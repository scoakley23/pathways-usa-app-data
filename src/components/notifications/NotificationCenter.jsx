import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Check, Trash2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function NotificationCenter({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  useEffect(() => {
    if (userEmail) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
      return () => clearInterval(interval);
    }
  }, [userEmail]);

  const fetchNotifications = async () => {
    try {
      const data = await base44.entities.Notification.filter(
        { user_email: userEmail }, '-created_date', 20
      );
      
      setNotifications(data);
      
      const unread = data.filter(n => !n.read).length;
      
      // If new unread notifications and we have more than before, trigger push (simplified logic)
      if (unread > unreadCount && permission === 'granted') {
         const latest = data.find(n => !n.read);
         if (latest) {
             new Notification(latest.title, { body: latest.message });
         }
      }
      
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await base44.entities.Notification.update(id, { read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking read", error);
    }
  };
  
  const markAllRead = async () => {
      try {
          const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
          await Promise.all(unreadIds.map(id => base44.entities.Notification.update(id, { read: true })));
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
          toast.success("All marked as read");
      } catch (error) {
          console.error("Error marking all read", error);
      }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await base44.entities.Notification.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
        console.error("Error deleting notification", error);
    }
  };

  const requestPushPermission = async () => {
      if (typeof Notification === 'undefined') return;
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
          toast.success("Notifications enabled!");
          new Notification("Test Notification", { body: "You will now receive alerts here." });
      }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="w-5 h-5 text-pw-navy" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-pw-red-ink rounded-full ring-2 ring-white" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[92vw] max-w-[380px] sm:w-[380px] flex flex-col bg-pw-page border-pw-line">
        <SheetHeader className="flex flex-row items-center justify-between gap-2 space-y-0 mb-4 pr-8">
          <SheetTitle className="text-xl font-extrabold text-pw-navy">Notifications</SheetTitle>
          {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                  Mark all read
              </Button>
          )}
        </SheetHeader>
        
        {permission !== 'granted' && (
            <div className="bg-pw-blue-soft p-3 rounded-2xl mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center text-sm font-semibold text-pw-blue-ink">
                    <AlertCircle className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />
                    <span>Enable push notifications?</span>
                </div>
                <Button size="sm" variant="outline" className="shrink-0" onClick={requestPushPermission}>
                    Enable
                </Button>
            </div>
        )}

        <ScrollArea className="flex-1 -mx-4 px-4">
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-pw-muted">
                    <Bell className="w-8 h-8 mb-2 opacity-40" aria-hidden="true" />
                    <p className="text-base">No notifications yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map(n => (
                        <div 
                            key={n.id} 
                            className={`relative group p-4 rounded-2xl border transition-colors ${n.read ? 'bg-white border-pw-line' : 'bg-white border-pw-navy/30 shadow-raised'}`}
                        >
                            <div className="flex justify-between items-start gap-2 mb-1">
                                <h4 className="text-base font-bold text-pw-navy flex items-center gap-2">
                                    {!n.read && <span className="w-2 h-2 rounded-full bg-pw-navy shrink-0" aria-hidden="true" />}
                                    {n.title}
                                </h4>
                                <div className="flex items-center gap-1 -mt-2 -mr-2 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                    {!n.read && (
                                        <button onClick={() => markAsRead(n.id)} className="w-11 h-11 flex items-center justify-center hover:bg-pw-soft rounded-xl text-pw-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy" title="Mark read" aria-label="Mark read">
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={(e) => deleteNotification(n.id, e)} className="w-11 h-11 flex items-center justify-center hover:bg-pw-red-soft rounded-xl text-pw-red-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy" title="Delete" aria-label="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-pw-muted mb-2 line-clamp-2">{n.message}</p>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-pw-muted">
                                    {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : 'Just now'}
                                </span>
                                {n.link && (
                                    <Link 
                                        to={n.link} 
                                        onClick={() => { setIsOpen(false); markAsRead(n.id); }}
                                        className="inline-flex items-center min-h-[44px] text-sm font-bold text-pw-navy underline underline-offset-4 decoration-pw-navy/40 hover:decoration-pw-navy"
                                    >
                                        View Details
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}