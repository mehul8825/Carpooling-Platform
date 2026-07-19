import { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, Search, Car, History, Wallet, User, LogOut, PieChart, Settings } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getCurrentUserAction } from "@/app/actions/auth";
import { prisma } from "@/lib/db";

export default async function EmployeeLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUserAction();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 md:gap-8">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col col-span-1 border rounded-xl bg-card text-card-foreground shadow-sm h-fit">
          <div className="p-6 border-b dark:border-gray-800">
            <h2 className="font-bold text-xl tracking-tight text-blue-600 dark:text-blue-400">Employee Portal</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage your rides and account</p>
          </div>
          
          <nav className="p-4 space-y-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 px-4">Overview</div>
          <Link href="/employee" className="flex items-center px-4 py-2.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </Link>

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6 px-4">Ride Actions</div>
          <Link href="/find-ride" className="flex items-center px-4 py-2.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Search className="w-5 h-5 mr-3" /> Find a Ride
          </Link>
          <Link href="/offer-ride" className="flex items-center px-4 py-2.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Car className="w-5 h-5 mr-3" /> Offer a Ride
          </Link>

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6 px-4">Account</div>
          <Link href="/employee/history" className="flex items-center px-4 py-2.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <History className="w-5 h-5 mr-3" /> Ride History
          </Link>
          <Link href="/employee/wallet" className="flex items-center px-4 py-2.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Wallet className="w-5 h-5 mr-3" /> Wallet & Earnings
          </Link>
          <Link href="/employee/reports" className="flex items-center px-4 py-2.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <PieChart className="w-5 h-5 mr-3" /> Reports & Analytics
          </Link>
          <Link href="/employee/settings" className="flex items-center px-4 py-2.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Settings className="w-5 h-5 mr-3" /> Settings
          </Link>
        </nav>
        
          <div className="p-4 border-t dark:border-gray-800 mt-4">
            <form action={async () => {
              "use server";
              const { logoutAction } = await import("@/app/actions/auth");
              await logoutAction();
            }}>
              <button type="submit" className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                <LogOut className="w-5 h-5 mr-3" /> Logout
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="col-span-1 md:col-span-3">
          {children}
        </main>
      </div>
    </div>
  );
}
