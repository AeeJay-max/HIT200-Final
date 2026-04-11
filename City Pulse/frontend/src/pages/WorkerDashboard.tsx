import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { MapPin, CheckCircle } from "lucide-react";
import { VITE_BACKEND_URL } from "../config/config";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import { toast } from "sonner";



interface AssignedIssue {
    _id: string;
    title: string;
    description: string;
    location: { latitude: number; longitude: number; address: string };
    status: string;
}

const WorkerDashboard = () => {
    const [issues, setIssues] = workerIssuesState();
    const [loading, setLoading] = useState(true);
    const [workerLocation, setWorkerLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [activeIssue, setActiveIssue] = useState<AssignedIssue | null>(null);
    const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        fetchIssues();
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (pos) => setWorkerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.error("GPS Error", err),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    const fetchIssues = async () => {
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/worker/issues`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
            });
            const data = await res.json();
            if (data.success) {
                setIssues(data.issues.filter((i: any) => i.status === "Worker Assigned" || i.status === "ASSIGNED_TO_WORKER" || i.status === "WORKER_ACCEPTED" || i.status === "In Progress" || i.status === "IN_PROGRESS"));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getRoute = async (issue: AssignedIssue) => {
        if (!workerLocation) {
            toast.error("Waiting for GPS signal...");
            return;
        }
        setActiveIssue(issue);

        try {
            // Utilize OSRM Open Routing API mapping seamlessly
            const query = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${workerLocation.lng},${workerLocation.lat};${issue.location.longitude},${issue.location.latitude}?overview=full&geometries=geojson`
            );
            const data = await query.json();
            if (!data.routes || !data.routes.length) return;

            const route = data.routes[0];
            setRouteInfo({
                distance: (route.distance / 1000).toFixed(2) + " km",
                duration: Math.ceil(route.duration / 60) + " mins",
            });

            if (mapRef.current) {
                const geojson = {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "LineString",
                        coordinates: route.geometry.coordinates,
                    },
                };

                if (mapRef.current.getSource("route")) {
                    (mapRef.current.getSource("route") as any).setData(geojson);
                } else {
                    mapRef.current.addSource("route", {
                        type: "geojson",
                        data: geojson as any,
                    });
                    mapRef.current.addLayer({
                        id: "route",
                        type: "line",
                        source: "route",
                        layout: { "line-join": "round", "line-cap": "round" },
                        paint: { "line-color": "#3887be", "line-width": 5, "line-opacity": 0.75 },
                    });
                }

                mapRef.current.flyTo({ center: [issue.location.longitude, issue.location.latitude], zoom: 14 });
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Worker cannot deny assigned issues, removing acceptance workflow
    useEffect(() => {
        if (!mapContainer.current || !workerLocation) return;

        if (mapRef.current) {
            mapRef.current.setCenter([workerLocation.lng, workerLocation.lat]);
            return;
        }

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
            center: [workerLocation.lng, workerLocation.lat],
            zoom: 12,
        });

        mapRef.current = map;

        new maplibregl.Marker({ color: 'green' })
            .setLngLat([workerLocation.lng, workerLocation.lat])
            .addTo(map);
    }, [workerLocation]);

    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    const markResolved = async (id: string) => {
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/worker/issues/${id}/resolve`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
            });
            if (res.ok) {
                toast.success("Issue Resolved pending Admin Verification");
                setIssues(issues.filter(i => i._id !== id));
                setActiveIssue(null);
                if (mapRef.current && mapRef.current.getSource("route")) {
                    (mapRef.current.getSource("route") as any).setData({ type: "FeatureCollection", features: [] });
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <HeaderAfterAuth />
            <div className="container mx-auto px-4 py-24">
                <h1 className="text-3xl font-bold text-slate-800 mb-6">Field Worker Dashboard</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold">Assigned Issues</h2>
                        {loading ? <p>Loading...</p> : issues.length === 0 ? <p>No pending assignments.</p> : issues.map(issue => (
                            <Card key={issue._id} className={`cursor-pointer transition-all ${activeIssue?._id === issue._id ? 'border-blue-500 shadow-md' : ''}`} onClick={() => getRoute(issue)}>
                                <CardHeader className="pb-2 text-sm">
                                    <CardTitle className="text-lg">{issue.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 truncate">{issue.description}</p>
                                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><MapPin size={12} /> {issue.location.address}</p>
                                    <div className="mt-3 flex gap-2">
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 text-xs font-semibold" onClick={(e) => { e.stopPropagation(); getRoute(issue); }}>Navigate to Issue</Button>
                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs font-semibold" onClick={(e) => { e.stopPropagation(); markResolved(issue._id); }}>Completed</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="lg:col-span-2">
                        <Card className="h-[60vh] relative overflow-hidden">
                            <div ref={mapContainer} className="w-full h-full" />
                            {routeInfo && activeIssue && (
                                <div className="absolute top-4 right-4 bg-white p-4 rounded-xl shadow-lg border border-slate-100 min-w-48">
                                    <h3 className="font-bold text-slate-800 mb-2">Navigation</h3>
                                    <div className="flex justify-between mb-1"><span className="text-sm text-slate-500">Distance:</span><span className="font-semibold">{routeInfo.distance}</span></div>
                                    <div className="flex justify-between mb-4"><span className="text-sm text-slate-500">Travel Time:</span><span className="font-semibold">{routeInfo.duration}</span></div>
                                    <Button onClick={() => markResolved(activeIssue._id)} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                        <CheckCircle className="mr-2 h-4 w-4" /> Mark Resolved
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Polyfill hook logic for brevity
function workerIssuesState() {
    return useState<AssignedIssue[]>([]);
}

export default WorkerDashboard;
