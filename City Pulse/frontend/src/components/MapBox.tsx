import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapComponentProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat: number;
  initialLng: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ onLocationSelect, initialLat, initialLng }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: [initialLng, initialLat],
      zoom: 12,
    });

    mapRef.current.on("mouseenter", () => {
      mapRef.current!.getCanvas().style.cursor = "crosshair";
    });
    mapRef.current.on("mouseleave", () => {
      mapRef.current!.getCanvas().style.cursor = "";
    });

    mapRef.current.on("load", () => {
      if (!mapRef.current) return;
      markerRef.current = new maplibregl.Marker({ draggable: true })
        .setLngLat([initialLng, initialLat])
        .addTo(mapRef.current);

      markerRef.current.on("dragstart", () => {
        if (mapRef.current) mapRef.current.getCanvas().style.cursor = "grabbing";
      });

      markerRef.current.on("dragend", async () => {
        if (mapRef.current) mapRef.current.getCanvas().style.cursor = "crosshair";
        const lngLat = markerRef.current!.getLngLat();
        const address = await reverseGeocode(lngLat.lng, lngLat.lat);
        onLocationSelect(lngLat.lat, lngLat.lng, address);
      });
    });

    mapRef.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new maplibregl.Marker({ draggable: true })
          .setLngLat([lng, lat])
          .addTo(mapRef.current!);
      }
      const address = await reverseGeocode(lng, lat);
      onLocationSelect(lat, lng, address);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [initialLat, initialLng, onLocationSelect]);

  async function reverseGeocode(lng: number, lat: number) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
};

export default MapComponent;
