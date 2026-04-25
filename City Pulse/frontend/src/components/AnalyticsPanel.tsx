import { useEffect, useState, useMemo } from "react";
import { VITE_BACKEND_URL } from "../config/config";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";
import Player from "lottie-react";
import starloader from "../assets/animations/starloder.json";
import DepartmentResponseTimeChart from "./DepartmentResponseTimeChart";
import WorkerPerformanceChart from "./WorkerPerformanceChart";
import { Calendar, Filter, Download } from "lucide-react";
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from "recharts";

const CHART_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#f43f5e'];

export default function AnalyticsPanel() {
    const [data, setData] = useState<any>(null);
    const [districts, setDistricts] = useState<any[]>([]);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = () => {
        setLoading(true);
        const query = `startDate=${startDate}&endDate=${endDate}`;

        // Main Admin Analytics
        fetch(`${VITE_BACKEND_URL}/api/v1/admin/analytics?${query}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        })
            .then((res) => res.json())
            .then((json) => {
                if (json.success) setData(json.data);
                else setData(null);
            })
            .catch(() => toast.error("Failed to load analytics"))
            .finally(() => setLoading(false));

        // District Analytics
        fetch(`${VITE_BACKEND_URL}/api/v1/analytics/districts?${query}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        })
            .then((res) => res.json())
            .then((json) => {
                if (json.success) setDistricts(json.districts || []);
            })
            .catch(() => { });
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const timeSeriesData = useMemo(() => {
        if (!data?.reportedOverTime && !data?.resolvedOverTime) return [];

        const map = new Map();
        data.reportedOverTime?.forEach((item: any) => {
            map.set(item._id, { date: item._id, reported: item.count, resolved: 0 });
        });

        data.resolvedOverTime?.forEach((item: any) => {
            if (map.has(item._id)) {
                map.get(item._id).resolved = item.count;
            } else {
                map.set(item._id, { date: item._id, reported: 0, resolved: item.count });
            }
        });

        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [data]);

    if (loading && !data) return <div className="flex justify-center p-8"><Player autoplay loop animationData={starloader} style={{ height: 100, width: 100 }} /></div>;

    return (
        <div className="space-y-6 mt-6 p-2">
            {/* Filter Controls */}
            <Card className="border-none shadow-sm bg-slate-50/50">
                <CardContent className="p-4 flex flex-col md:flex-row items-end gap-4">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> End Date</label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white" />
                    </div>
                    <Button onClick={fetchAnalytics} className="bg-sky-600 hover:bg-sky-700 h-10 px-6 gap-2">
                        <Filter className="h-4 w-4" /> Apply Filters
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Time Series Chart */}
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>System Performance: Reported vs Resolved</CardTitle>
                        <Button variant="ghost" size="sm" className="text-slate-400" onClick={() => toast("Exporting data...")}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    <Area name="Reported" type="monotone" dataKey="reported" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorReported)" />
                                    <Area name="Resolved" type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <DepartmentResponseTimeChart />
                <WorkerPerformanceChart />

                <Card>
                    <CardHeader><CardTitle>Issues by Status</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data?.byStatus || []}
                                        dataKey="count"
                                        nameKey="_id"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        fill="#8884d8"
                                        innerRadius={60}
                                        paddingAngle={5}
                                        label
                                    >
                                        {data?.byStatus?.map((_entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Issues by Category</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.byCategory || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="_id" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader><CardTitle className="text-sky-700">District Governance Overview</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={districts} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="_id"
                                        label={{ value: 'Districts', position: 'insideBottom', offset: -45 }}
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis label={{ value: 'Issues', angle: -90, position: 'insideLeft' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    <Bar name="Total Issues" dataKey="totalIssues" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                    <Bar name="Resolved" dataKey="resolvedIssues" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {districts?.map((d: any) => (
                                <div key={d._id} className="p-4 bg-white dark:bg-slate-800 border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{d._id || "Unassigned"}</p>
                                    <p className="text-2xl font-black text-[#0577b7] dark:text-sky-400">{d.totalIssues}</p>
                                    <div className="mt-2 text-[10px] space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Resolved</span>
                                            <span className="text-emerald-600 font-bold bg-emerald-50 px-1 rounded">{d.resolvedIssues}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Priority Avg</span>
                                            <span className="text-orange-600 font-bold bg-orange-50 px-1 rounded">{Math.round(d.avgPriorityScore || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Top Location Hotspots</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data?.hotspots?.map((h: any, idx: number) => (
                                <div key={h._id || idx} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded">
                                    <span className="text-sm truncate mr-2">{h._id || "Unknown Location"}</span>
                                    <span className="font-bold text-red-600 px-2 py-1 bg-red-200 rounded-full text-xs whitespace-nowrap">{h.count} Issues</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
