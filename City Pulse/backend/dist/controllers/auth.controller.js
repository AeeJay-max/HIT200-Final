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
exports.updatePhoneNumber = exports.getPhoneNumber = exports.resendWhatsApp = exports.verifyWhatsApp = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const citizen_model_1 = require("../models/citizen.model");
const verification_model_1 = require("../models/verification.model");
const whatsapp_service_1 = require("../services/whatsapp.service");
const phone_utils_1 = require("../utils/phone.utils");
const verifyWhatsApp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            res.status(400).json({ message: "Email and code are required" });
            return;
        }
        const citizen = yield citizen_model_1.CitizenModel.findOne({ email });
        if (!citizen) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (citizen.isVerified) {
            res.status(400).json({ message: "Account already verified" });
            return;
        }
        const verification = yield verification_model_1.VerificationModel.findOne({
            userId: citizen._id,
            isUsed: false,
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
        citizen.isVerified = true;
        yield citizen.save();
        verification.isUsed = true;
        yield verification.save();
        res.status(200).json({ message: "Account verified successfully" });
    }
    catch (error) {
        console.error("Error verifying WhatsApp:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.verifyWhatsApp = verifyWhatsApp;
const resendWhatsApp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }
        const citizen = yield citizen_model_1.CitizenModel.findOne({ email });
        if (!citizen) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (citizen.isVerified) {
            res.status(400).json({ message: "Account already verified" });
            return;
        }
        // Rate limit resends (max 3)
        const resendCount = yield verification_model_1.VerificationModel.countDocuments({
            userId: citizen._id,
            createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) }, // last hour
        });
        if (resendCount >= 3) {
            res.status(429).json({ message: "Too many resend attempts. Please try again later." });
            return;
        }
        // Invalidate old codes
        yield verification_model_1.VerificationModel.updateMany({ userId: citizen._id, isUsed: false }, { $set: { isUsed: true } });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = yield bcryptjs_1.default.hash(code, 10);
        yield verification_model_1.VerificationModel.create({
            userId: citizen._id,
            code: hashedCode,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            attempts: 0,
            isUsed: false,
        });
        yield (0, whatsapp_service_1.sendWhatsAppCode)(citizen.phonenumber, code);
        res.status(200).json({ message: "Verification code sent via WhatsApp" });
    }
    catch (error) {
        console.error("Error resending WhatsApp code:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.resendWhatsApp = resendWhatsApp;
const getPhoneNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.query;
        console.log("Phone lookup requested for email:", email);
        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }
        const citizen = yield citizen_model_1.CitizenModel.findOne({ email: String(email).toLowerCase() });
        console.log("Lookup result:", citizen ? "Found" : "Not Found");
        if (!citizen) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({ phonenumber: citizen.phonenumber });
    }
    catch (error) {
        console.error("Error getting phone number:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getPhoneNumber = getPhoneNumber;
const updatePhoneNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, newPhoneNumber } = req.body;
        if (!email || !newPhoneNumber) {
            res.status(400).json({ message: "Email and new phone number are required" });
            return;
        }
        const normalizedPhone = (0, phone_utils_1.formatZimbabweNumber)(newPhoneNumber);
        const citizen = yield citizen_model_1.CitizenModel.findOne({ email });
        if (!citizen) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (citizen.isVerified) {
            res.status(400).json({ message: "Cannot update phone number for verified accounts here." });
            return;
        }
        // Check if new number is already used by someone else
        const existingUser = yield citizen_model_1.CitizenModel.findOne({ phonenumber: normalizedPhone, email: { $ne: email } });
        if (existingUser) {
            res.status(400).json({ message: "This phone number is already registered to another account" });
            return;
        }
        citizen.phonenumber = normalizedPhone;
        yield citizen.save();
        res.status(200).json({ message: "Phone number updated successfully", phonenumber: normalizedPhone });
    }
    catch (error) {
        console.error("Error updating phone number:", error);
        res.status(400).json({ message: error.message || "Failed to update phone number" });
    }
});
exports.updatePhoneNumber = updatePhoneNumber;
