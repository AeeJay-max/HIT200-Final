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
exports.adminLogout = exports.refreshAdminToken = exports.adminSignin = exports.adminSignup = void 0;
const admin_model_1 = require("../../models/admin.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const refreshToken_model_1 = require("../../models/refreshToken.model");
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
        .length(10, { message: "Phone number must be exactly 10 digits" })
        .trim(),
    department: zod_1.z.string().trim(),
    adminAccessCode: zod_1.z
        .number()
        .int()
        .min(1000, { message: "Admin access code must be at least 4 digits" }),
});
const adminSignup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedData = signupSchema.parse(req.body);
        const { fullName, password, email, phonenumber, department, adminAccessCode, } = parsedData;
        //Check if the admin already exists
        const existingUser = yield admin_model_1.AdminModel.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: " User already exists" });
            return;
        }
        //Hash password and create new admin
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        yield admin_model_1.AdminModel.create({
            fullName,
            password: hashedPassword,
            email,
            phonenumber,
            department,
            adminAccessCode,
        });
        console.log("Admin created!");
        res.status(200).json({ message: "Admin Signed up!" });
    }
    catch (err) {
        if (err.name === "ZodError") {
            res.status(400).json({
                message: "Validation failed",
                errors: err.errors,
            });
            return;
        }
        console.error("Error creating admin:", err);
        res
            .status(411)
            .json({ message: "Admin already exists or another error occurred" });
    }
});
exports.adminSignup = adminSignup;
const adminSignin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, adminAccessCode } = req.body;
        // Find admin by email and access code
        const existingUser = yield admin_model_1.AdminModel.findOne({
            email,
            adminAccessCode,
        });
        if (!existingUser) {
            res.status(404).json({ message: "Admin not found!" });
            return;
        }
        // Verify password
        const isPasswordValid = yield bcryptjs_1.default.compare(password, existingUser.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: "Invalid password" });
            return;
        }
        // Generate JWT token
        const accessToken = jsonwebtoken_1.default.sign({ id: existingUser._id, role: existingUser.role }, process.env.JWT_PASSWORD, { expiresIn: "15m" });
        const refreshToken = crypto_1.default.randomBytes(40).toString("hex");
        yield refreshToken_model_1.RefreshTokenModel.create({
            token: refreshToken,
            userId: existingUser._id,
            userType: "Admin",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
                id: existingUser._id,
                fullName: existingUser.fullName,
                email: existingUser.email,
                adminAccessCode: existingUser.adminAccessCode,
                department: existingUser.department,
                phonenumber: existingUser.phonenumber,
                role: existingUser.role,
            },
        });
        console.log("Admin signed in with refresh token!");
    }
    catch (error) {
        console.error("Error during admin signin:", error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.adminSignin = adminSignin;
const refreshAdminToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            res.status(401).json({ message: "No refresh token" });
            return;
        }
        const tokenDoc = yield refreshToken_model_1.RefreshTokenModel.findOne({ token: refreshToken, userType: "Admin" });
        if (!tokenDoc) {
            res.status(403).json({ message: "Invalid refresh token" });
            return;
        }
        const admin = yield admin_model_1.AdminModel.findById(tokenDoc.userId);
        if (!admin) {
            res.status(404).json({ message: "Admin not found" });
            return;
        }
        const newAccessToken = jsonwebtoken_1.default.sign({ id: admin._id, role: admin.role }, process.env.JWT_PASSWORD, { expiresIn: "15m" });
        res.json({ token: newAccessToken });
    }
    catch (error) {
        res.status(500).json({ message: "Refresh failed" });
    }
});
exports.refreshAdminToken = refreshAdminToken;
const adminLogout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
        yield refreshToken_model_1.RefreshTokenModel.deleteOne({ token: refreshToken });
    }
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out" });
});
exports.adminLogout = adminLogout;
