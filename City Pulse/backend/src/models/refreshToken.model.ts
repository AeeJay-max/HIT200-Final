import { Schema, model, Document, Types } from "mongoose";

export interface IRefreshToken extends Document {
    token: string;
    userId: Types.ObjectId;
    userType: "Citizen" | "Admin" | "Worker";
    expiresAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
    {
        token: { type: String, required: true, unique: true },
        userId: { type: Schema.Types.ObjectId, required: true },
        userType: { type: String, required: true, enum: ["Citizen", "Admin", "Worker"] },
        expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-delete on expiry
    },
    { timestamps: true }
);

export const RefreshTokenModel = model<IRefreshToken>("RefreshToken", RefreshTokenSchema);
