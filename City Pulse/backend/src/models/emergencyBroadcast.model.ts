import { model, Schema, Document, Types } from "mongoose";

export interface IEmergencyBroadcast extends Document {
    title: string;
    message: string;
    priorityLevel: "Normal" | "Urgent" | "Critical";
    type: "Road Closure" | "Water Shutdown" | "Electric Outage" | "Public Hazard";
    createdBy: Types.ObjectId;
    expiresAt?: Date;
}

const EmergencyBroadcastSchema = new Schema<IEmergencyBroadcast>(
    {
        title: { type: String, required: true },
        message: { type: String, required: true },
        priorityLevel: {
            type: String,
            enum: ["Normal", "Urgent", "Critical"],
            default: "Normal"
        },
        type: {
            type: String,
            enum: ["Road Closure", "Water Shutdown", "Electric Outage", "Public Hazard"],
            required: true
        },
        createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
        expiresAt: { type: Date }
    },
    { timestamps: true }
);

export const EmergencyBroadcastModel = model<IEmergencyBroadcast>("EmergencyBroadcast", EmergencyBroadcastSchema);
