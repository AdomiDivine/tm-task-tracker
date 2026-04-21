import { useEffect, useRef } from "react";
import type { Task } from "./use-data";
import { toast } from "sonner";

export function useNotifications(tasks: Task[], userId: string | undefined) {
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    const now = Date.now();
    const myTasks = tasks.filter(
      (t) => t.assignee_id === userId || t.collaborator_ids?.includes(userId) || t.created_by === userId
    );

    myTasks.forEach((t) => {
      if (t.status === "done") return;
      const isOverdue = t.deadline && new Date(t.deadline).getTime() < now;
      const key = `${t.id}-${isOverdue ? "overdue" : "pending"}`;
      if (notifiedRef.current.has(key)) return;
      notifiedRef.current.add(key);

      if (isOverdue) {
        toast.error(`Overdue: ${t.title}`, { description: "Past deadline" });
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Task Overdue", { body: t.title, tag: t.id });
        }
      } else if (t.status === "pending") {
        // Soft toast only once per session
        if (!notifiedRef.current.has(`${t.id}-pending-toast`)) {
          notifiedRef.current.add(`${t.id}-pending-toast`);
        }
      }
    });
  }, [tasks, userId]);
}
