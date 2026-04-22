import { useEffect, useState } from "react";
import { X, ShieldAlert, MapPin, Clock, CheckCircle, Activity } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { VITE_BACKEND_URL } from "../../config/config";
import IssueMapView from "../IssueMapView";
import { OverrideAssignmentPanel } from "./OverrideAssignmentPanel";

interface IssueActionDrawerProps {
    issueId: string | null;
    onClose: () => void;
    onActionSuccess: () => void;
}

export const IssueActionDrawer = ({ issueId, onClose, onActionSuccess }: IssueActionDrawerProps) => {
    const [issue, setIssue] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [personnel, setPersonnel] = useState<{ departmentAdmins: any[], workers: any[] }>({ departmentAdmins: [], workers: [] });
    const [loadingPersonnel, setLoadingPersonnel] = useState(false);

    useEffect(() => {
        if (issueId) {
            fetchIssueDetails();
            fetchDepartments();
        }
    }, [issueId]);

    const fetchIssueDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
            });
            const data = await res.json();
            if (data.success) {
                setIssue(data.data);
                fetchPersonnel(data.data.assignedDepartment?._id || data.data.assignedDepartment);
            }
        } catch (e) {
            toast.error("Failed to load issue details");
        } finally {
            setLoading(false);
        }
    };


    const fetchDepartments = async () => {
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/departments`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
            });
            const data = await res.json();
            if (data.success) setDepartments(data.departments);
        } catch (e) { console.error(e); }
    };

    const fetchPersonnel = async (deptId: string) => {
        if (!deptId) return;
        setLoadingPersonnel(true);
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/assignable-personnel/${deptId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
            });
            const data = await res.json();
            if (data.success) setPersonnel(data.data);
        } catch (e) { console.error(e); }
        setLoadingPersonnel(false);
    };

    const handleOverride = async (assigneeId: string, role: string) => {
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/override-assignee`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`
                },
                body: JSON.stringify({ assigneeId, role })
            });
            if (res.ok) {
                toast.success("Assignment overridden successfully.");
                fetchIssueDetails();
                onActionSuccess();
            }
        } catch (e) { toast.error("Override failed"); }
    };

    const handleReassignDept = async (deptId: string) => {
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/reassign-department`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`
                },
                body: JSON.stringify({ departmentId: deptId })
            });
            if (res.ok) {
                toast.success("Issue moved to new department.");
                fetchIssueDetails();
                onActionSuccess();
            }
        } catch (e) { toast.error("Reassignment failed"); }
    };

    const handleForceEscalate = async () => {
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/escalate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
            });
            if (res.ok) {
                toast.success("Issue escalated to next level.");
                fetchIssueDetails();
                onActionSuccess();
            }
        } catch (e) { toast.error("Escalation failed"); }
    };

    const handleVerify = async (action: 'Approve' | 'Reject') => {
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/admin/issue/${issueId}/verify`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`
                },
                body: JSON.stringify({ action, notes: "Verified by Main Admin Control Center" })
            });
            if (res.ok) {
                toast.success(`Issue ${action === 'Approve' ? 'Resolved' : 'Returned'}`);
                fetchIssueDetails();
                onActionSuccess();
            }
        } catch (e) { toast.error("Verification command failed"); }
    };

    if (!issueId) return null;

    return (
        <div className={`fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${issueId ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Header */}
            <div className="p-4 border-b bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-sky-400" />
                    <h2 className="font-black uppercase tracking-tighter text-sm">Issue Control Terminal</h2>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center bg-slate-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
                </div>
            ) : issue ? (
                <div className="flex-1 overflow-y-auto bg-slate-50/50 flex flex-col">
                    {/* Main Content Area */}
                    <div className="p-6 space-y-6">
                        {/* Title & Status */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex gap-2">
                                    <Badge className={`uppercase text-[10px] ${issue.status === 'Resolved' ? 'bg-emerald-500' : 'bg-sky-500'}`}>{issue.status}</Badge>
                                    {issue.assignmentDeadlinePassed && (
                                        <Badge className="bg-rose-600 text-[10px] uppercase">Override Mode Enabled</Badge>
                                    )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">ID: {issue._id.substring(0, 12)}...</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 leading-tight">{issue.title}</h3>
                            <p className="text-sm text-slate-600 mt-2 bg-white p-3 rounded-lg border shadow-sm">{issue.description}</p>
                        </div>

                        {issue.assignmentDeadlinePassed ? (
                            <OverrideAssignmentPanel
                                issueId={issue._id}
                                onOverrideComplete={() => {
                                    fetchIssueDetails();
                                    onActionSuccess();
                                }}
                            />
                        ) : (
                            <>
                                {/* Location Mini-Map */}
                                <div className="h-40 rounded-xl overflow-hidden border shadow-inner relative bg-slate-200">
                                    <IssueMapView issues={[issue]} />
                                    <div className="absolute bottom-2 left-2 right-2 bg-white/90 p-2 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                        <MapPin className="w-3 h-3 text-rose-500" /> {issue.location?.address}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Assigned Dept</span>
                                        <span className="text-sm font-bold text-slate-700">{issue.assignedDepartment?.name || issue.assignedDepartment || 'QUEUED'}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Severity</span>
                                        <span className={`text-sm font-bold ${issue.severity === 'Critical' ? 'text-rose-600' : 'text-slate-700'}`}>{issue.severity}</span>
                                    </div>
                                </div>

                                {/* Votes & Community Support */}
                                {issue.votes && (
                                    <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
                                        <h4 className="text-[10px] font-black uppercase text-sky-700 mb-2 flex items-center gap-2">Community Validation</h4>
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-2xl font-black text-sky-600">{issue.votes.length}</p>
                                                <p className="text-[10px] text-sky-400 font-bold uppercase">Citizens</p>
                                            </div>
                                            <div className="flex-1 overflow-x-auto custom-scrollbar flex gap-1 items-center py-1">
                                                {issue.votes.slice(0, 5).map((v: any, i: number) => (
                                                    <div key={i} className="w-6 h-6 rounded-full bg-sky-200 border border-white flex items-center justify-center text-[10px] font-bold text-sky-700" title={v.userId?.fullName}>
                                                        {v.userId?.fullName?.charAt(0) || '?'}
                                                    </div>
                                                ))}
                                                {issue.votes.length > 5 && <span className="text-[10px] font-bold text-sky-400">+{issue.votes.length - 5}</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Timeline / Integrity Check */}
                                <div className="bg-white p-4 rounded-xl border shadow-sm">
                                    <h4 className="text-[10px] font-black uppercase text-slate-500 mb-3 flex items-center gap-2"><Clock className="w-3 h-3" /> System Timeline Logs</h4>
                                    <div className="space-y-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                        <div className="relative pl-6 flex justify-between">
                                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-sky-500 border-2 border-white shadow-sm" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">SUBMITTED</p>
                                                <p className="text-[10px] text-slate-400">{new Date(issue.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        {issue.deadlineTimestamp && (
                                            <div className="relative pl-6 flex justify-between">
                                                <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full ${new Date(issue.deadlineTimestamp) < new Date() ? 'bg-rose-500' : 'bg-emerald-500'} border-2 border-white shadow-sm`} />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">SLA DEADLINE</p>
                                                    <p className="text-[10px] text-slate-400">{new Date(issue.deadlineTimestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <hr className="border-slate-200" />

                                {/* POWER ACTIONS PANEL */}
                                <div className="space-y-4 pb-10">
                                    <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-500" /> Administrative Overrides</h4>

                                    {/* Force Escalate */}
                                    <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-10 shadow-lg shadow-rose-200" onClick={handleForceEscalate}>
                                        <ShieldAlert className="w-4 h-4 mr-2" /> Force Immediate Escalation
                                    </Button>

                                    {/* Verify / Approve Action */}
                                    {(issue.status === 'Resolved (Unverified)' || issue.workflowStage === 'AWAITING_VERIFICATION') && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button className="bg-emerald-600 hover:bg-emerald-700 h-10 text-xs font-bold" onClick={() => handleVerify('Approve')}>
                                                <CheckCircle className="w-4 h-4 mr-2" /> Approve Fix
                                            </Button>
                                            <Button variant="outline" className="h-10 text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => handleVerify('Reject')}>
                                                <X className="w-4 h-4 mr-2" /> Reject & Return
                                            </Button>
                                        </div>
                                    )}

                                    {/* Reassign Department */}
                                    <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                                        <h5 className="text-[10px] font-bold uppercase text-slate-500">Cross-Department Routing</h5>
                                        <div className="flex gap-2">
                                            <select id="drawer_dept_select" className="flex-1 text-xs border rounded h-9 bg-slate-50">
                                                <option value="">Select Department</option>
                                                {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                                            </select>
                                            <Button size="sm" className="bg-slate-800 hover:bg-slate-900 h-9" onClick={() => {
                                                const val = (document.getElementById('drawer_dept_select') as HTMLSelectElement).value;
                                                if (val) handleReassignDept(val);
                                            }}>Move</Button>
                                        </div>
                                    </div>

                                    {/* Personnel Override */}
                                    <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                                        <h5 className="text-[10px] font-bold uppercase text-slate-500">Personnel Intervention ({issue.assignedDepartment?.name || 'No Dept'})</h5>
                                        <div className="space-y-4">
                                            {loadingPersonnel ? (
                                                <p className="text-center text-[10px] text-slate-400 animate-pulse">Scanning availability...</p>
                                            ) : (
                                                <>
                                                    {personnel.departmentAdmins.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Available Admins</p>
                                                            {personnel.departmentAdmins.map(adm => (
                                                                <div key={adm._id} className="flex justify-between items-center p-2 bg-slate-50 rounded border text-xs">
                                                                    <span className="font-bold">{adm.fullName}</span>
                                                                    <Button size="sm" variant="outline" className="h-6 text-[10px] border-sky-200 text-sky-600" onClick={() => handleOverride(adm._id, "DEPARTMENT_ADMIN")}>Force Assign</Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {personnel.workers.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Available Workers</p>
                                                            {personnel.workers.map(wrk => (
                                                                <div key={wrk._id} className="flex justify-between items-center p-2 bg-slate-50 rounded border text-xs">
                                                                    <span className="font-bold">{wrk.fullName}</span>
                                                                    <Button size="sm" variant="outline" className="h-6 text-[10px] border-emerald-200 text-emerald-600" onClick={() => handleOverride(wrk._id, "WORKER")}>Direct Deploy</Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {personnel.departmentAdmins.length === 0 && personnel.workers.length === 0 && (
                                                        <p className="text-[10px] text-slate-400 italic">No personnel currently listed for this branch.</p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50">
                    <ShieldAlert className="w-12 h-12 mb-4 opacity-10" />
                    <p className="text-sm font-bold opacity-50">SELECT AN ISSUE TO INVOKE CONTROL HANDLES</p>
                </div>
            )}
        </div>
    );
};
