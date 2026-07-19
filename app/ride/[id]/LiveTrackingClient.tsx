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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
import { useRef } from "react";
import { approveBookingAction, rejectBookingAction, completeRideAction } from "@/app/actions/ride";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

const carIcon = L.divIcon({
  html: '<div style="background-color: white; border-radius: 50%; padding: 4px; box-shadow: 0 0 10px rgba(0,0,0,0.3); color: #3b82f6; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car-front"><path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"/><path d="M7 14h.01"/><path d="M17 14h.01"/><rect width="18" height="8" x="3" y="10" rx="2"/><path d="M5 18v2"/><path d="M19 18v2"/></svg></div>',
  className: 'custom-car-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

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

const passengerIcon = L.divIcon({
  html: '<div style="background-color: white; border-radius: 50%; padding: 4px; box-shadow: 0 0 10px rgba(0,0,0,0.3); color: #10b981; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

export function LiveTrackingClient({ ride, currentUserId, isDriver }: any) {
  const { socket } = useSocket(currentUserId);
  const [liveLocation, setLiveLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pickedUpPassengers, setPickedUpPassengers] = useState<string[]>([]);
  
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [chatOpenWith, setChatOpenWith] = useState<{ id: string, name: string } | null>(null);
  const [messages, setMessages] = useState<{ senderId: string, toUserId: string, text: string, timestamp: number }[]>([]);
  const [unreadSenders, setUnreadSenders] = useState<string[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Fetch route line
    const fetchRoute = async () => {
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${ride.pickupLng},${ride.pickupLat};${ride.dropLng},${ride.dropLat}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.code === "Ok" && data.routes.length > 0) {
          const decodedPath: [number, number][] = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );
          setRoutePath(decodedPath);
        }
      } catch (e) {
        console.error("Failed to fetch route");
      }
    };
    fetchRoute();
  }, [ride.pickupLng, ride.pickupLat, ride.dropLng, ride.dropLat]);

  useEffect(() => {
    if (!socket) return;
    const handleChat = (msg: { senderId: string, toUserId: string, text: string, timestamp: number }) => {
      setMessages(prev => [...prev, msg]);
      if (msg.senderId !== currentUserId) {
        if (!chatOpenWith || chatOpenWith.id !== msg.senderId) {
          setUnreadSenders(prev => prev.includes(msg.senderId) ? prev : [...prev, msg.senderId]);
        }
      }
    };
    socket.on("receive_chat_message", handleChat);
    return () => { socket.off("receive_chat_message", handleChat); };
  }, [socket, currentUserId, chatOpenWith]);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpenWith]);

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
    } else {
      const handleNewBooking = ({ booking, rideId: reqRideId }: any) => {
        if (reqRideId === ride.id) {
          toast("New Ride Request!", {
            id: booking.id,
            description: `A passenger has requested ${booking.seatsBooked} seat(s).`,
            action: {
              label: "Approve",
              onClick: async () => {
                const res = await approveBookingAction(booking.id);
                if (res.success) {
                  toast.success("Passenger approved!");
                  socket.emit("booking_updated", { passengerId: booking.passengerId, bookingId: booking.id, status: "APPROVED", rideId: ride.id });
                } else {
                  toast.error(res.error || "Failed to approve.");
                }
              }
            },
            cancel: {
              label: "Reject",
              onClick: async () => {
                const res = await rejectBookingAction(booking.id);
                if (res.success) {
                  toast.success("Passenger rejected.");
                  socket.emit("booking_updated", { passengerId: booking.passengerId, bookingId: booking.id, status: "REJECTED", rideId: ride.id });
                }
              }
            },
            duration: 30000
          });
        }
      };
      socket.on("new_booking_request", handleNewBooking);
      socket.on("booking_cancelled", (bookingId: string) => {
        toast.dismiss(bookingId);
        toast.info("A passenger cancelled their ride request.");
        router.refresh();
      });
      // Listen to generic ride updates to refresh UI
      socket.on("ride_updated_refresh", () => {
        router.refresh();
      });
    }

    const handleRideCompleted = () => {
      setShowPayment(true);
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsTracking(false);
      toast.success("You have arrived at your destination!");
    };
    socket.on("ride_completed", handleRideCompleted);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("ride_completed", handleRideCompleted);
      if (!isDriver) {
        socket.off("ride_location_updated", handleLocationUpdate);
      } else {
        socket.off("new_booking_request");
        socket.off("booking_cancelled");
      }
    };
  }, [socket, ride.id, isDriver, watchId]);

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
    toast.success("Simulation started at high speed!");
    
    const activeRoute = routePath.length > 0 ? routePath : [
      [ride.pickupLat, ride.pickupLng],
      [ride.dropLat, ride.dropLng]
    ];
    
    let currentStep = 0;
    const steps = activeRoute.length > 2 ? activeRoute.length - 1 : 100;
    const isRoute = activeRoute.length > 2;
    
    // Map each booking to the closest pickup step along the route
    const pickupSteps = ride.bookings.map((b: any, index: number) => {
      if (b.passengerPickupLat && b.passengerPickupLng && activeRoute.length > 0) {
        // Find closest point on activeRoute to their actual searched pickup location
        let closestDist = Infinity;
        let closestIndex = 0;
        activeRoute.forEach((coord, idx) => {
          const dist = haversineKm(b.passengerPickupLat, b.passengerPickupLng, coord[0], coord[1]);
          if (dist < closestDist) {
            closestDist = dist;
            closestIndex = idx;
          }
        });
        return {
          passengerId: b.passengerId,
          name: b.passenger.name,
          step: closestIndex,
          lat: b.passengerPickupLat,
          lng: b.passengerPickupLng
        };
      } else {
        // Fallback if they somehow booked without a custom pickup
        const fraction = ride.bookings.length === 1 ? 0.35 : 0.2 + (0.6 * (index / (ride.bookings.length - 1)));
        const step = Math.floor(steps * fraction);
        return {
          passengerId: b.passengerId,
          name: b.passenger.name,
          step,
          lat: activeRoute[Math.floor((activeRoute.length - 1) * fraction)][0],
          lng: activeRoute[Math.floor((activeRoute.length - 1) * fraction)][1]
        };
      }
    });
    
    const pickedUpPassengersLocal = new Set<string>();

    const simulationTick = () => {
      // Check if we reached a passenger's pickup spot
      const currentPickup = pickupSteps.find(p => p.step === currentStep);
      
      if (currentPickup && !pickedUpPassengersLocal.has(currentPickup.passengerId)) {
        pickedUpPassengersLocal.add(currentPickup.passengerId);
        setPickedUpPassengers(Array.from(pickedUpPassengersLocal));
        toast.info(`Stopping to pick up ${currentPickup.name}...`);
        
        if (socket && socket.connected) {
          const msg = { senderId: currentUserId, toUserId: currentPickup.passengerId, text: "I have arrived at your pickup point!", timestamp: Date.now() };
          setMessages(prev => [...prev, msg]);
          socket.emit("send_chat_message", { toUserId: currentPickup.passengerId, text: msg.text, senderId: currentUserId });
        }
        
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        
        setTimeout(() => {
          toast.success(`${currentPickup.name} picked up! Resuming ride...`);
          simulationIntervalRef.current = setInterval(simulationTick, 200);
        }, 3000);
        
        return;
      }

      currentStep++;
      if (currentStep > steps) {
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        setIsSimulating(false);
        setIsTracking(false);
        toast.success("Arrived at destination!");
        if (isDriver) {
          endRide(true); // pass true to skip confirm dialog
        }
        return;
      }

      let lat, lng;
      if (isRoute && currentStep < activeRoute.length) {
        lat = activeRoute[currentStep][0];
        lng = activeRoute[currentStep][1];
      } else {
        const fraction = currentStep / steps;
        lat = activeRoute[0][0] + (activeRoute[1][0] - activeRoute[0][0]) * fraction;
        lng = activeRoute[0][1] + (activeRoute[1][1] - activeRoute[0][1]) * fraction;
      }

      setLiveLocation({ lat, lng });

      if (socket && socket.connected) {
        socket.emit("update_ride_location", { rideId: ride.id, lat, lng });
      }
    };

    simulationIntervalRef.current = setInterval(simulationTick, 200);
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

  const endRide = async (skipConfirm = false) => {
    if (skipConfirm || confirm("Are you sure you want to end this trip for everyone?")) {
      stopSharingLocation();
      if (socket && socket.connected) {
        socket.emit("complete_ride", ride.id);
      }
      await completeRideAction(ride.id);
    }
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
                  <Button onClick={endRide} variant="destructive" className="w-full md:w-auto">
                    <CheckCircle className="w-4 h-4 mr-2" /> End Trip
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
              
              {routePath.length > 0 ? (
                <Polyline 
                  positions={routePath} 
                  color="#3b82f6" 
                  weight={5} 
                  opacity={0.8} 
                  dashArray="10, 10" 
                />
              ) : (
                <Polyline 
                  positions={[[ride.pickupLat, ride.pickupLng], [ride.dropLat, ride.dropLng]]} 
                  color="#3b82f6" 
                  weight={4} 
                  opacity={0.6} 
                  dashArray="8 8" 
                />
              )}
              
              <Marker position={[ride.pickupLat, ride.pickupLng]} icon={pickupIcon}>
                <Popup>Pickup: {ride.pickupLocation}</Popup>
              </Marker>
              
              <Marker position={[ride.dropLat, ride.dropLng]} icon={dropoffIcon}>
                <Popup>Drop-off: {ride.dropLocation}</Popup>
              </Marker>

              {/* Show passenger locations based on exact coordinates */}
              {routePath.length > 0 && ride.bookings.map((b: any, index: number) => {
                if (pickedUpPassengers.includes(b.passengerId)) return null;
                
                let lat, lng;
                if (b.passengerPickupLat && b.passengerPickupLng) {
                  lat = b.passengerPickupLat;
                  lng = b.passengerPickupLng;
                } else {
                  const fraction = ride.bookings.length === 1 ? 0.35 : 0.2 + (0.6 * (index / (ride.bookings.length - 1)));
                  lat = routePath[Math.floor((routePath.length - 1) * fraction)][0];
                  lng = routePath[Math.floor((routePath.length - 1) * fraction)][1];
                }
                
                return (
                  <Marker 
                    key={b.id}
                    position={[lat, lng]} 
                    icon={passengerIcon}
                  >
                    <Popup className="font-semibold text-emerald-600">
                      <div className="flex items-center gap-1"><Users className="w-4 h-4" /> Waiting: {b.passenger.name}</div>
                    </Popup>
                  </Marker>
                );
              })}

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
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 relative" onClick={() => {
                          setChatOpenWith({ id: b.passenger.id, name: b.passenger.name });
                          setUnreadSenders(prev => prev.filter(id => id !== b.passenger.id));
                        }}>
                          <MessageCircle className="h-4 w-4" />
                          {unreadSenders.includes(b.passenger.id) && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
                          )}
                        </Button>
                        <a href={`tel:${b.passenger.phone || ''}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" title="Call">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </a>
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
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 relative" onClick={() => {
                      setChatOpenWith({ id: ride.driver.id, name: ride.driver.name });
                      setUnreadSenders(prev => prev.filter(id => id !== ride.driver.id));
                    }}>
                      <MessageCircle className="h-4 w-4" />
                      {unreadSenders.includes(ride.driver.id) && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
                      )}
                    </Button>
                    <a href={`tel:${ride.driver.phone || ''}`}>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" title="Call">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPayment} onOpenChange={(open) => {
        if (!open) toast.info("Please complete your payment before leaving.");
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-emerald-600">Trip Completed!</DialogTitle>
            <DialogDescription className="text-center">
              You have successfully arrived at your destination.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
              <CheckCircle className="h-8 w-8" />
            </div>
            
            <div className="w-full bg-slate-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Route</span>
                <span className="font-medium text-right max-w-[200px] truncate">{ride.pickupLocation} to {ride.dropLocation}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Fare</span>
                <span className="font-medium">₹{ride.farePerSeat}</span>
              </div>
              {isDriver && (
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-slate-500">Total Earnings (Estimated)</span>
                  <span className="font-bold text-emerald-600">₹{ride.farePerSeat * ride.bookings.length}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={async () => {
              if (isDriver) {
                await completeRideAction(ride.id);
              }
              toast.success("Payment completed successfully!");
              router.push("/employee/history");
            }}>
              {isDriver ? "Acknowledge Payments" : `Pay ₹${ride.farePerSeat}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={!!chatOpenWith} onOpenChange={(open) => { if (!open) setChatOpenWith(null); }}>
        <DialogContent className="sm:max-w-md h-[500px] flex flex-col p-4">
          <DialogHeader>
            <DialogTitle>Chat with {chatOpenWith?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 rounded-md">
            {messages.filter(m => 
              (m.senderId === chatOpenWith?.id && m.toUserId === currentUserId) || 
              (m.senderId === currentUserId && m.toUserId === chatOpenWith?.id)
            ).length === 0 ? (
              <p className="text-center text-sm text-slate-500 mt-10">No messages yet. Send a quick reply below!</p>
            ) : (
              messages.filter(m => 
                (m.senderId === chatOpenWith?.id && m.toUserId === currentUserId) || 
                (m.senderId === currentUserId && m.toUserId === chatOpenWith?.id)
              ).map((m, i) => (
                <div key={i} className={`flex flex-col max-w-[80%] ${m.senderId === currentUserId ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                  <div className={`p-2.5 rounded-lg text-sm ${m.senderId === currentUserId ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none'}`}>
                    {m.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {["I have arrived!", "On my way", "Traffic is heavy", "Be right there", "Where are you?"].map((suggestion) => (
              <span 
                key={suggestion} 
                className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => setMsgInput(suggestion)}
              >
                {suggestion}
              </span>
            ))}
          </div>

          <div className="flex gap-2 mt-2 pt-2 border-t">
            <input 
              type="text" 
              className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" 
              placeholder="Type a message..."
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && msgInput.trim() && chatOpenWith) {
                  const msg = { senderId: currentUserId, toUserId: chatOpenWith.id, text: msgInput.trim(), timestamp: Date.now() };
                  setMessages(prev => [...prev, msg]);
                  socket?.emit("send_chat_message", { toUserId: chatOpenWith.id, text: msgInput.trim(), senderId: currentUserId });
                  setMsgInput("");
                }
              }}
            />
            <Button onClick={() => {
              if (msgInput.trim() && chatOpenWith) {
                const msg = { senderId: currentUserId, toUserId: chatOpenWith.id, text: msgInput.trim(), timestamp: Date.now() };
                setMessages(prev => [...prev, msg]);
                socket?.emit("send_chat_message", { toUserId: chatOpenWith.id, text: msgInput.trim(), senderId: currentUserId });
                setMsgInput("");
              }
            }}>Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
