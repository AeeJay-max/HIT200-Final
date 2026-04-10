import { model, Schema, Document } from "mongoose";
import { IIssue } from "../utils/issue";
import { ILocation } from "../utils/location";

const locationSchema = new Schema<ILocation>(
  {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    address: String,
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number] } // [longitude, latitude]
  },
  { _id: false }
);

const IssueSchema = new Schema<IIssue & Document>(
  {
    citizenId: {
      type: Schema.Types.ObjectId,
      ref: "Citizen",
      required: true,
    },
    issueType: {
      type: String,
      enum: [
        "Potholes",
        "Burst Water Pipes",
        "Sewer Issues",
        "Streetlights",
        "Traffic Lights",
        "Illegal Dumping",
        "Other",
      ],
      default: "Other",
      required: true,
    },
    title: {
      type: String,
      unique: true,
      required: true,
      maxlength: 100,
      minlength: 5,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
    },
    status: {
      type: String,
      enum: ["Reported", "Assigned", "Scheduled", "In Progress", "Cleared", "Resolved", "Verified", "Rejected", "Pending", "Maintenance Queue"],
      default: "Reported",
    },
    location: {
      type: locationSchema,
      required: true,
    },
    media: {
      type: Schema.Types.ObjectId,
      ref: "Multimedia",
    },
    potholeDetails: {
      diameter: Number,
      depth: Number,
      isOnHighway: Boolean,
      autoClassifiedDanger: Boolean,
    },
    evidenceMedia: [{ url: String, type: { type: String } }],
    assignedDepartment: { type: Schema.Types.ObjectId, ref: "Department" },
    assignedDeptAdmin: { type: Schema.Types.ObjectId, ref: "Admin" },
    assignedWorker: { type: Schema.Types.ObjectId, ref: "Admin" },
    expectedCompletionDeadline: Date,
    isOverdue: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0 },
    voters: [{ type: Schema.Types.ObjectId, ref: "Citizen" }],
    isDuplicateOf: { type: Schema.Types.ObjectId, ref: "Issue" },
    isEmergencyEscalation: { type: Boolean, default: false },
    assignedAt: Date,
    workStartedAt: Date,
    resolvedAt: Date,
    handledBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    priorityScore: { type: Number, default: 0 },
    escalationPriority: { type: String, enum: ["NORMAL", "HIGH", "CRITICAL"], default: "NORMAL" },
    clusterId: { type: Schema.Types.ObjectId, ref: "IssueCluster" }
  },
  { timestamps: true }
);

IssueSchema.index({ "location.latitude": 1, "location.longitude": 1 });
IssueSchema.index({ "location.coordinates": "2dsphere" });
IssueSchema.index({ status: 1 });
IssueSchema.index({ assignedDepartment: 1 });
IssueSchema.index({ priorityScore: -1 });
IssueSchema.index({ createdAt: -1 });

export const LocationModel = model("Location", locationSchema);

export interface IssueDocument extends IIssue, Document { }
export const IssueModel = model<IssueDocument>("Issue", IssueSchema);
