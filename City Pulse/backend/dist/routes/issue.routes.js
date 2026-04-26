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
router.get("/issues", auth_middleware_1.authMiddleware, issues_controllers_1.getIssues); // Alias for consistency across dashboard components
// Community Upvote
router.post("/issues/:id/upvote", auth_middleware_1.authMiddleware, issues_controllers_1.upvoteIssue);
router.post("/issues/:id/vote", auth_middleware_1.authMiddleware, issues_controllers_1.voteIssue);
// Dumping Lifecycle Tracker
router.put("/issues/:id/dumping-stage", auth_middleware_1.authMiddleware, issues_controllers_1.updateDumpingStage);
router.patch("/issues/:id/update-cleanup-stage", auth_middleware_1.authMiddleware, issues_controllers_1.updateDumpingStage); // Alias for consistency
// Public Transparency
router.get("/public/analytics", issues_controllers_1.getPublicAnalytics);
router.get("/public/schedule", issues_controllers_1.getPublicSchedule);
router.get("/public/outages", issues_controllers_1.getServiceOutages);
// Maintenance Queue
router.get("/maintenance-queue", auth_middleware_1.authMiddleware, issues_controllers_1.getIssues); // Reuse getIssues with filter
// Worker Assignment
router.patch("/issues/:id/assign-worker", auth_middleware_1.authMiddleware, issues_controllers_1.assignWorker);
router.patch("/issues/:id/assign-department-admin", auth_middleware_1.authMiddleware, issues_controllers_1.assignDepartmentAdmin);
router.patch("/issues/:id/accept-assignment", auth_middleware_1.authMiddleware, issues_controllers_1.acceptAssignment);
router.patch("/issues/:id/reject-assignment", auth_middleware_1.authMiddleware, issues_controllers_1.rejectAssignment);
router.patch("/issues/:id/reassign-worker", auth_middleware_1.authMiddleware, issues_controllers_1.reassignWorker);
router.patch("/issues/:id/reassign-department", auth_middleware_1.authMiddleware, issues_controllers_1.reassignDepartment);
router.patch("/issues/:id/override-assignee", auth_middleware_1.authMiddleware, issues_controllers_1.overrideAssignee);
router.get("/issues/assignable-personnel/:department", auth_middleware_1.authMiddleware, issues_controllers_1.getAssignablePersonnelByDepartment);
// Tracking API
router.get("/issues/:id/tracking", issues_controllers_1.getIssueTrackingStatus);
router.get("/issues/:id/votes", auth_middleware_1.authMiddleware, issues_controllers_1.getVotes);
router.get("/issues/:id/assignment-stats", auth_middleware_1.authMiddleware, issues_controllers_1.getAssignmentStats);
router.get("/issues/:id", auth_middleware_1.authMiddleware, issues_controllers_1.getIssueById);
router.get("/issues/:id/department-staff", auth_middleware_1.authMiddleware, issues_controllers_1.getIssueDepartmentStaff);
router.patch("/issues/:id/override-department-admin", auth_middleware_1.authMiddleware, issues_controllers_1.overrideDepartmentAdminAssignment);
router.patch("/issues/:id/override-worker", auth_middleware_1.authMiddleware, issues_controllers_1.overrideWorkerAssignment);
router.patch("/issues/:id/assign-pair", auth_middleware_1.authMiddleware, issues_controllers_1.assignAdminAndWorker);
router.get("/history", auth_middleware_1.authMiddleware, issues_controllers_1.getIssueHistory);
exports.default = router;
