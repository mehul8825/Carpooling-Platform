import { prisma } from "@/lib/db";
import { getCurrentUserAction } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock, CheckCircle2, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveDriverAction } from "@/app/actions/admin";
import { RejectDriverButton } from "@/components/admin/RejectDriverButton";
import { DocumentViewerModal } from "@/components/admin/DocumentViewerModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function VerificationsPage() {
  const admin = await getCurrentUserAction();
  if (!admin || admin.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  const allProfiles = await prisma.driverProfile.findMany({
    include: { user: true },
    orderBy: { createdAt: "asc" }
  });

  const pendingProfiles = allProfiles.filter(p => p.status === "PENDING");
  const processedProfiles = allProfiles.filter(p => p.status !== "PENDING");

  const approveWrapper = async (formData: FormData) => {
    "use server";
    const userId = formData.get("userId") as string;
    await approveDriverAction(userId);
  };

  const renderProfileDocs = (profile: any) => (
    <div className="flex flex-wrap gap-2">
      {profile.drivingLicence && (
        <DocumentViewerModal title="Driving Licence" label="Licence" src={profile.drivingLicence} />
      )}
      {profile.aadharCard && (
        <DocumentViewerModal title="Aadhar Card" label="Aadhar" src={profile.aadharCard} />
      )}
      {profile.vehicleFront && (
        <DocumentViewerModal title="Vehicle Front" label="Veh Front" src={profile.vehicleFront} />
      )}
      {profile.vehicleRear && (
        <DocumentViewerModal title="Vehicle Rear" label="Veh Rear" src={profile.vehicleRear} />
      )}
      {profile.vehiclePuc && (
        <DocumentViewerModal title="Vehicle PUC" label="PUC" src={profile.vehiclePuc} />
      )}
      {profile.driverPhoto && (
        <DocumentViewerModal title="Driver Photo" label="Photo" src={profile.driverPhoto} />
      )}
      
      {!profile.drivingLicence && !profile.aadharCard && !profile.vehicleFront && !profile.driverPhoto && (
        <span className="text-sm text-slate-400 italic bg-slate-50 px-3 py-1 rounded-md border border-slate-100">No documents uploaded</span>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Driver Verifications</h2>
          <p className="text-slate-500 text-sm mt-1">Review and manage driver submitted documents.</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pending ({pendingProfiles.length})
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Processed ({processedProfiles.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingProfiles.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">All Caught Up!</h3>
                  <p className="mt-1">There are no pending driver verifications at the moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProfiles.map(profile => (
                    <div key={profile.id} className="p-5 border rounded-lg border-slate-200 bg-white dark:bg-slate-900 shadow-sm">
                      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{profile.user.name} <span className="text-slate-400 font-normal text-sm">@{profile.user.username}</span></h4>
                          <p className="text-sm text-slate-500 mt-1">Requested: {new Date(profile.createdAt).toLocaleString()}</p>
                          
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Submitted Documents</p>
                            {renderProfileDocs(profile)}
                          </div>
                        </div>
                        
                        <div className="flex lg:flex-col gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6">
                          <form action={approveWrapper} className="flex-1 lg:flex-none">
                            <input type="hidden" name="userId" value={profile.userId} />
                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                              <CheckCircle className="w-4 h-4 mr-2" /> Approve
                            </Button>
                          </form>
                          <div className="flex-1 lg:flex-none">
                            <RejectDriverButton userId={profile.userId} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="processed" className="space-y-4">
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                Processed Verifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {processedProfiles.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="mt-1">No verifications have been processed yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {processedProfiles.map(profile => (
                    <div key={profile.id} className="p-5 border rounded-lg border-slate-200 bg-white dark:bg-slate-900 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{profile.user.name} <span className="text-slate-400 font-normal text-sm">@{profile.user.username}</span></h4>
                            {profile.status === "APPROVED" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                <CheckCircle className="w-3 h-3 mr-1" /> Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" /> Rejected
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">Last Updated: {new Date(profile.updatedAt).toLocaleString()}</p>
                          
                          {profile.status === "REJECTED" && profile.rejectionReason && (
                            <div className="mt-2 text-sm text-red-700 bg-red-50 p-2 rounded border border-red-100">
                              <span className="font-semibold">Reason:</span> {profile.rejectionReason}
                            </div>
                          )}
                          
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Documents on File</p>
                            {renderProfileDocs(profile)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
