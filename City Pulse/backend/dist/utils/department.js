"use strict";
// Maps an Admin's department to the Issue categories they have jurisdiction over.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoriesForDepartment = exports.DepartmentIssueMapping = void 0;
exports.DepartmentIssueMapping = {
    "Roads": ["Potholes", "Streetlights", "Traffic Lights"],
    "Water": ["Burst Water Pipes", "Sewer Issues"],
    "Environment": ["Environmental Issues", "Waste Management"],
    "Main": ["Potholes", "Burst Water Pipes", "Sewer Issues", "Streetlights", "Traffic Lights", "Other"],
    // Add fallback or "All" mapping for standard master admins if needed.
};
// Helper function to return array of issue types for a department. Returns all if Main or unmapped.
const getCategoriesForDepartment = (department) => {
    if (!department)
        return [];
    // If the admin is globally assigned or we don't strictly map them, maybe they see everything or nothing.
    // For safety, Main gets all. Unknown departments get an empty array to prevent data leaking.
    if (department.toLowerCase() === "main" || department.toLowerCase() === "admin") {
        return exports.DepartmentIssueMapping["Main"];
    }
    // Exact match from map
    const mapped = Object.keys(exports.DepartmentIssueMapping).find((key) => key.toLowerCase() === department.toLowerCase());
    return mapped ? exports.DepartmentIssueMapping[mapped] : [];
};
exports.getCategoriesForDepartment = getCategoriesForDepartment;
