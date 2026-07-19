"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import DynamicMap from "@/components/map/DynamicMap";
import { LocationSearch } from "@/components/map/LocationSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { searchRidesAction, requestBookingAction, cancelBookingAction } from "@/app/actions/ride";
import { toast } from "sonner";
import { Loader2, MapPin, Search, Clock, Users, IndianRupee, Car, Route, CheckCircle, XCircle } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

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

interface MatchedRide {
  id: string;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropLocation: string;
  dropLat: number;
  dropLng: number;
  travelDateTime: string;
  availableSeats: number;
  farePerSeat: number;
  status: string;
  pickupDist: number;
  dropDist: number;
  driver: { id: string; name: string | null; email: string | null };
  vehicle: { vehicleModel: string; registrationNo: string; seatingCapacity: number };
}

export function FindRideForm({ userId }: { userId?: string }) {
  const { socket } = useSocket(userId);
  const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [rides, setRides] = useState<MatchedRide[]>([]);
  const [mapSelectionMode, setMapSelectionMode] = useState<"pickup" | "dropoff" | null>(null);
  const [seatsBooked, setSeatsBooked] = useState<number>(1);
  const [searched, setSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [bookingPending, setBookingPending] = useState<string | null>(null);
  const [waitingForApproval, setWaitingForApproval] = useState<{ rideId: string, bookingId: string, driverId: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Listen for real-time new rides
  useEffect(() => {
    if (!socket || !searched || !pickup || !dropoff) return;

    // Join the search room to get relevant rides globally (then filter by route)
    socket.emit("join_search_room");

    const handleNewRide = (ride: any) => {
      const pickupDist = haversineKm(pickup.lat, pickup.lng, ride.pickupLat, ride.pickupLng);
      const dropDist = haversineKm(dropoff.lat, dropoff.lng, ride.dropLat, ride.dropLng);
      
      if (pickupDist <= 5 && dropDist <= 5) {
        setRides((prev) => {
          // Check if already in list
          if (prev.some(r => r.id === ride.id)) return prev;
          
          const newRide = { ...ride, pickupDist, dropDist };
          const newList = [newRide, ...prev];
          // Sort by distance
          return newList.sort((a, b) => a.pickupDist + a.dropDist - (b.pickupDist + b.dropDist));
        });
        toast.info("A new ride matching your route was just published!");
      }
    };

    socket.on("ride_available", handleNewRide);
    return () => {
      socket.off("ride_available", handleNewRide);
    };
  }, [socket, searched, pickup, dropoff]);

  // Listen for real-time booking updates
  useEffect(() => {
    if (!socket) return;
    
    const handleBookingUpdate = ({ bookingId, status, rideId }: { bookingId: string, status: string, rideId: string }) => {
      if (waitingForApproval && waitingForApproval.bookingId === bookingId) {
        if (status === "APPROVED") {
          toast.success("Your ride request was approved! Redirecting to live tracking...");
          const targetRideId = waitingForApproval.rideId;
          setWaitingForApproval(null);
          setTimeout(() => {
            router.push(`/ride/${targetRideId}`);
          }, 1500);
        } else if (status === "REJECTED") {
          toast.error("Your ride request was declined by the driver.");
          setWaitingForApproval(null);
        }
      } else {
        toast.success(`Booking status updated to ${status}!`);
      }
    };
    
    socket.on("booking_status_changed", handleBookingUpdate);
    return () => {
      socket.off("booking_status_changed", handleBookingUpdate);
    };
  }, [socket, waitingForApproval, router]);

  const handleSearch = async () => {
    if (!pickup || !dropoff) return;
    setIsSearching(true);
    setSearched(false);

    const res = await searchRidesAction({
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      dropLat: dropoff.lat,
      dropLng: dropoff.lng,
      radiusKm: 5,
    });

    setRides((res.rides || []) as MatchedRide[]);
    setSearched(true);
    setIsSearching(false);

    if (res.rides && res.rides.length > 0) {
      toast.success(`Found ${res.rides.length} matching ride(s)!`);
    } else {
      toast.info("No rides found near your route. Try expanding your search or check back later.");
    }
  };

  const handleBook = (rideId: string) => {
    setBookingPending(rideId);
    startTransition(async () => {
      const res = await requestBookingAction({ 
        rideId, 
        seatsBooked,
        passengerPickupLat: pickup?.lat,
        passengerPickupLng: pickup?.lng,
        passengerDropLat: dropoff?.lat,
        passengerDropLng: dropoff?.lng
      });
      if (res.success && res.booking && res.driverId) {
        toast.success("Ride requested! Waiting for driver approval...");
        setWaitingForApproval({ rideId, bookingId: res.booking.id, driverId: res.driverId });
        if (socket) {
          socket.emit("booking_requested", { driverId: res.driverId, booking: res.booking, rideId });
        }
      } else {
        toast.error(res.error || "Failed to request ride.");
      }
      setBookingPending(null);
    });
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (!mapSelectionMode) return;
    
    // Reverse geocode
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        if (mapSelectionMode === "pickup") {
          setPickup({ lat, lng, address: data.display_name });
        } else {
          setDropoff({ lat, lng, address: data.display_name });
        }
        setMapSelectionMode(null);
        toast.success(`Location set from map!`);
      }
    } catch (error) {
      toast.error("Failed to get address for that location");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left panel – search + results */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-primary" />
              Where are you going?
            </CardTitle>
            <CardDescription>
              Enter your pickup and destination to find rides nearby.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Your Pickup
                </Label>
                <Button 
                  type="button" 
                  variant={mapSelectionMode === "pickup" ? "default" : "outline"} 
                  size="sm" 
                  className="h-6 text-xs px-2"
                  onClick={() => setMapSelectionMode(mapSelectionMode === "pickup" ? null : "pickup")}
                >
                  {mapSelectionMode === "pickup" ? "Click on map..." : "Pin on Map"}
                </Button>
              </div>
              <LocationSearch
                placeholder="Where are you starting?"
                defaultValue={pickup?.address || ""}
                onSelect={(lat, lng, addr) => { setPickup({ lat, lng, address: addr }); setSearched(false); }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" /> Your Destination
                </Label>
                <Button 
                  type="button" 
                  variant={mapSelectionMode === "dropoff" ? "default" : "outline"} 
                  size="sm" 
                  className="h-6 text-xs px-2"
                  onClick={() => setMapSelectionMode(mapSelectionMode === "dropoff" ? null : "dropoff")}
                >
                  {mapSelectionMode === "dropoff" ? "Click on map..." : "Pin on Map"}
                </Button>
              </div>
              <LocationSearch
                placeholder="Where do you want to go?"
                defaultValue={dropoff?.address || ""}
                onSelect={(lat, lng, addr) => { setDropoff({ lat, lng, address: addr }); setSearched(false); }}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-slate-600" /> Number of Seats
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(num => (
                  <Button
                    key={num}
                    type="button"
                    variant={seatsBooked === num ? "default" : "outline"}
                    className="flex-1 transition-all"
                    onClick={() => setSeatsBooked(num)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            <Button className="w-full mt-2" onClick={handleSearch} disabled={!pickup || !dropoff || isSearching}>
              {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSearching ? "Searching..." : "Search Rides"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground">
                {rides.length > 0 ? `${rides.length} ride(s) found` : "No matches"}
              </h3>
              {rides.length > 0 && (
                <Badge variant="secondary">{rides.length}</Badge>
              )}
            </div>

            {rides.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent className="space-y-2">
                  <Car className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    No rides match your route right now.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Try a larger search area or check back later.
                  </p>
                </CardContent>
              </Card>
            ) : (
              rides.map((ride) => (
                <Card key={ride.id} className="hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold truncate">
                          {ride.driver.name}&apos;s Ride
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {ride.vehicle.vehicleModel} · {ride.vehicle.registrationNo}
                        </CardDescription>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm">₹{ride.farePerSeat}</p>
                        <p className="text-[10px] text-muted-foreground">/seat</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-2">
                    <div className="space-y-1.5 relative pl-4 before:absolute before:left-[5px] before:top-1.5 before:bottom-1.5 before:w-[2px] before:bg-border">
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span className="truncate" title={ride.pickupLocation}>{ride.pickupLocation}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="h-3 w-3 text-blue-600 shrink-0" />
                        <span className="truncate" title={ride.dropLocation}>{ride.dropLocation}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ride.travelDateTime).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {ride.availableSeats} seats
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        ~{ride.pickupDist.toFixed(1)} km away
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={isPending && bookingPending === ride.id}
                      onClick={() => handleBook(ride.id)}
                    >
                      {isPending && bookingPending === ride.id ? (
                        <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Requesting...</>
                      ) : (
                        "Request Seat"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="lg:col-span-3">
        <Card className="overflow-hidden h-full">
          <DynamicMap
            pickupLat={pickup?.lat}
            pickupLng={pickup?.lng}
            dropLat={dropoff?.lat}
            dropLng={dropoff?.lng}
            onMapClick={handleMapClick}
            isSelectingLocation={!!mapSelectionMode}
          />
        </Card>
      </div>
      <Dialog open={!!waitingForApproval} onOpenChange={(o) => {
        if (!o && confirm("Are you sure you want to cancel waiting? Your request is still pending with the driver.")) {
          setWaitingForApproval(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Waiting for Approval</DialogTitle>
            <DialogDescription className="text-center">
              Please wait while the driver reviews your request. Do not close this screen.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <div className="w-full space-y-2">
              <Progress value={undefined} className="h-2 w-full animate-pulse bg-blue-100 [&>div]:bg-blue-600" />
              <p className="text-xs text-center text-muted-foreground animate-pulse">Contacting driver...</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => {
              if (confirm("Cancel this request?")) {
                if (socket && waitingForApproval) {
                  socket.emit("cancel_booking", { 
                    driverId: waitingForApproval.driverId, 
                    bookingId: waitingForApproval.bookingId 
                  });
                  cancelBookingAction(waitingForApproval.bookingId);
                }
                setWaitingForApproval(null);
              }
            }}>
              Cancel Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
