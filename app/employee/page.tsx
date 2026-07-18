import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Car, Wallet, Navigation, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCurrentUserAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function EmployeeDashboardOverview() {
  const user = await getCurrentUserAction();
  if (!user) redirect("/auth/signin");

  // Fetch real data
  const ridesOfferedCount = await prisma.ride.count({ where: { driverId: user.id } });
  const ridesTakenCount = await prisma.rideBooking.count({ where: { passengerId: user.id } });
  
  // Calculate earnings (mock logic: sum of all published rides fare per seat * seats * 0.8 just as a dummy number, or real booking logic)
  const allRides = await prisma.ride.findMany({ where: { driverId: user.id } });
  const totalEarnings = allRides.reduce((acc, ride) => acc + (ride.farePerSeat * (6 - ride.availableSeats)), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Welcome back, {user.name}!</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rides Taken</p>
                <h3 className="text-3xl font-bold mt-1">{ridesTakenCount}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rides Offered</p>
                <h3 className="text-3xl font-bold mt-1">{ridesOfferedCount}</h3>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <h3 className="text-3xl font-bold mt-1">${totalEarnings.toFixed(2)}</h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Trips</CardTitle>
          </CardHeader>
          <CardContent>
            {ridesOfferedCount === 0 && ridesTakenCount === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Navigation className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming trips scheduled.</p>
                <Link href="/employee/find-ride">
                  <Button variant="link" className="mt-2 text-blue-600">Find a ride now</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {allRides.slice(0, 3).map(ride => (
                  <div key={ride.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">To: {ride.dropLocation}</p>
                      <p className="text-xs text-gray-500">{new Date(ride.travelDateTime).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">Driver</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/employee/find-ride" className="block">
              <Button className="w-full justify-start h-12 text-md">
                <Search className="mr-3 w-5 h-5" /> Find a Ride Now
              </Button>
            </Link>
            <Link href="/employee/offer-ride" className="block">
              <Button variant="outline" className="w-full justify-start h-12 text-md">
                <Car className="mr-3 w-5 h-5" /> Publish a New Ride
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
