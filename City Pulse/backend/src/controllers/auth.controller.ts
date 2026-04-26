import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { CitizenModel } from "../models/citizen.model";
import { VerificationModel } from "../models/verification.model";
import { sendWhatsAppCode } from "../services/whatsapp.service";
import { formatZimbabweNumber } from "../utils/phone.utils";
import { sendEmailOTP } from "../services/email.service";

export const verifyEmailOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            res.status(400).json({ message: "Email and code are required" });
            return;
        }

        const citizen = await CitizenModel.findOne({ email });
        if (!citizen) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (citizen.isEmailVerified) {
            res.status(400).json({ message: "Email already verified" });
            return;
        }

        const verification = await VerificationModel.findOne({
            userId: citizen._id,
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
        citizen.isEmailVerified = true;
        await citizen.save();

        verification.isUsed = true;
        await verification.save();

        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const verifyWhatsApp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            res.status(400).json({ message: "Email and code are required" });
            return;
        }

        const citizen = await CitizenModel.findOne({ email });
        if (!citizen) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (!citizen.isEmailVerified) {
            res.status(403).json({ message: "Please verify your email first" });
            return;
        }

        if (citizen.isVerified) {
            res.status(400).json({ message: "Account already verified" });
            return;
        }

        const verification = await VerificationModel.findOne({
            userId: citizen._id,
            isUsed: false,
            type: "whatsapp",
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
        citizen.isVerified = true;
        await citizen.save();

        verification.isUsed = true;
        await verification.save();

        res.status(200).json({ message: "Account verified successfully" });
    } catch (error) {
        console.error("Error verifying WhatsApp:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const resendEmailOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }

        const citizen = await CitizenModel.findOne({ email });
        if (!citizen) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (citizen.isEmailVerified) {
            res.status(400).json({ message: "Email already verified" });
            return;
        }

        // Rate limit resends (max 3)
        const resendCount = await VerificationModel.countDocuments({
            userId: citizen._id,
            type: "email",
            createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) }, // last hour
        });

        if (resendCount >= 3) {
            res.status(429).json({ message: "Too many resend attempts. Please try again later." });
            return;
        }

        // Invalidate old codes
        await VerificationModel.updateMany(
            { userId: citizen._id, isUsed: false, type: "email" },
            { $set: { isUsed: true } }
        );

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = await bcrypt.hash(code, 10);

        await VerificationModel.create({
            userId: citizen._id,
            code: hashedCode,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            attempts: 0,
            isUsed: false,
            type: "email",
        });

        await sendEmailOTP(citizen.email, code);

        res.status(200).json({ message: "Verification code sent to email" });
    } catch (error) {
        console.error("Error resending email code:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const resendWhatsApp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }

        const citizen = await CitizenModel.findOne({ email });
        if (!citizen) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (!citizen.isEmailVerified) {
            res.status(403).json({ message: "Please verify your email first" });
            return;
        }

        if (citizen.isVerified) {
            res.status(400).json({ message: "Account already verified" });
            return;
        }

        // Rate limit resends (max 3)
        const resendCount = await VerificationModel.countDocuments({
            userId: citizen._id,
            type: "whatsapp",
            createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) }, // last hour
        });

        if (resendCount >= 3) {
            res.status(429).json({ message: "Too many resend attempts. Please try again later." });
            return;
        }

        // Invalidate old codes
        await VerificationModel.updateMany(
            { userId: citizen._id, isUsed: false, type: "whatsapp" },
            { $set: { isUsed: true } }
        );

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = await bcrypt.hash(code, 10);

        await VerificationModel.create({
            userId: citizen._id,
            code: hashedCode,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            attempts: 0,
            isUsed: false,
            type: "whatsapp",
        });

        await sendWhatsAppCode(citizen.phonenumber, code);

        res.status(200).json({ message: "Verification code sent via WhatsApp" });
    } catch (error) {
        console.error("Error resending WhatsApp code:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPhoneNumber = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.query;
        console.log("Phone lookup requested for email:", email);
        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }
        const citizen = await CitizenModel.findOne({ email: String(email).toLowerCase() });
        console.log("Lookup result:", citizen ? "Found" : "Not Found");
        if (!citizen) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({ phonenumber: citizen.phonenumber });
    } catch (error) {
        console.error("Error getting phone number:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updatePhoneNumber = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, newPhoneNumber } = req.body;

        if (!email || !newPhoneNumber) {
            res.status(400).json({ message: "Email and new phone number are required" });
            return;
        }

        const normalizedPhone = formatZimbabweNumber(newPhoneNumber);

        const citizen = await CitizenModel.findOne({ email });
        if (!citizen) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (citizen.isVerified) {
            res.status(400).json({ message: "Cannot update phone number for verified accounts here." });
            return;
        }

        // Check if new number is already used by someone else
        const existingUser = await CitizenModel.findOne({ phonenumber: normalizedPhone, email: { $ne: email } });
        if (existingUser) {
            res.status(400).json({ message: "This phone number is already registered to another account" });
            return;
        }

        citizen.phonenumber = normalizedPhone;
        await citizen.save();

        res.status(200).json({ message: "Phone number updated successfully", phonenumber: normalizedPhone });
    } catch (error: any) {
        console.error("Error updating phone number:", error);
        res.status(400).json({ message: error.message || "Failed to update phone number" });
    }
};
