import { OfferRideForm } from "@/components/ride/OfferRideForm";
import { getCurrentUserAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";

export default async function OfferRidePage() {
  const user = await getCurrentUserAction();
  let savedLocations: any[] = [];
  if (user) {
    savedLocations = await prisma.savedLocation.findMany({ where: { userId: user.id } });
  }
  return <OfferRideForm userId={user?.id} savedLocations={savedLocations} />;
}
