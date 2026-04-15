// Maps an Admin's department to the Issue categories they have jurisdiction over.

export const DepartmentIssueMapping: Record<string, string[]> = {
    "City Council": ["Streetlight Failures", "Burst Water Pipes", "Sewer Failures"],
    "ZINWA": ["Water Supply Problems"],
    "ZESA": ["Electricity Supply Problems"],
    "EMA": ["Illegal Dumping Sites"],
    "Traffic Safety Council of Zimbabwe": ["Life-Threatening Potholes", "Traffic Light Failures"],
};

export const SlaMappingHrs: Record<string, number> = {
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
export const getDepartmentForIssueCategory = (category: string): string | null => {
    const entry = Object.entries(DepartmentIssueMapping).find(([dept, categories]) =>
        categories.includes(category)
    );
    return entry ? entry[0] : null;
};

// Gets SLA deadline timestamp based on issue type + current time
export const calculateSlaDeadline = (category: string, createdAt: Date = new Date()): Date => {
    const hours = SlaMappingHrs[category] || 72; // default 72 if somehow missing
    return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
};

// Helper function to return array of issue types for a department. Returns all if Main Admin.
export const getCategoriesForDepartment = (department: string): string[] => {
    if (!department) return [];

    if (department.toLowerCase() === "main" || department.toLowerCase() === "admin") {
        return Object.values(DepartmentIssueMapping).flat();
    }

    const mapped = Object.keys(DepartmentIssueMapping).find(
        (key) => key.toLowerCase() === department.toLowerCase()
    );

    return mapped ? DepartmentIssueMapping[mapped] : [];
};
