import Link from "next/link";
import { getCurrentUserAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookRideButton } from "@/components/ride/BookRideButton";
import { Car, MapPin, Calendar, Users, DollarSign, Shield, Zap, Sparkles } from "lucide-react";

export default async function Page() {
  const user = await getCurrentUserAction();

  // Fetch published rides
  const rides = await prisma.ride.findMany({
    where: {
      status: "PUBLISHED",
      availableSeats: { gt: 0 },
    },
    include: {
      driver: true,
      vehicle: true,
    },
    orderBy: {
      travelDateTime: "asc",
    },
  });

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </main>
    </div>
  );
}
