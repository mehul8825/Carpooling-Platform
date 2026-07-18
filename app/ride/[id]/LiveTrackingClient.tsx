"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Loader2, Navigation, MapPin, CheckCircle, Car, Users, MessageCircle, Phone, PlayCircle, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/BackButton";
import { useRef } from "react";

const carIcon = L.divIcon({
  html: '<div style="background-color: white; border-radius: 50%; padding: 4px; box-shadow: 0 0 10px rgba(0,0,0,0.3); font-size: 20px; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">🚗</div>',
  className: 'custom-car-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const pickupIcon = L.divIcon({
  html: '<div style="background-color: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">A</div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const dropoffIcon = L.divIcon({
  html: '<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">B</div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export function LiveTrackingClient({ ride, currentUserId, isDriver }: any) {
  const { socket } = useSocket(currentUserId);
  const [liveLocation, setLiveLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!socket || !ride.id || ride.status !== "ONGOING") return;

    // Join room initially
    socket.emit("join_ride_room", ride.id);

    // Edge case 1: Handle socket reconnections
    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("join_ride_room", ride.id); // Rejoin room on reconnect
      toast.success("Reconnected to live tracking server");
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      toast.error("Lost connection to tracking server. Attempting to reconnect...");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    const handleLocationUpdate = (data: { rideId: string, lat: number, lng: number }) => {
      if (data.rideId === ride.id) {
        setLiveLocation({ lat: data.lat, lng: data.lng });
      }
    };
    
    // Edge case 2: Listen for location updates if passenger
    if (!isDriver) {
      socket.on("ride_location_updated", handleLocationUpdate);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      if (!isDriver) {
        socket.off("ride_location_updated", handleLocationUpdate);
      }
    };
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
        
        // Edge case 3: Buffer or sync updates when disconnected (for now we just check socket)
        if (socket && socket.connected) {
          socket.emit("update_ride_location", { 
            rideId: ride.id, 
            lat: latitude, 
            lng: longitude 
          });
        }
      },
      (error) => {
        // Edge case 4: Location permissions revoked or GPS signal lost during tracking
        toast.error("GPS signal lost. Please check your device location settings.");
        console.error(error);
        setIsTracking(false);
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          setWatchId(null);
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );
    setWatchId(id);
  };

  const startSimulation = () => {
    setIsSimulating(true);
    setIsTracking(true);
    toast.success("Simulation started!");
    
    const steps = 100;
    let currentStep = 0;
    const startLat = ride.pickupLat;
    const startLng = ride.pickupLng;
    const endLat = ride.dropLat;
    const endLng = ride.dropLng;

    simulationIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep > steps) {
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        setIsSimulating(false);
        setIsTracking(false);
        toast.info("Arrived at destination!");
        return;
      }

      const fraction = currentStep / steps;
      const lat = startLat + (endLat - startLat) * fraction;
      const lng = startLng + (endLng - startLng) * fraction;

      setLiveLocation({ lat, lng });

      if (socket && socket.connected) {
        socket.emit("update_ride_location", { rideId: ride.id, lat, lng });
      }
    }, 1000); // move every 1 second
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    setIsSimulating(false);
    setIsTracking(false);
    toast.info("Simulation stopped");
  };

  const stopSharingLocation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    stopSimulation();
    setIsTracking(false);
    toast.info("Stopped sharing location");
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
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
            {!isConnected && (
              <span className="ml-3 text-xs font-medium px-2.5 py-1 bg-red-100 text-red-700 rounded-full animate-pulse">
                Offline
              </span>
            )}
          </h2>
          <p className="text-muted-foreground mt-1">
            {ride.pickupLocation} → {ride.dropLocation}
          </p>
        </div>

        {isDriver && (
          <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
            {ride.status !== "ONGOING" ? (
              <Button disabled className="w-full md:w-auto bg-slate-300">
                <Navigation className="w-4 h-4 mr-2" /> Waiting for Passengers...
              </Button>
            ) : !isTracking ? (
              <>
                <Button onClick={startSharingLocation} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                  <Navigation className="w-4 h-4 mr-2" /> Share Location
                </Button>
                <Button onClick={startSimulation} variant="outline" className="w-full md:w-auto border-blue-600 text-blue-600 hover:bg-blue-50">
                  <PlayCircle className="w-4 h-4 mr-2" /> Simulate Route
                </Button>
              </>
            ) : (
              <>
                {isSimulating ? (
                  <Button onClick={stopSimulation} variant="destructive" className="w-full md:w-auto">
                    <StopCircle className="w-4 h-4 mr-2" /> Stop Simulation
                  </Button>
                ) : (
                  <Button onClick={stopSharingLocation} variant="destructive" className="w-full md:w-auto">
                    <CheckCircle className="w-4 h-4 mr-2" /> End Trip / Stop Sharing
                  </Button>
                )}
              </>
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
              
              <Polyline 
                positions={[[ride.pickupLat, ride.pickupLng], [ride.dropLat, ride.dropLng]]} 
                color="#3b82f6" 
                weight={4} 
                opacity={0.6} 
                dashArray="8 8" 
              />
              
              <Marker position={[ride.pickupLat, ride.pickupLng]} icon={pickupIcon}>
                <Popup>Pickup: {ride.pickupLocation}</Popup>
              </Marker>
              
              <Marker position={[ride.dropLat, ride.dropLng]} icon={dropoffIcon}>
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
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{b.passenger.name}</p>
                      <p className="text-xs text-slate-500">{b.seatsBooked} seat(s)</p>
                    </div>
                    {isDriver && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => toast.success(`Opening chat with ${b.passenger.name}...`)}>
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => toast.success(`Calling ${b.passenger.name}...`)}>
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
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
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{ride.driver.name}</p>
                  <p className="text-xs text-slate-600">{ride.vehicle.vehicleModel} ({ride.vehicle.registrationNo})</p>
                </div>
                {!isDriver && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => toast.success(`Opening chat with driver...`)}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => toast.success(`Calling driver...`)}>
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
