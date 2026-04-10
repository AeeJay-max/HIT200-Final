import { model, Schema, Document, Types } from "mongoose";

export interface IScheduleAnnouncement extends Document {
    title: string;
    description: string;
    type: "Road Maintenance" | "Planned Shutdown" | "Repair Window" | "Service Interruption";
    affectedAreas: string[];
    startTime: Date;
    endTime: Date;
    createdBy: Types.ObjectId;
}

const ScheduleAnnouncementSchema = new Schema<IScheduleAnnouncement>(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        type: {
            type: String,
            enum: ["Road Maintenance", "Planned Shutdown", "Repair Window", "Service Interruption"],
            required: true,
        },
        affectedAreas: [{ type: String }],
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    },
    { timestamps: true }
);

export const ScheduleAnnouncementModel = model<IScheduleAnnouncement>("ScheduleAnnouncement", ScheduleAnnouncementSchema);
