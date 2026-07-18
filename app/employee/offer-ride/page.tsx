import { getCurrentUserAction } from "@/app/actions/auth";
import { OfferRideClient } from "./OfferRideClient";
import { redirect } from "next/navigation";

export default async function OfferRidePage() {
  const user = await getCurrentUserAction();
  if (!user) {
    redirect("/auth/signin");
  }

  let status = "NEW";
  if (user.driverProfile) {
    status = user.driverProfile.status;
  }

  return (
    <OfferRideClient 
      initialStatus={status as "NEW" | "PENDING" | "APPROVED"} 
      vehicles={user.vehicles || []}
    />
  );
}
