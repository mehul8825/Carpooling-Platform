import Link from "next/link";
import { getCurrentUserAction, logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";
import { NotificationBell } from "./NotificationBell";

export async function Header() {
  const user = await getCurrentUserAction();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Car className="h-6 w-6" />
          <span>ShareRide</span>
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
              <div className="flex items-center gap-4">
                <NotificationBell />
              <span className="text-sm text-muted-foreground">
                Hello, <span className="font-semibold text-foreground">{user.name}</span>
              </span>
              <Link href="/offer-ride">
                <Button variant="outline" size="sm">Offer Ride</Button>
              </Link>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm" type="submit" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
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
        </nav>
      </div>
    </header>
  );
}
