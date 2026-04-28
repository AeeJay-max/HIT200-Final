import { useEffect, useState } from "react";
import { VITE_BACKEND_URL } from "../../config/config";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { ShieldAlert, RefreshCcw, Bell } from "lucide-react";

const reassignAction = async (issueId: string, type: 'reassign-department' | 'override-worker', payload: any, onRefresh: () => void) => {
    try {
        const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/${type}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("auth_token")}`
            },
            body: JSON.stringify(payload)
        });
        if (res.ok) { toast.success("Action applied successfully."); onRefresh(); }
        else toast.error("Failed action.");
    } catch { toast.error("Error connecting server"); }
};

const handlePingWorker = async (issueId: string) => {
    try {
        const res = await fetch(`${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/ping/${issueId}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("auth_token")}`
            }
        });
        const result = await res.json();
        if (res.ok) {
            toast.success("Ping successful", { description: result.message });
        } else {
            toast.error("Ping failed", { description: result.message });
        }
    } catch (error) {
        toast.error("Error connecting to server");
    }
};

export const EscalationPanel = ({ onIssueClick }: { onIssueClick: (issue: any) => void }) => {
    const [data, setData] = useState<any>({ escalatedIssues: [], slaRiskIssues: [], repeatedDelayDepartments: [] });
    const [departments, setDepartments] = useState<any[]>([]);

    const loadData = () => {
        fetch(`${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/escalations`, { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } })
            .then(r => r.json()).then(d => { if (d && d.success) setData(d.data || { escalatedIssues: [], slaRiskIssues: [], repeatedDelayDepartments: [] }); }).catch(console.error);

        fetch(`${VITE_BACKEND_URL}/api/v1/departments`, { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } })
            .then(r => r.json()).then(d => { if (d.success) setDepartments(d.departments); }).catch(console.error);
    }
    useEffect(() => { loadData(); }, []);

    const handleForceEscalate = async (issueId: string) => {
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/escalate`, {
                method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
            });
            if (res.ok) { toast.success("Forced Escalation Applied!"); loadData(); }
        } catch { toast.error("Error connecting"); }
    };

    return (
        <Card className="shadow-lg border-l-4 border-l-rose-500 h-[600px] flex flex-col">
            <CardHeader className="bg-rose-50/50 flex flex-row items-center justify-between py-3 shrink-0">
                <CardTitle className="text-lg text-rose-800 flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Phase 6: Escalation Control</CardTitle>
                <div className="flex gap-2">
                    <Badge variant="destructive" className="animate-pulse">{data.escalatedIssues.length} Escalated</Badge>
                    <Badge className="bg-orange-500">{data.slaRiskIssues.length} At Risk</Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4 overflow-y-auto flex-1 space-y-6">

                {/* Segment 1: Escalated Issues */}
                <div>
                    <h5 className="text-sm font-bold text-rose-700 mb-2 border-b pb-1">Actively Escalated</h5>
                    <div className="flex flex-col gap-2">
                        {data.escalatedIssues.map((issue: any) => (
                            <div key={issue._id}
                                onClick={() => onIssueClick(issue)}
                                className="p-3 border rounded-lg bg-rose-50/50 shadow-sm flex flex-col xl:flex-row justify-between xl:items-center gap-4 cursor-pointer hover:bg-rose-100/50 transition-colors"
                            >
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm whitespace-nowrap overflow-hidden text-ellipsis w-64">{issue.title}</h4>
                                    <p className="text-[11px] text-slate-500">Lvl: <span className="font-bold text-rose-600">{issue.escalationLevel}</span> • {issue.assignedDepartment?.name || 'Unassigned'}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <select id={`esc_dept_${issue._id}`} className="text-[10px] border rounded bg-white w-24">
                                        <option value="">New Dept</option>
                                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                    </select>
                                    <Button size="sm" variant="destructive" className="h-6 px-2 text-[10px]" onClick={() => {
                                        const deptId = (document.getElementById(`esc_dept_${issue._id}`) as HTMLSelectElement).value;
                                        if (deptId) reassignAction(issue._id, "reassign-department", { departmentId: deptId }, loadData);
                                    }}>Override</Button>
                                </div>
                            </div>
                        ))}
                        {data.escalatedIssues.length === 0 && <p className="text-xs text-slate-400 italic">No escalated issues.</p>}
                    </div>
                </div>

                {/* Segment 2: SLA Risk Issues */}
                <div>
                    <h5 className="text-sm font-bold text-orange-600 mb-2 border-b pb-1">SLA Risk (&lt;12h Deadline)</h5>
                    <div className="flex flex-col gap-2">
                        {data.slaRiskIssues.map((issue: any) => (
                            <div key={issue._id}
                                onClick={() => onIssueClick(issue)}
                                className="p-2 border rounded bg-orange-50/30 flex justify-between items-center group cursor-pointer hover:bg-orange-100/30 transition-colors"
                            >
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-[13px] whitespace-nowrap overflow-hidden text-ellipsis w-48">{issue.title}</h4>
                                    <p className="text-[10px] text-orange-700 font-bold">Expires: {new Date(issue.deadlineTimestamp).toLocaleTimeString()}</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" className="h-6 px-2 text-[10px] bg-orange-600 hover:bg-orange-700" onClick={() => handleForceEscalate(issue._id)}>Force Escalate</Button>
                                </div>
                            </div>
                        ))}
                        {data.slaRiskIssues.length === 0 && <p className="text-xs text-slate-400 italic">No risks detected.</p>}
                    </div>
                </div>

                {/* Segment 3: Repeated Delay Departments */}
                <div>
                    <h5 className="text-sm font-bold text-slate-700 mb-2 border-b pb-1">Repeated Delay Departments</h5>
                    <div className="grid grid-cols-2 gap-2">
                        {data.repeatedDelayDepartments.map((dep: any, i: number) => (
                            <div key={i} className="p-2 border rounded bg-slate-50 flex justify-between items-center">
                                <span className="text-xs font-semibold">{dep.department}</span>
                                <Badge variant="destructive" className="text-[10px]">{dep.overdueCount} Overdue</Badge>
                            </div>
                        ))}
                        {data.repeatedDelayDepartments.length === 0 && <p className="text-xs text-slate-400 italic">Departments performing to SLA.</p>}
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}

