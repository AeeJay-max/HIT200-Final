import { model, Schema, Document, Types } from "mongoose";
import { ILocation } from "../utils/location";

export interface IIssueCluster extends Document {
    zoneName: string;
    centerLocation: ILocation;
    clusterSize: number;
    clusterSeverity: string;
    issueType: string;
    issueIds: Types.ObjectId[];
}

const ClusterSchema = new Schema<IIssueCluster>(
    {
        zoneName: { type: String, required: true },
        centerLocation: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            address: { type: String }
        },
        clusterSize: { type: Number, default: 1 },
        clusterSeverity: { type: String, enum: ["low", "medium", "high", "critical"], default: "low" },
        issueType: { type: String, required: true },
        issueIds: [{ type: Schema.Types.ObjectId, ref: "Issue" }]
    },
    { timestamps: true }
);

export const IssueClusterModel = model<IIssueCluster>("IssueCluster", ClusterSchema);
