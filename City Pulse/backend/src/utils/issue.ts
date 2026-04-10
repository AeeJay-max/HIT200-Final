import { ILocation } from "./location";
import { Types } from "mongoose";

export interface IIssue {
  citizenId: Types.ObjectId; // reference to Citizen
  issueType: string;
  title: string;
  description: string;
  status?: string;
  workflowStage?: string;
  severity?: string;
  location: ILocation; // embedded location object
  media?: Types.ObjectId[]; // refs to multimedia
  images?: { url: string; stage: "Reported" | "Before" | "After" }[];
  cleanupStage?: "Scheduled" | "In Progress" | "Cleared" | "Verified";
  dangerMetrics?: {
    diameterCm: number;
    depthCm: number;
    isOnMainRoad: boolean;
    autoSeverityScore: number;
    isLifeThreatening: boolean;
  };
  timeline?: {
    reportedAt: Date;
    assignedAt?: Date;
    workBegunAt?: Date;
    resolvedAt?: Date;
    isOverdue: boolean;
  };
  upvotes?: Types.ObjectId[];
  aiDuplicateFlag?: Types.ObjectId;
  emergencyEscalation?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  handledBy?: Object | string;
  assignedDepartment?: Types.ObjectId;
  departmentAdminAssignedBy?: Types.ObjectId;
  workerAssignedToFix?: Types.ObjectId;
  assignmentAcceptedTimestamp?: Date;
  assignmentRejectedTimestamp?: Date;
  workerAssignmentTimestamp?: Date;
  deadlineTimestamp?: Date;
  priorityScore?: number;
  escalationLevel?: number;
  escalationPriority?: "Low" | "Medium" | "High";
  district?: string;
  resolutionQualityVerifiedBy?: Types.ObjectId;
  resolutionVerificationTimestamp?: Date;
  delayDuration?: number;
  violationStage?: string;
  queueType?: "emergency" | "maintenance" | "general";
  duplicateReferenceIssueId?: Types.ObjectId;
  overdueStatus?: boolean;
  isDeleted?: boolean;
}
