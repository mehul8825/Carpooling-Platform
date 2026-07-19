import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Navigation, Clock, Users, Car, MapPin } from "lucide-react";
import { getCurrentUserAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/badge";

export default async function RideHistoryPage() {
  const user = await getCurrentUserAction();
  if (!user) redirect("/auth/signin");

  const ridesOffered = await prisma.ride.findMany({
    where: { driverId: user.id },
    include: {
      vehicle: true,
      driver: { select: { name: true } },
      bookings: {
        where: { status: { in: ["APPROVED", "COMPLETED"] } },
        include: { passenger: { select: { name: true } } }
      }
    },
    orderBy: { travelDateTime: "desc" }
  });

  const bookings = await prisma.rideBooking.findMany({
    where: { passengerId: user.id },
    include: { 
      ride: {
        include: {
          vehicle: true,
          driver: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <BackButton title="Back to Dashboard" />
      <h2 className="text-2xl font-bold mb-6">Ride History</h2>
      
      {ridesOffered.length === 0 && bookings.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          You have no ride history yet.
        </Card>
      )}

      {ridesOffered.map(ride => {
        const totalEarned = ride.bookings.reduce((sum, b) => sum + b.totalFare, 0);
        return (
          <Card key={ride.id} className="hover:shadow-md transition-shadow overflow-hidden">
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <Badge variant="outline">Driver (Offered Ride)</Badge>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="font-bold text-lg text-emerald-600">+₹{totalEarned.toFixed(2)}</div>
                  <Badge variant="secondary">{ride.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="bg-muted p-3 rounded-full text-foreground shrink-0">
                  <Navigation className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-emerald-500" /> <span className="font-medium">{ride.pickupLocation}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 mt-1">
                    <MapPin className="w-4 h-4 text-red-500" /> <span className="font-medium">{ride.dropLocation}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> {new Date(ride.travelDateTime).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/50 p-3 rounded-lg border">
                  <h4 className="font-semibold flex items-center gap-2 mb-2"><Car className="w-4 h-4" /> Vehicle Info</h4>
                  <p className="text-muted-foreground">{ride.vehicle.vehicleModel} ({ride.vehicle.registrationNo})</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg border">
                  <h4 className="font-semibold flex items-center gap-2 mb-2"><Users className="w-4 h-4" /> Participants</h4>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Driver:</span> You
                  </p>
                  {ride.bookings.length > 0 ? (
                    <p className="text-muted-foreground mt-1">
                      <span className="font-medium">Passengers:</span> {ride.bookings.map(b => b.passenger.name).join(', ')}
                    </p>
                  ) : (
                    <p className="text-muted-foreground/60 italic mt-1">No passengers</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {bookings.map(booking => (
        <Card key={booking.id} className="hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <div className="flex justify-between items-center">
              <Badge variant="outline">Passenger (Ride Taken)</Badge>
              <div className="text-right flex flex-col items-end gap-1">
                <div className="font-bold text-lg">-₹{booking.totalFare.toFixed(2)}</div>
                <Badge variant="secondary">{booking.status}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="bg-muted p-3 rounded-full text-foreground shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-emerald-500" /> <span className="font-medium">{booking.ride.pickupLocation}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 mt-1">
                  <MapPin className="w-4 h-4 text-red-500" /> <span className="font-medium">{booking.ride.dropLocation}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {new Date(booking.ride.travelDateTime).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/50 p-3 rounded-lg border">
                <h4 className="font-semibold flex items-center gap-2 mb-2"><Car className="w-4 h-4" /> Vehicle Info</h4>
                <p className="text-muted-foreground">{booking.ride.vehicle.vehicleModel} ({booking.ride.vehicle.registrationNo})</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg border">
                <h4 className="font-semibold flex items-center gap-2 mb-2"><Users className="w-4 h-4" /> Participants</h4>
                <p className="text-muted-foreground">
                  <span className="font-medium">Driver:</span> {booking.ride.driver.name}
                </p>
                <p className="text-muted-foreground mt-1">
                  <span className="font-medium">Passenger:</span> You ({booking.seatsBooked} seats)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
