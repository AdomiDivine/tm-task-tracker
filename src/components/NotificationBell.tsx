import { useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationsBell } from "@/hooks/use-notifications-bell";
import { formatDistanceToNow } from "date-fns";

interface Props {
  userId: string | undefined;
}

export function NotificationBell({ userId }: Props) {
  const { notifications, unreadCount, markAllRead } = useNotificationsBell(userId);
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && unreadCount > 0) markAllRead();
      }}
    >
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-md hover:bg-accent text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[var(--color-pending)] rounded-full ring-2 ring-background animate-pulse" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          <p className="text-xs text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">No notifications yet</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.id} className={`px-4 py-3 ${!n.read ? "bg-primary/5" : ""}`}>
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
