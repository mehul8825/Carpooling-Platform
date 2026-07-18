import { FindRideForm } from "@/components/ride/FindRideForm";
import { PassengerBookings } from "@/components/ride/PassengerBookings";
import { getMyBookingsAction } from "@/app/actions/ride";
import { getCurrentUserAction } from "@/app/actions/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Inbox } from "lucide-react";

export default async function FindRidePage() {
  const user = await getCurrentUserAction();
  const { bookings } = await getMyBookingsAction();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Find a Ride</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search for rides along your route and request a seat.
        </p>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList>
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Search Rides
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <Inbox className="h-4 w-4" />
            My Bookings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <FindRideForm userId={user?.id} />
        </TabsContent>

        <TabsContent value="bookings">
          <PassengerBookings bookings={(bookings || []) as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
