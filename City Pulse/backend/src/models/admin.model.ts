import { model, Schema } from "mongoose";

const AdminSchema = new Schema(
  {
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
    department: { type: String, required: true },
    adminAccessCode: { type: Number, required: true, unique: true },
    role: {
      type: String,
      enum: ["main_admin", "dept_admin", "dept_worker"],
      default: "dept_admin",
      required: true,
    },
    assignedIssues: [{ type: Schema.Types.ObjectId, ref: "Issue" }],
    performanceMetrics: {
      averageResolutionTime: { type: Number, default: 0 }, // in hours
      totalResolved: { type: Number, default: 0 },
    },
    refreshToken: { type: String, default: null }
  },
  { timestamps: true }
);

export const AdminModel = model("Admin", AdminSchema);
