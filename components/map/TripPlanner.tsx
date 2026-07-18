"use client";

import { useState, useTransition } from "react";
import DynamicMap from "./DynamicMap";
import { LocationSearch } from "./LocationSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { publishRideAction } from "@/app/actions/ride";
import { toast } from "sonner";

interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  path: [number, number][]; // decoded polyline
}

export function TripPlanner() {
  const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const calculateRoute = async () => {
    if (!pickup || !dropoff) return;
    
    setLoadingRoute(true);
    setError(null);
    setRouteInfo(null);

    try {
      // OSRM coordinates are in longitude, latitude order
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`
      );
      
      const data = await response.json();

      if (data.code === "Ok" && data.routes.length > 0) {
        const route = data.routes[0];
        // GeoJSON returns coordinates in [lon, lat] format. We map it to [lat, lon] for Leaflet.
        const decodedPath: [number, number][] = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        
        setRouteInfo({
          distance: route.distance,
          duration: route.duration,
          path: decodedPath,
        });
      } else if (data.code === "NoRoute") {
        setError("Unable to find a valid driving route between these locations. Please adjust the pickup or destination.");
      } else {
        setError("Error calculating route. Please try again.");
      }
    } catch (err) {
      setError("Network error while trying to calculate route.");
    } finally {
      setLoadingRoute(false);
    }
  };

  const publishRide = async () => {
    if (!pickup || !dropoff || !routeInfo) return;

    startTransition(async () => {
      // DUMMY DATA FOR NOW (In a real app, this comes from auth context/session)
      const res = await publishRideAction({
        driverId: "clxxxxxx_driver1", 
        vehicleId: "clxxxxxx_vehicle1",
        pickupLocation: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropLocation: dropoff.address,
        dropLat: dropoff.lat,
        dropLng: dropoff.lng,
        travelDateTime: new Date(Date.now() + 86400000), // tomorrow
        availableSeats: 3,
        farePerSeat: 50,
      });

      if (res.success) {
        toast.success("Ride published successfully!");
        setRouteInfo(null);
        setPickup(null);
        setDropoff(null);
      } else {
        toast.error("Failed to publish ride: " + res.error);
        setError("Failed to publish ride: " + res.error);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1 shadow-md border-primary/10">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            Plan Your Ride
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Pickup Location</label>
            <LocationSearch 
              placeholder="Where are you starting?" 
              onSelect={(lat, lng, address) => {
                setPickup({ lat, lng, address });
                setRouteInfo(null); // Clear old route
              }} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Drop-off Location</label>
            <LocationSearch 
              placeholder="Where are you going?" 
              onSelect={(lat, lng, address) => {
                setDropoff({ lat, lng, address });
                setRouteInfo(null); // Clear old route
              }} 
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          {routeInfo && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Distance</span>
                <span className="font-semibold">{(routeInfo.distance / 1000).toFixed(1)} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Est. Time</span>
                <span className="font-semibold">{Math.ceil(routeInfo.duration / 60)} mins</span>
              </div>
            </div>
          )}

          <Button 
            className="w-full mt-4" 
            onClick={calculateRoute}
            disabled={!pickup || !dropoff || loadingRoute}
            variant={routeInfo ? "outline" : "default"}
          >
            {loadingRoute && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {routeInfo ? "Recalculate Route" : "Calculate Route"}
          </Button>

          {routeInfo && (
            <Button className="w-full" onClick={publishRide} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Publishing..." : "Publish Ride"}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="md:col-span-2 shadow-md rounded-xl overflow-hidden border border-border">
        <DynamicMap 
          pickupLat={pickup?.lat}
          pickupLng={pickup?.lng}
          dropLat={dropoff?.lat}
          dropLng={dropoff?.lng}
          routePath={routeInfo?.path}
        />
      </div>
    </div>
  );
}
