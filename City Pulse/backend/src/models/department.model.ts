import { model, Schema, Document } from "mongoose";

export interface IDepartment extends Document {
    name: string;
    // Performance and responsibility metrics
    averageResponseTimeHours: number;
    averageAssignmentAcceptanceTimeHours: number;
    averageResolutionSpeedHours: number;
    totalOverdueIssues: number;
    totalEscalationCount: number;
    totalIssuesHandled: number;
}

const DepartmentSchema = new Schema<IDepartment>(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        averageResponseTimeHours: { type: Number, default: 0 },
        averageAssignmentAcceptanceTimeHours: { type: Number, default: 0 },
        averageResolutionSpeedHours: { type: Number, default: 0 },
        totalOverdueIssues: { type: Number, default: 0 },
        totalEscalationCount: { type: Number, default: 0 },
        totalIssuesHandled: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const DepartmentModel = model<IDepartment>("Department", DepartmentSchema);
