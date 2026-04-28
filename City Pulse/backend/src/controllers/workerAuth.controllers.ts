import { Request, Response } from "express";
import { WorkerModel } from "../models/worker.model";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { RefreshTokenModel } from "../models/refreshToken.model";
import crypto from "crypto";
import { formatZimbabweNumber } from "../utils/phone.utils";
import { VerificationModel } from "../models/verification.model";
import { sendWhatsAppCode } from "../services/whatsapp.service";
import { sendEmailOTP } from "../services/email.service";

export const workerSignup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, email, password, phonenumber, departmentId } = req.body;
        const adminId = (req as any).adminId;

        if (!fullName || !email || !password || !phonenumber || !departmentId) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }

        // Normalization
        let normalizedPhone: string;
        try {
            normalizedPhone = formatZimbabweNumber(phonenumber);
        } catch (e: any) {
            res.status(400).json({ message: e.message });
            return;
        }

        const existingWorker = await WorkerModel.findOne({ email });
        if (existingWorker) {
            res.status(400).json({ message: "Worker already exists" });
            return;
        }

        const existingPhone = await WorkerModel.findOne({ phonenumber: normalizedPhone });
        if (existingPhone) {
            res.status(400).json({ message: "Phone number already registered" });
            return;
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const worker = await WorkerModel.create({
            fullName,
            email,
            password: hashedPassword,
            phonenumber: normalizedPhone,
            department: departmentId,
            createdBy: adminId
        });

        res.status(201).json({ success: true, worker });
    } catch (error) {
        console.error("Worker signup error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const workerLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const worker = await WorkerModel.findOne({ email });
        if (!worker) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        const isMatch = await bcryptjs.compare(password, worker.password!);
        if (!isMatch) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        // Check if account is active
        if (worker.isActive === false) {
            const { AdminModel } = await import("../models/admin.model");
            const deactivator = await AdminModel.findById(worker.deactivatedBy).select("email fullName");
            const deactivatorInfo = deactivator
                ? `${deactivator.fullName} (${deactivator.email})`
                : "a System Administrator";

            res.status(403).json({
                message: `Your account has been deactivated. Please contact ${deactivatorInfo} for more information.`,
                success: false
            });
            return;
        }

        // New Verification Checks
        if (!worker.email || !worker.phonenumber) {
            res.status(401).json({
                message: "Missing contact details. Please update your profile.",
                verificationRequired: true,
                missingDetails: true,
                email: worker.email,
                role: "WORKER"
            });
            return;
        }

        if (!worker.isEmailVerified) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const hashedCode = await bcryptjs.hash(code, 10);
            await VerificationModel.findOneAndUpdate(
                { userId: worker._id, type: "email" },
                { code: hashedCode, expiresAt: new Date(Date.now() + 5 * 60 * 1000), isUsed: false, attempts: 0 },
                { upsert: true }
            );
            await sendEmailOTP(worker.email, code).catch(err => console.error("Worker Login Email OTP error:", err));

            res.status(401).json({
                message: "Please verify your email. A new code has been sent.",
                verificationRequired: true,
                step: "email",
                email: worker.email,
                role: "WORKER"
            });
            return;
        }

        if (!worker.isVerified) {
            // Auto-verify legacy isVerified flag if email is already verified
            worker.isVerified = true;
            await worker.save();
        }

        const accessToken = jwt.sign(
            { id: worker._id, role: "WORKER" },
            process.env.JWT_PASSWORD!,
            { expiresIn: "10h" }
        );

        const refreshToken = crypto.randomBytes(40).toString("hex");
        await RefreshTokenModel.create({
            token: refreshToken,
            userId: worker._id,
            userType: "Worker",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            token: accessToken,
            worker: {
                id: worker._id,
                fullName: worker.fullName,
                email: worker.email,
                role: "WORKER"
            }
        });
    } catch (error) {
        console.error("Worker login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const refreshWorkerToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            res.status(401).json({ message: "No refresh token" });
            return;
        }

        const tokenDoc = await RefreshTokenModel.findOne({ token: refreshToken, userType: "Worker" });
        if (!tokenDoc) {
            res.status(403).json({ message: "Invalid refresh token" });
            return;
        }

        const worker = await WorkerModel.findById(tokenDoc.userId);
        if (!worker) {
            res.status(404).json({ message: "Worker not found" });
            return;
        }

        const newAccessToken = jwt.sign(
            { id: worker._id, role: "WORKER" },
            process.env.JWT_PASSWORD!,
            { expiresIn: "10h" }
        );

        res.json({ token: newAccessToken });
    } catch (error) {
        res.status(500).json({ message: "Refresh failed" });
    }
};

export const workerLogout = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
        await RefreshTokenModel.deleteOne({ token: refreshToken });
    }
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out" });
};
