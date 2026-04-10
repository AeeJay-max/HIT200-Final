import { Router } from "express";
import { refreshToken, logout } from "../controllers/auth-controllers/refresh.controller";

const router = Router();

router.post("/auth/refresh-token", refreshToken);
router.post("/auth/logout", logout);

export default router;
