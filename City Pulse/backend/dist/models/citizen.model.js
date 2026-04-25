"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CitizenModel = void 0;
const mongoose_1 = require("mongoose");
const CitizenSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true },
    password: {
        type: String,
        required: [
            true,
            "Password Must Have Atleast one UpperCase, LowerCase and Number each",
        ],
        min: [8, "Must be at least 8 Character"],
    },
    email: { type: String, unique: true, required: true, lowercase: true },
    phonenumber: {
        type: String,
        required: [true, "User phone number required"],
    },
    pushSubscription: { type: mongoose_1.Schema.Types.Mixed }, // Web Push Subscription object
    trustScore: { type: Number, default: 100 },
    successfulReports: { type: Number, default: 0 },
    fakeReports: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
}, { timestamps: true });
exports.CitizenModel = (0, mongoose_1.model)("Citizen", CitizenSchema);
