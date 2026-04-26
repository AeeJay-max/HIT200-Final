import { Router } from "express";
import {
    verifyWhatsApp,
    resendWhatsApp,
    getPhoneNumber,
    updatePhoneNumber,
    verifyEmailOTP,
    resendEmailOTP
} from "../controllers/auth.controller";

const router = Router();

router.post("/verify-whatsapp", verifyWhatsApp);
router.post("/resend-whatsapp", resendWhatsApp);
router.get("/phone", getPhoneNumber);
router.post("/update-phone", updatePhoneNumber);
router.post("/verify-email-otp", verifyEmailOTP);
router.post("/resend-email-otp", resendEmailOTP);

export default router;
