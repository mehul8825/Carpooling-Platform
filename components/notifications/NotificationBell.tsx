"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getUnreadNotificationsAction, markNotificationsAsReadAction } from "@/app/actions/notifications";
import { getCurrentUserAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string | Date;
  isRead: boolean;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { socket } = useSocket(userId || "");

  // Fetch initial user id and notifications
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      const user = await getCurrentUserAction();
      if (user && mounted) {
        setUserId(user.id);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const fetchNotifications = async () => {
    const res = await getUnreadNotificationsAction();
    if (res.success && res.data) {
      setNotifications(res.data);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotification = () => {
      fetchNotifications();
    };
    
    socket.on("new_notification", handleNewNotification);
    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket]);

  const handleMarkAsRead = async (ids: string[]) => {
    // Optimistic update
    setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
    
    // Server update
    await markNotificationsAsReadAction(ids);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center">
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h4>
          {notifications.length > 0 && (
            <button 
              onClick={() => handleMarkAsRead(notifications.map(n => n.id))}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mb-2 opacity-50" />
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={cn(
                    "px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0",
                    !notification.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
                  )}
                  onClick={() => handleMarkAsRead([notification.id])}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{notification.title}</h5>
                    <span className="text-[10px] text-slate-400">
                      {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
