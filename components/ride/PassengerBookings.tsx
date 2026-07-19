"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Car, Navigation, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRazorpay } from "@/hooks/use-razorpay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wallet, Banknote, FileText } from "lucide-react";
import { payWithWalletAction } from "@/app/actions/wallet";
import { useState } from "react";

interface Booking {
  id: string;
  seatsBooked: number;
  totalFare: number;
  status: string;
  paymentStatus?: string;
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

export function PassengerBookings({ bookings, walletBalance = 0 }: { bookings: Booking[], walletBalance?: number }) {
  const router = useRouter();
  const isRazorpayLoaded = useRazorpay();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWalletPayment = async (booking: Booking) => {
    if (walletBalance < booking.totalFare) {
      toast.error("Insufficient wallet balance. Please add money or use another method.");
      return;
    }
    
    setIsProcessing(true);
    const res = await payWithWalletAction(booking.id);
    if (res.success) {
      toast.success("Payment successful using Wallet!");
      setSelectedBooking(null);
      window.location.reload();
    } else {
      toast.error(res.error || "Payment failed");
    }
    setIsProcessing(false);
  };

  const handleCashPayment = async (booking: Booking) => {
    // For Cash, we can just assume they will pay the driver directly.
    // So we don't mark it as PAID here automatically, or we can just tell them.
    toast.success("You selected Cash. Please pay the driver during the ride.");
    setSelectedBooking(null);
  };

  const handleRazorpayPayment = async (booking: Booking) => {
    if (!isRazorpayLoaded) {
      toast.error("Payment gateway is loading. Please try again in a moment.");
      return;
    }

    try {
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(booking.totalFare * 100), // paise
          receipt: `rcpt_${booking.id}`,
          bookingId: booking.id,
        }),
      });

      if (!orderRes.ok) {
        throw new Error("Failed to create order");
      }

      const order = await orderRes.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Carpooling Platform",
        description: `Payment for ride to ${booking.ride.dropLocation}`,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || "no_order_id",
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature || "no_signature",
                bookingId: booking.id,
              }),
            });

            if (verifyRes.ok) {
              toast.success("Payment successful!");
              window.location.reload();
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            toast.error("Payment verification error");
          }
        },
        prefill: {
          name: booking.ride.driver.name || "User",
        },
        theme: {
          color: "#2563eb",
        },
      };

      if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast.error(`Payment failed: ${response.error.description}`);
        });
        rzp.open();
      } else {
        // HACKATHON FALLBACK: If no Razorpay key is provided, just simulate the payment success instantly!
        toast.info("Simulating payment (No Razorpay Key Found)...");
        setTimeout(async () => {
          await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: order.id,
              razorpay_payment_id: "simulated_payment_123",
              bookingId: booking.id,
            }),
          });
          toast.success("Payment successful! (Simulated)");
          window.location.reload();
          setIsOpen(false);
        }, 1500);
      }
    } catch (error) {
      toast.error("Failed to initialize payment");
    }
  };

  // Helper just to resolve compilation for standard dialog logic
  const setIsOpen = (open: boolean) => {
    if (!open) setSelectedBooking(null);
  };

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
                <div className="flex gap-2">
                  <Badge variant={statusColor[booking.status] || "outline"}>
                    {booking.status}
                  </Badge>
                  {booking.paymentStatus === "PAID" && (
                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">PAID</Badge>
                  )}
                </div>
                {booking.status === "APPROVED" && booking.paymentStatus !== "PAID" && (
                  <Button size="sm" onClick={() => setSelectedBooking(booking)} className="bg-blue-600 hover:bg-blue-700">
                    <CreditCard className="h-4 w-4 mr-2" /> Pay ₹{booking.totalFare}
                  </Button>
                )}
                {booking.status === "COMPLETED" && booking.paymentStatus === "PAID" && (
                  <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => router.push(`/invoice/${booking.id}`)}>
                    <FileText className="h-4 w-4 mr-2" /> Tax Invoice
                  </Button>
                )}
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

      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
            <DialogDescription>
              Choose how you want to pay ₹{selectedBooking?.totalFare} for your ride.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              variant="outline"
              className="h-16 justify-start px-6 flex items-center gap-4 hover:border-blue-500 hover:bg-blue-50"
              onClick={() => selectedBooking && handleRazorpayPayment(selectedBooking)}
              disabled={isProcessing}
            >
              <div className="bg-blue-100 p-2 rounded-full">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Card / UPI / NetBanking</div>
                <div className="text-xs text-gray-500">Pay securely via Razorpay</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-16 justify-start px-6 flex items-center gap-4 hover:border-emerald-500 hover:bg-emerald-50"
              onClick={() => selectedBooking && handleWalletPayment(selectedBooking)}
              disabled={isProcessing}
            >
              <div className="bg-emerald-100 p-2 rounded-full">
                <Wallet className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Carpooling Wallet</div>
                <div className="text-xs text-gray-500">
                  Available Balance: <span className={walletBalance < (selectedBooking?.totalFare || 0) ? "text-red-500" : "text-emerald-600"}>₹{walletBalance.toFixed(2)}</span>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-16 justify-start px-6 flex items-center gap-4 hover:border-gray-500 hover:bg-gray-50"
              onClick={() => selectedBooking && handleCashPayment(selectedBooking)}
              disabled={isProcessing}
            >
              <div className="bg-gray-200 p-2 rounded-full">
                <Banknote className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Cash to Driver</div>
                <div className="text-xs text-gray-500">Pay directly during the trip</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
