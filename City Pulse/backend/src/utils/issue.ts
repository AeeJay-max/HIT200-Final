import { ILocation } from "./location";
import { Types } from "mongoose";

export interface IIssue {
  citizenId: Types.ObjectId; // reference to Citizen
  issueType:
  | "Potholes"
  | "Burst Water Pipes"
  | "Sewer Issues"
  | "Streetlights"
  | "Traffic Lights"
  | "Illegal Dumping"
  | "Other";
  title: string;
  description: string;
  severity?: "low" | "medium" | "high" | "critical";
  status?: "Reported" | "Assigned" | "Scheduled" | "In Progress" | "Cleared" | "Resolved" | "Verified" | "Rejected" | "Pending" | "Maintenance Queue";
  location: ILocation; // embedded location object
  media?: Types.ObjectId[]; // refs to multimedia

  // Pothole Specific Attributes
  potholeDetails?: {
    diameter: number;
    depth: number;
    isOnHighway: boolean;
    autoClassifiedDanger: boolean;
  };

  // Dumping Site Specific Attributes
  evidenceMedia?: Array<{ url: string; type: string }>;

  // Worker Assignment Tracking
  assignedDepartment?: Types.ObjectId;
  assignedDeptAdmin?: Types.ObjectId;
  assignedWorker?: Types.ObjectId;

  // Smart Timeline & Accountability
  expectedCompletionDeadline?: Date;
  isOverdue?: boolean;

  // Smart City Features
  upvotes?: number;
  voters?: Types.ObjectId[];
  isDuplicateOf?: Types.ObjectId;
  isEmergencyEscalation?: boolean;
  priorityScore?: number;
  escalationPriority?: string;
  clusterId?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
  assignedAt?: Date;
  workStartedAt?: Date;
  resolvedAt?: Date;
  handledBy?: Object | string;
}
