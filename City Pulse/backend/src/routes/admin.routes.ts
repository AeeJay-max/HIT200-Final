import { Router } from "express";
import {
  adminSignin,
  adminSignup,
} from "../controllers/auth-controllers/admin.auth.controller";
import { authMiddleware } from "../middlerware/auth.middleware";
import {
  deleteIssueByAdmin,
  getAdminProfile,
  getHandledIssuesByAdmin,
  updateAdminProfile,
  updateIssueStatus,
  getAnalytics,
  getRadiusHotspots,
  getAllAdmins,
  verifyIssueCompletion,
  manualEscalationAssign,
} from "../controllers/admin.controller";
import { getIssues } from "../controllers/issues.controllers";

const router = Router();

router.post("/admin/signup", adminSignup);

router.post("/admin/signin", adminSignin);

router.get("/admin/profile/:id", authMiddleware, getAdminProfile);

router.get("/admin/issues", authMiddleware, getIssues);

router.get("/admin/handled-issues", authMiddleware, getHandledIssuesByAdmin);

router.put("/admin/:id", authMiddleware, updateAdminProfile);

router.put("/admin/issue/:id/status", authMiddleware, updateIssueStatus);

router.delete("/issue/admin/:issueid", authMiddleware, deleteIssueByAdmin);

import { createNotification, getNotifications } from "../controllers/notification.controller";
import { createEmergencyBroadcast, getActiveBroadcasts } from "../controllers/emergencyBroadcast.controller";
import { createSchedule, getSchedules } from "../controllers/scheduleAnnouncement.controller";
import { requireRole } from "../middlerware/auth.middleware";

router.post("/admin/notifications", authMiddleware, requireRole(["admin"]), createNotification);
router.get("/admin/notifications", authMiddleware, getNotifications);

// Emergency logic
router.post("/admin/broadcasts", authMiddleware, requireRole(["admin"]), createEmergencyBroadcast);
router.get("/admin/broadcasts", authMiddleware, getActiveBroadcasts);

// Schedules
router.post("/admin/schedules", authMiddleware, requireRole(["admin"]), createSchedule);
router.get("/admin/schedules", authMiddleware, getSchedules);

router.get("/admin/analytics", authMiddleware, requireRole(["admin"]), getAnalytics);
router.post("/admin/analytics/radius", authMiddleware, requireRole(["admin"]), getRadiusHotspots);

router.put("/admin/issue/:id/verify", authMiddleware, requireRole(["admin"]), verifyIssueCompletion);
router.post("/admin/issue/:id/escalation-assign", authMiddleware, requireRole(["MAIN_ADMIN"]), manualEscalationAssign);
router.get("/admins", authMiddleware, requireRole(["MAIN_ADMIN"]), getAllAdmins);

export default router;
