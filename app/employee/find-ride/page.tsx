"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Calendar, Users, Car } from "lucide-react";
import { searchRidesAction } from "@/app/actions/ride";
import { toast } from "sonner";
import { BookRideButton } from "@/components/ride/BookRideButton";
import { BackButton } from "@/components/ui/BackButton";

export default function FindRidePage() {
  const [rides, setRides] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      from: formData.get("from") as string,
      to: formData.get("to") as string,
      seats: parseInt(formData.get("seats") as string) || 1,
    };

    const res = await searchRidesAction(data);
    setLoading(false);
    setHasSearched(true);
    if (res.success && res.rides) {
      setRides(res.rides);
    } else {
      toast.error(res.error || "Failed to search rides");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <BackButton title="Back to Dashboard" />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Where do you want to go?</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex items-center space-x-2 border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <MapPin className="w-5 h-5 text-gray-400" />
              <Input name="from" className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto" placeholder="Current Location" defaultValue="" />
            </div>
            <div className="flex items-center space-x-2 border rounded-md px-3 py-2 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <Search className="w-5 h-5 text-blue-500" />
              <Input name="to" className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto" placeholder="Destination" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input type="datetime-local" name="date" />
              </div>
              <div className="space-y-2">
                <Label>Seats Needed</Label>
                <Input type="number" name="seats" min="1" max="4" defaultValue="1" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-2" size="lg">
              {loading ? "Searching..." : "Search Rides"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Search Results ({rides.length})</h2>
          
          {rides.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border text-center">
                <Car className="w-16 h-16 text-slate-300 stroke-[1.5]" />
                <h3 className="mt-4 text-lg font-semibold text-slate-800">No rides found</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1">Try adjusting your search criteria</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rides.map((ride) => (
                <Card key={ride.id} className="shadow-sm hover:shadow-md transition-shadow border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-base font-semibold truncate text-slate-800">
                          {ride.driver.name}&apos;s Ride
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Vehicle: {ride.vehicle.vehicleModel} ({ride.vehicle.registrationNo})
                        </CardDescription>
                      </div>
                      <span className="text-lg font-bold text-slate-950 flex items-center shrink-0">
                        ₹{ride.farePerSeat}
                        <span className="text-xs font-normal text-slate-500">/seat</span>
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 pb-4">
                    <div className="space-y-2 relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                      <div className="text-sm flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="truncate text-slate-700 font-medium">{ride.pickupLocation}</span>
                      </div>
                      <div className="text-sm flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span className="truncate text-slate-700 font-medium">{ride.dropLocation}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(ride.travelDateTime).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {ride.availableSeats} seats left
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <BookRideButton 
                      rideId={ride.id} 
                      passengerId={"placeholder"} 
                      pricePerSeat={ride.farePerSeat} 
                    />
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
