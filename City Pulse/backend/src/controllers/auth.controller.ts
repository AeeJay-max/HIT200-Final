import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { CitizenModel } from "../models/citizen.model";
import { WorkerModel } from "../models/worker.model";
import { VerificationModel } from "../models/verification.model";
import { sendWhatsAppCode } from "../services/whatsapp.service";
import { formatZimbabweNumber } from "../utils/phone.utils";
import { sendEmailOTP } from "../services/email.service";

export const verifyEmailOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, code, role } = req.body;

        if (!email || !code) {
            res.status(400).json({ message: "Email and code are required" });
            return;
        }

        const Model: any = role === "WORKER" ? WorkerModel : CitizenModel;
        const user = await Model.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (user.isEmailVerified) {
            res.status(400).json({ message: "Email already verified" });
            return;
        }

        const verification = await VerificationModel.findOne({
            userId: user._id,
            isUsed: false,
            type: "email",
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (!verification) {
            res.status(400).json({ message: "Verification code expired or not found. Please resend." });
            return;
        }

        if (verification.attempts >= 5) {
            res.status(400).json({ message: "Maximum attempts reached. Please resend a new code." });
            return;
        }

        const isMatch = await bcrypt.compare(code, verification.code);
        if (!isMatch) {
            verification.attempts += 1;
            await verification.save();
            res.status(400).json({ message: "Invalid verification code" });
            return;
        }

        // Success
        user.isEmailVerified = true;
        user.isVerified = true; // Complete account verification
        await user.save();

        verification.isUsed = true;
        await verification.save();

        res.status(200).json({ message: "Account verified successfully" });
    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const resendEmailOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, role } = req.body;

        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }

        const Model: any = role === "WORKER" ? WorkerModel : CitizenModel;
        const user = await Model.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (user.isEmailVerified) {
            res.status(400).json({ message: "Email already verified" });
            return;
        }

        // Rate limit resends (max 3)
        const resendCount = await VerificationModel.countDocuments({
            userId: user._id,
            type: "email",
            createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) }, // last hour
        });

        if (resendCount >= 3) {
            res.status(429).json({ message: "Too many resend attempts. Please try again later." });
            return;
        }

        // Invalidate old codes
        await VerificationModel.updateMany(
            { userId: user._id, isUsed: false, type: "email" },
            { $set: { isUsed: true } }
        );

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = await bcrypt.hash(code, 10);

        await VerificationModel.create({
            userId: user._id,
            code: hashedCode,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            attempts: 0,
            isUsed: false,
            type: "email",
        });

        await sendEmailOTP(user.email, code);

        res.status(200).json({ message: "Verification code sent to email" });
    } catch (error) {
        console.error("Error resending email code:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const getPhoneNumber = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, role } = req.query;
        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }
        const Model: any = role === "WORKER" ? WorkerModel : CitizenModel;
        const user = await Model.findOne({ email: String(email).toLowerCase() });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({ phonenumber: user.phonenumber });
    } catch (error) {
        console.error("Error getting phone number:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updatePhoneNumber = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, newPhoneNumber, role } = req.body;

        if (!email || !newPhoneNumber) {
            res.status(400).json({ message: "Email and new phone number are required" });
            return;
        }

        const normalizedPhone = formatZimbabweNumber(newPhoneNumber);

        const Model: any = role === "WORKER" ? WorkerModel : CitizenModel;
        const user = await Model.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (user.isVerified) {
            res.status(400).json({ message: "Cannot update phone number for verified accounts here." });
            return;
        }

        // Check if new number is already used by someone else in the same model
        const existingUser = await Model.findOne({ phonenumber: normalizedPhone, email: { $ne: email } });
        if (existingUser) {
            res.status(400).json({ message: "This phone number is already registered to another account" });
            return;
        }

        user.phonenumber = normalizedPhone;
        await user.save();

        res.status(200).json({ message: "Phone number updated successfully", phonenumber: normalizedPhone });
    } catch (error: any) {
        console.error("Error updating phone number:", error);
        res.status(400).json({ message: error.message || "Failed to update phone number" });
    }
};
