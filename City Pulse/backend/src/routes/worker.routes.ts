import { Router } from "express";
import { signupWorker, loginWorker, getDepartmentWorkers, assignDepartmentAdmin, assignWorker, getIssueTracking, updateCleanupStage, getMaintenanceQueue } from "../controllers/worker.controller";
import { authMiddleware } from "../middlerware/auth.middleware";

const router = Router();
router.post("/workers/signup", signupWorker);
router.post("/workers/login", loginWorker);
router.get("/departments/:id/workers", authMiddleware, getDepartmentWorkers);
router.patch("/issues/:id/assign-worker", authMiddleware, assignWorker);
router.patch("/issues/:id/assign-department-admin", authMiddleware, assignDepartmentAdmin);
router.get("/issues/:id/tracking", getIssueTracking);
router.patch("/issues/:id/update-cleanup-stage", authMiddleware, updateCleanupStage);
router.get("/issues/maintenance-queue", authMiddleware, getMaintenanceQueue);

export default router;
