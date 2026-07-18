import { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Car, FileText, Settings, LogOut, ShieldCheck } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 border-r border-slate-800 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold text-lg">
          <ShieldCheck className="w-6 h-6 mr-2 text-blue-400" />
          Admin Portal
        </div>
        
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center space-x-3 p-2 rounded-md">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold border border-slate-700">
              AD
            </div>
            <div>
              <p className="font-semibold text-sm">System Admin</p>
              <p className="text-xs text-slate-400">admin@carpool.com</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2 px-4">Overview</div>
          <Link href="/admin" className="flex items-center px-4 py-2.5 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3 text-slate-400" /> Dashboard
          </Link>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-4">Management</div>
          <Link href="/admin/employees" className="flex items-center px-4 py-2.5 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
            <Users className="w-5 h-5 mr-3 text-slate-400" /> Employees
          </Link>
          <Link href="/admin/vehicles" className="flex items-center px-4 py-2.5 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
            <Car className="w-5 h-5 mr-3 text-slate-400" /> Vehicles
          </Link>
          <Link href="/admin/rides" className="flex items-center px-4 py-2.5 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
            <FileText className="w-5 h-5 mr-3 text-slate-400" /> All Rides
          </Link>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-4">System</div>
          <Link href="/admin/settings" className="flex items-center px-4 py-2.5 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
            <Settings className="w-5 h-5 mr-3 text-slate-400" /> Settings
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <Link href="/auth/signin" className="flex items-center px-4 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 rounded-md transition-colors">
            <LogOut className="w-5 h-5 mr-3" /> Logout
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center md:hidden">
            <ShieldCheck className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Admin</h1>
          </div>
          <div className="hidden md:flex">
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">System Overview</h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-900">
          {children}
        </div>
      </main>
    </div>
  );
}
