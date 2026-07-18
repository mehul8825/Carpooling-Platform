"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { updateCompanySettingsAction } from "@/app/actions/admin";

interface SettingsFormProps {
  initialData: {
    companyName: string;
    costPerKm: number;
    adminEmail: string;
  } | null;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [companyName, setCompanyName] = useState(initialData?.companyName || "Carpooling Inc");
  const [costPerKm, setCostPerKm] = useState(initialData?.costPerKm?.toString() || "5.0");
  const [adminEmail, setAdminEmail] = useState(initialData?.adminEmail || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const res = await updateCompanySettingsAction({ 
          companyName, 
          costPerKm: parseFloat(costPerKm), 
          adminEmail 
        });
        
        if (res.success) {
          toast.success("Settings updated successfully!");
        } else {
          toast.error(res.error || "Failed to update settings.");
        }
      } catch (err) {
        toast.error("An unexpected error occurred.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company Name</label>
          <Input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={isPending}
            placeholder="Carpooling Inc"
          />
          <p className="text-xs text-slate-500">The name of your organization displayed across the platform.</p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Travel Cost per KM (₹)</label>
          <Input
            required
            type="number"
            step="0.1"
            value={costPerKm}
            onChange={(e) => setCostPerKm(e.target.value)}
            disabled={isPending}
            placeholder="5.0"
          />
          <p className="text-xs text-slate-500">Default fare calculation metric per passenger per kilometer.</p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Administrator Email</label>
          <Input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            disabled={isPending}
            placeholder="admin@company.com"
          />
          <p className="text-xs text-slate-500">Primary contact for platform support issues.</p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
