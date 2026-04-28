"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePhoneNumber = exports.getPhoneNumber = exports.resendEmailOTP = exports.verifyEmailOTP = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const citizen_model_1 = require("../models/citizen.model");
const worker_model_1 = require("../models/worker.model");
const verification_model_1 = require("../models/verification.model");
const phone_utils_1 = require("../utils/phone.utils");
const email_service_1 = require("../services/email.service");
const verifyEmailOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, code, role } = req.body;
        if (!email || !code) {
            res.status(400).json({ message: "Email and code are required" });
            return;
        }
        const Model = role === "WORKER" ? worker_model_1.WorkerModel : citizen_model_1.CitizenModel;
        const user = yield Model.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (user.isEmailVerified) {
            res.status(400).json({ message: "Email already verified" });
            return;
        }
        const verification = yield verification_model_1.VerificationModel.findOne({
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
        const isMatch = yield bcryptjs_1.default.compare(code, verification.code);
        if (!isMatch) {
            verification.attempts += 1;
            yield verification.save();
            res.status(400).json({ message: "Invalid verification code" });
            return;
        }
        // Success
        user.isEmailVerified = true;
        user.isVerified = true; // Complete account verification
        yield user.save();
        verification.isUsed = true;
        yield verification.save();
        res.status(200).json({ message: "Account verified successfully" });
    }
    catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.verifyEmailOTP = verifyEmailOTP;
const resendEmailOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, role } = req.body;
        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }
        const Model = role === "WORKER" ? worker_model_1.WorkerModel : citizen_model_1.CitizenModel;
        const user = yield Model.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (user.isEmailVerified) {
            res.status(400).json({ message: "Email already verified" });
            return;
        }
        // Rate limit resends (max 3)
        const resendCount = yield verification_model_1.VerificationModel.countDocuments({
            userId: user._id,
            type: "email",
            createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) }, // last hour
        });
        if (resendCount >= 3) {
            res.status(429).json({ message: "Too many resend attempts. Please try again later." });
            return;
        }
        // Invalidate old codes
        yield verification_model_1.VerificationModel.updateMany({ userId: user._id, isUsed: false, type: "email" }, { $set: { isUsed: true } });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = yield bcryptjs_1.default.hash(code, 10);
        yield verification_model_1.VerificationModel.create({
            userId: user._id,
            code: hashedCode,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            attempts: 0,
            isUsed: false,
            type: "email",
        });
        yield (0, email_service_1.sendEmailOTP)(user.email, code);
        res.status(200).json({ message: "Verification code sent to email" });
    }
    catch (error) {
        console.error("Error resending email code:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.resendEmailOTP = resendEmailOTP;
const getPhoneNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, role } = req.query;
        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }
        const Model = role === "WORKER" ? worker_model_1.WorkerModel : citizen_model_1.CitizenModel;
        const user = yield Model.findOne({ email: String(email).toLowerCase() });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({ phonenumber: user.phonenumber });
    }
    catch (error) {
        console.error("Error getting phone number:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getPhoneNumber = getPhoneNumber;
const updatePhoneNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, newPhoneNumber, role } = req.body;
        if (!email || !newPhoneNumber) {
            res.status(400).json({ message: "Email and new phone number are required" });
            return;
        }
        const normalizedPhone = (0, phone_utils_1.formatZimbabweNumber)(newPhoneNumber);
        const Model = role === "WORKER" ? worker_model_1.WorkerModel : citizen_model_1.CitizenModel;
        const user = yield Model.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (user.isVerified) {
            res.status(400).json({ message: "Cannot update phone number for verified accounts here." });
            return;
        }
        // Check if new number is already used by someone else in the same model
        const existingUser = yield Model.findOne({ phonenumber: normalizedPhone, email: { $ne: email } });
        if (existingUser) {
            res.status(400).json({ message: "This phone number is already registered to another account" });
            return;
        }
        user.phonenumber = normalizedPhone;
        yield user.save();
        res.status(200).json({ message: "Phone number updated successfully", phonenumber: normalizedPhone });
    }
    catch (error) {
        console.error("Error updating phone number:", error);
        res.status(400).json({ message: error.message || "Failed to update phone number" });
    }
});
exports.updatePhoneNumber = updatePhoneNumber;
