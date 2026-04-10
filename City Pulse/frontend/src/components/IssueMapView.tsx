import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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
    const [userLocation, setUserLocation] = useState<[number, number]>([31.0530, -17.8248]); // Default Harare

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
            // Update center if it was dynamically fetched later and map already exists
            mapRef.current.setCenter(userLocation);
        }

        // Use standard GeoJSON native clustering for high density resolution
        const features = issues.map(issue => {
            let color = "#3b82f6"; // blue
            if (issue.status === "Resolved") color = "#22c55e"; // green
            else if (issue.status === "Rejected") color = "#ef4444"; // red
            else if (issue.status === "Pending") color = "#f59e0b"; // yellow
            else if (issue.status === "In Progress") color = "#3b82f6"; // blue
            else if (issue.status === "Reported") color = "#a855f7"; // purple

            return {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [issue.location.longitude, issue.location.latitude]
                },
                properties: {
                    id: issue._id,
                    title: issue.title,
                    status: issue.status,
                    type: issue.type,
                    color: color
                }
            };
        });

        const geojsonData = {
            type: "FeatureCollection",
            features: features
        };

        const map = mapRef.current;

        map.on('load', () => {
            if (map.getSource('issues')) {
                (map.getSource('issues') as maplibregl.GeoJSONSource).setData(geojsonData as any);
            } else {
                map.addSource('issues', {
                    type: 'geojson',
                    data: geojsonData as any,
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50
                });

                map.addLayer({
                    id: 'clusters',
                    type: 'circle',
                    source: 'issues',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 50, '#f28cb1'],
                        'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40]
                    }
                });

                map.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'issues',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12
                    }
                });

                map.addLayer({
                    id: 'unclustered-point',
                    type: 'circle',
                    source: 'issues',
                    filter: ['!', ['has', 'point_count']],
                    paint: {
                        'circle-color': ['get', 'color'],
                        'circle-radius': 8,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff'
                    }
                });
            }
        });

        // if already loaded and deps changed
        if (map.isStyleLoaded() && map.getSource('issues')) {
            (map.getSource('issues') as maplibregl.GeoJSONSource).setData(geojsonData as any);
        }

    }, [issues, userLocation]);

    return <div ref={mapContainer} style={{ width: "100%", height: "600px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }} />;
};

export default IssueMapView;
