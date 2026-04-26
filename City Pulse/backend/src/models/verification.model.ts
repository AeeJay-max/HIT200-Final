import { Schema, model, Types } from "mongoose";

const VerificationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "Citizen" },
        code: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        isUsed: { type: Boolean, default: false },
        attempts: { type: Number, default: 0 },
        type: { type: String, enum: ["email", "whatsapp"], required: true },
    },
    { timestamps: true }
);

export const VerificationModel = model("Verification", VerificationSchema);
