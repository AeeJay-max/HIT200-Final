import { Router, Request, Response } from "express";
import { AuditLogModel } from "../models/auditLog.model";
import { authMiddleware } from "../middlerware/auth.middleware";
import { requireRole } from "../middlerware/requireRole";

const router = Router();

router.get("/logs", authMiddleware, requireRole(["MAIN_ADMIN"]), async (req: Request, res: Response): Promise<void> => {
    try {
        const logs = await AuditLogModel.find()
            .sort({ timestamp: -1 })
            .limit(200)
            .populate("actorId", "fullName email");
        res.status(200).json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: "Fetch failed" });
    }
});

export default router;
