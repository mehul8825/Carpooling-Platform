import { ReactNode } from "react";
import { ShieldCheck, Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 md:gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col col-span-1 border rounded-xl bg-card text-card-foreground shadow-sm h-fit">

          <AdminSidebar />
        </aside>

        {/* Mobile Sidebar & Main Content */}
        <main className="col-span-1 md:col-span-3">
          <div className="md:hidden flex items-center mb-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Menu className="h-4 w-4" /> Admin Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-white dark:bg-gray-800 border-r-gray-200 dark:border-r-gray-700">
                <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
                <div className="p-6 border-b dark:border-gray-800">
                  <h2 className="font-bold text-xl tracking-tight flex items-center text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="w-5 h-5 mr-2" /> Admin Portal
                  </h2>
                </div>
                <AdminSidebar />
              </SheetContent>
            </Sheet>
          </div>

          <div className="bg-transparent">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
