import { getCurrentUserAction } from "@/app/actions/auth";
import { FindRideForm } from "@/components/ride/FindRideForm";
import { BackButton } from "@/components/ui/BackButton";

export default async function FindRidePage() {
  const user = await getCurrentUserAction();
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <BackButton title="Back to Dashboard" />
      <FindRideForm userId={user?.id} />
    </div>
  );
}
