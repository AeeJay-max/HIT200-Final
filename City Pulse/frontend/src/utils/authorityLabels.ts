export const DEPARTMENT_LABELS: Record<string, string> = {
    "City Council": "City Council",
    "ZINWA": "ZINWA",
    "ZESA": "ZESA",
    "EMA": "EMA",
    "Traffic Safety Council of Zimbabwe": "TSCZ",
};

export const getAuthorityLabel = (deptName: string): string => {
    return DEPARTMENT_LABELS[deptName] || deptName;
};

export const ISSUE_TYPE_LABELS: Record<string, string> = {
    "Life-Threatening Potholes": "Potholes (Critical - TSCZ)",
    "Water Supply Problems": "ZINWA - Water Supply Problems",
    "Electricity Supply Problems": "ZESA - Electricity Supply",
    "Burst Water Pipes": "City Council - Water Pipe Burst",
    "Sewer Failures": "City Council - Sewer Failure",
    "Streetlight Failures": "City Council - Streetlight Failure",
    "Traffic Light Failures": "TSCZ - Traffic Light Failure",
    "Illegal Dumping Sites": "EMA - Illegal Dumping",
};

export const getIssueTypeLabel = (type: string): string => {
    return ISSUE_TYPE_LABELS[type] || type;
};
