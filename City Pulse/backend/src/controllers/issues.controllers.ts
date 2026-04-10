import { Request, Response } from "express";
import { IssueModel } from "../models/issue.model";
import { MultimediaModel } from "../models/multimedia.model";

export const createIssue = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];

    const { title = "Untitled", description, location, issueType } = req.body;
    // location stuff

    let parsedLocation = location;
    if (typeof location === "string") {
      try {
        parsedLocation = JSON.parse(location);
      } catch {
        res.status(400).json({ message: "Invalid location JSON format" });
        return;
      }
    }
    parsedLocation.type = "Point";
    parsedLocation.coordinates = [parsedLocation.longitude, parsedLocation.latitude];

    if (
      !title ||
      !description ||
      !parsedLocation ||
      !parsedLocation.latitude ||
      !parsedLocation.longitude ||
      !issueType
    ) {
      res.status(400).json({ message: "Please fill all the required fields " });
      return;
    }

    const existingIssue = await IssueModel.findOne({ title });
    if (existingIssue) {
      res
        .status(400)
        .json({ message: " Issue with this title already exists" });
      return;
    }

    const force = req.body.force === "true" || req.body.force === true;
    if (!force) {
      const { checkDuplicateIssue } = await import("../services/duplicate.service");
      const duplicateId = await checkDuplicateIssue(parsedLocation.latitude, parsedLocation.longitude, issueType);
      if (duplicateId) {
        res.status(409).json({ message: "Similar issue already reported nearby", duplicateReferenceIssueId: duplicateId });
        return;
      }
    }

    let mappedStatus = "Reported";
    const potholeDetails = req.body.potholeDetails ? (typeof req.body.potholeDetails === "string" ? JSON.parse(req.body.potholeDetails) : req.body.potholeDetails) : undefined;

    if (issueType === "Potholes" && potholeDetails) {
      const dangerScore = potholeDetails.diameter * potholeDetails.depth;
      if (dangerScore < 100 && !potholeDetails.isOnHighway) {
        mappedStatus = "Maintenance Queue";
        potholeDetails.autoClassifiedDanger = false;
      } else {
        potholeDetails.autoClassifiedDanger = true;
      }
    }

    const _severity = req.body.severity || "low";
    let pSeverityScore = _severity === "critical" ? 4 : _severity === "high" ? 3 : _severity === "medium" ? 2 : 1;
    let computedPriorityScore = pSeverityScore * 1 * 1 * 1 * 1; // base multipliers
    let computedEscalationPriority = "NORMAL";
    let isEmergencyEscalation = false;

    const emergencyTypes = ["Traffic Lights", "Burst Water Pipes", "power outage", "bridge damage", "Power Outage", "Bridge Damage"];
    if (emergencyTypes.includes(issueType)) {
      isEmergencyEscalation = true;
      computedEscalationPriority = "CRITICAL";
      computedPriorityScore = 1000;

      const { NotificationModel } = await import("../models/notification.model");
      const { AdminModel } = await import("../models/admin.model");
      const mainAdmin = await AdminModel.findOne({ role: "main_admin" }).lean();

      if (mainAdmin) {
        await NotificationModel.create({
          title: "EMERGENCY ALERT: " + issueType,
          message: title + " - " + description,
          type: "BROADCAST",
          createdBy: mainAdmin._id
        });
        // Part 19 Disaster Mode notification intercept
      }
    }

    const issue = await IssueModel.create({
      citizenId: (req as any).citizenId, // Adapt as per your auth
      issueType,
      title,
      description,
      location: parsedLocation,
      status: mappedStatus,
      potholeDetails,
      severity: _severity,
      multimediaId: (req as any).multimediaId,
      priorityScore: computedPriorityScore,
      escalationPriority: computedEscalationPriority,
      isEmergencyEscalation
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
    console.log("Response body:", {
      message: "Issue created",
      media: mediaDocs,
    });

    res.status(200).json({ message: "Issue created", issue, media: mediaDocs });
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getIssues = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId; // Use admin context to filter
    let matchQuery: any = {};

    if (adminId) {
      const { AdminModel } = await import("../models/admin.model");
      const { getCategoriesForDepartment } = await import("../utils/department");

      const adminReq = await AdminModel.findById(adminId).lean();
      if (adminReq) {
        const allowedCategories = getCategoriesForDepartment(adminReq.department as string);
        if (allowedCategories.length > 0) {
          matchQuery.issueType = { $in: allowedCategories };
        }
      }
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const totalIssues = await IssueModel.countDocuments(matchQuery);

    const issues = await IssueModel.find(matchQuery)
      .populate("citizenId", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const issuesWithMedia = await Promise.all(
      issues.map(async (issue) => {
        const media = await MultimediaModel.find({ issueID: issue._id });
        return {
          _id: issue._id,
          title: issue.title,
          description: issue.description,
          type: issue.issueType,
          location: issue.location, //  send only address
          reportedBy: (issue.citizenId as any)?.fullName || "Anonymous",
          reportedAt: issue.createdAt,
          image: media.length > 0 ? media[0].url : null,
          status: issue.status,
        };
      })
    );

    res.json({
      issues: issuesWithMedia,
      pagination: {
        total: totalIssues,
        page,
        pages: Math.ceil(totalIssues / limit),
        limit
      }
    });
  } catch (err) {
    console.error("Error fetching issues:", err);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};
