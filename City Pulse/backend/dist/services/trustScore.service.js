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
exports.updateCitizenTrustScore = void 0;
const citizen_model_1 = require("../models/citizen.model");
const issue_model_1 = require("../models/issue.model");
const updateCitizenTrustScore = (citizenId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const citizen = yield citizen_model_1.CitizenModel.findById(citizenId);
        if (!citizen)
            return;
        const reports = yield issue_model_1.IssueModel.find({ citizenId });
        const successful = reports.filter(r => r.status === "Resolved" || r.status === "Closed").length;
        const fake = reports.filter(r => r.status === "Rejected").length;
        // Formula: (Successful * 10) - (Fake * 50) + (Base 100)
        // Upvotes logic could be added if we track upvotes received across all issues
        const newScore = 100 + (successful * 10) - (fake * 50);
        citizen.trustScore = Math.max(0, newScore); // Ensure it doesn't go negative
        citizen.successfulReports = successful;
        citizen.fakeReports = fake;
        yield citizen.save();
    }
    catch (error) {
        console.error("Error updating trust score:", error);
    }
});
exports.updateCitizenTrustScore = updateCitizenTrustScore;
