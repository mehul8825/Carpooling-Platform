"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Car, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";

interface Booking {
  id: string;
  seatsBooked: number;
  totalFare: number;
  status: string;
  createdAt: string;
  ride: {
    id: string;
    pickupLocation: string;
    dropLocation: string;
    travelDateTime: string;
    status: string;
    vehicle: { vehicleModel: string; registrationNo: string };
    driver: { name: string | null; phone: string | null };
  };
}

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  REQUESTED: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export function PassengerBookings({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();

  if (bookings.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You haven&apos;t requested any rides yet. Search and book a ride to see it here!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-600" />
                  {booking.ride.driver.name || "Driver"}&apos;s Ride
                </CardTitle>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-emerald-600" />
                    <span className="truncate">{booking.ride.pickupLocation}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-blue-600" />
                    <span className="truncate">{booking.ride.dropLocation}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={statusColor[booking.status] || "outline"}>
                  {booking.status}
                </Badge>
                {booking.status === "APPROVED" && booking.ride.status === "ONGOING" && (
                  <Button variant="outline" size="sm" onClick={() => router.push(`/ride/${booking.ride.id}`)}>
                    <Navigation className="h-3 w-3 mr-1" /> Go to Tracking
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(booking.ride.travelDateTime).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </span>
              <span>
                {booking.seatsBooked} seat(s) · ₹{booking.totalFare}
              </span>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
