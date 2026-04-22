"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentIssueMapping = exports.STANDARD_DEPARTMENTS = void 0;
exports.STANDARD_DEPARTMENTS = [
    "Roads Department",
    "Water Department",
    "Sanitation Department",
    "Electrical Department",
    "City Council",
    "ZINWA",
    "ZESA",
    "EMA",
    "TSCZ"
];
exports.DepartmentIssueMapping = {
    "Life-Threatening Potholes": "Roads Department",
    "Burst Water Pipes": "Water Department",
    "Sewer Failures": "Sanitation Department",
    "Streetlight Failures": "Electrical Department",
    "Traffic Light Failures": "TSCZ",
    "Illegal Dumping Sites": "City Council",
    "Water Supply Problems": "ZINWA",
    "Electricity Supply Problems": "ZESA"
};
