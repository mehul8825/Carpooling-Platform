import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, Map, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getCurrentUserAction } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { approveDriverAction } from "@/app/actions/admin";
import { RejectDriverButton } from "@/components/admin/RejectDriverButton";

export default async function AdminDashboardOverview() {
  const admin = await getCurrentUserAction();
  if (!admin || admin.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  const totalEmployees = await prisma.user.count({ where: { role: "EMPLOYEE" } });
  const registeredVehicles = await prisma.vehicle.count();
  const activeRides = await prisma.ride.count({ where: { status: { in: ["PUBLISHED", "ONGOING"] } } });
  const pendingApprovalsCount = await prisma.driverProfile.count({ where: { status: "PENDING" } });

  const pendingProfiles = await prisma.driverProfile.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: "asc" }
  });

  const approveWrapper = async (formData: FormData) => {
    "use server";
    const userId = formData.get("userId") as string;
    await approveDriverAction(userId);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">System Dashboard</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Employees</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-800 dark:text-white">{totalEmployees}</h3>
              </div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Registered Vehicles</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-800 dark:text-white">{registeredVehicles}</h3>
              </div>
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Car className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Rides</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-800 dark:text-white">{activeRides}</h3>
              </div>
              <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/30 rounded-full flex items-center justify-center">
                <Map className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Approvals</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-800 dark:text-white">{pendingApprovalsCount}</h3>
              </div>
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Recent Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-400">
              <p>Logs disabled for demo.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Pending Driver Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingProfiles.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p>All driver documents have been processed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingProfiles.map(profile => (
                  <div key={profile.id} className="p-4 border rounded-lg border-slate-200 bg-white">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <h4 className="font-semibold text-slate-800">{profile.user.name} (@{profile.user.username})</h4>
                        <p className="text-sm text-slate-500 mt-1">Requested: {new Date(profile.createdAt).toLocaleString()}</p>
                        <div className="flex gap-2 mt-2">
                          <a href="https://placehold.co/600x400/EEE/31343C?font=montserrat&text=Licence+Document" target="_blank" className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors">
                            <FileText className="w-3 h-3"/> View Licence
                          </a>
                          <a href="https://placehold.co/600x400/EEE/31343C?font=montserrat&text=Aadhar+Card" target="_blank" className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors">
                            <FileText className="w-3 h-3"/> View Aadhar
                          </a>
                          <a href="https://placehold.co/600x400/EEE/31343C?font=montserrat&text=Vehicle+Photos" target="_blank" className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors">
                            <FileText className="w-3 h-3"/> View Vehicle
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 shrink-0">
                        <RejectDriverButton userId={profile.userId} />
                        <form action={approveWrapper}>
                          <input type="hidden" name="userId" value={profile.userId} />
                          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
