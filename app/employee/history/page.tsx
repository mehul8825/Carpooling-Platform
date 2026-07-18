import { Card, CardContent } from "@/components/ui/card";
import { Navigation, Clock } from "lucide-react";
import { getCurrentUserAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";

export default async function RideHistoryPage() {
  const user = await getCurrentUserAction();
  if (!user) redirect("/auth/signin");

  const ridesOffered = await prisma.ride.findMany({
    where: { driverId: user.id },
    orderBy: { travelDateTime: "desc" }
  });

  const bookings = await prisma.rideBooking.findMany({
    where: { passengerId: user.id },
    include: { ride: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <BackButton title="Back to Dashboard" />
      <h2 className="text-2xl font-bold mb-6">Ride History</h2>
      
      {ridesOffered.length === 0 && bookings.length === 0 && (
        <p className="text-gray-500">You have no ride history yet.</p>
      )}

      {ridesOffered.map(ride => (
        <Card key={ride.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full text-blue-600">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-blue-600 mb-1">Offered Ride</p>
                <p className="font-bold">To: {ride.dropLocation}</p>
                <p className="text-sm text-gray-500">{new Date(ride.travelDateTime).toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-green-600">+$15.00</div>
              <div className="text-xs text-gray-500">{ride.status}</div>
            </div>
          </CardContent>
        </Card>
      ))}

      {bookings.map(booking => (
        <Card key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-l-4 border-l-gray-400">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-500 mb-1">Passenger Ride</p>
                <p className="font-bold">To: {booking.ride.dropLocation}</p>
                <p className="text-sm text-gray-500">{new Date(booking.ride.travelDateTime).toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-700 dark:text-gray-300">-${booking.totalFare.toFixed(2)}</div>
              <div className="text-xs text-gray-500">{booking.status}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
