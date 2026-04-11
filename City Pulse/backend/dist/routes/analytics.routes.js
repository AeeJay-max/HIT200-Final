"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const geoAnalytics_service_1 = require("../services/geoAnalytics.service");
const auth_middleware_1 = require("../middlerware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/hotspots", auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lat, lng } = req.query;
        const data = yield (0, geoAnalytics_service_1.get10kmRadiusAnalytics)(Number(lat), Number(lng), 10000);
        res.json({ success: true, analytics: data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.get("/heatmap", auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lat, lng } = req.query;
        const data = yield (0, geoAnalytics_service_1.get10kmRadiusAnalytics)(Number(lat), Number(lng), 10000);
        res.json({ success: true, analytics: data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.get("/department-workload-zone", auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lat, lng } = req.query;
        const data = yield (0, geoAnalytics_service_1.get10kmRadiusAnalytics)(Number(lat), Number(lng), 10000);
        res.json({ success: true, analytics: data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.get("/response-times/departments", auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, geoAnalytics_service_1.getDepartmentPerformance)();
        res.json({ success: true, departments: data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.get("/response-times/workers", auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield (0, geoAnalytics_service_1.getAllWorkersPerformance)();
        res.json({ success: true, stats });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.get("/department-performance", auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, geoAnalytics_service_1.getDepartmentPerformance)();
        res.json({ success: true, departments: data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.get("/districts", auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, geoAnalytics_service_1.getDistrictAnalytics)();
        res.json({ success: true, districts: data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.get("/worker-stats/:id", auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, geoAnalytics_service_1.getWorkerPerformanceById)(req.params.id);
        res.json({ success: true, stats: data[0] || null });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.get("/public-transparency", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, geoAnalytics_service_1.getPublicTransparencyStats)();
        res.json({ success: true, tracking: data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
exports.default = router;
