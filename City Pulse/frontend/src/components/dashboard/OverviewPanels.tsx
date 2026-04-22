import { useEffect, useState } from "react";
import { VITE_BACKEND_URL } from "../../config/config";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const SystemHealthBadge = () => {
    const [health, setHealth] = useState<any>(null);
    useEffect(() => {
        fetch(`${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/system-health`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        }).then(res => res.json()).then(data => {
            if (data && data.success) setHealth(data.data);
        }).catch(console.error);
    }, []);

    if (!health) return null;
    return (
        <div className="flex gap-4 text-xs font-bold uppercase p-2 bg-slate-900 text-white rounded-lg opacity-80 mt-2">
            <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${health.databaseStatus === 'operational' ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} /> DB: {health.databaseStatus}</span>
            <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${health.socketStatus === 'active' ? 'bg-emerald-500' : 'bg-yellow-500'}`} /> Sockets: {health.socketStatus}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Notifications: {health.notificationServiceStatus}</span>
        </div>
    );
};

export const SystemOverviewPanel = () => {
    const [stats, setStats] = useState<any>({});
    useEffect(() => {
        fetch(`${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/overview`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        }).then(res => res.json()).then(data => {
            if (data && data.success) setStats(data.data || {});
        }).catch(console.error);
    }, []);

    return (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card className="shadow hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm text-slate-500">Total Issues</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0 text-2xl font-black">{(stats || {}).totalIssues || 0}</CardContent>
            </Card>
            <Card className="shadow hover:shadow-lg transition-all duration-300 border-l-4 border-l-gray-400">
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm text-slate-500">Unassigned</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0 text-2xl font-black">{stats.unassignedIssues || 0}</CardContent>
            </Card>
            <Card className="shadow hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm text-slate-500">In Progress</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0 text-2xl font-black">{stats.issuesInProgress || 0}</CardContent>
            </Card>
            <Card className="shadow hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm text-slate-500">Awaiting Verif.</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0 text-2xl font-black">{stats.awaitingVerificationIssues || 0}</CardContent>
            </Card>
            <Card className="shadow hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm text-slate-500">Resolved</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0 text-2xl font-black">{stats.resolvedIssues || 0}</CardContent>
            </Card>
            <Card className="shadow hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500">
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm text-slate-500">Overdue SLA</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0 text-2xl font-black text-red-600 animate-pulse">{stats.overdueIssues || 0}</CardContent>
            </Card>
        </div>
    );
};

export const DepartmentPerformancePanel = () => {
    const [performance, setPerformance] = useState<any[]>([]);
    useEffect(() => {
        fetch(`${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/department-performance`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        }).then(res => res.json()).then(data => {
            if (data && data.success) setPerformance(data.data || []);
        }).catch(console.error);
    }, []);

    return (
        <Card className="shadow-lg">
            <CardHeader className="bg-slate-50"><CardTitle className="text-lg">Department Enforcement & Performance Monitor</CardTitle></CardHeader>
            <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-2">Department</th>
                            <th className="px-4 py-2">Active Issues</th>
                            <th className="px-4 py-2">Resolved</th>
                            <th className="px-4 py-2 text-rose-600">Overdue</th>
                            <th className="px-4 py-2">Avg Resolution (Ms)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {performance.map((dept, i) => (
                            <tr key={i} className="border-b hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-semibold">{dept.departmentName}</td>
                                <td className="px-4 py-3">{dept.activeIssues}</td>
                                <td className="px-4 py-3 text-emerald-600">{dept.resolvedIssues}</td>
                                <td className="px-4 py-3 text-rose-600 font-bold">{dept.overdueIssues}</td>
                                <td className="px-4 py-3">{(dept.averageResolutionTimeMs / (1000 * 60 * 60)).toFixed(2)} Hrs</td>
                            </tr>
                        ))}
                        {performance.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-slate-500">No data accumulated yet.</td></tr>}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
};
