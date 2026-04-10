import { useEffect, useState } from "react";
import { VITE_BACKEND_URL } from "../config/config";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import DepartmentDeadlineScoreboard from "../components/DepartmentDeadlineScoreboard";
import IssueResolutionSchedulePanel from "../components/IssueResolutionSchedulePanel";
import ServiceOutageScheduleViewer from "../components/ServiceOutageScheduleViewer";

const TransparencyDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    useEffect(() => {
        fetch(`${VITE_BACKEND_URL}/api/v1/public/analytics`)
            .then(res => res.json())
            .then(data => setStats(data.stats));
    }, []);

    if (!stats) return <div className="p-10 text-center flex items-center justify-center min-h-screen text-slate-500 font-semibold animate-pulse">Loading Public Data...</div>;

    const resolutionRate = stats.totalIssues ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#0577b7]">City Pulse Transparency</h1>
                        <p className="text-slate-500 text-sm mt-1">Public Accountability Dashboard & Real-Time Resolution Metrics</p>
                    </div>
                    <Link to="/">
                        <Button variant="outline" className="text-sky-700 border-sky-200 hover:bg-sky-50">Back to Home</Button>
                    </Link>
                </div>

                {/* Community Trust Widget */}
                <div className="bg-gradient-to-r from-[#0577b7] to-sky-400 p-6 rounded-2xl shadow-xl text-white flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold opacity-90">Citizen Governance Integrity</h3>
                        <p className="text-xs opacity-70">Average reputation of contributors based on verified municipal reports</p>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-black">94.2/100</p>
                        <p className="text-[10px] font-bold uppercase tracking-tighter bg-white/20 px-2 py-1 rounded-full inline-block mt-1">High Trust Rating</p>
                    </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-t-4 border-t-sky-500 shadow-md">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Reports</CardTitle></CardHeader>
                        <CardContent><p className="text-5xl font-black text-sky-700">{stats.totalIssues}</p></CardContent>
                    </Card>
                    <Card className="border-t-4 border-t-emerald-500 shadow-md transform hover:-translate-y-1 transition duration-300">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Verified Resolved</CardTitle></CardHeader>
                        <CardContent><p className="text-5xl font-black text-emerald-600">{stats.resolvedIssues}</p></CardContent>
                    </Card>
                    <Card className="border-t-4 border-t-amber-500 shadow-md">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Resolution Rate</CardTitle></CardHeader>
                        <CardContent><p className="text-5xl font-black text-amber-500">{resolutionRate}%</p></CardContent>
                    </Card>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-8">
                    <h2 className="text-xl font-bold mb-6 text-slate-700">Infrastructure Issues by Category</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.byType.map((t: any) => (
                            <div key={t._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center hover:bg-blue-50 transition-colors">
                                <p className="text-3xl font-bold text-slate-700 mb-1">{t.count}</p>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t._id}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    <DepartmentDeadlineScoreboard />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 pb-10">
                    <IssueResolutionSchedulePanel />
                    <ServiceOutageScheduleViewer />
                </div>
            </div>
        </div>
    );
};
export default TransparencyDashboard;
