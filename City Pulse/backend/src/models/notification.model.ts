import { model, Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
    title: string;
    message: string;
    type: string;
    createdBy: Types.ObjectId;
    recipient?: Types.ObjectId;
    readBy: Types.ObjectId[];
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            default: "SYSTEM"
        },
        createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
        recipient: { type: Schema.Types.ObjectId, ref: "Citizen" },
        readBy: [{ type: Schema.Types.ObjectId, ref: "Citizen" }]
    },
    { timestamps: true }
);

export const NotificationModel = model<INotification>("Notification", NotificationSchema);
