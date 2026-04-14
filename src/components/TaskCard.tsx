import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

interface TaskCardProps {
  task: Tables<"tasks">;
  projects: Tables<"projects">[];
  members: { user_id: string; display_name: string }[];
  onMoveTask?: (taskId: string, newStatus: string) => void;
}

export function TaskCard({ task, projects, members, onMoveTask }: TaskCardProps) {
  const hasBlocker = task.blocker.length > 0;
  const project = projects.find(p => p.id === task.project_id);
  const assignee = members.find(m => m.user_id === task.assignee_id);

  return (
    <div className={`glass-card-hover p-4 space-y-3 ${hasBlocker ? "blocker-glow" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground leading-tight">{task.title}</h3>
        {hasBlocker && (
          <Badge variant="destructive" className="shrink-0 text-[10px] gap-1">
            <AlertTriangle className="w-3 h-3" />
            Blocker
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: project?.color }} />
        <span className="text-xs text-muted-foreground">{project?.name ?? "Unknown"}</span>
      </div>

      {hasBlocker && (
        <div className="bg-blocker/10 border border-blocker/20 rounded-md p-2">
          <p className="text-xs text-blocker">{task.blocker}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.duration || "—"}
          </span>
          <span>{assignee?.display_name ?? "Unassigned"}</span>
        </div>
        <div className="flex items-center gap-1">
          {task.status === "pending" && onMoveTask && (
            <button onClick={() => onMoveTask(task.id, "in-progress")} className="p-1 rounded hover:bg-accent text-primary transition-colors" title="Start task">
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {task.status === "in-progress" && onMoveTask && (
            <button onClick={() => onMoveTask(task.id, "done")} className="p-1 rounded hover:bg-accent text-success transition-colors" title="Mark done">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
