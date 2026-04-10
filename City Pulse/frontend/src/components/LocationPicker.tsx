import React, { useEffect, useRef } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationPickerProps {
  location: Location | null;
  onChange: (location: Location) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ location, onChange }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    const reverseGeocode = async (lng: number, lat: number) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        return data.display_name || "";
      } catch (error) {
        console.error("Reverse geocoding failed:", error);
        return "";
      }
    };

    const initMap = async (lng: number, lat: number) => {
      if (map.current) return;
      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
        center: [lng, lat],
        zoom: 14,
      });

      marker.current = new maplibregl.Marker({ draggable: true })
        .setLngLat([lng, lat])
        .addTo(map.current);

      const address = await reverseGeocode(lng, lat);
      onChange({ latitude: lat, longitude: lng, address });

      marker.current.on("dragend", async () => {
        const lngLat = marker.current!.getLngLat();
        const addr = await reverseGeocode(lngLat.lng, lngLat.lat);
        onChange({ latitude: lngLat.lat, longitude: lngLat.lng, address: addr });
      });

      map.current.on("click", async (e) => {
        marker.current!.setLngLat(e.lngLat);
        const addr = await reverseGeocode(e.lngLat.lng, e.lngLat.lat);
        onChange({ latitude: e.lngLat.lat, longitude: e.lngLat.lng, address: addr });
      });
    };

    if (location && location.latitude && location.longitude) {
      initMap(location.longitude, location.latitude);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            initMap(position.coords.longitude, position.coords.latitude);
          },
          () => {
            initMap(31.0333, -17.8252); // Default to Harare, Zimbabwe center
          },
          { enableHighAccuracy: true }
        );
      } else {
        initMap(31.0333, -17.8252);
      }
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [location, onChange]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "300px",
        borderRadius: 8,
        overflow: "hidden",
      }}
    />
  );
};

export default LocationPicker;
