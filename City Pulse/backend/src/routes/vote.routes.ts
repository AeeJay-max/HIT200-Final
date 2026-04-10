import { Router } from "express";
import { voteIssue, getIssueVotes } from "../controllers/vote.controller";
import { authMiddleware } from "../middlerware/auth.middleware";

const router = Router();
router.post("/issues/:id/vote", authMiddleware, voteIssue);
router.get("/issues/:id/votes", getIssueVotes);

export default router;
