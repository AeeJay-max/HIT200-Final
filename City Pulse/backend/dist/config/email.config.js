"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const getTransporter = (authOptions) => {
    return nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: (authOptions === null || authOptions === void 0 ? void 0 : authOptions.user) || process.env.SMTP_USER || 'default@citypulse.com',
            pass: (authOptions === null || authOptions === void 0 ? void 0 : authOptions.pass) || process.env.SMTP_PASS || 'password',
        },
    });
};
exports.getTransporter = getTransporter;
