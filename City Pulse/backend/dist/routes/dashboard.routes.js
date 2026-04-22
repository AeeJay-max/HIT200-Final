"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlerware/auth.middleware");
const DashboardController = __importStar(require("../controllers/dashboard.controller"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
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
exports.default = router;
