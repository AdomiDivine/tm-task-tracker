import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string;
  task_id: string | null;
  read: boolean;
  created_at: string;
}

export function useNotificationsBell(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    setNotifications((data ?? []) as Notification[]);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchAll();
    const ch = supabase
      .channel(`notif-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 30));
          // Browser notification
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            const n = payload.new as Notification;
            new window.Notification(n.title, { body: n.body, tag: n.id });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, fetchAll]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAllRead, refetch: fetchAll };
}
