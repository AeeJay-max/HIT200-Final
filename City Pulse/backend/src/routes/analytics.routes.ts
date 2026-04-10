import { Router } from "express";
import {
    get10kmRadiusAnalytics,
    getDepartmentPerformance,
    getPublicTransparencyStats,
    getDistrictAnalytics,
    getWorkerPerformanceById,
    getAllWorkersPerformance
} from "../services/geoAnalytics.service";
import { authMiddleware } from "../middlerware/auth.middleware";

const router = Router();

router.get("/hotspots", authMiddleware, async (req, res) => {
    try {
        const { lat, lng } = req.query;
        const data = await get10kmRadiusAnalytics(Number(lat), Number(lng), 10000);
        res.json({ success: true, analytics: data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/heatmap", authMiddleware, async (req, res) => {
    try {
        const { lat, lng } = req.query;
        const data = await get10kmRadiusAnalytics(Number(lat), Number(lng), 10000);
        res.json({ success: true, analytics: data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/department-workload-zone", authMiddleware, async (req, res) => {
    try {
        const { lat, lng } = req.query;
        const data = await get10kmRadiusAnalytics(Number(lat), Number(lng), 10000);
        res.json({ success: true, analytics: data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/response-times/departments", authMiddleware, async (req, res) => {
    try {
        const data = await getDepartmentPerformance();
        res.json({ success: true, departments: data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/response-times/workers", authMiddleware, async (req, res) => {
    try {
        const stats = await getAllWorkersPerformance();
        res.json({ success: true, stats });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/department-performance", authMiddleware, async (req, res) => {
    try {
        const data = await getDepartmentPerformance();
        res.json({ success: true, departments: data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/districts", authMiddleware, async (req, res) => {
    try {
        const data = await getDistrictAnalytics();
        res.json({ success: true, districts: data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/worker-stats/:id", authMiddleware, async (req, res) => {
    try {
        const data = await getWorkerPerformanceById(req.params.id);
        res.json({ success: true, stats: data[0] || null });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/public-transparency", async (req, res) => {
    try {
        const data = await getPublicTransparencyStats();
        res.json({ success: true, tracking: data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
