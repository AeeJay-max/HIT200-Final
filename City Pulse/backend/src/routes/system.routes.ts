import { Router } from "express";
import { getSystemHealth } from "../controllers/system.controller";

const router = Router();

router.get("/system/health", getSystemHealth);

export default router;
