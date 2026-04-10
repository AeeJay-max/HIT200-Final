import { Request, Response } from "express";
import { IssueVoteModel } from "../models/issueVote.model";
import { IssueModel } from "../models/issue.model";

export const voteIssue = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const citizenId = (req as any).citizenId;

        if (!citizenId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const existingVote = await IssueVoteModel.findOne({ issueId: id, userId: citizenId });
        if (existingVote) {
            await IssueVoteModel.deleteOne({ _id: existingVote._id });
            await IssueModel.findByIdAndUpdate(id, { $inc: { upvotes: -1 }, $pull: { voters: citizenId } });
            res.json({ message: "Vote removed" });
            return;
        }

        await IssueVoteModel.create({ issueId: id, userId: citizenId });
        await IssueModel.findByIdAndUpdate(id, { $inc: { upvotes: 1 }, $push: { voters: citizenId } });
        res.json({ message: "Vote added" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getIssueVotes = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const votes = await IssueVoteModel.find({ issueId: id }).populate("userId", "fullName");
        res.json({ count: votes.length, votes });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
