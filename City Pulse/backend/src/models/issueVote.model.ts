import { model, Schema } from "mongoose";

const IssueVoteSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "Citizen", required: true },
        issueId: { type: Schema.Types.ObjectId, ref: "Issue", required: true },
        voteWeight: { type: Number, default: 1 },
        timestamp: { type: Date, default: Date.now }
    }
);
export const IssueVoteModel = model("IssueVote", IssueVoteSchema);