export const OverdueIssuesPanel = ({ onIssueClick }: { onIssueClick: (issue: any) => void }) => {
    const [issues, setIssues] = useState<any[]>([]);
    const loadData = () => {
        fetch(`${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/overdue`, { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } })
            .then(r => r.json()).then(d => { if (d && d.success) setIssues(d.data || []); }).catch(console.error);
    }
    useEffect(() => { loadData(); }, []);

    return (
        <Card className="shadow-lg border-l-4 border-l-yellow-500">
            <CardHeader className="bg-yellow-50/50 flex flex-row items-center justify-between py-3">
                <CardTitle className="text-lg text-yellow-800 flex items-center gap-2"><RefreshCcw className="h-5 w-5" /> Overdue SLA Violations</CardTitle>
                <Badge variant="outline" className="border-yellow-600 text-yellow-700">{issues.length} Records</Badge>
            </CardHeader>
            <CardContent className="pt-4 max-h-96 overflow-y-auto space-y-4">
                {issues.map(issue => {
                    const hoursOverdue = ((Date.now() - new Date(issue.deadlineTimestamp).getTime()) / (1000 * 60 * 60)).toFixed(1);
                    return (
                        <div key={issue._id}
                            onClick={() => onIssueClick(issue)}
                            className="p-3 border rounded-lg bg-yellow-50/20 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer hover:bg-yellow-100/30 transition-colors"
                        >
                            <div>
                                <h4 className="font-bold text-slate-800">{issue.title}</h4>
                                <p className="text-xs text-slate-500">{issue.assignedDepartment?.name || 'Unassigned'} • Worker: {issue.workerAssignedToFix?.fullName || 'None'}</p>
                            </div>
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-black text-rose-600 bg-rose-100 px-2 py-1 rounded">-{hoursOverdue} Hours</span>
                                <Button size="sm" variant="outline" className="h-7 text-xs border-orange-200 text-orange-600 hover:bg-orange-50" onClick={(e) => {
                                    e.stopPropagation();
                                    handlePingWorker(issue._id);
                                }}>
                                    <Bell className="w-3 h-3 mr-1" /> Ping Worker
                                </Button>
                            </div>
                        </div>
                    )
                })}
                {issues.length === 0 && <p className="text-sm text-slate-500 w-full text-center py-4">No violations tracked.</p>}
            </CardContent>
        </Card>
    );
};
