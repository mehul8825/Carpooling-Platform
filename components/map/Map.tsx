"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon issue with Webpack
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

interface MapProps {
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;
  routePath?: [number, number][];
  onMapClick?: (lat: number, lng: number) => void;
  isSelectingLocation?: boolean;
}

function ClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function MapUpdater({ pickupLat, pickupLng, dropLat, dropLng }: MapProps) {
  const map = useMap();

  useEffect(() => {
    if (pickupLat && pickupLng && dropLat && dropLng) {
      const bounds = L.latLngBounds(
        [pickupLat, pickupLng],
        [dropLat, dropLng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickupLat && pickupLng) {
      map.setView([pickupLat, pickupLng], 14);
    }
  }, [map, pickupLat, pickupLng, dropLat, dropLng]);

  return null;
}

export default function Map({ pickupLat, pickupLng, dropLat, dropLng, routePath, onMapClick, isSelectingLocation }: MapProps) {
  const [mounted, setMounted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[400px] w-full bg-gray-100 rounded-md flex items-center justify-center">Loading Map...</div>;
  }

  const defaultCenter: [number, number] = [28.6139, 77.2090]; // New Delhi as default

  return (
    <div className={isFullScreen ? "fixed inset-0 z-50 h-screen w-screen bg-white" : "h-[400px] w-full rounded-md overflow-hidden relative z-0"}>
      <Button 
        variant="secondary" 
        size="icon" 
        className="absolute top-2 right-2 z-[400] bg-white/90 hover:bg-white shadow-sm"
        onClick={() => setIsFullScreen(!isFullScreen)}
      >
        {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>

      <style jsx global>{`
        .leaflet-container.crosshair-cursor-enabled {
          cursor: crosshair !important;
        }
        .leaflet-container.crosshair-cursor-enabled .leaflet-interactive {
          cursor: crosshair !important;
        }
      `}</style>

      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        className={`h-full w-full z-0 ${isSelectingLocation ? 'crosshair-cursor-enabled' : ''}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ClickHandler onMapClick={onMapClick} />

        {pickupLat && pickupLng && (
          <Marker position={[pickupLat, pickupLng]} icon={icon}>
            <Popup>Pickup Location</Popup>
          </Marker>
        )}

        {dropLat && dropLng && (
          <Marker position={[dropLat, dropLng]} icon={icon}>
            <Popup>Drop-off Location</Popup>
          </Marker>
        )}

        {routePath && routePath.length > 0 && (
          <Polyline positions={routePath} color="#2563eb" weight={5} opacity={0.8} />
        )}

        <MapUpdater pickupLat={pickupLat} pickupLng={pickupLng} dropLat={dropLat} dropLng={dropLng} />
      </MapContainer>
    </div>
  );
}
