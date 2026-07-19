import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, Map, AlertTriangle, Route } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUserAction } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardOverview() {
  const admin = await getCurrentUserAction();
  if (!admin || admin.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  const totalEmployees = await prisma.user.count({ where: { role: "EMPLOYEE" } });
  const registeredVehicles = await prisma.vehicle.count();
  const activeRides = await prisma.ride.count({ where: { status: { in: ["PUBLISHED", "ONGOING"] } } });
  const pendingApprovalsCount = await prisma.driverProfile.count({ where: { status: "PENDING" } });

  // Mock data for Admin CSS chart (Platform Revenue)
  const chartData = [
    { month: "Jan", revenue: 450, users: 120 },
    { month: "Feb", revenue: 600, users: 150 },
    { month: "Mar", revenue: 550, users: 145 },
    { month: "Apr", revenue: 800, users: 210 },
    { month: "May", revenue: 750, users: 195 },
    { month: "Jun", revenue: 950, users: 240 },
  ];
  const maxRevenue = Math.max(...chartData.map(d => d.revenue));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">System Dashboard</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Active platform users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Registered Vehicles
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registeredVehicles}</div>
            <p className="text-xs text-muted-foreground mt-1">Total fleet size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Rides
            </CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRides}</div>
            <p className="text-xs text-muted-foreground mt-1">Ongoing or published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovalsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires admin review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Platform Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2 sm:gap-6 mt-4">
              {chartData.map((data, i) => (
                <div key={i} className="flex flex-col items-center w-full group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                    ₹{data.revenue}
                  </div>
                  <div 
                    className="w-full bg-primary/90 rounded-t-md hover:bg-primary transition-all duration-300 relative"
                    style={{ height: `${(data.revenue / maxRevenue) * 100}%`, minHeight: '4px' }}
                  >
                  </div>
                  <div className="mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{data.month}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-12 text-md" asChild>
                <Link href="/admin/employees">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 text-md" asChild>
                <Link href="/admin/verifications">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Approve Drivers
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 text-md" asChild>
                <Link href="/admin/vehicles">
                  <Car className="w-4 h-4 mr-2" />
                  View Vehicles
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 text-md" asChild>
                <Link href="/admin/rides">
                  <Route className="w-4 h-4 mr-2" />
                  All Rides
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
    </div>
    </div>
  )
}
