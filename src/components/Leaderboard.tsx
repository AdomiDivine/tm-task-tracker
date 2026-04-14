import { users, type Task } from "@/lib/data";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

interface LeaderboardProps {
  tasks: Task[];
}

export function Leaderboard({ tasks }: LeaderboardProps) {
  const memberStats = users.map((user) => {
    const userTasks = tasks.filter(t => t.assigneeId === user.id);
    const total = userTasks.length;
    const done = userTasks.filter(t => t.status === "done").length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);
    const blockers = userTasks.filter(t => t.blocker.length > 0);
    return { user, total, done, progress, blockers };
  }).sort((a, b) => b.progress - a.progress);

  return (
    <div className="glass-card p-6 space-y-4">
      <h2 className="text-lg font-bold text-foreground">Team Leaderboard</h2>
      <div className="space-y-4">
        {memberStats.map(({ user, total, done, progress, blockers }) => (
          <div key={user.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                  {user.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{user.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {blockers.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-blocker">
                    <AlertTriangle className="w-3 h-3" />
                    {blockers.length}
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
        ))}
      </div>
    </div>
  );
}
