"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { submitDriverVerificationAction, simulateAdminApprovalAction } from "@/app/actions/driver";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";

interface DriverVerificationFormProps {
  initialStatus: "NEW" | "PENDING" | "REJECTED";
  initialRejectionReason?: string | null;
}

export function DriverVerificationForm({ initialStatus, initialRejectionReason }: DriverVerificationFormProps) {
  const [driverStatus, setDriverStatus] = useState<"NEW" | "PENDING" | "REJECTED">(initialStatus);
  const router = useRouter();

  const [isSubmittingDocs, setIsSubmittingDocs] = useState(false);

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleDocumentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingDocs(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const drivingLicenceFile = formData.get("drivingLicence") as File;
      const aadharCardFile = formData.get("aadharCard") as File;
      const vehiclePucFile = formData.get("vehiclePuc") as File;
      const driverPhotoFile = formData.get("driverPhoto") as File;
      const vehicleFrontFile = formData.get("vehicleFront") as File;
      const vehicleRearFile = formData.get("vehicleRear") as File;

      const docs = {
        drivingLicence: drivingLicenceFile?.size > 0 ? await toBase64(drivingLicenceFile) : undefined,
        aadharCard: aadharCardFile?.size > 0 ? await toBase64(aadharCardFile) : undefined,
        vehiclePuc: vehiclePucFile?.size > 0 ? await toBase64(vehiclePucFile) : undefined,
        driverPhoto: driverPhotoFile?.size > 0 ? await toBase64(driverPhotoFile) : undefined,
        vehicleFront: vehicleFrontFile?.size > 0 ? await toBase64(vehicleFrontFile) : undefined,
        vehicleRear: vehicleRearFile?.size > 0 ? await toBase64(vehicleRearFile) : undefined,
      };

      const res = await submitDriverVerificationAction(docs);
      if (res.success) {
        toast.success("Documents submitted successfully for verification.");
        setDriverStatus("PENDING");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to submit documents");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while uploading documents. They might be too large.");
    } finally {
      setIsSubmittingDocs(false);
    }
  };

  const handleSimulate = async () => {
    const res = await simulateAdminApprovalAction();
    if (res.success) {
      toast.success("Admin simulated approval!");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  if (driverStatus === "NEW" || driverStatus === "REJECTED") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <BackButton title="Back" />
        
        {driverStatus === "REJECTED" && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex gap-3">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold">Application Rejected</h3>
              <p className="text-sm mt-1">
                Your previous application was rejected for the following reason:<br/>
                <span className="font-medium text-red-900 mt-2 block p-2 bg-white rounded border border-red-100">"{initialRejectionReason}"</span>
              </p>
              <p className="text-xs mt-3">Please upload corrected documents below to re-submit.</p>
            </div>
          </div>
        )}

        {driverStatus === "NEW" && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex gap-3">
            <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold">First-Time Driver Verification</h3>
              <p className="text-sm mt-1">To ensure the safety of our corporate community, we require verification documents before you can offer a ride.</p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{driverStatus === "REJECTED" ? "Re-submit Verification Documents" : "Submit Verification Documents"}</CardTitle>
            <CardDescription>Please provide clear photos or scans of the following.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDocumentSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Driving Licence</Label>
                  <Input type="file" name="drivingLicence" accept="image/*" required />
                </div>
                <div className="space-y-2">
                  <Label>Aadhar Card</Label>
                  <Input type="file" name="aadharCard" accept="image/*" required />
                </div>
                <div className="space-y-2">
                  <Label>PUC Certificate</Label>
                  <Input type="file" name="vehiclePuc" accept="image/*" required />
                </div>
                <div className="space-y-2">
                  <Label>Your Personal Photo</Label>
                  <Input type="file" name="driverPhoto" accept="image/*" required />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Front (Number Plate)</Label>
                  <Input type="file" name="vehicleFront" accept="image/*" required />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Rear (Number Plate)</Label>
                  <Input type="file" name="vehicleRear" accept="image/*" required />
                </div>
              </div>

              <Button type="submit" className="w-full">Submit Documents for Review</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (driverStatus === "PENDING") {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-4">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold">Verification Pending</h2>
        <p className="text-gray-600">
          Your documents have been submitted and are currently being reviewed by our administrative team. 
          You will be able to offer rides once approved (usually within 24 hours).
        </p>
        <div className="mt-8">
          <Button variant="outline" onClick={handleSimulate}>
            [Simulate Admin Approval for Demo]
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
