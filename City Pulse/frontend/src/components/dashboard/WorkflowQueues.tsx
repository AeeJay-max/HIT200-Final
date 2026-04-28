import { useState, useEffect } from "react";
import { VITE_BACKEND_URL } from "../../config/config";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { MapPin } from "lucide-react";

interface Issue {
    _id: string;
    title: string;
    assignedDepartment?: string;
    workflowStage?: string;
    status?: string;
    upvotes: string[];
    location: { address: string };
    overdueStatus?: boolean;
    timeline?: { isOverdue: boolean };
}

export function WorkflowQueues({ onAssignClick }: { onAssignClick: (issue: Issue) => void }) {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const response = await fetch(`${VITE_BACKEND_URL}/api/v1/issues`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
                });
                const data = await response.json();
                const issuesList = data.data || data.issues || [];
                const sorted = [...issuesList].sort((a: Issue, b: Issue) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0));
                setIssues(sorted);
            } catch (err) { }
            setLoading(false);
        };
        fetchIssues();
    }, []);

    const unassigned = issues.filter(i => i.workflowStage === "SUBMITTED" || i.status === "SUBMITTED" || i.status === "Reported" || !i.assignedDepartment);
    const assignedToDept = issues.filter(i => i.workflowStage === "ROUTED_TO_DEPARTMENT" || i.status === "ROUTED_TO_DEPARTMENT");
    const assignedToWorker = issues.filter(i => i.workflowStage === "ASSIGNED_TO_WORKER" || i.status === "Worker Assigned");
    const inProgress = issues.filter(i => i.workflowStage === "IN_PROGRESS" || i.status === "In Progress" || i.workflowStage === "WORKER_ACCEPTED");
    const awaitingVerification = issues.filter(i => i.workflowStage === "AWAITING_VERIFICATION" || i.status === "Resolved (Unverified)");
    const escalated = issues.filter(i => i.workflowStage === "ESCALATED" || i.status === "Escalated");
    const overdue = issues.filter(i => i.timeline?.isOverdue || i.overdueStatus);

    const panels = [
        { title: "Unassigned Issues", data: unassigned, color: "bg-stone-100 text-stone-700" },
        { title: "Assigned To Department", data: assignedToDept, color: "bg-sky-100 text-sky-700" },
        { title: "Assigned To Worker", data: assignedToWorker, color: "bg-blue-100 text-blue-700" },
        { title: "Issues In Progress", data: inProgress, color: "bg-amber-100 text-amber-700" },
        { title: "Awaiting Verification", data: awaitingVerification, color: "bg-purple-100 text-purple-700" },
        { title: "Escalated Issues", data: escalated, color: "bg-rose-100 text-rose-700" },
        { title: "Overdue Issues", data: overdue, color: "bg-red-100 text-red-700" },
    ];

    if (loading) return <div className="animate-pulse h-32 bg-slate-200 rounded-xl"></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Active Workflow Stages</h2>
            <div className="grid grid-cols-1 gap-6">
                {panels.map((panel, idx) => (
                    <Card key={idx} className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 py-3 border-b flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs ${panel.color}`}>{panel.data.length}</span>
                                {panel.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {panel.data.length === 0 ? (
                                <div className="p-4 text-center text-sm text-slate-400 italic">No issues currently in this stage.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/30">
                                            <TableHead>Issue</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Votes</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {panel.data.map(issue => (
                                            <TableRow key={issue._id}>
                                                <TableCell className="font-medium text-slate-700">{issue.title}</TableCell>
                                                <TableCell className="text-xs text-slate-500">
                                                    <MapPin className="h-3 w-3 inline mr-1 opacity-50" />
                                                    {issue.location?.address}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="border-sky-200 text-sky-700 bg-sky-50">
                                                        ⭐ {issue.upvotes?.length || 0}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        onClick={() => onAssignClick(issue)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                                    >
                                                        Assign Target
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
