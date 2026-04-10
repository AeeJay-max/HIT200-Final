"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenModel = void 0;
const mongoose_1 = require("mongoose");
const RefreshTokenSchema = new mongoose_1.Schema({
    token: { type: String, required: true, unique: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    userType: { type: String, required: true, enum: ["Citizen", "Admin", "Worker"] },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-delete on expiry
}, { timestamps: true });
exports.RefreshTokenModel = (0, mongoose_1.model)("RefreshToken", RefreshTokenSchema);
