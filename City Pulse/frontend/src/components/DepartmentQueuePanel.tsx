import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import IssueDetailsPanel from './IssueDetailsPanel';
import { useAuth } from '../contexts/AuthContext';
import { VITE_BACKEND_URL } from '../config/config';
import { toast } from 'sonner';

export default function DepartmentQueuePanel() {
    const [issues, setIssues] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [issueToAssign, setIssueToAssign] = useState<any>(null);
    const [selectedWorkerId, setSelectedWorkerId] = useState("");
    const { token } = useAuth();

    const fetchIssues = async () => {
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/admin/issues`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.issues) setIssues(data.issues.filter((i: any) => i.status !== "Closed" && i.status !== "COMPLETED"));
        } catch (e) {
            console.error(e);
        }
    };

    const fetchWorkers = async (deptId: string) => {
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/departments/${deptId}/workers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setWorkers(data.workers);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (token) fetchIssues();
    }, [token]);

    const handleOpenAssign = (issue: any) => {
        setIssueToAssign(issue);
        setSelectedWorkerId("");
        setAssignModalOpen(true);
        if (issue.assignedDepartment?._id) {
            fetchWorkers(issue.assignedDepartment._id);
        }
    };

    const confirmAssignment = async () => {
        if (!selectedWorkerId) return toast.error("Select a worker first");

        const isReassign = !!issueToAssign.workerAssignedToFix;
        const endpoint = isReassign ? 'reassign-worker' : 'assign-worker';
        const bodyContent = isReassign
            ? JSON.stringify({ workerId: selectedWorkerId })
            : JSON.stringify({ workerId: selectedWorkerId, departmentId: issueToAssign.assignedDepartment._id });

        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueToAssign._id}/${endpoint}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: bodyContent
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(isReassign ? "Worker reassigned successfully" : "Worker assigned successfully");
                setAssignModalOpen(false);
                fetchIssues();
            } else {
                toast.error(data.message || "Assignment failed");
            }
        } catch (e) {
            console.error(e);
            toast.error("Network error");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Department Queue</CardTitle>
                </CardHeader>
                <CardContent>
                    {issues.length === 0 ? <p className="text-sm text-gray-500">No issues assigned to this department.</p> : (
                        <ul className="space-y-3">
                            {issues.map((iss: any) => {
                                const isAssigned = !!iss.workerAssignedToFix;
                                return (
                                    <li key={iss._id} className="p-3 border rounded-lg flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-sm">{iss.title}</span>
                                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                {iss.status === 'SUBMITTED' || iss.status === 'Reported' ? 'Not Yet Assigned' : (iss.status === 'Worker Assigned' || iss.status === 'ASSIGNED_TO_WORKER' ? 'ASSIGNED TO WORKER' : iss.status)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            <Button size="sm" variant="outline" onClick={() => setSelectedIssue(iss)}>View Details</Button>
                                            <Button size="sm" onClick={() => handleOpenAssign(iss)}>
                                                {isAssigned ? "Reassign Worker" : "Assign Worker"}
                                            </Button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>
            {selectedIssue && <IssueDetailsPanel issue={selectedIssue} onClose={() => setSelectedIssue(null)} />}

            {assignModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-white shadow-xl">
                        <CardHeader>
                            <CardTitle>{issueToAssign?.workerAssignedToFix ? "Reassign Worker" : "Assign Worker"}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">Select a department worker for: <span className="font-semibold">{issueToAssign?.title}</span></p>
                            {workers.length === 0 ? (
                                <p className="text-sm text-red-500 mb-4">No workers available in this department.</p>
                            ) : (
                                <div className="space-y-2 mb-4">
                                    {workers.map(w => (
                                        <label key={w._id} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-slate-50 transition-colors">
                                            <input
                                                type="radio"
                                                name="workerSelect"
                                                value={w._id}
                                                checked={selectedWorkerId === w._id}
                                                onChange={() => setSelectedWorkerId(w._id)}
                                            />
                                            <span>{w.fullName} <span className="text-xs text-gray-400">({w.email})</span></span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
                                <Button onClick={confirmAssignment} disabled={!selectedWorkerId}>Confirm Assignment</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
