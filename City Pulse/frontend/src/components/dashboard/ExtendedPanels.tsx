import { useEffect, useState } from "react";
import { VITE_BACKEND_URL } from "../../config/config";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Clock, CheckCircle2, AlertTriangle, Map } from "lucide-react";
import IssueMapView from "../IssueMapView";

export const VerificationWorkflowPanel = ({ onIssueClick }: { onIssueClick: (issue: any) => void }) => {
    const [data, setData] = useState<any>({ awaitingVerification: [], delayedVerification: [], recentlyVerified: [], rejectedVerification: [] });

    const fetchVerification = () => {
        fetch(`${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/verification`, { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } })
            .then(r => r.json()).then(d => { if (d && d.success) setData(d.data || { awaitingVerification: [], delayedVerification: [], recentlyVerified: [], rejectedVerification: [] }); }).catch(console.error);
    };

    useEffect(() => {
        fetchVerification();
    }, []);

    const handleAction = async (issueId: string, action: string) => {
        try {
            const statusTarget = action === 'approve' ? 'Resolved' : action === 'reject' ? 'Rejected' : 'AWAITING_VERIFICATION';
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
                body: JSON.stringify({ status: statusTarget })
            });
            if (res.ok) {
                toast.success(`Issue verification ${action} executed.`);
                fetchVerification();
            }
        } catch (e) { console.error(e); }
    };

    const renderList = (issues: any[], title: string, hasActions: boolean) => (
        <div className="mb-4">
            <h5 className="text-sm font-bold text-slate-700 mb-2 border-b pb-1">{title} ({issues.length})</h5>
            <div className="flex flex-col gap-2">
                {issues.map(issue => (
                    <div key={issue._id}
                        onClick={() => onIssueClick(issue)}
                        className="p-2 border rounded bg-slate-50 flex justify-between items-center group cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                        <div>
                            <h4 className="font-semibold text-slate-800 text-sm whitespace-nowrap overflow-hidden text-ellipsis w-48">{issue.title}</h4>
                            <p className="text-xs text-slate-500">{issue.assignedDepartment?.name} • Wait: {Math.floor((Date.now() - new Date(issue.updatedAt).getTime()) / 3600000)}h</p>
                        </div>
                        {hasActions && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(issue._id, 'approve')}>Approve</Button>
                                <Button size="sm" className="h-6 px-2 text-[10px] bg-rose-600 hover:bg-rose-700" onClick={() => handleAction(issue._id, 'reject')}>Reject</Button>
                                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => toast("Evidence request dispatched")}>Ask Evidence</Button>
                            </div>
                        )}
                    </div>
                ))}
                {issues.length === 0 && <p className="text-xs text-slate-400 italic">No issues tracking.</p>}
            </div>
        </div>
    );

    return (
        <Card className="shadow-lg border-l-4 border-l-indigo-500 h-[500px] flex flex-col">
            <CardHeader className="bg-indigo-50/50 py-3 shrink-0">
                <CardTitle className="text-lg text-indigo-800 flex items-center gap-2"><Clock className="h-5 w-5" /> Phase 5: Verification Control</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 overflow-y-auto flex-1">
                {renderList(data.awaitingVerification, "Awaiting Verification", true)}
                {renderList(data.delayedVerification, "Delayed Verification (Critical > 24h)", true)}
                {renderList(data.recentlyVerified, "Recently Verified Log", false)}
                {renderList(data.rejectedVerification, "Rejected / Returned", false)}
            </CardContent>
        </Card>
    );
};

export const RecentlyResolvedPanel = ({ onIssueClick }: { onIssueClick: (issue: any) => void }) => {
    const [issues, setIssues] = useState<any[]>([]);
    useEffect(() => {
        fetch(`${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/recently-resolved`, { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } })
            .then(r => r.json()).then(d => { if (d && d.success) setIssues(d.data || []); }).catch(console.error);
    }, []);

    return (
        <Card className="shadow-lg border-l-4 border-l-emerald-500">
            <CardHeader className="bg-emerald-50/50 flex flex-row items-center justify-between py-3">
                <CardTitle className="text-lg text-emerald-800 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Recently Resolved Tracker</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 max-h-96 overflow-y-auto space-y-3">
                {issues.map(issue => (
                    <div key={issue._id}
                        onClick={() => onIssueClick(issue)}
                        className="p-2 border-b flex justify-between items-center group hover:bg-slate-50 cursor-pointer"
                    >
                        <div>
                            <h4 className="font-semibold text-slate-700 text-sm">{issue.title}</h4>
                            <p className="text-xs text-slate-400">{issue.assignedDepartment?.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-emerald-600">{new Date(issue.resolutionTimestamp || issue.updatedAt).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-500">Worker: {issue.workerAssignedToFix?.fullName || 'N/A'}</p>
                        </div>
                    </div>
                ))}
                {issues.length === 0 && <p className="text-sm text-slate-500 w-full text-center py-4">No recent resolutions.</p>}
            </CardContent>
        </Card>
    );
};

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

const CHART_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#f43f5e'];

export const AnalyticsSummaryPanel = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    useEffect(() => {
        fetch(`${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/analytics`, { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } })
            .then(r => r.json()).then(d => { if (d && d.success) setAnalytics(d.data); }).catch(console.error);
    }, []);

    if (!analytics) return <Card className="p-4"><p className="text-center text-sm text-slate-500 animate-pulse">Loading Analytics Data...</p></Card>

    return (
        <Card className="shadow-lg h-full">
            <CardHeader className="bg-slate-50 flex flex-row items-center py-3">
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Global Hotspots & Aggregation</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-6">
                <div>
                    <h3 className="font-bold text-slate-600 mb-4">Most Common Issue Types</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={analytics.mostCommonIssueType} margin={{ left: -20, right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="_id"
                                    type="category"
                                    tick={{ fontSize: 10, fontWeight: 'bold' }}
                                    width={120}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                    {analytics.mostCommonIssueType?.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-[10px] font-bold text-blue-600 uppercase">Total Departments</p>
                        <p className="text-2xl font-black text-blue-800">{analytics.issuesPerDepartment?.length || 0}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Avg Resolution</p>
                        <p className="text-2xl font-black text-emerald-800">
                            {Math.round(analytics.issuesPerDepartment?.reduce((acc: any, curr: any) => acc + (curr.averageResolutionTimeMs || 0), 0) / (analytics.issuesPerDepartment?.length || 1) / 3600000)}h
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export const DashboardMapPanel = () => {
    const [mapData, setMapData] = useState<any[]>([]);
    useEffect(() => {
        fetch(`${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/map-data`, { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } })
            .then(r => r.json()).then(d => { if (d && d.success) setMapData(d.data || []); }).catch(console.error);
    }, []);

    return (
        <Card className="shadow-lg h-[400px] flex flex-col overflow-hidden">
            <CardHeader className="bg-slate-50 flex flex-row items-center py-3 z-10 shrink-0">
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2"><Map className="h-5 w-5 text-blue-600" /> System Map Aggregation</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative bg-slate-200">
                <IssueMapView issues={mapData} />
                {mapData.length > 0 && <div className="absolute bottom-2 left-2 bg-white/90 p-2 rounded shadow text-xs font-bold pointer-events-none z-10">Map loaded with {mapData.length} global markers</div>}
            </CardContent>
        </Card>
    )
}
