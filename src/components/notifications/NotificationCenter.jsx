import React, { useState, useEffect } from 'react';
import { notifications as notificationsApi } from '@/api/notifications';
import { Bell, Check, Trash2, AlertCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { NOTIFICATION_LINES } from '@/components/progress/progressStrings';
import { Link } from 'react-router-dom';

// The notifications panel. It has no button of its own: the Notifications
// row on Me opens it (openNotifications(), through Layout's `open` /
// `onOpenChange`), and the Me tab shows a dot from `onUnreadChange(count)`.
// It stays mounted so it keeps checking for new ones.
export const OPEN_NOTIFICATIONS_EVENT = 'pathways-open-notifications';
export const openNotifications = () => window.dispatchEvent(new Event(OPEN_NOTIFICATIONS_EVENT));

export default function NotificationCenter({ userEmail, open = false, onOpenChange, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isOpen = open;
  const setIsOpen = (value) => onOpenChange?.(value);
  useEffect(() => { onUnreadChange?.(unreadCount); }, [unreadCount]); // eslint-disable-line react-hooks/exhaustive-deps
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
      const data = await notificationsApi.list({ limit: 20 });
      
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
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking read", error);
    }
  };
  
  const markAllRead = async () => {
      try {
          const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
          await Promise.all(unreadIds.map(id => notificationsApi.markRead(id)));
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
      await notificationsApi.remove(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
        console.error("Error deleting notification", error);
    }
  };

  const [language] = useAppLanguage();
  const tr = useTranslatedLines(NOTIFICATION_LINES, language, { cacheKey: 'notifications_v1' });
  const t = (key) => (language !== 'en' && tr(key)) || NOTIFICATION_LINES[key] || key;
  const locale = language === 'en' ? 'en-US' : language;
  const when = (d) => {
    try { return new Date(d).toLocaleDateString(locale, { month: 'short', day: 'numeric' }); } catch (e) { return ''; }
  };
  const requestPushPermission = async () => {
      if (typeof Notification === 'undefined') return;
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
          toast.success(t('push_done'));
      }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="bottom" dir={RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'} className="max-h-[85vh] flex flex-col rounded-t-sheet bg-paper border-line px-4 pt-6 pb-6">
        <SheetHeader className="flex flex-row items-center justify-between gap-2 space-y-0 mb-4 pe-10">
          <SheetTitle className="font-display text-[1.625rem] leading-tight text-navy text-start" dir="auto">{t('title')}</SheetTitle>
          {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="min-h-tap px-2 text-base font-semibold text-denim underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim" dir="auto">
                  {t('mark_all')}
              </button>
          )}
        </SheetHeader>
        
        {permission !== 'granted' && (
            <div className="bg-white border-[1.5px] border-line p-3 rounded-card mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center text-base font-semibold text-navy">
                    <AlertCircle className="w-5 h-5 me-2 shrink-0" aria-hidden="true" />
                    <span dir="auto">{t('push_ask')}</span>
                </div>
                <button type="button" className="shrink-0 min-h-tap rounded-button border-[1.5px] border-line bg-white px-4 text-base font-semibold text-navy hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim" onClick={requestPushPermission}>
                    {t('push_on')}
                </button>
            </div>
        )}

        <ScrollArea className="flex-1 -mx-4 px-4">
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted">
                    <Bell className="w-8 h-8 mb-2 opacity-40" aria-hidden="true" />
                    <p className="text-base" dir="auto">{t('empty')}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map(n => (
                        <div 
                            key={n.id} 
                            className={`relative group p-4 rounded-card border-[1.5px] bg-white ${n.read ? 'border-line' : 'border-navy'}`}
                        >
                            <div className="flex justify-between items-start gap-2 mb-1">
                                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                                    {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-gold shrink-0" aria-hidden="true" />}
                                    <span dir="auto">{n.title}</span>
                                    {!n.read && <span className="sr-only">, {t('unread')}</span>}
                                </h3>
                                <div className="flex items-center gap-1 -mt-2 -me-2 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                    {!n.read && (
                                        <button onClick={() => markAsRead(n.id)} className="w-11 h-11 flex items-center justify-center hover:bg-tint rounded-button text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim" title={t('mark_read')} aria-label={t('mark_read')}>
                                            <Check className="w-5 h-5" aria-hidden="true" />
                                        </button>
                                    )}
                                    <button onClick={(e) => deleteNotification(n.id, e)} className="w-11 h-11 flex items-center justify-center hover:bg-tint rounded-button text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim" title={t('remove')} aria-label={t('remove')}>
                                        <Trash2 className="w-5 h-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-base text-muted mb-2 line-clamp-2" dir="auto">{n.message}</p>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-small text-muted">
                                    {n.created_date ? when(n.created_date) : t('just_now')}
                                </span>
                                {n.link && (
                                    <Link 
                                        to={n.link} 
                                        onClick={() => { setIsOpen(false); markAsRead(n.id); }}
                                        className="inline-flex items-center min-h-[44px] text-base font-semibold text-denim underline underline-offset-4"
                                    >
                                        {t('open')}
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