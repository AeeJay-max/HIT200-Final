import { useEffect, useState } from "react";
import { VITE_BACKEND_URL } from "../../config/config";
import { Users, UserCheck, UserX, Search, ShieldCheck, HardHat, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";

interface PersonnelData {
    admins: any[];
    workers: any[];
}

export const PersonnelControlPanel = () => {
    const [personnel, setPersonnel] = useState<PersonnelData>({ admins: [], workers: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchPersonnel = async () => {
        setLoading(true);
        try {
            const url = `${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/personnel`;
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
            });
            const data = await response.json();
            if (data.success) {
                setPersonnel(data.data);
            }
        } catch (err) {
            console.error("Personnel fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: string, role: string, currentStatus: boolean) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} this account?`)) return;

        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/personnel/${id}/toggle`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`
                },
                body: JSON.stringify({ role, active: !currentStatus })
            });
            const data = await res.json();
            if (data.success) {
                fetchPersonnel();
            }
        } catch (err) {
            console.error("Toggle error:", err);
        }
    };

    const handleDeletePersonnel = async (id: string, role: string) => {
        if (!confirm(`WARNING: Permanent removal of this personnel record. This action cannot be undone. Proceed?`)) return;

        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/personnel/${id}?role=${role}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`
                }
            });
            const data = await res.json();
            if (data.success) {
                fetchPersonnel();
            } else {
                alert(data.message || "Deletion failed");
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    useEffect(() => {
        fetchPersonnel();
    }, []);

    const filteredAdmins = personnel.admins.filter(a =>
        a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.department && a.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredWorkers = personnel.workers.filter(w =>
        w.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.department && w.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Card className="h-full border-none shadow-none bg-transparent flex flex-col">
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-black tracking-tighter uppercase">Personnel Control Room</CardTitle>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cross-Department Resource Management</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search units..."
                            className="h-8 w-48 pl-8 text-xs bg-white border-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Badge variant="outline" className="h-8 border-slate-200 bg-white px-3 font-bold text-slate-600">
                        {personnel.admins.length + personnel.workers.length} Units
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="px-0 flex-1 overflow-hidden mt-4">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                        {/* DEPT ADMINS SECTION */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Department Administrators</h3>
                            </div>
                            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">FullName</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Dept</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-center">Load</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredAdmins.length > 0 ? filteredAdmins.map((admin) => (
                                            <tr key={admin._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 text-xs font-bold text-slate-800">{admin.fullName}</td>
                                                <td className="px-4 py-3">
                                                    <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-50 text-[9px] px-1.5 py-0">
                                                        {admin.department || 'GLOBAL'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-center text-[10px] font-mono font-bold text-slate-500">
                                                    {admin.assignedIssues || 0}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive !== false ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></span>
                                                        <span className={`text-[10px] font-black uppercase ${admin.isActive !== false ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {admin.isActive !== false ? 'Active' : 'Disabled'}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 ml-2"
                                                            onClick={() => handleToggleStatus(admin._id, admin.role || 'DEPARTMENT_ADMIN', admin.isActive !== false)}
                                                        >
                                                            {admin.isActive !== false ? <UserX className="w-3.5 h-3.5 text-rose-500" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 ml-1 hover:bg-rose-50 text-rose-400 hover:text-rose-600"
                                                            onClick={() => handleDeletePersonnel(admin._id, "DEPARTMENT_ADMIN")}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400 italic">No operators identified</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* FIELD WORKERS SECTION */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <HardHat className="w-4 h-4 text-amber-600" />
                                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Field Personnel (Workers)</h3>
                            </div>
                            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Worker</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Dept</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Current Load</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Availability</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredWorkers.length > 0 ? filteredWorkers.map((worker) => (
                                            <tr key={worker._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 text-xs font-bold text-slate-800">{worker.fullName}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase">{worker.department || 'General'}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden w-12 hidden sm:block">
                                                            <div
                                                                className={`h-full ${(worker.assignedIssues || 0) > 3 ? 'bg-amber-500' : 'bg-sky-500'}`}
                                                                style={{ width: `${Math.min((worker.assignedIssues || 0) * 20, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-600">{worker.assignedIssues || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.2">
                                                        {worker.isActive !== false ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                                                <span className="text-[10px] font-black uppercase text-emerald-600">Active</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 ml-1"
                                                                    onClick={() => handleToggleStatus(worker._id, 'WORKER', true)}
                                                                >
                                                                    <UserX className="w-3.5 h-3.5 text-rose-500" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                                                                <span className="text-[10px] font-black uppercase text-rose-600">Disabled</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 ml-1"
                                                                    onClick={() => handleToggleStatus(worker._id, 'WORKER', false)}
                                                                >
                                                                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 ml-2 hover:bg-rose-50 text-rose-400 hover:text-rose-600"
                                                            onClick={() => handleDeletePersonnel(worker._id, "WORKER")}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400 italic">No field personnel available</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
