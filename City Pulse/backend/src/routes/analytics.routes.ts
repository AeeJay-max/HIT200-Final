import { Router } from "express";
import { getRadiusAnalytics, getDepartmentPerformance, getPublicTransparency, getEscalations, getWorkerPerformance, getDistrictPerformance, getClusters } from "../controllers/analytics.controller";
import { authMiddleware } from "../middlerware/auth.middleware";

const router = Router();
router.post("/analytics/radius", authMiddleware, getRadiusAnalytics);
router.get("/analytics/department-performance", authMiddleware, getDepartmentPerformance);
router.get("/analytics/public-transparency", getPublicTransparency);
router.get("/analytics/escalations", authMiddleware, getEscalations);
router.get("/analytics/worker-performance", authMiddleware, getWorkerPerformance);
router.get("/analytics/district-performance", authMiddleware, getDistrictPerformance);
router.get("/analytics/clusters", authMiddleware, getClusters);

export default router;
