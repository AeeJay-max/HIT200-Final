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
exports.findNearbySimilarIssue = void 0;
const issue_model_1 = require("../models/issue.model");
const findNearbySimilarIssue = (lat_1, lng_1, issueType_1, ...args_1) => __awaiter(void 0, [lat_1, lng_1, issueType_1, ...args_1], void 0, function* (lat, lng, issueType, radiusMeters = 200) {
    const radiusInRadians = radiusMeters / 6378100;
    return yield issue_model_1.IssueModel.find({
        issueType,
        status: { $ne: "Resolved" },
        location: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radiusInRadians]
            }
        }
    }).limit(5).lean();
});
exports.findNearbySimilarIssue = findNearbySimilarIssue;
