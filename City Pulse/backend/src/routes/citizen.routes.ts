import { Router } from "express";
import {
  citizenSignin,
  citizenSignup,
} from "../controllers/auth-controllers/citizen.auth.controller";
import { authMiddleware } from "../middlerware/auth.middleware";
import { loginLimiter } from "../middlerware/rateLimiters";
import {
  deleteIssue,
  getCitizenProfile,
  getIssuesByCitizen,
  updateCitizenProfile,
  getTrustScore,
} from "../controllers/citizen.controller";

const router = Router();

router.post("/citizen/signup", citizenSignup);

router.post("/citizen/signin", loginLimiter, citizenSignin);

router.get("/citizen/profile/", authMiddleware, getCitizenProfile);

router.put("/citizen/:id", authMiddleware, updateCitizenProfile);

router.get("/citizen/issues", authMiddleware, getIssuesByCitizen);

router.delete("/citizen/issues/:id", authMiddleware, deleteIssue);

router.get("/citizen/trust-score", authMiddleware, getTrustScore);

import { getNotifications, subscribeToPush, markAsRead, getUnreadCount } from "../controllers/notification.controller";

router.get("/citizen/notifications", authMiddleware, getNotifications);

router.post("/citizen/notifications/subscribe", authMiddleware, subscribeToPush);

router.get("/notifications/unread-count", authMiddleware, getUnreadCount);

router.patch("/notifications/read/:id", authMiddleware, markAsRead);

export default router;
