import { ReactNode } from "react";
import { ShieldCheck, Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <aside className="w-64 hidden md:flex flex-col h-full bg-white dark:bg-gray-800 border-r dark:border-gray-700">
        <AdminSidebar />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-4 md:px-6 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="md:hidden text-gray-600 dark:text-gray-300" />
                }
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-white dark:bg-gray-800 border-r-gray-200 dark:border-r-gray-700">
                {/* Add VisuallyHidden Title for accessibility */}
                <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
                <AdminSidebar />
              </SheetContent>
            </Sheet>
            <div className="flex items-center">
              <ShieldCheck className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Admin</h1>
            </div>
          </div>
          <div className="hidden md:flex">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">System Overview</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
          {children}
        </div>
      </main>
    </div>
  );
}
