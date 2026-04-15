import "dotenv/config";
import { connectDB } from "./config/database";
import { IssueModel } from "./models/issue.model";
import mongoose from "mongoose";

async function migrate() {
    console.log("Starting GeoJSON migration...");
    await connectDB();

    const issues = await IssueModel.find({ geoJSON: { $exists: false } });
    console.log(`Found ${issues.length} issues needing migration.`);

    for (const issue of issues) {
        if (issue.location && issue.location.longitude && issue.location.latitude) {
            (issue as any).geoJSON = {
                type: "Point",
                coordinates: [issue.location.longitude, issue.location.latitude]
            };
            await issue.save();
            console.log(`Migrated issue: ${issue.title}`);
        }
    }

    console.log("Migration complete.");
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
