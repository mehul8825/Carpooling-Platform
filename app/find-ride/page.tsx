import { FindRideForm } from "@/components/ride/FindRideForm";
import { getCurrentUserAction } from "@/app/actions/auth";

export default async function FindRidePage() {
  const user = await getCurrentUserAction();
  return <FindRideForm userId={user?.id} />;
}
