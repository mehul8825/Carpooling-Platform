import { OfferRideForm } from "@/components/ride/OfferRideForm";
import { getCurrentUserAction } from "@/app/actions/auth";

export default async function OfferRidePage() {
  const user = await getCurrentUserAction();
  return <OfferRideForm userId={user?.id} />;
}
