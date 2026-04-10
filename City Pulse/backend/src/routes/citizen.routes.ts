import { Router } from "express";
import {
  citizenSignin,
  citizenSignup,
} from "../controllers/auth-controllers/citizen.auth.controller";
import { authMiddleware } from "../middlerware/auth.middleware";
import {
  deleteIssue,
  getCitizenProfile,
  getIssuesByCitizen,
  updateCitizenProfile,
} from "../controllers/citizen.controller";

const router = Router();

router.post("/citizen/signup", citizenSignup);

router.post("/citizen/signin", citizenSignin);

router.get("/citizen/profile/", authMiddleware, getCitizenProfile);

router.put("/citizen/:id", authMiddleware, updateCitizenProfile);

router.get("/citizen/issues", authMiddleware, getIssuesByCitizen);

router.delete("/citizen/issues/:id", authMiddleware, deleteIssue);

import { getNotifications } from "../controllers/notification.controller";
import { getActiveBroadcasts } from "../controllers/emergencyBroadcast.controller";
import { getSchedules } from "../controllers/scheduleAnnouncement.controller";

router.get("/citizen/notifications", authMiddleware, getNotifications);
router.get("/citizen/broadcasts", authMiddleware, getActiveBroadcasts);
router.get("/citizen/schedules", authMiddleware, getSchedules);

export default router;
