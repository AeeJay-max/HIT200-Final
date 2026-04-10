import { CitizenModel } from "../models/citizen.model";
import { IssueModel } from "../models/issue.model";

export const updateCitizenTrustScore = async (citizenId: string) => {
    try {
        const citizen = await CitizenModel.findById(citizenId);
        if (!citizen) return;

        const reports = await IssueModel.find({ citizenId });

        const successful = reports.filter(r => r.status === "Resolved" || r.status === "Closed").length;
        const fake = reports.filter(r => r.status === "Rejected").length;

        // Formula: (Successful * 10) - (Fake * 50) + (Base 100)
        // Upvotes logic could be added if we track upvotes received across all issues
        const newScore = 100 + (successful * 10) - (fake * 50);

        (citizen as any).trustScore = Math.max(0, newScore); // Ensure it doesn't go negative
        (citizen as any).successfulReports = successful;
        (citizen as any).fakeReports = fake;

        await citizen.save();
    } catch (error) {
        console.error("Error updating trust score:", error);
    }
};
