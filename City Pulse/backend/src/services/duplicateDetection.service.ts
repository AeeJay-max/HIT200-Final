import { IssueModel } from "../models/issue.model";

export const findNearbySimilarIssue = async (lat: number, lng: number, issueType: string, radiusMeters: number = 200) => {
    const radiusInRadians = radiusMeters / 6378100;

    return await IssueModel.find({
        issueType,
        status: { $ne: "Resolved" },
        location: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radiusInRadians]
            }
        }
    }).limit(5).lean();
};

