import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfferRideForm } from "@/components/ride/OfferRideForm";
import { DriverBookings } from "@/components/ride/DriverBookings";
import { getMyRidesAction } from "@/app/actions/ride";
import { getCurrentUserAction } from "@/app/actions/auth";
import { PlusCircle, Inbox } from "lucide-react";

export default async function OfferRidePage() {
  const { rides } = await getMyRidesAction();
  const user = await getCurrentUserAction();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Offer a Ride</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Publish your commute and manage passenger requests.
        </p>
      </div>

      <Tabs defaultValue="publish" className="space-y-6">
        <TabsList>
          <TabsTrigger value="publish" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Publish
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Inbox className="h-4 w-4" />
            My Rides & Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="publish">
          <OfferRideForm userId={user?.id} />
        </TabsContent>

        <TabsContent value="requests">
          <DriverBookings rides={(rides || []) as any} userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
