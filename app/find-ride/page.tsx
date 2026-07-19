import { FindRideForm } from "@/components/ride/FindRideForm";
import { getCurrentUserAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";

export default async function FindRidePage() {
  const user = await getCurrentUserAction();
  let savedLocations: any[] = [];
  if (user) {
    savedLocations = await prisma.savedLocation.findMany({ where: { userId: user.id } });
  }
  return <FindRideForm userId={user?.id} savedLocations={savedLocations} />;
}
