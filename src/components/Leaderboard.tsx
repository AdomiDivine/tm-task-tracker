import type { Tables } from "@/integrations/supabase/types";
import type { Task } from "@/hooks/use-data";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

interface LeaderboardProps {
  tasks: Task[];
  members: (Tables<"profiles"> & { role: string })[];
}

export function Leaderboard({ tasks, members }: LeaderboardProps) {
  const stats = members
    .map((m) => {
      const userTasks = tasks.filter(
        (t) => t.assignee_id === m.user_id || t.collaborator_ids?.includes(m.user_id)
      );
      const total = userTasks.length;
      const done = userTasks.filter((t) => t.status === "done").length;
      const progress = total === 0 ? 0 : Math.round((done / total) * 100);
      const blockers = userTasks.filter((t) => t.blocker.length > 0 && t.status !== "done");
      return { member: m, total, done, progress, blockers };
    })
    .sort((a, b) => b.progress - a.progress);

  return (
    <div className="glass-card p-6 space-y-4">
      <h2 className="text-lg font-bold text-foreground">Team Workload</h2>
      <div className="space-y-4">
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members yet</p>
        ) : (
          stats.map(({ member, total, done, progress, blockers }) => (
            <div key={member.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {member.avatar_initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.display_name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {blockers.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-[var(--color-pending)] font-semibold">
                      <AlertTriangle className="w-3 h-3" />
                      {blockers.length} blocker{blockers.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-sm font-bold text-primary">{progress}%</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={progress} className="flex-1 h-1.5" />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{done}/{total}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
