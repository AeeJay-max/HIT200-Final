import React, { useState, useEffect } from "react";
import { VITE_BACKEND_URL } from "../../config/config";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { ShieldAlert, Users, HardHat, CheckCircle2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

interface Personnel {
    _id: string;
    fullName: string;
    email: string;
    department: string;
}

interface StaffData {
    departmentAdmins: Personnel[];
    workers: Personnel[];
}

export const OverrideAssignmentPanel = ({ issueId, onOverrideComplete }: { issueId: string, onOverrideComplete: () => void }) => {
    const [staff, setStaff] = useState<StaffData>({ departmentAdmins: [], workers: [] });
    const [loading, setLoading] = useState(true);
    const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/department-staff`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
                });
                const data = await res.json();
                if (data.success) {
                    setStaff(data.data);
                } else {
                    toast.error(data.message || "Failed to load department staff");
                }
            } catch (err) {
                console.error(err);
                toast.error("Network error loading staff");
            } finally {
                setLoading(false);
            }
        };

        if (issueId) fetchStaff();
    }, [issueId]);

    const handleAssignAdmin = async () => {
        if (!selectedAdminId) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/override-department-admin`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`
                },
                body: JSON.stringify({ adminId: selectedAdminId })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Department Admin Override Successful");
                onOverrideComplete();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error("Override failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignWorker = async () => {
        if (!selectedWorkerId) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/override-worker`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`
                },
                body: JSON.stringify({ workerId: selectedWorkerId })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Worker Override Successful");
                onOverrideComplete();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error("Override failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-4 text-center animate-pulse text-slate-500">Loading department personnel...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-50 border rounded-lg overflow-hidden">
            <div className="bg-rose-50 p-4 border-b border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-rose-600" />
                    <h3 className="font-bold text-rose-900">Main Admin Override Assignment</h3>
                </div>
                <Badge className="bg-rose-600 text-white animate-pulse">Deadline Missed</Badge>
            </div>

            <div className="flex-1 overflow-hidden p-4 space-y-6">
                {/* Department Admins */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold border-b pb-1">
                        <Users className="h-4 w-4" />
                        <h4>Department Administrators</h4>
                    </div>
                    {staff.departmentAdmins.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No department admins available</p>
                    ) : (
                        <RadioGroup value={selectedAdminId || ""} onValueChange={setSelectedAdminId} className="space-y-2">
                            {staff.departmentAdmins.map(admin => (
                                <div key={admin._id} className="flex items-center space-x-2 p-2 bg-white rounded border hover:border-slate-300 transition-colors">
                                    <RadioGroupItem value={admin._id} id={`admin-${admin._id}`} />
                                    <Label htmlFor={`admin-${admin._id}`} className="flex-1 cursor-pointer">
                                        <div className="font-medium text-sm">{admin.fullName}</div>
                                        <div className="text-[10px] text-slate-500">{admin.email}</div>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}
                    <Button
                        size="sm"
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white h-8"
                        disabled={!selectedAdminId || submitting}
                        onClick={handleAssignAdmin}
                    >
                        {submitting ? "Processing..." : "Assign Admin Override"}
                    </Button>
                </div>

                <div className="flex items-center gap-2 py-2">
                    <div className="h-[1px] flex-1 bg-slate-200"></div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">OR</span>
                    <div className="h-[1px] flex-1 bg-slate-200"></div>
                </div>

                {/* Workers */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold border-b pb-1">
                        <HardHat className="h-4 w-4" />
                        <h4>Field Workers</h4>
                    </div>
                    {staff.workers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No workers found for this department</p>
                    ) : (
                        <RadioGroup value={selectedWorkerId || ""} onValueChange={setSelectedWorkerId} className="space-y-2">
                            <div className="h-40 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="space-y-2">
                                    {staff.workers.map(worker => (
                                        <div key={worker._id} className="flex items-center space-x-2 p-2 bg-white rounded border hover:border-slate-300 transition-colors">
                                            <RadioGroupItem value={worker._id} id={`worker-${worker._id}`} />
                                            <Label htmlFor={`worker-${worker._id}`} className="flex-1 cursor-pointer">
                                                <div className="font-medium text-sm">{worker.fullName}</div>
                                                <div className="text-[10px] text-slate-500">{worker.email}</div>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </RadioGroup>
                    )}
                    <Button
                        size="sm"
                        variant="secondary"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                        disabled={!selectedWorkerId || submitting}
                        onClick={handleAssignWorker}
                    >
                        {submitting ? "Processing..." : "Assign Worker Override"}
                    </Button>
                </div>
            </div>

            <div className="p-4 bg-slate-100 border-t flex items-center gap-2 text-[10px] text-slate-500">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Only one assignment allowed per submission. This action will be logged.
            </div>
        </div>
    );
};
