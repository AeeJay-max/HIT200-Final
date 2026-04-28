"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.workerLogout = exports.refreshWorkerToken = exports.workerLogin = exports.workerSignup = void 0;
const worker_model_1 = require("../models/worker.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const refreshToken_model_1 = require("../models/refreshToken.model");
const crypto_1 = __importDefault(require("crypto"));
const phone_utils_1 = require("../utils/phone.utils");
const verification_model_1 = require("../models/verification.model");
const email_service_1 = require("../services/email.service");
const workerSignup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, email, password, phonenumber, departmentId } = req.body;
        const adminId = req.adminId;
        if (!fullName || !email || !password || !phonenumber || !departmentId) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }
        // Normalization
        let normalizedPhone;
        try {
            normalizedPhone = (0, phone_utils_1.formatZimbabweNumber)(phonenumber);
        }
        catch (e) {
            res.status(400).json({ message: e.message });
            return;
        }
        const existingWorker = yield worker_model_1.WorkerModel.findOne({ email });
        if (existingWorker) {
            res.status(400).json({ message: "Worker already exists" });
            return;
        }
        const existingPhone = yield worker_model_1.WorkerModel.findOne({ phonenumber: normalizedPhone });
        if (existingPhone) {
            res.status(400).json({ message: "Phone number already registered" });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const worker = yield worker_model_1.WorkerModel.create({
            fullName,
            email,
            password: hashedPassword,
            phonenumber: normalizedPhone,
            department: departmentId,
            createdBy: adminId
        });
        res.status(201).json({ success: true, worker });
    }
    catch (error) {
        console.error("Worker signup error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.workerSignup = workerSignup;
const workerLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const worker = yield worker_model_1.WorkerModel.findOne({ email });
        if (!worker) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, worker.password);
        if (!isMatch) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        // Check if account is active
        if (worker.isActive === false) {
            const { AdminModel } = yield Promise.resolve().then(() => __importStar(require("../models/admin.model")));
            const deactivator = yield AdminModel.findById(worker.deactivatedBy).select("email fullName");
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
            const hashedCode = yield bcryptjs_1.default.hash(code, 10);
            yield verification_model_1.VerificationModel.findOneAndUpdate({ userId: worker._id, type: "email" }, { code: hashedCode, expiresAt: new Date(Date.now() + 5 * 60 * 1000), isUsed: false, attempts: 0 }, { upsert: true });
            yield (0, email_service_1.sendEmailOTP)(worker.email, code).catch(err => console.error("Worker Login Email OTP error:", err));
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
            yield worker.save();
        }
        const accessToken = jsonwebtoken_1.default.sign({ id: worker._id, role: "WORKER" }, process.env.JWT_PASSWORD, { expiresIn: "10h" });
        const refreshToken = crypto_1.default.randomBytes(40).toString("hex");
        yield refreshToken_model_1.RefreshTokenModel.create({
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
    }
    catch (error) {
        console.error("Worker login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.workerLogin = workerLogin;
const refreshWorkerToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            res.status(401).json({ message: "No refresh token" });
            return;
        }
        const tokenDoc = yield refreshToken_model_1.RefreshTokenModel.findOne({ token: refreshToken, userType: "Worker" });
        if (!tokenDoc) {
            res.status(403).json({ message: "Invalid refresh token" });
            return;
        }
        const worker = yield worker_model_1.WorkerModel.findById(tokenDoc.userId);
        if (!worker) {
            res.status(404).json({ message: "Worker not found" });
            return;
        }
        const newAccessToken = jsonwebtoken_1.default.sign({ id: worker._id, role: "WORKER" }, process.env.JWT_PASSWORD, { expiresIn: "10h" });
        res.json({ token: newAccessToken });
    }
    catch (error) {
        res.status(500).json({ message: "Refresh failed" });
    }
});
exports.refreshWorkerToken = refreshWorkerToken;
const workerLogout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
        yield refreshToken_model_1.RefreshTokenModel.deleteOne({ token: refreshToken });
    }
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out" });
});
exports.workerLogout = workerLogout;
