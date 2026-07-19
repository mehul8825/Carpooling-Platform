"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom markers using MapPin SVG
const pickupIcon = L.divIcon({
  html: `<div style="color: #10b981; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.4));">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const dropoffIcon = L.divIcon({
  html: `<div style="color: #3b82f6; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.4));">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
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

  const defaultCenter: [number, number] = [23.0225, 72.5714]; // Ahmedabad, Gujarat as default

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
        .leaflet-container.crosshair-cursor-enabled,
        .leaflet-container.crosshair-cursor-enabled .leaflet-interactive,
        .leaflet-container.crosshair-cursor-enabled .leaflet-grab {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>') 12 24, crosshair !important;
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
          <Marker position={[pickupLat, pickupLng]} icon={pickupIcon}>
            <Popup>Pickup Location</Popup>
          </Marker>
        )}

        {dropLat && dropLng && (
          <Marker position={[dropLat, dropLng]} icon={dropoffIcon}>
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
