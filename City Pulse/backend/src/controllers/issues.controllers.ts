import { Request, Response } from "express";
import mongoose from "mongoose";
import { IssueModel } from "../models/issue.model";
import { MultimediaModel } from "../models/multimedia.model";
import { DepartmentModel } from "../models/department.model";
import { getDepartmentForIssueCategory, calculateSlaDeadline, getCategoriesForDepartment } from "../utils/department";
import { AdminModel } from "../models/admin.model";
import { WorkerModel } from "../models/worker.model";
import { findNearbySimilarIssue } from "../services/duplicateDetection.service";
import { IssueVoteModel } from "../models/issueVote.model";
import { sendTargetedNotification } from "./notification.controller";
import { logAction } from "../services/audit.service";
import { updateCitizenTrustScore } from "../services/trustScore.service";
import { getIO } from "../utils/socket";


export const createIssue = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const { title = "Untitled", description, location, issueType, severity } = req.body;

    let parsedLocation = location;
    if (typeof location === "string") {
      try {
        parsedLocation = JSON.parse(location);
      } catch {
        res.status(400).json({ message: "Invalid location JSON format" });
        return;
      }
    }

    if (!title || !description || !parsedLocation || !parsedLocation.latitude || !parsedLocation.longitude || !issueType) {
      res.status(400).json({ message: "Please fill all the required fields" });
      return;
    }

    // Duplicate detection (PART 11: Cluster Intelligence)
    const nearbyIssues = await findNearbySimilarIssue(
      parsedLocation.latitude,
      parsedLocation.longitude,
      issueType
    );

    if (nearbyIssues && nearbyIssues.length > 0) {
      res.status(409).json({
        message: "Duplicate Cluster Detected",
        suggestion: "This issue has already been reported nearby by other citizens.",
        duplicates: nearbyIssues.map(i => ({ id: i._id, title: i.title }))
      });
      return;
    }

    const existingIssue = await IssueModel.findOne({ title });
    if (existingIssue) {
      res.status(400).json({ message: "Issue with this title already exists" });
      return;
    }

    // Automatic Department Routing (String Schema Standardized)
    const { DepartmentIssueMapping } = await import("../utils/department.constants");
    const deptString = DepartmentIssueMapping[issueType] || null;

    // SLA Deadline
    const deadlineTimestamp = calculateSlaDeadline(issueType);

    const issue = await IssueModel.create({
      citizenId: (req as any).citizenId,
      issueType,
      severity: severity || "Low",
      title,
      description,
      location: parsedLocation,
      geoJSON: {
        type: "Point",
        coordinates: [parsedLocation.longitude, parsedLocation.latitude]
      },
      status: "SUBMITTED",
      workflowStage: "SUBMITTED",
      assignedDepartment: deptString,
      deadlineTimestamp,
      dangerMetrics: req.body.dangerMetrics || undefined,
    });

    const mediaDocs = await Promise.all(
      files.map((file) =>
        MultimediaModel.create({
          issueID: issue._id,
          fileType: file.mimetype.startsWith("video") ? "video" : "image",
          url: file.path,
          filename: file.originalname,
        })
      )
    );

    res.status(200).json({ message: "Issue created", issue, media: mediaDocs });

  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    let matchQuery: any = {};
    const adminId = (req as any).adminId; // If called by Admin

    if (adminId) {
      const adminReq = await AdminModel.findById(adminId).lean();
      if (adminReq) {
        // RBAC check: Main admins see all, Dept Admins see only their Dept categories
        if (adminReq.role !== "MAIN_ADMIN") {
          const allowedCategories = getCategoriesForDepartment(adminReq.department as string);
          if (allowedCategories.length > 0) {
            matchQuery.issueType = { $in: allowedCategories };
          }
        }
      }
    }

    const issues = await IssueModel.find(matchQuery)
      .populate("citizenId", "fullName email")
      .populate("assignedDepartment", "name")
      .populate("departmentAdminAssignedBy", "fullName email")
      .populate("workerAssignedToFix", "fullName")
      .sort({ severity: 1, upvotes: -1 })
      .lean();

    const issuesWithMedia = await Promise.all(
      issues.map(async (issue: any) => {
        const media = await MultimediaModel.find({ issueID: issue._id });
        return {
          ...issue,
          reportedBy: issue.citizenId?.fullName || "Anonymous",
          image: media.length > 0 ? media[0].url : null,
          media: media.map(m => m.url),
        };
      })
    );

    res.json({ success: true, issues: issuesWithMedia, data: issuesWithMedia });
  } catch (err) {
    console.error("Error fetching issues:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const upvoteIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const citizenId = (req as any).citizenId;

    if (!citizenId) {
      res.status(401).json({ message: "Unauthorized. Only citizens can upvote." });
      return;
    }

    const issue = await IssueModel.findById(id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    if (issue.upvotes && issue.upvotes.includes(citizenId)) {
      res.status(400).json({ message: "You have already upvoted this issue" });
      return;
    }

    issue.upvotes = issue.upvotes || [];
    issue.upvotes.push(citizenId);

    // Auto-escalation threshold
    if (issue.upvotes.length > 50 && issue.severity !== "Critical") {
      issue.severity = "Critical";
      issue.emergencyEscalation = true;
    }

    await issue.save();
    res.json({ message: "Issue upvoted", upvotes: issue.upvotes.length });
  } catch (error) {
    console.error("Error upvoting issue:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const voteIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { weight } = req.body;
    const citizenId = (req as any).citizenId;

    if (!citizenId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const vote = await IssueVoteModel.findOneAndUpdate(
      { userId: citizenId, issueId: id },
      { voteWeight: weight || 1, timestamp: new Date() },
      { upsert: true, new: true }
    );

    // Sync upvotes array for legacy sorting
    await IssueModel.findByIdAndUpdate(id, { $addToSet: { upvotes: citizenId } });

    res.status(200).json({ success: true, vote });
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateDumpingStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { cleanupStage } = req.body;
    const adminId = (req as any).adminId;

    const issue = await IssueModel.findById(id);
    if (!issue || issue.issueType !== "Illegal Dumping Sites") {
      res.status(400).json({ message: "Invalid issue for dumping stage updates" });
      return;
    }

    const oldStage = issue.cleanupStage;
    issue.cleanupStage = cleanupStage;
    const oldStatus = issue.status;
    if (cleanupStage === "Verified") {
      issue.status = "Closed";
    } else if (cleanupStage === "Cleared") {
      issue.status = "Resolved (Unverified)";
    }

    await issue.save();

    if (issue.citizenId) {
      await updateCitizenTrustScore(issue.citizenId.toString());
    }

    await logAction({
      actorId: adminId || (req as any).workerId,
      actorRole: adminId ? "ADMIN" : "WORKER",
      actionType: "STATUS_CHANGE",
      targetEntity: "ISSUE",
      targetId: issue._id as string,
      oldValue: { stage: oldStage, status: oldStatus },
      newValue: { stage: cleanupStage, status: issue.status },
      ipAddress: req.ip
    });

    res.json({ message: "Dumping stage updated", issue });
  } catch (error) {
    console.error("Error updating dumping stage:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPublicAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalIssues = await IssueModel.countDocuments();
    const resolvedIssues = await IssueModel.countDocuments({ status: { $in: ["Resolved", "Resolved (Unverified)", "Closed"] } });
    const inProgressIssues = await IssueModel.countDocuments({ status: { $in: ["In Progress", "Worker Assigned"] } });

    const byType = await IssueModel.aggregate([
      { $group: { _id: "$issueType", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalIssues,
        resolvedIssues,
        inProgressIssues,
        byType
      }
    });
  } catch (error) {
    console.error("Error fetching public analytics:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const assignWorker = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { workerId, departmentId } = req.body;
    const adminId = (req as any).adminId;

    const adminReq = await AdminModel.findById(adminId);
    if (!adminReq || adminReq.role !== "DEPARTMENT_ADMIN") {
      res.status(403).json({ message: "Forbidden: Only Department Admins can assign workers." });
      return;
    }

    const worker = await WorkerModel.findById(workerId);
    // Assuming adminReq.department is a string that might represent the ObjectID or the department name. We'll toString() all logic.
    if (!worker || worker.department.toString() !== departmentId) {
      res.status(400).json({ message: "Worker does not belong to the selected department." });
      return;
    }

    const issue = await IssueModel.findById(id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    if (issue.status === "COMPLETED" || issue.status === "CANCELLED" || issue.status === "Resolved" || issue.status === "Closed") {
      res.status(400).json({ message: "Cannot assign worker to completed or cancelled issue." });
      return;
    }

    if (issue.workerAssignedToFix) {
      res.status(400).json({ message: "Worker already assigned. Use reassign to change worker." });
      return;
    }

    const oldWorker = issue.workerAssignedToFix;
    issue.workerAssignedToFix = workerId;
    issue.assignedDepartment = worker.department;
    issue.departmentAdminAssignedBy = adminId;
    issue.workerAssignmentTimestamp = new Date();

    // Work must begin within 48 hours
    issue.deadlineTimestamp = new Date(Date.now() + 48 * 60 * 60 * 1000);

    if (!issue.timeline) {
      issue.timeline = { reportedAt: new Date(), isOverdue: false };
    }
    issue.timeline.assignedAt = new Date();
    const oldStatus = issue.status;
    issue.status = "ASSIGNED_TO_WORKER";
    issue.workflowStage = "ASSIGNED_TO_WORKER";

    await issue.save();

    // log IssueStatusHistory entry
    const { IssueStatusHistoryModel } = await import("../models/issueStatusHistory.model");
    await IssueStatusHistoryModel.create({
      issueID: issue._id,
      status: "ASSIGNED_TO_WORKER",
      changedBy: adminId,
    });

    await logAction({
      actorId: adminId,
      actorRole: "ADMIN",
      actionType: "ASSIGNMENT",
      targetEntity: "ISSUE",
      targetId: issue._id as string,
      oldValue: { workerId: oldWorker, status: oldStatus },
      newValue: { workerId, status: "ASSIGNED_TO_WORKER", workflowStage: "ASSIGNED_TO_WORKER" },
      ipAddress: req.ip
    });

    // PART 11: Notification triggers. NOTE: sendTargetedNotification handles email, socket and doc trigger automatically
    await sendTargetedNotification(workerId, "New Assignment", `You have been assigned to issue ${issue.title}`, "assignment");
    if (issue.citizenId) {
      await sendTargetedNotification(issue.citizenId.toString(), "Worker Assigned", `A worker has been assigned to fix your reported issue: ${issue.title}`, "status_update");
    }

    res.status(200).json(issue);
  } catch (error) {
    console.error("Error assigning worker:", error);
    res.status(500).json({ message: "Failed to assign worker" });
  }
};

export const assignDepartmentAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { adminId, departmentId } = req.body;
    const mainAdminId = (req as any).adminId;

    const issue = await IssueModel.findById(id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    issue.departmentAdminAssignedBy = adminId;
    issue.assignedDepartment = departmentId;
    issue.deadlineTimestamp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hr to assign worker

    if (!issue.timeline) {
      issue.timeline = { reportedAt: new Date(), isOverdue: false };
    }
    issue.timeline.assignedAt = new Date();
    issue.status = "Pending"; // Or specialized status

    await issue.save();

    // Notification for Dept Admin
    await sendTargetedNotification(adminId, "Issue Assignment", `Main Admin assigned you an issue for department supervision.`, "assignment");

    res.status(200).json(issue);
  } catch (error) {
    console.error("Error assigning dept admin:", error);
    res.status(500).json({ message: "Failed to assign department admin" });
  }
};

export const getIssueTrackingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const issue = await IssueModel.findById(req.params.id)
      .populate("assignedDepartment", "name")
      .populate("departmentAdminAssignedBy", "fullName lastName")
      .populate("workerAssignedToFix", "fullName lastName")
      .lean();

    if (!issue) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    const progressMap: Record<string, number> = {
      'Reported': 10,
      'Worker Assigned': 30,
      'In Progress': 60,
      'Resolved (Unverified)': 85,
      'Resolved': 100,
      'Closed': 100
    };

    res.status(200).json({
      timeline: issue.timeline,
      department: issue.assignedDepartment,
      departmentAdmin: issue.departmentAdminAssignedBy,
      worker: issue.workerAssignedToFix,
      progressPercentage: progressMap[issue.status || ''] || 0,
      expectedCompletionDate: issue.deadlineTimestamp,
      isOverdue: issue.timeline?.isOverdue,
      violationStage: (issue as any).violationStage,
      delayDuration: (issue as any).delayDuration
    });
  } catch (error) {
    console.error("Error fetching tracking:", error);
    res.status(500).json({ message: "Failed to get tracking info" });
  }
};
export const getVotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const votes = await IssueVoteModel.find({ issueId: id }).populate("userId", "fullName");
    res.status(200).json({ success: true, votes });
  } catch (error) {
    console.error("Error fetching votes:", error);
    res.status(500).json({ success: false, message: "Fetch failed" });
  }
};

export const getPublicSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const issues = await IssueModel.find({ status: { $nin: ["Resolved", "Closed", "Rejected"] } })
      .select("title severity escalationLevel timeline createdAt queueType")
      .sort({ escalationLevel: -1, "timeline.reportedAt": 1 })
      .limit(50);
    res.json({ success: true, schedule: issues });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getServiceOutages = async (req: Request, res: Response): Promise<void> => {
  try {
    const issues = await IssueModel.find({
      issueType: { $in: ["Power Outage", "Water Supply"] },
      status: { $nin: ["Resolved", "Closed", "Rejected"] }
    })
      .select("title severity timeline createdAt location queueType")
      .sort({ "timeline.reportedAt": -1 });
    res.json({ success: true, outages: issues });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const acceptAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const workerId = (req as any).workerId;

    const issue = await IssueModel.findById(id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    if (issue.workerAssignedToFix?.toString() !== workerId) {
      res.status(403).json({ message: "You are not assigned to this issue" });
      return;
    }

    issue.assignmentAcceptedTimestamp = new Date();
    issue.status = "WORKER_ACCEPTED";
    issue.workflowStage = "WORKER_ACCEPTED";
    if (issue.timeline) issue.timeline.workBegunAt = new Date();

    await issue.save();

    const { IssueStatusHistoryModel } = await import("../models/issueStatusHistory.model");
    await IssueStatusHistoryModel.create({
      issueID: issue._id,
      status: "WORKER_ACCEPTED",
      changedBy: workerId,
    });

    if (issue.departmentAdminAssignedBy) {
      await sendTargetedNotification(
        issue.departmentAdminAssignedBy.toString(),
        "Assignment Accepted",
        `Worker has accepted assignment for issue ${issue.title}`,
        "Status Update"
      );
    }

    res.status(200).json(issue);
  } catch (error) {
    console.error("Error accepting assignment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const workerId = (req as any).workerId;

    const issue = await IssueModel.findById(id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    if (issue.workerAssignedToFix?.toString() !== workerId) {
      res.status(403).json({ message: "You are not assigned to this issue" });
      return;
    }

    issue.assignmentRejectedTimestamp = new Date();
    issue.workerAssignedToFix = undefined;
    issue.status = "ROUTED_TO_DEPARTMENT";
    issue.workflowStage = "ROUTED_TO_DEPARTMENT";

    await issue.save();

    const { IssueStatusHistoryModel } = await import("../models/issueStatusHistory.model");
    await IssueStatusHistoryModel.create({
      issueID: issue._id,
      status: "ROUTED_TO_DEPARTMENT",
      changedBy: workerId,
    });

    if (issue.departmentAdminAssignedBy) {
      await sendTargetedNotification(
        issue.departmentAdminAssignedBy.toString(),
        "Assignment Rejected",
        `Worker rejected assignment for issue ${issue.title}`,
        "Warning"
      );
    }

    res.status(200).json(issue);
  } catch (error) {
    console.error("Error rejecting assignment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const reassignWorker = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { workerId } = req.body;
    const adminId = (req as any).adminId;

    const issue = await IssueModel.findById(id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    const worker = await WorkerModel.findById(workerId);
    if (!worker) {
      res.status(400).json({ message: "New worker not found" });
      return;
    }

    const oldWorkerId = issue.workerAssignedToFix;

    issue.workerAssignedToFix = workerId;
    issue.assignmentAcceptedTimestamp = undefined;
    issue.status = "ASSIGNED_TO_WORKER";
    issue.workflowStage = "ASSIGNED_TO_WORKER";

    await issue.save();

    const { IssueStatusHistoryModel } = await import("../models/issueStatusHistory.model");
    await IssueStatusHistoryModel.create({
      issueID: issue._id,
      status: "ASSIGNED_TO_WORKER",
      changedBy: adminId,
    });

    if (oldWorkerId) {
      await sendTargetedNotification(oldWorkerId.toString(), "Unassigned", `You have been unassigned from ${issue.title}`, "Status Update");
    }
    await sendTargetedNotification(workerId, "New Assignment", `You have been reassigned to issue ${issue.title}`, "assignment");

    res.status(200).json(issue);
  } catch (error) {
    console.error("Error reassigning worker:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAssignmentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const issue = await IssueModel.findById(id).populate("workerAssignedToFix").lean();

    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    const worker = issue.workerAssignedToFix as any;
    const workerAvgCompletionTime = worker ? (worker.averageResolutionTimeHours || 0) : 0;

    let adminAvgResponseTimeHours = 0;
    if (issue.departmentAdminAssignedBy) {
      const adminId = issue.departmentAdminAssignedBy;

      // Calculate admin's average response time by finding all their assigned issues
      const assignedIssues = await IssueModel.find({
        departmentAdminAssignedBy: adminId,
        "timeline.reportedAt": { $exists: true },
        "timeline.assignedAt": { $exists: true }
      }).select("timeline").lean();

      if (assignedIssues.length > 0) {
        let totalResponseMs = 0;
        let validCount = 0;

        assignedIssues.forEach(iss => {
          const rep = iss.timeline?.reportedAt ? new Date(iss.timeline.reportedAt).getTime() : 0;
          const assigned = iss.timeline?.assignedAt ? new Date(iss.timeline.assignedAt).getTime() : 0;
          if (rep > 0 && assigned > 0 && assigned >= rep) {
            totalResponseMs += (assigned - rep);
            validCount++;
          }
        });

        if (validCount > 0) {
          const avgMs = totalResponseMs / validCount;
          adminAvgResponseTimeHours = parseFloat((avgMs / (1000 * 60 * 60)).toFixed(2));
        }
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        adminAvgResponseTimeHours,
        workerAvgCompletionTimeHours: workerAvgCompletionTime,
      }
    });
  } catch (error) {
    console.error("Error fetching assignment stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getIssueHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    let matchQuery: any = {
      status: { $in: ["Resolved", "Closed", "Resolved (Unverified)", "COMPLETED"] }
    };

    const adminId = (req as any).adminId;
    const citizenId = (req as any).citizenId;
    const workerId = (req as any).workerId;

    if (adminId) {
      const adminReq = await AdminModel.findById(adminId).lean();
      if (adminReq) {
        if (adminReq.role !== "MAIN_ADMIN") {
          const dept = await DepartmentModel.findOne({ name: adminReq.department }).lean();
          if (dept) {
            matchQuery.assignedDepartment = dept._id;
          } else {
            // Fallback if department name doesn't match any ID
            matchQuery.assignedDepartment = new mongoose.Types.ObjectId();
          }
        } else {
          const deptId = req.query.departmentId as string;
          if (deptId) {
            if (mongoose.Types.ObjectId.isValid(deptId)) {
              matchQuery.assignedDepartment = deptId;
            } else {
              const dept = await DepartmentModel.findOne({ name: deptId }).lean();
              if (dept) matchQuery.assignedDepartment = dept._id;
            }
          }
        }
      }
    } else if (citizenId) {
      const deptId = req.query.departmentId as string;
      if (deptId) {
        if (mongoose.Types.ObjectId.isValid(deptId)) {
          matchQuery.assignedDepartment = deptId;
        } else {
          const dept = await DepartmentModel.findOne({ name: deptId }).lean();
          if (dept) matchQuery.assignedDepartment = dept._id;
        }
      }
    } else if (workerId) {
      matchQuery.workerAssignedToFix = workerId;
    }

    const issues = await IssueModel.find(matchQuery)
      .populate("citizenId", "fullName email")
      .populate("assignedDepartment", "name")
      .populate("departmentAdminAssignedBy", "fullName email")
      .populate("workerAssignedToFix", "fullName")
      .sort({ "timeline.resolvedAt": -1, resolutionTimestamp: -1, updatedAt: -1 })
      .lean();

    res.status(200).json({ success: true, history: issues });
  } catch (err) {
    console.error("Error fetching issue history:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const reassignDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { departmentId } = req.body;
    const adminId = (req as any).adminId;

    const adminReq = await AdminModel.findById(adminId);
    if (!adminReq || adminReq.role !== "MAIN_ADMIN") {
      res.status(403).json({ message: "Forbidden: Only Main Admins can reassign departments." });
      return;
    }

    const issue = await IssueModel.findById(id);
    if (!issue) { res.status(404).json({ message: "Issue not found" }); return; }

    issue.assignedDepartment = departmentId;
    issue.departmentAdminAssignedBy = undefined;
    issue.workerAssignedToFix = undefined;
    issue.workflowStage = "ROUTED_TO_DEPARTMENT";
    issue.status = "Pending";
    await issue.save();
    res.json({ success: true, message: "Department reassigned", issue });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const overrideAssignee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { assigneeId, role } = req.body;
    const adminId = (req as any).adminId;

    const adminReq = await AdminModel.findById(adminId);
    if (!adminReq || adminReq.role !== "MAIN_ADMIN") { res.status(403).json({ message: "Forbidden: Only Main Admins can override assignees." }); return; }

    const issue = await IssueModel.findById(id);
    if (!issue) { res.status(404).json({ message: "Issue not found" }); return; }

    issue.assignedToUserId = assigneeId;
    issue.assignedToRole = role;

    if (role === "DEPARTMENT_ADMIN") {
      issue.departmentAdminAssignedBy = assigneeId;
      issue.workerAssignedToFix = undefined;
      issue.workflowStage = "AWAITING_VERIFICATION";
      issue.status = "Pending";
    } else if (role === "WORKER") {
      issue.workerAssignedToFix = assigneeId;
      issue.departmentAdminAssignedBy = undefined;
      issue.workflowStage = "ASSIGNED_TO_WORKER";
      issue.status = "ASSIGNED_TO_WORKER";
    }

    await issue.save();
    res.json({ success: true, message: "Assignee overridden successfully", issue });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const getAssignablePersonnelByDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department } = req.params;
    const { getAssignablePersonnel } = await import("../services/issues.service");
    const personnel = await getAssignablePersonnel(department);
    res.json({ success: true, data: personnel });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const getIssueById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const issue = await IssueModel.findById(id)
      .populate("citizenId", "fullName email")
      .populate("departmentAdminAssignedBy", "fullName email")
      .populate("workerAssignedToFix", "fullName email")
      .lean();

    if (!issue) {
      res.status(404).json({ success: false, message: "Issue not found" });
      return;
    }

    const media = await MultimediaModel.find({ issueID: id });
    const votes = await IssueVoteModel.find({ issueId: id }).populate("userId", "fullName");

    res.json({
      success: true,
      data: {
        ...issue,
        media: media.map(m => m.url),
        votes: votes
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const assignAdminAndWorker = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { adminId, workerId } = req.body;
    const requesterId = (req as any).adminId;

    const mainAdmin = await AdminModel.findById(requesterId);
    if (!mainAdmin || mainAdmin.role !== "MAIN_ADMIN") {
      res.status(403).json({ success: false, message: "Only Main Admins can perform this dual assignment" });
      return;
    }

    const issue = await IssueModel.findById(id);
    if (!issue) {
      res.status(404).json({ success: false, message: "Issue not found" });
      return;
    }

    // Assign to Admin (Supervisor)
    if (adminId) {
      issue.departmentAdminAssignedBy = adminId;
    }

    // Assign to Worker (Field Staff)
    if (workerId) {
      issue.workerAssignedToFix = workerId;
      issue.status = "ASSIGNED_TO_WORKER";
      issue.workflowStage = "ASSIGNED_TO_WORKER";
      issue.workerAssignmentTimestamp = new Date();
      // Work must begin within 48 hours if worker is assigned
      issue.deadlineTimestamp = new Date(Date.now() + 48 * 60 * 60 * 1000);
    } else if (adminId) {
      // If only Admin is assigned, it moves to ROUTED_TO_DEPARTMENT stage for them to handle further
      issue.workflowStage = "ROUTED_TO_DEPARTMENT";
      issue.status = "Pending";
      issue.deadlineTimestamp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hr for them to assign worker
    }

    issue.overrideSource = "MAIN_ADMIN";
    issue.overrideTimestamp = new Date();

    if (!issue.timeline) {
      issue.timeline = { reportedAt: issue.createdAt || new Date(), isOverdue: false };
    }
    issue.timeline.assignedAt = new Date();

    await issue.save();

    // Log Action
    await logAction({
      actorId: requesterId,
      actorRole: "ADMIN",
      actionType: "ASSIGNMENT",
      targetEntity: "ISSUE",
      targetId: issue._id as string,
      newValue: { adminId, workerId, status: issue.status },
      ipAddress: req.ip
    });

    // Notifications
    if (adminId) {
      await sendTargetedNotification(adminId, "Direct Supervision Assignment", `Main Admin assigned you to supervise: ${issue.title}`, "assignment");
    }
    if (workerId) {
      await sendTargetedNotification(workerId, "Direct Field Assignment", `Main Admin has directly assigned you to: ${issue.title}`, "assignment");
    }

    if (issue.citizenId) {
      await sendTargetedNotification(issue.citizenId.toString(), "Issue Update", `Your reported issue "${issue.title}" has been assigned to personnel for resolution.`, "status_update");
    }

    res.json({ success: true, message: "Assignment completed successfully", data: issue });
  } catch (err: any) {
    console.error("Error in assignAdminAndWorker:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getIssueDepartmentStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const issue = await IssueModel.findById(id);
    if (!issue) {
      res.status(404).json({ success: false, message: "Issue not found" });
      return;
    }

    let departmentName = issue.assignedDepartment;
    if (!departmentName) {
      res.status(400).json({ success: false, message: "Issue has no assigned department" });
      return;
    }

    // Resolve name if departmentName is an ID
    if (mongoose.Types.ObjectId.isValid(departmentName)) {
      const dept = await DepartmentModel.findById(departmentName);
      if (dept) {
        departmentName = dept.name;
      }
    }

    // Create a robust search query for the department
    // Matches the exact name, or a case-insensitive regex
    // Special handling for TSCZ and Roads mapping
    const searchTerms = [departmentName];

    // Explicit mapping: Roads -> Traffic Safety Council
    if (departmentName.toLowerCase().includes("roads") || departmentName === "Traffic Safety Council of Zimbabwe" || departmentName === "TSCZ") {
      searchTerms.push("Traffic Safety Council of Zimbabwe", "TSCZ", "Roads", "Roads Department");
    }

    const deptQuery = {
      $or: [
        { department: { $in: searchTerms } },
        { department: { $regex: new RegExp(`^${departmentName}$`, 'i') } }
      ]
    };

    const departmentAdmins = await AdminModel.find({
      ...deptQuery,
      role: "DEPARTMENT_ADMIN",
      isActive: { $ne: false }
    }).select("-password -__v").lean();

    const workers = await WorkerModel.find({
      ...deptQuery,
      isActive: { $ne: false }
    }).select("-password -__v").lean();

    res.json({
      success: true,
      data: {
        departmentName, // Return the resolved name for UI clarity
        departmentAdmins,
        workers
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const overrideDepartmentAdminAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;
    const requesterId = (req as any).adminId;

    const mainAdmin = await AdminModel.findById(requesterId);
    if (!mainAdmin || mainAdmin.role !== "MAIN_ADMIN") {
      res.status(403).json({ success: false, message: "Only Main Admins can perform overrides" });
      return;
    }

    const issue = await IssueModel.findById(id);
    if (!issue) {
      res.status(404).json({ success: false, message: "Issue not found" });
      return;
    }

    issue.departmentAdminAssignedBy = adminId;
    issue.workerAssignedToFix = undefined;
    issue.status = "ROUTED_TO_DEPARTMENT";
    issue.workflowStage = "ROUTED_TO_DEPARTMENT";
    issue.overrideSource = "MAIN_ADMIN";
    issue.overrideTimestamp = new Date();

    await issue.save();
    try {
      getIO().emit("issueUpdated", { issueId: id, source: "MAIN_ADMIN_OVERRIDE" });
    } catch (err) {
      console.error("Socket emit failed:", err);
    }
    res.json({ success: true, message: "Department Admin overridden successfully", data: issue });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const overrideWorkerAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { workerId } = req.body;
    const requesterId = (req as any).adminId;

    const mainAdmin = await AdminModel.findById(requesterId);
    if (!mainAdmin || mainAdmin.role !== "MAIN_ADMIN") {
      res.status(403).json({ success: false, message: "Only Main Admins can perform overrides" });
      return;
    }

    const issue = await IssueModel.findById(id);
    if (!issue) {
      res.status(404).json({ success: false, message: "Issue not found" });
      return;
    }

    issue.workerAssignedToFix = workerId;
    issue.departmentAdminAssignedBy = undefined;
    issue.status = "ASSIGNED_TO_WORKER";
    issue.workflowStage = "ASSIGNED_TO_WORKER";
    issue.overrideSource = "MAIN_ADMIN";
    issue.overrideTimestamp = new Date();

    await issue.save();
    try {
      getIO().emit("issueUpdated", { issueId: id, source: "MAIN_ADMIN_OVERRIDE" });
    } catch (err) {
      console.error("Socket emit failed:", err);
    }
    res.json({ success: true, message: "Worker overridden successfully", data: issue });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
