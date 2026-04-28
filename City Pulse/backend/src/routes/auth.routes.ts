import { Router } from "express";
import {
    getPhoneNumber,
    updatePhoneNumber,
    verifyEmailOTP,
    resendEmailOTP
} from "../controllers/auth.controller";

const router = Router();

router.get("/phone", getPhoneNumber);
router.post("/update-phone", updatePhoneNumber);
router.post("/verify-email-otp", verifyEmailOTP);
router.post("/resend-email-otp", resendEmailOTP);

export default router;
