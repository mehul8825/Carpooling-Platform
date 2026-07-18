import Link from "next/link";
import { getCurrentUserAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Search, PlusCircle, Shield, Zap, Users, ArrowRight, Sparkles } from "lucide-react";

export default async function Page() {
  const user = await getCurrentUserAction();

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 text-center bg-gradient-to-b from-background via-background to-muted/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Smart Carpooling Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Share Rides,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              Save Together
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-base sm:text-lg text-muted-foreground">
            Connect with verified colleagues, split fuel costs, and commute sustainably — all on one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/find-ride">
              <Button size="lg" className="gap-2 px-6 w-full sm:w-auto">
                <Search className="h-4 w-4" />
                Find a Ride
              </Button>
            </Link>
            <Link href="/offer-ride">
              <Button size="lg" variant="outline" className="gap-2 px-6 w-full sm:w-auto">
                <PlusCircle className="h-4 w-4" />
                Offer a Ride
              </Button>
            </Link>
          </div>

          {!user && (
            <p className="text-xs text-muted-foreground pt-2">
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                Create a free account
              </Link>{" "}
              to start booking rides.
            </p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-10">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center border-dashed">
              <CardContent className="pt-6 space-y-3">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">1. Driver Offers</h3>
                <p className="text-sm text-muted-foreground">
                  The driver sets their pickup &amp; drop-off, configures seats &amp; fare, and publishes the ride.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-dashed">
              <CardContent className="pt-6 space-y-3">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">2. Passenger Finds</h3>
                <p className="text-sm text-muted-foreground">
                  The passenger enters their route. The platform shows rides that pass nearby and they request a seat.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-dashed">
              <CardContent className="pt-6 space-y-3">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">3. Driver Approves</h3>
                <p className="text-sm text-muted-foreground">
                  The driver reviews incoming requests and approves passengers. Seats update in real-time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-10">Why ShareRide?</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex gap-4 p-4">
              <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Verified Users</h3>
                <p className="text-xs text-muted-foreground mt-1">Every participant is verified with their corporate identity.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Smart Matching</h3>
                <p className="text-xs text-muted-foreground mt-1">Proximity-based route matching using real map data.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Live Tracking</h3>
                <p className="text-xs text-muted-foreground mt-1">GPS tracking with automatic offline detection.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
