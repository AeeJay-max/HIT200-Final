import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { VITE_BACKEND_URL } from "../config/config";
import { Button } from "./ui/button";
import { Loader2, Zap } from "lucide-react";

interface Issue {
    _id: string;
    title: string;
    location: { latitude: number; longitude: number; address: string };
    status: string;
    type: string;
}

interface IssueMapViewProps {
    issues: Issue[];
}

const IssueMapView: React.FC<IssueMapViewProps> = ({ issues }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const [userLocation, setUserLocation] = useState<[number, number]>([31.0530, -17.8248]);

    // GEO-ANALYTICS STATE
    const [radiusMode, setRadiusMode] = useState(false);
    const [radiusCenter, setRadiusCenter] = useState<[number, number] | null>(null);
    const [hotspots, setHotspots] = useState<any[]>([]);
    const [loadingHotspots, setLoadingHotspots] = useState(false);

    const fetchHotspots = async (lng: number, lat: number) => {
        setLoadingHotspots(true);
        try {
            const response = await fetch(`${VITE_BACKEND_URL}/api/v1/admin/analytics/radius`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
                },
                body: JSON.stringify({ lat, lng, radiusKm: 5 }),
            });
            const data = await response.json();
            if (data.success) {
                setHotspots(data.hotspots);
            }
        } catch (err) {
            console.error("Hotspot error", err);
        } finally {
            setLoadingHotspots(false);
        }
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.longitude, position.coords.latitude]);
                },
                (error) => console.warn("Geolocation denied or error", error),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    useEffect(() => {
        if (!mapContainer.current) return;

        if (!mapRef.current) {
            mapRef.current = new maplibregl.Map({
                container: mapContainer.current,
                style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
                center: userLocation,
                zoom: 11,
            });

            mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
        } else {
            if (!radiusMode) mapRef.current.setCenter(userLocation);
        }

        const map = mapRef.current;

        const handleMapClick = (e: maplibregl.MapMouseEvent) => {
            if (!radiusMode) return;
            setRadiusCenter([e.lngLat.lng, e.lngLat.lat]);
            fetchHotspots(e.lngLat.lng, e.lngLat.lat);
        };

        map.on('click', handleMapClick);

        return () => {
            map.off('click', handleMapClick);
        }
    }, [userLocation, radiusMode]);

    useEffect(() => {
        if (!mapRef.current) return;

        // Clear old markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        if (mapRef.current.getSource("scan-radius")) {
            mapRef.current.removeLayer("scan-radius-fill");
            mapRef.current.removeLayer("scan-radius-outline");
            mapRef.current.removeSource("scan-radius");
        }

        if (radiusMode && radiusCenter) {
            // Display Hotspots
            hotspots.forEach(hotspot => {
                const el = document.createElement('div');
                el.className = 'w-8 h-8 rounded-full bg-red-500/80 border-2 border-white flex items-center justify-center font-bold text-white text-xs shadow-lg animate-pulse';
                el.innerText = hotspot.count.toString();

                const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
                    `<strong>🚨 Recurrence Cluster</strong><br/>
                     ${hotspot.count} issues reported here<br/>
                     Type: ${hotspot._id.issueType}`
                );

                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat([hotspot._id.lng, hotspot._id.lat])
                    .setPopup(popup)
                    .addTo(mapRef.current!);

                markersRef.current.push(marker);
            });

            // Draw a rough circle polygon for 5km visually (using a pure geojson approx)
            import("@turf/circle").then(({ default: turfCircle }) => {
                const circleGeojson = turfCircle(radiusCenter, 5, { units: 'kilometers' });

                if (!mapRef.current!.getSource("scan-radius")) {
                    mapRef.current!.addSource("scan-radius", {
                        type: "geojson",
                        data: circleGeojson
                    });
                    mapRef.current!.addLayer({
                        id: "scan-radius-fill",
                        type: "fill",
                        source: "scan-radius",
                        paint: { "fill-color": "#ef4444", "fill-opacity": 0.1 }
                    });
                    mapRef.current!.addLayer({
                        id: "scan-radius-outline",
                        type: "line",
                        source: "scan-radius",
                        paint: { "line-color": "#ef4444", "line-width": 2, "line-dasharray": [2, 2] }
                    });
                }
            });

        } else {
            // Add normal issues
            issues.forEach(issue => {
                let color = "#3b82f6";
                if (issue.status === "Resolved" || issue.status === "Resolved (Unverified)" || issue.status === "Closed") color = "#22c55e";
                else if (issue.status === "Rejected") color = "#ef4444";
                else if (issue.status === "Pending") color = "#f59e0b";
                else if (issue.status === "In Progress" || issue.status === "Worker Assigned") color = "#3b82f6";
                else if (issue.status === "Reported") color = "#a855f7";

                if (issue.location && typeof issue.location.longitude === "number" && typeof issue.location.latitude === "number") {
                    const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
                        `<strong>${issue.title}</strong><br/>
               Status: <em>${issue.status}</em><br/>
               Type: ${issue.type}`
                    );

                    const marker = new maplibregl.Marker({ color })
                        .setLngLat([issue.location.longitude, issue.location.latitude])
                        .setPopup(popup)
                        .addTo(mapRef.current!);

                    markersRef.current.push(marker);
                }
            });
        }

    }, [issues, radiusMode, radiusCenter, hotspots]);

    const totalIssuesInRadius = hotspots.reduce((acc: number, h: any) => acc + (h.count || 0), 0);
    const majorityIssue = hotspots.length > 0
        ? hotspots.reduce((prev: any, current: any) => (prev.count > current.count ? prev : current))._id.issueType
        : "N/A";

    return (
        <div className="relative w-full h-[600px] border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            {/* Overlay Controls */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-100 max-w-sm">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center"><Zap className="w-4 h-4 mr-2 text-rose-500" /> Intelligence Overlay</h3>
                <p className="text-xs text-slate-500 mb-4">Toggle Geographic Radius Analytics to scan for severe infrastructure failure clusters within a 5km perimeter.</p>
                <Button
                    variant={radiusMode ? "destructive" : "default"}
                    className={`w-full ${radiusMode ? '' : 'bg-slate-800'}`}
                    onClick={() => {
                        setRadiusMode(!radiusMode);
                        setRadiusCenter(null);
                        setHotspots([]);
                    }}
                >
                    {loadingHotspots && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {radiusMode ? "Disable 5km Scanner" : "Activate 5km Scanner"}
                </Button>
                {radiusMode && !radiusCenter && (
                    <p className="text-xs font-semibold text-rose-600 mt-3 animate-pulse text-center">Click anywhere on the map to set scan perimeter!</p>
                )}
                {radiusMode && radiusCenter && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs shadow-sm">
                        <span className="font-bold block text-slate-800 mb-2 border-b pb-1">5km Radius Scan Results</span>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-600">Total Issues:</span>
                            <span className="font-semibold text-rose-600">{totalIssuesInRadius}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-600">Majority Issue:</span>
                            <span className="font-semibold text-slate-800">{majorityIssue}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-600">Dense Clusters:</span>
                            <span className="font-semibold text-slate-800">{hotspots.length}</span>
                        </div>

                        {hotspots.length > 0 && (
                            <div className="mt-2 text-[10px] space-y-1 border-t border-slate-200 pt-2 max-h-24 overflow-y-auto pr-1">
                                {hotspots.map((h, i) => (
                                    <div key={i} className="flex justify-between text-slate-500 bg-white p-1 rounded border border-slate-100">
                                        <span className="truncate w-3/4" title={h._id.issueType}>{h._id.issueType}</span>
                                        <span className="font-bold text-slate-700">{h.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div ref={mapContainer} className="w-full h-full" />
        </div>
    );
};

export default IssueMapView;
