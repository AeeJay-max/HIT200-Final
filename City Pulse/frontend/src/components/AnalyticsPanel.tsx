import { useEffect, useState } from "react";
import { VITE_BACKEND_URL } from "../config/config";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import Player from "lottie-react";
import starloader from "../assets/animations/starloder.json";
import DepartmentResponseTimeChart from "./DepartmentResponseTimeChart";
import WorkerPerformanceChart from "./WorkerPerformanceChart";
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const CHART_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#f43f5e'];

export default function AnalyticsPanel() {
    const [data, setData] = useState<any>(null);
    const [districts, setDistricts] = useState<any[]>([]);

    useEffect(() => {
        // Main Admin Analytics
        fetch(`${VITE_BACKEND_URL}/api/v1/admin/analytics`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        })
            .then((res) => res.json())
            .then((json) => {
                if (json.success) setData(json.data);
                else setData(null);
            })
            .catch(() => toast.error("Failed to load analytics"));

        // District Analytics
        fetch(`${VITE_BACKEND_URL}/api/v1/analytics/districts`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        })
            .then((res) => res.json())
            .then((json) => {
                if (json.success) setDistricts(json.districts || []);
            })
            .catch(() => { });
    }, []);

    if (!data) return <div className="flex justify-center p-8"><Player autoplay loop animationData={starloader} style={{ height: 100, width: 100 }} /></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 p-2">
            <DepartmentResponseTimeChart />
            <WorkerPerformanceChart />
            <Card>
                <CardHeader><CardTitle>Issues by Status</CardTitle></CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.byStatus}
                                    dataKey="count"
                                    nameKey="_id"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    fill="#8884d8"
                                    label
                                >
                                    {data.byStatus?.map((entry: any, index: number) => (
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
                            <BarChart data={data.byCategory} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="_id" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                                <YAxis />
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
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="_id"
                                    label={{ value: 'Districts', position: 'insideBottom', offset: -45 }}
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                />
                                <YAxis label={{ value: 'Issues', angle: -90, position: 'insideLeft' }} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                <Legend verticalAlign="top" height={36} />
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
                        {data.hotspots?.map((h: any, idx: number) => (
                            <div key={h._id || idx} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded">
                                <span className="text-sm truncate mr-2">{h._id || "Unknown Location"}</span>
                                <span className="font-bold text-red-600 px-2 py-1 bg-red-200 rounded-full text-xs whitespace-nowrap">{h.count} Issues</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
