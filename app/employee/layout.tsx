import { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, Search, Car, History, Wallet, User, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b dark:border-gray-700 font-bold text-lg text-blue-600 dark:text-blue-400">
          CarpoolApp
        </div>
        
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 font-bold">
              EMP
            </div>
            <div>
              <p className="font-semibold text-sm">Employee User</p>
              <Link href="/employee/profile" className="text-xs text-blue-600 dark:text-blue-400 font-medium">View Profile</Link>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
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
        </nav>
        
        <div className="p-4 border-t dark:border-gray-700">
          <Link href="/auth/signin" className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
            <LogOut className="w-5 h-5 mr-3" /> Logout
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center md:hidden">
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">CarpoolApp</h1>
          </div>
          <div className="hidden md:flex">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Employee Portal</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Balance: <span className="text-green-600 font-bold">$0.00</span></span>
            <NotificationBell />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
