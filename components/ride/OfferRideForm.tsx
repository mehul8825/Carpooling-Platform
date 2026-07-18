"use client";

import { useState, useTransition } from "react";
import DynamicMap from "@/components/map/DynamicMap";
import { LocationSearch } from "@/components/map/LocationSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { publishRideAction } from "@/app/actions/ride";
import { toast } from "sonner";
import { Loader2, MapPin, Clock, Users, IndianRupee, Route, CheckCircle } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";

interface RouteInfo {
  distance: number;
  duration: number;
  path: [number, number][];
}

export function OfferRideForm({ userId }: { userId?: string }) {
  const { socket } = useSocket(userId);
  const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [mapSelectionMode, setMapSelectionMode] = useState<"pickup" | "dropoff" | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [published, setPublished] = useState(false);

  // Ride config
  const [seats, setSeats] = useState("3");
  const [fare, setFare] = useState("");
  const [dateTime, setDateTime] = useState("");

  const calculateRoute = async () => {
    if (!pickup || !dropoff) return;
    setLoadingRoute(true);
    setError(null);
    setRouteInfo(null);

    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`
      );
      const data = await res.json();

      if (data.code === "Ok" && data.routes.length > 0) {
        const route = data.routes[0];
        const decodedPath: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        setRouteInfo({ distance: route.distance, duration: route.duration, path: decodedPath });

        // Auto-suggest fare: ₹5/km
        const distKm = route.distance / 1000;
        if (!fare) setFare(Math.round(distKm * 5).toString());
      } else if (data.code === "NoRoute") {
        setError("Unable to find a valid driving route. Please adjust locations.");
      } else {
        setError("Error calculating route.");
      }
    } catch {
      setError("Network error while calculating route.");
    } finally {
      setLoadingRoute(false);
    }
  };

  const handlePublish = async () => {
    if (!pickup || !dropoff || !routeInfo) return;
    if (!dateTime) return toast.error("Please select a departure date & time.");
    if (!fare || Number(fare) <= 0) return toast.error("Please set a valid fare.");

    startTransition(async () => {
      const res = await publishRideAction({
        pickupLocation: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropLocation: dropoff.address,
        dropLat: dropoff.lat,
        dropLng: dropoff.lng,
        travelDateTime: new Date(dateTime).toISOString(),
        availableSeats: Number(seats),
        farePerSeat: Number(fare),
      });

      if (res.success) {
        toast.success("Ride published! Passengers can now find your ride.");
        if (socket && res.ride) {
          socket.emit("new_ride_published", res.ride);
        }
        setPublished(true);
      } else {
        toast.error(res.error || "Failed to publish ride.");
      }
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
        setRouteInfo(null);
        setMapSelectionMode(null);
        toast.success(`Location set from map!`);
      }
    } catch (error) {
      toast.error("Failed to get address for that location");
    }
  };

  if (published) {
    return (
      <Card className="max-w-lg mx-auto text-center py-12">
        <CardContent className="space-y-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Ride Published!</h2>
          <p className="text-muted-foreground">
            Your ride is now visible to passengers searching nearby routes. You&apos;ll see booking
            requests here when passengers request a seat.
          </p>
          <Button onClick={() => { setPublished(false); setRouteInfo(null); setPickup(null); setDropoff(null); setFare(""); setDateTime(""); }}>
            Publish Another Ride
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left Panel */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Route className="h-5 w-5 text-primary" />
              Set Your Route
            </CardTitle>
            <CardDescription>
              Enter your pickup and drop-off to calculate the route.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Pickup
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
                placeholder="Start location..."
                defaultValue={pickup?.address || ""}
                onSelect={(lat, lng, addr) => { setPickup({ lat, lng, address: addr }); setRouteInfo(null); }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" /> Drop-off
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
                placeholder="Destination..."
                defaultValue={dropoff?.address || ""}
                onSelect={(lat, lng, addr) => { setDropoff({ lat, lng, address: addr }); setRouteInfo(null); }}
              />
            </div>

            <Button
              className="w-full"
              onClick={calculateRoute}
              disabled={!pickup || !dropoff || loadingRoute}
            >
              {loadingRoute && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Calculate Route
            </Button>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Route details + Ride config */}
        {routeInfo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Ride Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Route className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-semibold text-sm">{(routeInfo.distance / 1000).toFixed(1)} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Time</p>
                    <p className="font-semibold text-sm">{Math.ceil(routeInfo.duration / 60)} mins</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Departure Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" /> Seats
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="6"
                      value={seats}
                      onChange={(e) => setSeats(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <IndianRupee className="h-3.5 w-3.5" /> Fare/seat
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={fare}
                      onChange={(e) => setFare(e.target.value)}
                      placeholder="₹"
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={handlePublish} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Publishing..." : "Publish Ride"}
              </Button>
            </CardContent>
          </Card>
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
            routePath={routeInfo?.path}
            onMapClick={handleMapClick}
            isSelectingLocation={!!mapSelectionMode}
          />
        </Card>
      </div>
    </div>
  );
}
