import { getCompanySettingsAction } from "@/app/actions/admin";
import { getCurrentUserAction } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const admin = await getCurrentUserAction();
  if (!admin || admin.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  const settings = await getCompanySettingsAction();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">System Configuration</h2>
      </div>

      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            Global Settings
          </CardTitle>
          <CardDescription>
            Manage application-wide parameters for the carpooling platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm initialData={settings ? { ...settings, adminEmail: settings.adminEmail || "" } : null} />
        </CardContent>
      </Card>
    </div>
  );
}
