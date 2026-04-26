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
exports.citizenLogout = exports.refreshCitizenToken = exports.citizenSignin = exports.citizenSignup = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const citizen_model_1 = require("../../models/citizen.model");
const refreshToken_model_1 = require("../../models/refreshToken.model");
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const verification_model_1 = require("../../models/verification.model");
const phone_utils_1 = require("../../utils/phone.utils");
const email_service_1 = require("../../services/email.service");
const signupSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, { message: "Full name is required" }).trim(),
    password: zod_1.z
        .string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    })
        .trim(),
    email: zod_1.z.string().email({ message: "Invalid email format" }).trim(),
    phonenumber: zod_1.z
        .string()
        .min(9, { message: "Phone number must be at least 9 characters" }),
});
const citizenSignup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedData = signupSchema.parse(req.body);
        const { fullName, password, email, phonenumber } = parsedData;
        // Normalization
        let normalizedPhone;
        try {
            normalizedPhone = (0, phone_utils_1.formatZimbabweNumber)(phonenumber);
        }
        catch (e) {
            res.status(400).json({ message: e.message });
            return;
        }
        const existingCitizen = yield citizen_model_1.CitizenModel.findOne({ email });
        if (existingCitizen) {
            res.status(400).json({ message: " Citizen already exists" });
            return;
        }
        const existingPhone = yield citizen_model_1.CitizenModel.findOne({ phonenumber: normalizedPhone });
        if (existingPhone) {
            res.status(400).json({ message: "Phone number already registered" });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newCitizen = yield citizen_model_1.CitizenModel.create({
            fullName,
            password: hashedPassword,
            email,
            phonenumber: normalizedPhone,
            isVerified: false,
        });
        // Generate OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = yield bcryptjs_1.default.hash(code, 10);
        // Store email verification
        yield verification_model_1.VerificationModel.create({
            userId: newCitizen._id,
            code: hashedCode,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            isUsed: false,
            attempts: 0,
            type: "email",
        });
        // Send Email message
        yield (0, email_service_1.sendEmailOTP)(email, code);
        console.log("Citizen created and email verification code sent!");
        res.status(201).json({ message: "Verification code sent via Email" });
    }
    catch (err) {
        if (err.name === "ZodError") {
            res.status(400).json({
                message: "Validation failed",
                errors: err.errors,
            });
            return;
        }
        console.error("Error creating CitizenModel:", err);
        res
            .status(411)
            .json({ message: "Citizen already exists or another error occurred" });
    }
});
exports.citizenSignup = citizenSignup;
const citizenSignin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const existingCitizen = yield citizen_model_1.CitizenModel.findOne({ email });
        if (!existingCitizen) {
            res.status(400).json({ message: "Invalid email or password" });
            return;
        }
        if (!existingCitizen.isEmailVerified) {
            res.status(401).json({
                message: "Account email not verified",
                status: 401,
                step: "email"
            });
            return;
        }
        if (!existingCitizen.isVerified) {
            res.status(401).json({
                message: "Account phone not verified",
                status: 401,
                step: "whatsapp"
            });
            return;
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, existingCitizen.password);
        if (!isPasswordValid) {
            res.status(400).json({ message: "Invalid email or password" });
            return;
        }
        const accessToken = jsonwebtoken_1.default.sign({ id: existingCitizen._id, role: "CITIZEN" }, process.env.JWT_PASSWORD, { expiresIn: "10h" });
        const refreshToken = crypto_1.default.randomBytes(40).toString("hex");
        yield refreshToken_model_1.RefreshTokenModel.create({
            token: refreshToken,
            userId: existingCitizen._id,
            userType: "Citizen",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({
            token: accessToken,
            user: {
                id: existingCitizen._id,
                fullName: existingCitizen.fullName,
                email: existingCitizen.email,
                phonenumber: existingCitizen.phonenumber,
                role: "CITIZEN",
            },
        });
        console.log("Citizen signed in with refresh token!");
    }
    catch (error) {
        console.error("Error during citizen signin:", error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.citizenSignin = citizenSignin;
const refreshCitizenToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            res.status(401).json({ message: "No refresh token" });
            return;
        }
        const tokenDoc = yield refreshToken_model_1.RefreshTokenModel.findOne({ token: refreshToken, userType: "Citizen" });
        if (!tokenDoc) {
            res.status(403).json({ message: "Invalid refresh token" });
            return;
        }
        const citizen = yield citizen_model_1.CitizenModel.findById(tokenDoc.userId);
        if (!citizen) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const newAccessToken = jsonwebtoken_1.default.sign({ id: citizen._id, role: "CITIZEN" }, process.env.JWT_PASSWORD, { expiresIn: "10h" });
        res.json({ token: newAccessToken });
    }
    catch (error) {
        res.status(500).json({ message: "Refresh failed" });
    }
});
exports.refreshCitizenToken = refreshCitizenToken;
const citizenLogout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
        yield refreshToken_model_1.RefreshTokenModel.deleteOne({ token: refreshToken });
    }
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out" });
});
exports.citizenLogout = citizenLogout;
