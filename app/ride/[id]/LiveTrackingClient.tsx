"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Loader2, Navigation, MapPin, CheckCircle, Car, Users } from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/BackButton";

const carIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", // We'll just use default marker for now, tinted conceptually
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export function LiveTrackingClient({ ride, currentUserId, isDriver }: any) {
  const { socket } = useSocket(currentUserId);
  const [liveLocation, setLiveLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!socket || !ride.id || ride.status !== "ONGOING") return;

    socket.emit("join_ride_room", ride.id);

    if (!isDriver) {
      const handleLocationUpdate = (data: { rideId: string, lat: number, lng: number }) => {
        if (data.rideId === ride.id) {
          setLiveLocation({ lat: data.lat, lng: data.lng });
        }
      };
      
      socket.on("ride_location_updated", handleLocationUpdate);
      return () => {
        socket.off("ride_location_updated", handleLocationUpdate);
      };
    }
  }, [socket, ride.id, isDriver]);

  const startSharingLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    toast.success("Started sharing live location!");
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLiveLocation({ lat: latitude, lng: longitude });
        
        if (socket) {
          socket.emit("update_ride_location", { 
            rideId: ride.id, 
            lat: latitude, 
            lng: longitude 
          });
        }
      },
      (error) => {
        toast.error("Unable to retrieve your location");
        console.error(error);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
    setWatchId(id);
  };

  const stopSharingLocation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    toast.info("Stopped sharing location");
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  if (!mounted) return <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-xl animate-pulse">Loading map...</div>;

  const center: [number, number] = liveLocation 
    ? [liveLocation.lat, liveLocation.lng] 
    : [ride.pickupLat, ride.pickupLng];

  return (
    <div className="space-y-6">
      <BackButton title="Back" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Navigation className="text-blue-600" />
            Live Ride Tracking
          </h2>
          <p className="text-muted-foreground mt-1">
            {ride.pickupLocation} → {ride.dropLocation}
          </p>
        </div>

        {isDriver && (
          <div className="flex gap-2 w-full md:w-auto">
            {ride.status !== "ONGOING" ? (
              <Button disabled className="w-full md:w-auto bg-slate-300">
                <Navigation className="w-4 h-4 mr-2" /> Waiting for Passengers...
              </Button>
            ) : !isTracking ? (
              <Button onClick={startSharingLocation} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                <Navigation className="w-4 h-4 mr-2" /> Start Driving & Share Location
              </Button>
            ) : (
              <Button onClick={stopSharingLocation} variant="destructive" className="w-full md:w-auto">
                <CheckCircle className="w-4 h-4 mr-2" /> End Trip / Stop Sharing
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 overflow-hidden shadow-sm border-slate-200">
          <div className="h-[500px] w-full relative z-0">
            <MapContainer center={center} zoom={14} className="h-full w-full z-0">
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <Marker position={[ride.pickupLat, ride.pickupLng]}>
                <Popup>Pickup: {ride.pickupLocation}</Popup>
              </Marker>
              
              <Marker position={[ride.dropLat, ride.dropLng]}>
                <Popup>Drop-off: {ride.dropLocation}</Popup>
              </Marker>

              {liveLocation && (
                <Marker position={[liveLocation.lat, liveLocation.lng]} icon={carIcon}>
                  <Popup className="font-semibold text-blue-600">
                    <div className="flex items-center gap-1"><Car className="w-4 h-4" /> Live Location</div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </Card>

        <Card className="shadow-sm border-slate-200 h-fit">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" /> Passengers ({ride.bookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {ride.bookings.length === 0 ? (
                <p className="text-sm text-slate-500 p-4 text-center">No passengers yet.</p>
              ) : (
                ride.bookings.map((b: any) => (
                  <div key={b.id} className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {b.passenger.name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{b.passenger.name}</p>
                      <p className="text-xs text-slate-500">{b.seatsBooked} seat(s)</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Driver Details</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                  {ride.driver.name?.[0] || "?"}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{ride.driver.name}</p>
                  <p className="text-xs text-slate-600">{ride.vehicle.vehicleModel} ({ride.vehicle.registrationNo})</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
