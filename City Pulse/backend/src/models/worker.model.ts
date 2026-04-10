import { model, Schema, Document, Types } from "mongoose";

export interface IWorker extends Document {
  fullName: string;
  email: string;
  password?: string;
  phonenumber: string;
  department: Types.ObjectId;
  role: "DEPARTMENT_WORKER";
  createdBy: Types.ObjectId; // Department Admin who created this worker
  isActive: boolean;
  performanceScore: number;
  totalIssuesResolved: number;
  totalOverdueIssues: number;
  averageResolutionTimeHours: number;
  pushSubscription?: any;
}

const WorkerSchema = new Schema<IWorker>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    password: { type: String, required: true },
    phonenumber: { type: String, required: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    role: { type: String, enum: ["DEPARTMENT_WORKER"], default: "DEPARTMENT_WORKER" },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    isActive: { type: Boolean, default: true },
    pushSubscription: { type: Schema.Types.Mixed }, // Store Web Push Subscription object

    // Productivity analytics fields
    performanceScore: { type: Number, default: 100 },
    totalIssuesResolved: { type: Number, default: 0 },
    totalOverdueIssues: { type: Number, default: 0 },
    averageResolutionTimeHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const WorkerModel = model<IWorker>("Worker", WorkerSchema);
