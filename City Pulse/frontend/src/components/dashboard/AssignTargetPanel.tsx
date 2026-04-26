import { useState, useEffect } from "react";
import { Users, Shield, HardHat, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { VITE_BACKEND_URL } from "../../config/config";

interface AssignTargetPanelProps {
    issueId: string;
    departmentName: string;
    onSuccess: () => void;
}

export const AssignTargetPanel = ({ issueId, departmentName, onSuccess }: AssignTargetPanelProps) => {
    const [personnel, setPersonnel] = useState<{ departmentAdmins: any[], workers: any[] }>({ departmentAdmins: [], workers: [] });
    const [resolvedDeptName, setResolvedDeptName] = useState(departmentName);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

    useEffect(() => {
        const fetchPersonnel = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/department-staff`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
                });
                const data = await res.json();
                if (data.success) {
                    setPersonnel(data.data);
                    if (data.data.departmentName) {
                        setResolvedDeptName(data.data.departmentName);
                    }
                }
            } catch (err) {
                toast.error("Failed to load department staff");
            } finally {
                setLoading(false);
            }
        };
        if (issueId) fetchPersonnel();
    }, [issueId]);

    const handleAssign = async () => {
        if (!selectedAdminId && !selectedWorkerId) {
            toast.error("Please select at least an admin or a worker.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/assign-pair`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`
                },
                body: JSON.stringify({
                    adminId: selectedAdminId,
                    workerId: selectedWorkerId
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Assignment specialized successfully!");
                onSuccess();
            } else {
                toast.error(data.message || "Assignment failed");
            }
        } catch (error) {
            toast.error("Internal service error during assignment");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scanning Branch Personnel...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl">
                <h4 className="text-[10px] font-black uppercase text-sky-800 mb-1">Targeting Branch</h4>
                <p className="text-lg font-black text-slate-800">{resolvedDeptName}</p>
            </div>

            <div className="space-y-4">
                {/* Admin Selection */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-sky-600" />
                        <h5 className="text-xs font-black uppercase text-slate-700">Assign Supervisor (Admin)</h5>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                        {personnel.departmentAdmins.map(admin => (
                            <button
                                key={admin._id}
                                onClick={() => setSelectedAdminId(selectedAdminId === admin._id ? null : admin._id)}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${selectedAdminId === admin._id ? 'bg-sky-600 border-sky-700 text-white shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold">{admin.fullName}</span>
                                    <span className={`text-[10px] ${selectedAdminId === admin._id ? 'text-sky-100' : 'text-slate-400'}`}>{admin.email}</span>
                                </div>
                                {selectedAdminId === admin._id && <CheckCircle className="w-4 h-4" />}
                            </button>
                        ))}
                        {personnel.departmentAdmins.length === 0 && (
                            <p className="text-xs text-slate-400 italic py-2 text-center">No admins listed for this branch.</p>
                        )}
                    </div>
                </div>

                {/* Worker Selection */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                        <HardHat className="w-4 h-4 text-emerald-600" />
                        <h5 className="text-xs font-black uppercase text-slate-700">Deploy Field Staff (Worker)</h5>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                        {personnel.workers.map(worker => (
                            <button
                                key={worker._id}
                                onClick={() => setSelectedWorkerId(selectedWorkerId === worker._id ? null : worker._id)}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${selectedWorkerId === worker._id ? 'bg-emerald-600 border-emerald-700 text-white shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold">{worker.fullName}</span>
                                    <span className={`text-[10px] ${selectedWorkerId === worker._id ? 'text-emerald-100' : 'text-slate-400'}`}>{worker.email}</span>
                                </div>
                                {selectedWorkerId === worker._id && <CheckCircle className="w-4 h-4" />}
                            </button>
                        ))}
                        {personnel.workers.length === 0 && (
                            <p className="text-xs text-slate-400 italic py-2 text-center">No workers currently available.</p>
                        )}
                    </div>
                </div>
            </div>

            <Button
                onClick={handleAssign}
                disabled={submitting || (!selectedAdminId && !selectedWorkerId)}
                className="w-full bg-slate-900 border border-slate-800 hover:bg-black text-white font-black uppercase py-6 rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
                {submitting ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Executing Command...
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 mr-2" />
                        Deploy Specialized Team
                    </div>
                )}
            </Button>
        </div>
    );
};
