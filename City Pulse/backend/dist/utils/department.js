"use strict";
// Maps an Admin's department to the Issue categories they have jurisdiction over.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoriesForDepartment = exports.calculateSlaDeadline = exports.getDepartmentForIssueCategory = exports.SlaMappingHrs = exports.DepartmentIssueMapping = void 0;
exports.DepartmentIssueMapping = {
    "City Council": ["Streetlight Failures", "Burst Water Pipes", "Sewer Failures"],
    "ZINWA": ["Water Supply Problems"],
    "ZESA": ["Electricity Supply Problems"],
    "EMA": ["Illegal Dumping Sites"],
    "Traffic Safety Council of Zimbabwe": ["Life-Threatening Potholes", "Traffic Light Failures"],
};
exports.SlaMappingHrs = {
    "Life-Threatening Potholes": 24,
    "Burst Water Pipes": 12,
    "Sewer Failures": 18,
    "Streetlight Failures": 72,
    "Traffic Light Failures": 12,
    "Illegal Dumping Sites": 48,
    "Water Supply Problems": 24,
    "Electricity Supply Problems": 24
};
// Gets the required Department string based on issue type
const getDepartmentForIssueCategory = (category) => {
    const entry = Object.entries(exports.DepartmentIssueMapping).find(([dept, categories]) => categories.includes(category));
    return entry ? entry[0] : null;
};
exports.getDepartmentForIssueCategory = getDepartmentForIssueCategory;
// Gets SLA deadline timestamp based on issue type + current time
const calculateSlaDeadline = (category, createdAt = new Date()) => {
    const hours = exports.SlaMappingHrs[category] || 72; // default 72 if somehow missing
    return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
};
exports.calculateSlaDeadline = calculateSlaDeadline;
// Helper function to return array of issue types for a department. Returns all if Main Admin.
const getCategoriesForDepartment = (department) => {
    if (!department)
        return [];
    if (department.toLowerCase() === "main" || department.toLowerCase() === "admin") {
        return Object.values(exports.DepartmentIssueMapping).flat();
    }
    const mapped = Object.keys(exports.DepartmentIssueMapping).find((key) => key.toLowerCase() === department.toLowerCase());
    return mapped ? exports.DepartmentIssueMapping[mapped] : [];
};
exports.getCategoriesForDepartment = getCategoriesForDepartment;
