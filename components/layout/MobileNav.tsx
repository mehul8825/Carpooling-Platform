"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { logoutAction } from "@/app/actions/auth";
import { Menu, Search, PlusCircle, LogOut, User } from "lucide-react";

interface MobileNavProps {
  user: { id: string; name: string | null; email: string | null; role: string } | null;
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" />
        }
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1 mt-6">
          <Button variant="ghost" className="justify-start gap-3" onClick={() => navigate("/find-ride")}>
            <Search className="h-4 w-4" />
            Find Ride
          </Button>
          <Button variant="ghost" className="justify-start gap-3" onClick={() => navigate("/offer-ride")}>
            <PlusCircle className="h-4 w-4" />
            Offer Ride
          </Button>
        </div>

        <Separator className="my-4" />

        {user ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <form action={async () => {
              await logoutAction();
              setOpen(false);
              router.push("/");
              router.refresh();
            }}>
              <Button variant="ghost" type="submit" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={() => navigate("/auth/signin")}>
              Sign In
            </Button>
            <Button className="w-full" onClick={() => navigate("/auth/signup")}>
              Sign Up
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
