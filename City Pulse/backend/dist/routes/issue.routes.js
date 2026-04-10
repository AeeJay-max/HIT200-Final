"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_middleware_1 = require("../middlerware/upload.middleware");
const issues_controllers_1 = require("../controllers/issues.controllers");
const auth_middleware_1 = require("../middlerware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/citizen/create-issue", auth_middleware_1.authMiddleware, (req, res, next) => {
    upload_middleware_1.upload.array("files", 10)(req, res, (err) => {
        console.log("Upload middleware callback");
        if (err) {
            console.error("=== UPLOAD ERROR ===");
            console.error("Error type:", typeof err);
            console.error("Error:", err);
            console.error("Error message:", err === null || err === void 0 ? void 0 : err.message);
            return res
                .status(400)
                .json({ message: "Upload failed", error: err.message });
        }
        console.log("Upload successful, proceeding to controller");
        next();
    });
}, issues_controllers_1.createIssue);
router.get("/all-issues", auth_middleware_1.authMiddleware, issues_controllers_1.getIssues);
// Community Upvote
router.post("/:id/upvote", auth_middleware_1.authMiddleware, issues_controllers_1.upvoteIssue);
router.post("/:id/vote", auth_middleware_1.authMiddleware, issues_controllers_1.voteIssue);
// Dumping Lifecycle Tracker
router.put("/:id/dumping-stage", auth_middleware_1.authMiddleware, issues_controllers_1.updateDumpingStage);
router.patch("/:id/update-cleanup-stage", auth_middleware_1.authMiddleware, issues_controllers_1.updateDumpingStage); // Alias for consistency
// Public Transparency
router.get("/public/analytics", issues_controllers_1.getPublicAnalytics);
router.get("/public/schedule", issues_controllers_1.getPublicSchedule);
router.get("/public/outages", issues_controllers_1.getServiceOutages);
// Maintenance Queue
router.get("/maintenance-queue", auth_middleware_1.authMiddleware, issues_controllers_1.getIssues); // Reuse getIssues with filter
// Worker Assignment
router.patch("/:id/assign-worker", auth_middleware_1.authMiddleware, issues_controllers_1.assignWorker);
router.patch("/:id/assign-department-admin", auth_middleware_1.authMiddleware, issues_controllers_1.assignDepartmentAdmin);
// Tracking API
router.get("/:id/tracking", issues_controllers_1.getIssueTrackingStatus);
router.get("/:id/votes", auth_middleware_1.authMiddleware, issues_controllers_1.getVotes);
exports.default = router;
