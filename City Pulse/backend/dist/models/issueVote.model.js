"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssueVoteModel = void 0;
const mongoose_1 = require("mongoose");
const issueVoteSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Citizen", required: true },
    issueId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Issue", required: true },
    voteWeight: { type: Number, default: 1 },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });
issueVoteSchema.index({ userId: 1, issueId: 1 }, { unique: true });
exports.IssueVoteModel = (0, mongoose_1.model)("IssueVote", issueVoteSchema);
