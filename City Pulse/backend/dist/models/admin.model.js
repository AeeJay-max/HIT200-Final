"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModel = void 0;
const mongoose_1 = require("mongoose");
const AdminSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true },
    password: {
        type: String,
        required: [true],
        min: [8],
    },
    email: { type: String, required: true, lowercase: true },
    phonenumber: {
        type: String,
        required: [true],
    },
    department: { type: String, required: false },
    role: { type: String, enum: ["MAIN_ADMIN", "DEPARTMENT_ADMIN"], default: "DEPARTMENT_ADMIN" },
    adminAccessCode: { type: Number, required: true, unique: true },
    pushSubscription: { type: mongoose_1.Schema.Types.Mixed }, // Web Push Subscription object
    isActive: { type: Boolean, default: true },
    deactivatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin" },
}, { timestamps: true });
exports.AdminModel = (0, mongoose_1.model)("Admin", AdminSchema);
