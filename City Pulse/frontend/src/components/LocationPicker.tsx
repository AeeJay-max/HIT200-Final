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
    if (map.current) return;

    const reverseGeocode = async (lat: number, lng: number) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        return data.display_name;
      } catch (error) {
        console.error("Geocoding failed", error);
        return "";
      }
    };

    const initMap = async (lng: number, lat: number, isAutoDetected = false) => {
      if (map.current) return;

      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
        center: [lng, lat],
        zoom: 12,
      });

      marker.current = new maplibregl.Marker({ draggable: true })
        .setLngLat([lng, lat])
        .addTo(map.current);

      if (isAutoDetected) {
        const address = await reverseGeocode(lat, lng);
        onChange({ latitude: lat, longitude: lng, address });
      }

      marker.current.on("dragend", async () => {
        const lngLat = marker.current!.getLngLat();
        const address = await reverseGeocode(lngLat.lat, lngLat.lng);
        onChange({ latitude: lngLat.lat, longitude: lngLat.lng, address });
      });

      map.current.on("click", async (e) => {
        marker.current!.setLngLat(e.lngLat);
        const address = await reverseGeocode(e.lngLat.lat, e.lngLat.lng);
        onChange({ latitude: e.lngLat.lat, longitude: e.lngLat.lng, address });
      });
    };

    if (location && location.latitude && location.longitude) {
      initMap(location.longitude, location.latitude);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            initMap(position.coords.longitude, position.coords.latitude, true);
          },
          () => {
            initMap(-74.006, 40.7128); // Fallback to NYC
          },
          { enableHighAccuracy: true }
        );
      } else {
        initMap(-74.006, 40.7128);
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
