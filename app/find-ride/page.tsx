import { FindRideForm } from "@/components/ride/FindRideForm";
import { getCurrentUserAction } from "@/app/actions/auth";

export default async function FindRidePage() {
  const user = await getCurrentUserAction();
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Find a Ride</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search for rides along your route and request a seat.
        </p>
      </div>

      <FindRideForm userId={user?.id} />
    </div>
  );
}
