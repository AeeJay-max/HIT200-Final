import { Router, Request, Response, NextFunction } from "express";
import { upload } from "../middlerware/upload.middleware";
import { createIssue, getIssues, upvoteIssue, updateDumpingStage, getPublicAnalytics, assignWorker, getIssueTrackingStatus, voteIssue, assignDepartmentAdmin, getVotes, getPublicSchedule, getServiceOutages, acceptAssignment, rejectAssignment, reassignWorker, getAssignmentStats, getIssueHistory } from "../controllers/issues.controllers";
import { authMiddleware } from "../middlerware/auth.middleware";

const router = Router();
router.post(
  "/citizen/create-issue",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    upload.array("files", 10)(req, res, (err) => {
      console.log("Upload middleware callback");
      if (err) {
        console.error("=== UPLOAD ERROR ===");
        console.error("Error type:", typeof err);
        console.error("Error:", err);
        console.error("Error message:", err?.message);
        return res
          .status(400)
          .json({ message: "Upload failed", error: err.message });
      }
      console.log("Upload successful, proceeding to controller");
      next();
    });
  },
  createIssue
);

router.get("/all-issues", authMiddleware, getIssues);

// Community Upvote
router.post("/issues/:id/upvote", authMiddleware, upvoteIssue);
router.post("/issues/:id/vote", authMiddleware, voteIssue);

// Dumping Lifecycle Tracker
router.put("/issues/:id/dumping-stage", authMiddleware, updateDumpingStage);
router.patch("/issues/:id/update-cleanup-stage", authMiddleware, updateDumpingStage); // Alias for consistency

// Public Transparency
router.get("/public/analytics", getPublicAnalytics);
router.get("/public/schedule", getPublicSchedule);
router.get("/public/outages", getServiceOutages);

// Maintenance Queue
router.get("/maintenance-queue", authMiddleware, getIssues); // Reuse getIssues with filter

// Worker Assignment
router.patch("/issues/:id/assign-worker", authMiddleware, assignWorker);
router.patch("/issues/:id/assign-department-admin", authMiddleware, assignDepartmentAdmin);
router.patch("/issues/:id/accept-assignment", authMiddleware, acceptAssignment);
router.patch("/issues/:id/reject-assignment", authMiddleware, rejectAssignment);
router.patch("/issues/:id/reassign-worker", authMiddleware, reassignWorker);

// Tracking API
router.get("/issues/:id/tracking", getIssueTrackingStatus);
router.get("/issues/:id/votes", authMiddleware, getVotes);
router.get("/issues/:id/assignment-stats", authMiddleware, getAssignmentStats);
router.get("/history", authMiddleware, getIssueHistory);

export default router;
