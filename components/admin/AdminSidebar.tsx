"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Car, FileText, Settings, LogOut, ShieldCheck, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();

  const routes = [
    {
      group: "Overview",
      items: [
        { href: "/admin", icon: LayoutDashboard, label: "Dashboard" }
      ]
    },
    {
      group: "Management",
      items: [
        { href: "/admin/verifications", icon: CheckCircle, label: "Verifications" },
        { href: "/admin/employees", icon: Users, label: "Employees" },
        { href: "/admin/vehicles", icon: Car, label: "Vehicles" },
        { href: "/admin/rides", icon: FileText, label: "All Rides" }
      ]
    },
    {
      group: "System",
      items: [
        { href: "/admin/settings", icon: Settings, label: "Settings" }
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r dark:border-gray-700">
      <div className="h-16 flex items-center px-6 border-b dark:border-gray-700 font-bold text-lg text-blue-600 dark:text-blue-400 flex-shrink-0">
        <ShieldCheck className="w-6 h-6 mr-2" />
        Admin Portal
      </div>
      
      <div className="p-4 border-b dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-full flex items-center justify-center font-bold">
            AD
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">System Admin</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">admin@carpool.com</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {routes.map((group, index) => (
          <div key={index}>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 px-4 first:mt-0">
              {group.group}
            </div>
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={cn(
                    "flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors mb-1",
                    active 
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 mr-3", active ? "text-blue-700 dark:text-blue-400" : "text-gray-400 dark:text-gray-500")} /> 
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t dark:border-gray-700 flex-shrink-0">
        <Link href="/auth/signin" className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
          <LogOut className="w-5 h-5 mr-3" /> Logout
        </Link>
      </div>
    </div>
  );
}
