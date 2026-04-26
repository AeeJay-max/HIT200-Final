"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationModel = void 0;
const mongoose_1 = require("mongoose");
const VerificationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "Citizen" },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    type: { type: String, enum: ["email", "whatsapp"], required: true },
}, { timestamps: true });
exports.VerificationModel = (0, mongoose_1.model)("Verification", VerificationSchema);
