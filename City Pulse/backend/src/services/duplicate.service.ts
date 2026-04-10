import { IssueModel } from "../models/issue.model";

export const checkDuplicateIssue = async (latitude: number, longitude: number, issueType: string): Promise<string | null> => {
    // 150 meters -> radians ~ 150 / 6378100
    const maxDistanceRadians = 150 / 6378100;

    const duplicates = await IssueModel.find({
        issueType,
        location: {
            $geoWithin: {
                $centerSphere: [[longitude, latitude], maxDistanceRadians]
            }
        }
    });

    return duplicates.length > 0 ? (duplicates[0] as any)._id.toString() : null;
};
