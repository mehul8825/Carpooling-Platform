"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { requestBookingAction } from "@/app/actions/ride";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BookRideButtonProps {
  rideId: string;
  pricePerSeat: number;
}

export function BookRideButton({ rideId, pricePerSeat }: BookRideButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleBook = () => {
    startTransition(async () => {
      const res = await requestBookingAction({
        rideId,
        seatsBooked: 1,
      });

      if (res.success) {
        toast.success("Ride requested! Waiting for driver approval.");
      } else {
        toast.error("Failed to request booking: " + res.error);
      }
    });
  };

  return (
    <Button onClick={handleBook} disabled={isPending} className="w-full">
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Booking...
        </>
      ) : (
        "Request Seat"
      )}
    </Button>
  );
}
