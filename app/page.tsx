import Link from "next/link";
import { getCurrentUserAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookRideButton } from "@/components/ride/BookRideButton";
import { Car, MapPin, Calendar, Users, DollarSign, Shield, Zap, Sparkles } from "lucide-react";

export default async function Page() {
  const user = await getCurrentUserAction();

  // Fetch published rides
  const rides = await prisma.ride.findMany({
    where: {
      status: "PUBLISHED",
      availableSeats: { gt: 0 },
    },
    include: {
      driver: true,
      vehicle: true,
    },
    orderBy: {
      travelDateTime: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 text-center bg-gradient-to-b from-blue-50/40 via-white to-slate-50">
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Carpooling Platform</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900">
            Share Rides, Save Money, <br />
            <span className="text-blue-600">
              Save the Planet
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-600">
            Join ShareRide to connect with verified colleagues and commute sustainably. Share your fuel costs, bypass heavy traffic, and reduce your carbon footprint.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link href="/offer-ride">
              <Button size="lg" className="shadow-md hover:shadow-lg transition-all px-8">
                <Car className="mr-2 h-5 w-5" />
                Offer a Ride
              </Button>
            </Link>
            {!user && (
              <Link href="/auth/signup">
                <Button size="lg" variant="outline" className="px-8">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Features / Why Us */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Why ShareRide?</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg h-fit">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Verified Coworkers</h3>
                  <p className="text-sm text-slate-500 mt-1">Every driver and passenger is verified with their corporate ID and documents.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg h-fit">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Real-time GPS Tracking</h3>
                  <p className="text-sm text-slate-500 mt-1">Live tracking and automatic driver-offline warnings using integrated OSM maps.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg h-fit">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Pro-rata Splits</h3>
                  <p className="text-sm text-slate-500 mt-1">Clear cost per seat, with flexible ride approvals and automated seat reservations.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Available Rides */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Available Rides</h2>
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {rides.length} Found
              </span>
            </div>

            {rides.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-150 shadow-sm text-center">
                <Car className="w-16 h-16 text-slate-300 stroke-[1.5]" />
                <h3 className="mt-4 text-lg font-semibold text-slate-800">No rides listed yet</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1">
                  Be the first to publish a commute route or ask colleagues to post their plans!
                </p>
                <Link href="/offer-ride" className="mt-6">
                  <Button>Publish Commute</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rides.map((ride) => (
                  <Card key={ride.id} className="shadow-sm hover:shadow-md transition-shadow border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <CardTitle className="text-base font-semibold truncate text-slate-800">
                            {ride.driver.name}&apos;s Ride
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Vehicle: {ride.vehicle.vehicleModel} ({ride.vehicle.registrationNo})
                          </CardDescription>
                        </div>
                        <span className="text-lg font-bold text-slate-950 flex items-center shrink-0">
                          ₹{ride.farePerSeat}
                          <span className="text-xs font-normal text-slate-500">/seat</span>
                        </span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 pb-4">
                      <div className="space-y-2 relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                        <div className="text-sm flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="truncate text-slate-700 font-medium" title={ride.pickupLocation}>
                            {ride.pickupLocation}
                          </span>
                        </div>
                        <div className="text-sm flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span className="truncate text-slate-700 font-medium" title={ride.dropLocation}>
                            {ride.dropLocation}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(ride.travelDateTime).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {ride.availableSeats} seats left
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter>
                      {user ? (
                        user.id === ride.driverId ? (
                          <Button disabled variant="outline" className="w-full">
                            Your Ride
                          </Button>
                        ) : (
                          <BookRideButton 
                            rideId={ride.id} 
                            passengerId={user.id} 
                            pricePerSeat={ride.farePerSeat} 
                          />
                        )
                      ) : (
                        <Link href="/auth/signup" className="w-full">
                          <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                            Sign up to Book
                          </Button>
                        </Link>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
