import { Schema, model, Types } from "mongoose";

interface IIssueVote {
    userId: Types.ObjectId;
    issueId: Types.ObjectId;
    voteWeight: number;
    timestamp: Date;
}

const issueVoteSchema = new Schema<IIssueVote>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "Citizen", required: true },
        issueId: { type: Schema.Types.ObjectId, ref: "Issue", required: true },
        voteWeight: { type: Number, default: 1 },
        timestamp: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

issueVoteSchema.index({ userId: 1, issueId: 1 }, { unique: true });

export const IssueVoteModel = model<IIssueVote>("IssueVote", issueVoteSchema);
