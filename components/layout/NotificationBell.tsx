"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getUnreadNotificationsAction, markNotificationsAsReadAction } from "@/app/actions/notifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    const res = await getUnreadNotificationsAction();
    if (res.success && res.data) {
      setNotifications(res.data);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 15 seconds for demo purposes
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && notifications.length > 0) {
      // Mark as read when opened
      const ids = notifications.map(n => n.id);
      await markNotificationsAsReadAction(ids);
      // We will optimistic update so the badge clears immediately
      setNotifications([]);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-slate-100 hover:text-slate-900 h-10 w-10 text-slate-600 hover:text-blue-600 hover:bg-blue-50">
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-lg border-slate-200">
        <div className="bg-slate-50 border-b border-slate-100 p-3 font-semibold text-sm text-slate-800">
          Notifications
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No new notifications.
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm last:border-0">
                  <div className="font-semibold text-slate-800">{notif.title}</div>
                  <div className="text-slate-600 mt-0.5 leading-snug">{notif.message}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
