import { useEffect, useState } from "react";
import { VITE_BACKEND_URL } from "../config/config";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import Player from "lottie-react";
import starloader from "../assets/animations/starloder.json";
import DepartmentResponseTimeChart from "./DepartmentResponseTimeChart";
import WorkerPerformanceChart from "./WorkerPerformanceChart";

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
                    <div className="space-y-4">
                        {data.byStatus?.map((s: any) => (
                            <div key={s._id} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                                <span className="font-medium text-gray-700">{s._id}</span>
                                <span className="text-xl font-bold text-blue-600">{s.count}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Issues by Category</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.byCategory?.map((c: any) => (
                            <div key={c._id} className="flex flex-col gap-1">
                                <div className="flex justify-between text-sm font-medium text-gray-600">
                                    <span>{c._id}</span>
                                    <span>{c.count}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${Math.min((c.count / data.totalIssues) * 100, 100)}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader><CardTitle className="text-sky-700">District Governance Overview</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {districts?.map((d: any) => (
                            <div key={d._id} className="p-4 bg-white border rounded-xl shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase">{d._id || "Unassigned"}</p>
                                <p className="text-2xl font-black text-[#0577b7]">{d.totalIssues}</p>
                                <div className="mt-2 text-[10px] space-y-1">
                                    <div className="flex justify-between">
                                        <span>Resolved</span>
                                        <span className="text-emerald-600 font-bold">{d.resolvedIssues}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Priority Avg</span>
                                        <span className="text-orange-600 font-bold">{Math.round(d.avgPriorityScore || 0)}</span>
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
