"use client";

import { useTransition, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { approveBookingAction, rejectBookingAction } from "@/app/actions/ride";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MapPin, Users, Clock, Check, X, Loader2, IndianRupee } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";

interface Booking {
  id: string;
  seatsBooked: number;
  totalFare: number;
  status: string;
  createdAt: string;
  passenger: { id: string; name: string | null; email: string | null };
}

interface RideWithBookings {
  id: string;
  pickupLocation: string;
  dropLocation: string;
  travelDateTime: string;
  availableSeats: number;
  farePerSeat: number;
  status: string;
  vehicle: { vehicleModel: string; registrationNo: string };
  bookings: Booking[];
}

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  REQUESTED: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export function DriverBookings({ rides: initialRides, userId }: { rides: RideWithBookings[], userId?: string }) {
  const [rides, setRides] = useState<RideWithBookings[]>(initialRides);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { socket } = useSocket(userId);

  useEffect(() => {
    setRides(initialRides);
  }, [initialRides]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewBooking = (booking: Booking & { rideId: string }) => {
      setRides(prev => prev.map(ride => {
        if (ride.id === booking.rideId) {
          // Check if booking already exists
          if (ride.bookings.some(b => b.id === booking.id)) return ride;
          return {
            ...ride,
            bookings: [booking, ...ride.bookings]
          };
        }
        return ride;
      }));
      toast.info(`New booking request from ${booking.passenger.name || booking.passenger.email}!`);
    };

    socket.on("new_booking_request", handleNewBooking);
    return () => {
      socket.off("new_booking_request", handleNewBooking);
    };
  }, [socket]);

  const handleApprove = (bookingId: string, passengerId: string) => {
    startTransition(async () => {
      const res = await approveBookingAction(bookingId);
      if (res.success) {
        toast.success("Booking approved!");
        setRides(prev => prev.map(r => {
          if (r.bookings.some(b => b.id === bookingId)) {
            const booking = r.bookings.find(b => b.id === bookingId);
            return {
              ...r,
              availableSeats: r.availableSeats - (booking?.seatsBooked || 0),
              status: "ONGOING",
              bookings: r.bookings.map(b => b.id === bookingId ? { ...b, status: "APPROVED" } : b)
            };
          }
          return r;
        }));
        if (socket) {
          socket.emit("booking_updated", { passengerId, bookingId, status: "APPROVED" });
        }
      } else {
        toast.error(res.error || "Failed to approve.");
      }
    });
  };

  const handleReject = (bookingId: string, passengerId: string) => {
    startTransition(async () => {
      const res = await rejectBookingAction(bookingId);
      if (res.success) {
        toast.success("Booking rejected.");
        setRides(prev => prev.map(r => ({
          ...r,
          bookings: r.bookings.map(b => b.id === bookingId ? { ...b, status: "REJECTED" } : b)
        })));
        if (socket) {
          socket.emit("booking_updated", { passengerId, bookingId, status: "REJECTED" });
        }
      } else {
        toast.error(res.error || "Failed to reject.");
      }
    });
  };

  if (rides.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You haven&apos;t published any rides yet. Offer a ride to start receiving booking requests!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rides.map((ride) => (
        <Card key={ride.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-sm font-semibold">
                  {ride.vehicle.vehicleModel} · {ride.vehicle.registrationNo}
                </CardTitle>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-emerald-600" />
                    <span className="truncate">{ride.pickupLocation}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-blue-600" />
                    <span className="truncate">{ride.dropLocation}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={ride.status === "PUBLISHED" ? "default" : "secondary"}>
                  {ride.status}
                </Badge>
                {ride.status === "ONGOING" && (
                  <Button variant="outline" size="sm" onClick={() => router.push(`/ride/${ride.id}`)}>
                    Go to Live Tracking
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(ride.travelDateTime).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {ride.availableSeats} seats left
              </span>
              <span className="flex items-center gap-1">
                <IndianRupee className="h-3 w-3" />
                ₹{ride.farePerSeat}/seat
              </span>
            </div>
          </CardHeader>

          {ride.bookings.length > 0 && (
            <>
              <Separator />
              <CardContent className="pt-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Booking Requests ({ride.bookings.length})
                </p>
                {ride.bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {booking.passenger.name || booking.passenger.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.seatsBooked} seat(s) · ₹{booking.totalFare}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusColor[booking.status] || "outline"}>
                        {booking.status}
                      </Badge>
                      {booking.status === "REQUESTED" && (
                        <>
                          {ride.availableSeats < booking.seatsBooked && (
                            <span className="text-[10px] text-destructive mr-1">Not enough seats</span>
                          )}
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => handleApprove(booking.id, booking.passenger.id)}
                            disabled={isPending || ride.availableSeats < booking.seatsBooked}
                            title={ride.availableSeats < booking.seatsBooked ? "Not enough seats available" : "Approve"}
                          >
                            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(booking.id, booking.passenger.id)}
                            disabled={isPending}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
