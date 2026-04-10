import { Router } from "express";
import { authMiddleware, requireRole } from "../middlerware/auth.middleware";
import {
    getNotifications,
    markNotificationRead,
    subscribePush,
    broadcastNotification
} from "../controllers/notification.controller";

const router = Router();

router.get("/", authMiddleware, getNotifications);
router.get("/me", authMiddleware, getNotifications);
router.patch("/:id/read", authMiddleware, markNotificationRead);
router.post("/subscribe", authMiddleware, subscribePush);
router.post("/broadcast", authMiddleware, requireRole(["admin"]), broadcastNotification);

export default router;
