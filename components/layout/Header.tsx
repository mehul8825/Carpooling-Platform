import Link from "next/link";
import { getCurrentUserAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Car, Search, PlusCircle, LogOut, Menu, User, LayoutDashboard, Wallet, ShieldCheck } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { prisma } from "@/lib/db";

export async function Header() {
  const user = await getCurrentUserAction();
  
  let currentBalance = 0;
  if (user) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    currentBalance = wallet?.balance || 0;
  }

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
          <Link href="/find-ride">
            <Button variant="ghost" size="sm" className="gap-2">
              <Search className="h-4 w-4" />
              Find Ride
            </Button>
          </Link>
          <Link href="/offer-ride">
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
              {/* Added Balance & Notification */}
              <div className="hidden lg:flex items-center space-x-4 mr-2">
                <Link href="/employee/wallet">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 cursor-pointer transition-colors bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full border">
                    <Wallet className="w-4 h-4 inline mr-2 text-purple-500" />
                    <span className="text-green-600 font-bold">₹{currentBalance.toFixed(2)}</span>
                  </span>
                </Link>
                <NotificationBell />
              </div>
              <Separator orientation="vertical" className="h-5 hidden lg:block" />
              
              {/* Dashboard Link based on Role */}
              {user.role === "ADMIN" ? (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              ) : (
                <Link href="/employee">
                  <Button variant="outline" size="sm" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
              
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground ml-2">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-foreground max-w-[100px] truncate">
                  {user.name}
                </span>
              </div>
              <Separator orientation="vertical" className="h-5 hidden sm:block" />
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
