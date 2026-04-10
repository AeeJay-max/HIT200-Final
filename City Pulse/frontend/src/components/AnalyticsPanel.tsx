import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { VITE_BACKEND_URL } from "../config/config";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Player from "lottie-react";
import starloader from "../assets/animations/starloder.json";
import RadiusSelector from "./RadiusSelector";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";

const AnalyticsPanel = React.memo(function AnalyticsPanel() {
    const token = localStorage.getItem("auth_token");
    const [radiusPayload, setRadiusPayload] = useState<any>(null);

    const { data: deptPerf } = useQuery({
        queryKey: ["department-performance"],
        queryFn: async () => {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/analytics/department-performance`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json();
            return d.data || [];
        }
    });

    const { data: transparency } = useQuery({
        queryKey: ["public-transparency"],
        queryFn: async () => {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/analytics/transparency`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json();
            return d.data || null;
        }
    });

    const { data: radiusData, isLoading: radiusLoading } = useQuery({
        queryKey: ["radius-analytics", radiusPayload],
        queryFn: async () => {
            if (!radiusPayload) return null;
            const queryParams = new URLSearchParams({
                lat: radiusPayload.centerLatitude,
                lng: radiusPayload.centerLongitude,
                radius: radiusPayload.radiusKm,
            });
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/analytics/radius?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json();
            return d.data || [];
        },
        enabled: !!radiusPayload
    });

    const { data: escalationsData } = useQuery({
        queryKey: ["escalations"],
        queryFn: async () => {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/analytics/escalations`, { headers: { Authorization: `Bearer ${token}` } });
            const d = await res.json();
            return d.escalations || [];
        }
    });

    const { data: workerPerf } = useQuery({
        queryKey: ["worker-perf"],
        queryFn: async () => {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/analytics/worker-performance`, { headers: { Authorization: `Bearer ${token}` } });
            const d = await res.json();
            // Map workerName to a shorter string if needed or just use it
            return d.performance || [];
        }
    });

    const { data: districtPerf } = useQuery({
        queryKey: ["district-perf"],
        queryFn: async () => {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/analytics/district-performance`, { headers: { Authorization: `Bearer ${token}` } });
            const d = await res.json();
            return d.performance || [];
        }
    });

    return (
        <div className="space-y-6 mt-6 p-2">
            <RadiusSelector onSearch={setRadiusPayload} />

            {radiusLoading && <div className="flex justify-center p-4">Loading Zone Data...</div>}

            {radiusData && radiusData.length > 0 && (
                <Card className="border-blue-200 shadow-md">
                    <CardHeader className="bg-blue-50">
                        <CardTitle className="text-blue-800">Intelligence Zone Hotspots</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="mb-4 text-gray-700">Found clusters inside the selected {radiusPayload.radiusKm}km radius.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {radiusData.map((cluster: any, idx: number) => (
                                <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded flex items-center justify-between">
                                    <span className="font-medium truncate mr-2">{cluster._id}</span>
                                    <span className="font-bold text-red-600 px-2 py-1 bg-red-100 rounded-full text-xs">{cluster.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Department Response Times (Hours)</CardTitle></CardHeader>
                    <CardContent className="h-80">
                        {deptPerf ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={deptPerf} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="_id" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="avgResolutionTime" fill="#3b82f6" name="Avg Time (hrs)" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <Player autoplay loop animationData={starloader} style={{ height: 100 }} />}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>SLA Overview (Timeline Violations)</CardTitle></CardHeader>
                    <CardContent className="h-80 flex justify-center items-center">
                        {transparency ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: "On Time", value: transparency.totalIssues - transparency.overdueIssuesCount },
                                            { name: "Overdue", value: transparency.overdueIssuesCount }
                                        ]}
                                        cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <Player autoplay loop animationData={starloader} style={{ height: 100 }} />}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle> Escalations (Priority Levels) </CardTitle></CardHeader>
                    <CardContent className="h-80 flex justify-center items-center">
                        {escalationsData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={escalationsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="_id" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#ef4444" name="Escalated Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <Player autoplay loop animationData={starloader} style={{ height: 100 }} />}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle> Worker Performance Metrics </CardTitle></CardHeader>
                    <CardContent className="h-80 flex justify-center items-center">
                        {workerPerf ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={workerPerf} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="workerName" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="performanceRatingScore" fill="#8b5cf6" name="Performance Score" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <Player autoplay loop animationData={starloader} style={{ height: 100 }} />}
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2">
                    <CardHeader><CardTitle> District Governance Snapshot </CardTitle></CardHeader>
                    <CardContent className="h-[400px] flex justify-center items-center">
                        {districtPerf ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={districtPerf} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="_id" type="category" width={150} tickFormatter={(tick) => tick.length > 20 ? tick.substring(0, 20) + "..." : tick} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="issuesPerDistrict" fill="#f59e0b" name="Issues" />
                                    <Bar dataKey="overduePercentage" fill="#dc2626" name="% Overdue" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <Player autoplay loop animationData={starloader} style={{ height: 100 }} />}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
});

export default AnalyticsPanel;
