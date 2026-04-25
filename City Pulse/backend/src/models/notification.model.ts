import { model, Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
    title: string;
    message: string;
    type: "Power Outage" | "Water Supply" | "Road Maintenance" | "Other" | "System Alert" | "Escalation" | "Assignment" | "Status Update" | "Broadcast" | "Warning" | "Critical";
    priority: "Normal" | "Urgent" | "Critical" | "High";
    linkTo?: string;
    createdBy?: Types.ObjectId; // Optional for system-generated alerts
    recipientId?: Types.ObjectId; // Targeted notification
    isRead: boolean;
    deliveryStatus: "sent" | "failed" | "pending" | "retrying";
    emailDeliveryStatus: "PENDING" | "SENT" | "FAILED";
    retryCount: number;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ["Power Outage", "Water Supply", "Road Maintenance", "Other", "System Alert", "Escalation", "Assignment", "Status Update", "Broadcast", "Warning", "Critical"],
            default: "Other"
        },
        priority: {
            type: String,
            enum: ["Normal", "Urgent", "Critical", "High"],
            default: "Normal"
        },
        linkTo: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
        recipientId: { type: Schema.Types.ObjectId }, // Can ref Citizen, Admin, or Worker
        isRead: { type: Boolean, default: false },
        deliveryStatus: {
            type: String,
            enum: ["sent", "failed", "pending", "retrying"],
            default: "pending"
        },
        emailDeliveryStatus: {
            type: String,
            enum: ["PENDING", "SENT", "FAILED"],
            default: "PENDING"
        },
        retryCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const NotificationModel = model<INotification>("Notification", NotificationSchema);
