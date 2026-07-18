import { TripPlanner } from "@/components/map/TripPlanner";

export default function OfferRidePage() {
  return (
    <div className="container mx-auto p-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Offer a Ride</h1>
        <p className="text-muted-foreground mt-2">
          Plan your route and publish your ride for passengers to join.
        </p>
      </div>
      
      <TripPlanner />
    </div>
  );
}
