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
  
  const allRides = await prisma.ride.findMany({ where: { driverId: user.id } });
  
  // Fetch actual wallet balance
  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  const currentBalance = wallet?.balance || 0;
  const pendingRequests = await prisma.rideBooking.findMany({
    where: {
      ride: { driverId: user.id },
      status: "REQUESTED"
    },
    include: {
      passenger: true,
      ride: true
    }
  });

  // Server actions for forms
  const acceptAction = async (formData: FormData) => {
    "use server";
    const { approveBookingAction } = await import("@/app/actions/ride");
    await approveBookingAction(formData.get("bookingId") as string);
  };
  
  const rejectAction = async (formData: FormData) => {
    "use server";
    const { rejectBookingAction } = await import("@/app/actions/ride");
    await rejectBookingAction(formData.get("bookingId") as string);
  };

  // Mock data for the CSS chart
  const chartData = [
    { month: "Jan", earnings: 120, rides: 15 },
    { month: "Feb", earnings: 250, rides: 22 },
    { month: "Mar", earnings: 180, rides: 18 },
    { month: "Apr", earnings: 340, rides: 30 },
    { month: "May", earnings: 290, rides: 25 },
    { month: "Jun", earnings: Math.max(currentBalance, 450), rides: Math.max(ridesOfferedCount, 35) },
  ];
  const maxEarnings = Math.max(...chartData.map(d => d.earnings));

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
                <p className="text-sm font-medium text-gray-500">Wallet Balance</p>
                <h3 className="text-3xl font-bold mt-1">₹{currentBalance.toFixed(2)}</h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Dynamic CSS Bar Chart */}
      <Card className="mb-8 border-none shadow-md overflow-hidden">
        <CardHeader className="bg-white pb-0">
          <CardTitle className="text-gray-800">Earnings Overview (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent className="bg-white pt-6">
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-6 mt-4">
            {chartData.map((data, i) => (
              <div key={i} className="flex flex-col items-center w-full group">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                  ₹{data.earnings}
                </div>
                {/* Bar */}
                <div 
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md hover:from-blue-700 hover:to-blue-500 transition-all duration-300 relative"
                  style={{ height: `${(data.earnings / maxEarnings) * 100}%`, minHeight: '4px' }}
                >
                  <div className="absolute -top-1 left-0 right-0 h-2 bg-blue-300/30 rounded-t-md"></div>
                </div>
                <div className="mt-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{data.month}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pendingRequests.length > 0 && (
          <Card className="lg:col-span-2 border-blue-200 shadow-sm">
            <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100">
              <CardTitle className="text-blue-800 flex items-center">
                <span className="relative flex h-3 w-3 mr-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                Pending Seat Requests ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-900">{req.passenger.name} <span className="font-normal text-gray-500">requests</span> {req.seatsBooked} seat(s)</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Ride to <span className="font-medium text-gray-700">{req.ride.dropLocation}</span> on {new Date(req.ride.travelDateTime).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <form action={acceptAction} className="flex-1 sm:flex-none">
                        <input type="hidden" name="bookingId" value={req.id} />
                        <Button type="submit" size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">Accept</Button>
                      </form>
                      <form action={rejectAction} className="flex-1 sm:flex-none">
                        <input type="hidden" name="bookingId" value={req.id} />
                        <Button type="submit" size="sm" variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">Reject</Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Trips</CardTitle>
          </CardHeader>
          <CardContent>
            {ridesOfferedCount === 0 && ridesTakenCount === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Navigation className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming trips scheduled.</p>
                <Link href="/find-ride">
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">Driver</span>
                      {ride.status !== "COMPLETED" && (
                        <Link href={`/ride/${ride.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2">Track</Button>
                        </Link>
                      )}
                    </div>
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
            <Link href="/find-ride" className="block">
              <Button className="w-full justify-start h-12 text-md">
                <Search className="mr-3 w-5 h-5" /> Find a Ride Now
              </Button>
            </Link>
            <Link href="/offer-ride" className="block">
              <Button variant="outline" className="w-full justify-start h-12 text-md">
                <Car className="mr-3 w-5 h-5" /> Publish a New Ride
              </Button>
            </Link>
            <Link href="/employee/wallet" className="block">
              <Button variant="outline" className="w-full justify-start h-12 text-md text-purple-600 border-purple-200 hover:bg-purple-50">
                <Wallet className="mr-3 w-5 h-5" /> Add/Withdraw Funds
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
