import { Router } from "express";
import { authMiddleware } from "../middlerware/auth.middleware";
import * as DashboardController from "../controllers/dashboard.controller";

const router = Router();

router.use(authMiddleware);

router.get("/main-admin/overview", DashboardController.getOverview);
router.get("/main-admin/escalations", DashboardController.getEscalations);
router.get("/main-admin/department-performance", DashboardController.getDepartmentPerformance);
router.get("/main-admin/overdue", DashboardController.getOverdue);
router.get("/main-admin/analytics", DashboardController.getAnalyticsSummary);
router.get("/main-admin/map-data", DashboardController.getMapData);
router.get("/main-admin/verification", DashboardController.getVerification);
router.get("/main-admin/recently-resolved", DashboardController.getRecentlyResolved);
router.get("/main-admin/system-health", DashboardController.getSystemHealth);
router.get("/main-admin/activity-stream", DashboardController.getActivityStream);
router.get("/main-admin/personnel", DashboardController.getPersonnelDirectory);
router.patch("/main-admin/personnel/:id/toggle", DashboardController.togglePersonnelStatus);

export default router;
