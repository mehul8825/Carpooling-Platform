import Link from "next/link";
import { getCurrentUserAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Car, Search, PlusCircle, LogOut, Menu, User } from "lucide-react";
import { MobileNav } from "./MobileNav";

export async function Header() {
  const user = await getCurrentUserAction();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground">
            <Car className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline-block">ShareRide</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/employee/find-ride">
            <Button variant="ghost" size="sm" className="gap-2">
              <Search className="h-4 w-4" />
              Find Ride
            </Button>
          </Link>
          <Link href="/employee/offer-ride">
            <Button variant="ghost" size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Offer Ride
            </Button>
          </Link>
        </nav>

        {/* Desktop Auth / User */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-foreground max-w-[120px] truncate">
                  {user.name}
                </span>
              </div>
              <Separator orientation="vertical" className="h-5" />
              <form action={async () => {
                "use server";
                const { logoutAction } = await import("@/app/actions/auth");
                await logoutAction();
              }}>
                <Button variant="ghost" size="sm" type="submit" className="gap-2 text-muted-foreground hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Nav Trigger */}
        <MobileNav user={user} />
      </div>
    </header>
  );
}
