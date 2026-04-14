import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { VITE_BACKEND_URL } from "../config/config";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import { toast } from "sonner";
import { MapPin, Calendar, UserCheck, CheckCircle } from "lucide-react";
import { getAuthorityLabel } from "../utils/authorityLabels";

interface Timeline {
    reportedAt?: string;
    assignedAt?: string;
    workBegunAt?: string;
    resolvedAt?: string;
}

interface IssueHistory {
    _id: string;
    title: string;
    description: string;
    issueType: string;
    status: string;
    location: { address: string };
    timeline: Timeline;
    citizenId?: { fullName: string; email: string };
    assignedDepartment?: { name: string };
    departmentAdminAssignedBy?: { fullName: string; email: string };
    workerAssignedToFix?: { fullName: string };
    workerAssignmentTimestamp?: string;
    resolutionTimestamp?: string;
    severity: string;
}

const HistoryPage = () => {
    const [issues, setIssues] = useState<IssueHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<IssueHistory | null>(null);

    // Hardcoded departments list since we don't know the department API, could be derived from issueType mapping but let's just make it generic or user filtered
    const [selectedDeptId] = useState("");

    const fetchHistory = async () => {
        setLoading(true);
        let url = `${VITE_BACKEND_URL}/api/v1/history`;
        if (selectedDeptId) {
            url += `?departmentId=${selectedDeptId}`;
        }
        try {
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
            });
            const data = await res.json();
            if (data.success) {
                setIssues(data.history);
            } else {
                toast.error("Failed to load history.");
            }
        } catch (e) {
            console.error(e);
            toast.error("An error occurred fetching history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [selectedDeptId]);

    const formatDate = (d: string | undefined) => {
        if (!d) return "Not recorded";
        const date = new Date(d);
        return date.toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        }) + ' at ' + date.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <HeaderAfterAuth />
            <div className="container mx-auto px-4 py-24">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">Issue History</h1>

                {/* Roles like main admin and citizen can filter by department visually if needed */}
                {/* We omitted complex dept fetch for brevity, but they can view general history */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <p className="col-span-full text-center text-slate-500">Loading history...</p>
                    ) : issues.length === 0 ? (
                        <p className="col-span-full text-center text-slate-500">No resolved issues found in your history.</p>
                    ) : (
                        issues.map(issue => (
                            <Card key={issue._id} className="cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-1" onClick={() => setSelectedIssue(issue)}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-semibold">{issue.title}</CardTitle>
                                        {getStatusBadge(issue.status)}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-3">{issue.description}</p>

                                    <div className="flex flex-col gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} className="text-blue-500" />
                                            <span>Resolved: {formatDate(issue.resolutionTimestamp || issue.timeline?.resolvedAt || issue.timeline?.reportedAt)}</span>
                                        </div>
                                        {issue.assignedDepartment?.name && (
                                            <div className="flex items-center gap-1">
                                                <UserCheck size={14} className="text-amber-500" />
                                                <span>Authority: {getAuthorityLabel(issue.assignedDepartment.name)}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Modal / Overlay - No Action allowed */}
            {selectedIssue && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{selectedIssue.title}</h2>
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><MapPin size={14} /> {selectedIssue.location?.address || "Unknown Location"}</p>
                            </div>
                            {getStatusBadge(selectedIssue.status)}
                        </div>
                        <div className="p-6">
                            <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                                {selectedIssue.description}
                            </p>

                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                                <div>
                                    <span className="block text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Reporter</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-medium">{selectedIssue.citizenId?.fullName || "Anonymous"}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Reported On</span>
                                    <span className="text-slate-800 dark:text-slate-200">{formatDate(selectedIssue.timeline?.reportedAt)}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Assigned By</span>
                                    <span className="text-slate-800 dark:text-slate-200">{selectedIssue.departmentAdminAssignedBy?.fullName || "System Auth Routing"}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Assigned Date</span>
                                    <span className="text-slate-800 dark:text-slate-200">{formatDate(selectedIssue.timeline?.assignedAt || selectedIssue.workerAssignmentTimestamp)}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Assigned Worker</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-medium">{selectedIssue.workerAssignedToFix?.fullName || "Not Specified"}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Resolved On</span>
                                    <span className="text-slate-800 dark:text-slate-200 text-emerald-600 dark:text-emerald-400 font-medium">
                                        {formatDate(selectedIssue.resolutionTimestamp || selectedIssue.timeline?.resolvedAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end">
                            <Button variant="outline" onClick={() => setSelectedIssue(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
