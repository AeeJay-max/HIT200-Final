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
} from "../controllers/admin.controller";
import { getIssues } from "../controllers/issues.controllers";
import { requireRole } from "../middlerware/requireRole";
import { getAuditLogs } from "../controllers/audit.controller";

const router = Router();

router.post("/admin/signup", adminSignup);

router.post("/admin/signin", adminSignin);

router.get("/admin/profile/:id", authMiddleware, getAdminProfile);

router.get("/admin/issues", authMiddleware, getIssues);

router.get("/admin/handled-issues", authMiddleware, getHandledIssuesByAdmin);

router.put("/admin/:id", authMiddleware, updateAdminProfile);

router.put("/admin/issue/:id/status", authMiddleware, updateIssueStatus);

router.delete("/issue/admin/:issueid", authMiddleware, deleteIssueByAdmin);

import { createNotification, sendBroadcast } from "../controllers/notification.controller";
import { loginLimiter, broadcastLimiter } from "../middlerware/rateLimiters";

router.post("/admin/signin", loginLimiter, adminSignin);

router.post("/admin/notifications", authMiddleware, createNotification);

router.post("/admin/notifications/broadcast", authMiddleware, broadcastLimiter, sendBroadcast);

router.get("/admin/analytics", authMiddleware, getAnalytics);

router.get("/admin/audit/logs", authMiddleware, requireRole(["MAIN_ADMIN"]), getAuditLogs);

export default router;
