"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Car, ShieldCheck, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { submitDriverVerificationAction, simulateAdminApprovalAction } from "@/app/actions/driver";
import { publishRideAction } from "@/app/actions/ride";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";

interface OfferRideClientProps {
  initialStatus: "NEW" | "PENDING" | "APPROVED" | "REJECTED";
  vehicles: any[];
  initialRejectionReason?: string | null;
}

export function OfferRideClient({ initialStatus, vehicles, initialRejectionReason }: OfferRideClientProps) {
  const [driverStatus, setDriverStatus] = useState<"NEW" | "PENDING" | "APPROVED" | "REJECTED">(initialStatus);
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

  const handlePublishRide = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      from: formData.get("from") as string,
      to: formData.get("to") as string,
      date: formData.get("date") as string,
      seats: parseInt(formData.get("seats") as string),
      fare: parseFloat(formData.get("fare") as string),
      vehicleId: formData.get("vehicleId") as string,
    };
    
    if (!data.vehicleId) {
      return toast.error("Please select a vehicle");
    }

    const res = await publishRideAction({
      pickupLocation: data.from,
      pickupLat: 0,
      pickupLng: 0,
      dropLocation: data.to,
      dropLat: 0,
      dropLng: 0,
      travelDateTime: data.date,
      availableSeats: data.seats,
      farePerSeat: data.fare,
    });
    if (res.success) {
      toast.success("Ride published successfully!");
      router.push("/employee");
    } else {
      toast.error(res.error);
    }
  };

  const handleSimulate = async () => {
    const res = await simulateAdminApprovalAction();
    if (res.success) {
      toast.success("Admin simulated approval!");
      setDriverStatus("APPROVED");
      router.refresh();
    }
  };

  if (driverStatus === "NEW" || driverStatus === "REJECTED") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <BackButton title="Back to Dashboard" />
        
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="shadow-md border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Car className="w-6 h-6 text-blue-600" /> Publish a Ride</CardTitle>
          <CardDescription>Share your daily commute route to find passengers.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePublishRide} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input name="from" className="pl-9" placeholder="Home Address" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input name="to" className="pl-9" placeholder="Office Campus" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input name="date" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label>Available Seats</Label>
                <Input name="seats" type="number" min="1" max="6" defaultValue="3" required />
              </div>
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <select name="vehicleId" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="">Select a vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.vehicleModel} ({v.registrationNo})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Fare per Seat ($)</Label>
                <Input name="fare" type="number" defaultValue="5" required />
              </div>
            </div>
            <Button type="submit" className="w-full mt-4" size="lg">Publish Ride</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
