import { getCurrentUserAction } from "@/app/actions/auth";
import { OfferRideClient } from "./OfferRideClient";
import { redirect } from "next/navigation";

export default async function OfferRidePage() {
  const user = await getCurrentUserAction();
  if (!user) {
    redirect("/auth/signin");
  }

  let status = "NEW";
  let rejectionReason: string | null = null;
  if (user.driverProfile) {
    status = user.driverProfile.status;
    rejectionReason = user.driverProfile.rejectionReason;
  }

  return (
    <OfferRideClient 
      initialStatus={status as "NEW" | "PENDING" | "APPROVED" | "REJECTED"} 
      vehicles={user.vehicles || []}
      initialRejectionReason={rejectionReason}
    />
  );
}
