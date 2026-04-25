import { Router } from "express";
import { verifyWhatsApp, resendWhatsApp, getPhoneNumber, updatePhoneNumber } from "../controllers/auth.controller";

const router = Router();

router.post("/verify-whatsapp", verifyWhatsApp);
router.post("/resend-whatsapp", resendWhatsApp);
router.get("/phone", getPhoneNumber);
router.post("/update-phone", updatePhoneNumber);

export default router;
