import { Router } from "express";
import { authMiddleware, requireRole } from "../middlerware/auth.middleware";
import { createWorker, getAssignedIssues, assignWorkerToIssue, markIssueResolved, getWorkerProfile, getWorkersByDepartment, getWorkersForAdminDepartment } from "../controllers/worker.controller";
import { workerSignup, workerLogin } from "../controllers/workerAuth.controllers";

const router = Router();

// Auth for Workers
router.post("/workers/signup", authMiddleware, requireRole(["admin"]), workerSignup);
router.post("/workers/login", workerLogin);

// Listing workers for a department
router.get("/departments/:id/workers", authMiddleware, getWorkersByDepartment);
router.get("/workers/department", authMiddleware, requireRole(["admin"]), getWorkersForAdminDepartment);

// Admin actions on Workers
router.post("/worker/create", authMiddleware, requireRole(["admin"]), createWorker);
router.post("/worker/assign", authMiddleware, requireRole(["admin"]), assignWorkerToIssue);

// Worker Dashboard endpoints
router.get("/worker/issues", authMiddleware, requireRole(["worker"]), getAssignedIssues);
router.put("/worker/issues/:issueId/resolve", authMiddleware, requireRole(["worker"]), markIssueResolved);

// Profile
router.get("/worker/profile/:workerId", authMiddleware, requireRole(["worker"]), getWorkerProfile);

export default router;
