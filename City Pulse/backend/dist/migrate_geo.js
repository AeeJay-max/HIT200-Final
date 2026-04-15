"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const database_1 = require("./config/database");
const issue_model_1 = require("./models/issue.model");
function migrate() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Starting GeoJSON migration...");
        yield (0, database_1.connectDB)();
        const issues = yield issue_model_1.IssueModel.find({ geoJSON: { $exists: false } });
        console.log(`Found ${issues.length} issues needing migration.`);
        for (const issue of issues) {
            if (issue.location && issue.location.longitude && issue.location.latitude) {
                issue.geoJSON = {
                    type: "Point",
                    coordinates: [issue.location.longitude, issue.location.latitude]
                };
                yield issue.save();
                console.log(`Migrated issue: ${issue.title}`);
            }
        }
        console.log("Migration complete.");
        process.exit(0);
    });
}
migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
