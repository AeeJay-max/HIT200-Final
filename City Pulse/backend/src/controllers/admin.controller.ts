import { AdminModel } from "../models/admin.model";
import { IssueModel } from "../models/issue.model";
import { Request, Response } from "express";
import { IssueStatusHistoryModel } from "../models/issueStatusHistory.model";
import mongoose from "mongoose";

interface AuthRequest extends Request {
  adminId?: string;
}

export const getAdminProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const loggedInAdminId = req.adminId;

    if (id !== loggedInAdminId) {
      res.status(403).json({ message: "Unauthorised access" });
      return;
    }

    const admin = await AdminModel.findById(id).select("-password").lean();

    if (!admin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }

    res.json(admin);
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateAdminProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const { fullName, email, phonenumber, department } = req.body;

    if (!fullName || !email || !phonenumber || !department) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const updatedAdmin = await AdminModel.findByIdAndUpdate(
      id,
      { fullName, email, phonenumber, department },
      { new: true }
    );

    if (!updatedAdmin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }

    res.json({ message: "Profile updated successfully", user: updatedAdmin });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateIssueStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.adminId;

    const validStatuses = [
      "Reported",
      "In Progress",
      "Resolved",
      "Rejected",
      "Pending",
      "Closed",
      "Resolved (Unverified)",
    ];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: "Invalid status value" });
      return;
    }

    const updatedIssue = await IssueModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedIssue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }
    // Creating a record in IssueStatusHistory for this status change

    await IssueStatusHistoryModel.create({
      issueID: new mongoose.Types.ObjectId(id),
      status,
      handledBy: new mongoose.Types.ObjectId(adminId!),
      changedBy: new mongoose.Types.ObjectId(adminId!), // original reporter, optional
      changedAt: new Date(), // optional if timestamps enabled
    });

    res.json({ message: "Issue updated successfully", issue: updatedIssue });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getHandledIssuesByAdmin = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const adminId = authReq.adminId; // from authMiddleware

    if (!adminId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const historyRecords = await IssueStatusHistoryModel.aggregate([
      {
        $match: {
          handledBy: new mongoose.Types.ObjectId(adminId),
          status: { $in: ["In Progress", "Resolved", "Pending", "Rejected"] },
        },
      },
      {
        $sort: { changedAt: -1 },
      },
      {
        $group: {
          _id: "$issueID",
          latestRecord: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$latestRecord" },
      },
      {
        $lookup: {
          from: "issues",
          localField: "issueID",
          foreignField: "_id",
          as: "issueDetails",
        },
      },
      {
        $unwind: "$issueDetails",
      },
      {
        $project: {
          status: 1,
          handledBy: 1,
          lastStatus: "$status",
          lastUpdated: "$changedAt",
          issueDetails: 1,
        },
      },
    ]);
    const issues = historyRecords.map((record) => ({
      ...record.issueDetails,
      status: record.status,
      handledBy: record.handledBy,
      lastStatus: record.lastStatus,
      lastUpdated: record.lastUpdated,
      isRejected: record.status === "Rejected",
    }));


    res.status(200).json({ success: true, issues });
  } catch (error) {
    console.error("Error fetching handled issues:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteIssueByAdmin = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const loggedInAdminId = req.adminId; // from auth middleware
    const { issueid } = req.params;

    // Validate issueid format
    if (!mongoose.Types.ObjectId.isValid(issueid)) {
      res.status(400).json({ message: "Invalid issue ID format" });
      return;
    }
    // If allowing any admin to delete:

    const result = await IssueModel.deleteOne({ _id: issueid });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: "Issue not found or unauthorized" });
      return;
    }
    res.json({ message: "Deleted Successfully!" });
  } catch (error) {
    console.error("Error deleting issue:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const adminId = (req as any).adminId;
    let matchStage: any = {};

    if (adminId) {
      const { AdminModel } = await import("../models/admin.model");
      const { getCategoriesForDepartment } = await import("../utils/department");
      const adminReq = await AdminModel.findById(adminId).lean();

      if (adminReq && adminReq.role !== "MAIN_ADMIN") {
        const allowedCategories = getCategoriesForDepartment(adminReq.department as string);
        if (allowedCategories.length > 0) {
          matchStage = { $match: { issueType: { $in: allowedCategories } } };
        }
      }
    }

    const { WorkerModel } = await import("../models/worker.model");
    const { DepartmentModel } = await import("../models/department.model");

    const basePipeline = Object.keys(matchStage).length > 0 ? [matchStage] : [];

    const totalPipeline = [...basePipeline, { $count: "total" }];
    const totalResult = await IssueModel.aggregate(totalPipeline);
    const totalIssues = totalResult.length > 0 ? totalResult[0].total : 0;

    const byStatus = await IssueModel.aggregate([...basePipeline, { $group: { _id: "$status", count: { $sum: 1 } } }]);
    const byCategory = await IssueModel.aggregate([...basePipeline, { $group: { _id: "$issueType", count: { $sum: 1 } } }]);

    // Geo Intelligence Engine: Hotspots based on coordinates matching
    const hotspots = await IssueModel.aggregate([
      ...basePipeline,
      {
        $group: {
          _id: { lat: "$location.latitude", lng: "$location.longitude", address: "$location.address" },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }, // Danger clusters/repeated failures
      { $sort: { count: -1 } },
      { $limit: 100 }
    ]);

    // SLA Compliance
    const slaCompliance = await IssueModel.aggregate([
      ...basePipeline,
      {
        $group: {
          _id: { department: "$assignedDepartment", escalationLevel: "$escalationLevel" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Worker Productivity
    const workerProductivity = await WorkerModel.find({})
      .sort({ totalIssuesResolved: -1, averageResolutionTimeHours: 1 })
      .limit(10)
      .select("fullName email totalIssuesResolved totalOverdueIssues averageResolutionTimeHours performanceScore");

    // Department Stats
    const departmentStats = await DepartmentModel.find({});

    res.status(200).json({
      success: true,
      data: {
        totalIssues,
        byStatus,
        byCategory,
        hotspots,
        slaCompliance,
        workerProductivity,
        departmentStats
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getRadiusHotspots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng, radiusKm, timeFilter } = req.body;

    if (lat === undefined || lng === undefined || !radiusKm) {
      res.status(400).json({ message: "lat, lng, and radiusKm are required parameters." });
      return;
    }

    const radiusInRadians = radiusKm / 6378.1; // Earth's radius in km

    let matchStage: any = {
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians] // MongoDB uses [lng, lat]
        }
      }
    };

    if (timeFilter) {
      const date = new Date();
      if (timeFilter === "weekly") date.setDate(date.getDate() - 7);
      if (timeFilter === "monthly") date.setMonth(date.getMonth() - 1);
      if (timeFilter === "yearly") date.setFullYear(date.getFullYear() - 1);
      matchStage.createdAt = { $gte: date };
    }

    const hotspots = await IssueModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { lat: "$location.latitude", lng: "$location.longitude", address: "$location.address", issueType: "$issueType" },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 0 } } },
      { $sort: { count: -1 } },
      { $limit: 100 }
    ]);

    res.status(200).json({ success: true, hotspots });
  } catch (error) {
    console.error("Error fetching radius hotspots:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

