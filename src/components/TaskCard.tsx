import type { Tables } from "@/integrations/supabase/types";
import type { Task, Attachment } from "@/hooks/use-data";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, ArrowRight, CheckCircle2, RotateCcw, Trash2, Pencil, Link as LinkIcon, Paperclip, CalendarClock } from "lucide-react";
import { format, isPast } from "date-fns";

interface TaskCardProps {
  task: Task;
  projects: Tables<"projects">[];
  members: { user_id: string; display_name: string; avatar_initials: string }[];
  currentUserId?: string;
  isAdmin?: boolean;
  onMoveTask?: (taskId: string, newStatus: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, projects, members, currentUserId, isAdmin, onMoveTask, onEdit, onDelete }: TaskCardProps) {
  const hasBlocker = task.blocker.length > 0;
  const project = projects.find((p) => p.id === task.project_id);
  const assignee = members.find((m) => m.user_id === task.assignee_id);
  const collaborators = (task.collaborator_ids ?? [])
    .map((id) => members.find((m) => m.user_id === id))
    .filter(Boolean);
  const isOverdue = task.deadline && task.status !== "done" && isPast(new Date(task.deadline));
  const attachments: Attachment[] = Array.isArray(task.attachments) ? (task.attachments as unknown as Attachment[]) : [];
  const canEdit = isAdmin || task.created_by === currentUserId || task.assignee_id === currentUserId;
  const canDelete = isAdmin || task.created_by === currentUserId;

  const statusBadge =
    task.status === "done" ? (
      <Badge className="bg-[var(--color-completed)] text-white border-0 text-[10px]">Completed</Badge>
    ) : task.status === "pending" ? (
      <Badge className="bg-[var(--color-pending)] text-white border-0 text-[10px]">Pending</Badge>
    ) : (
      <Badge className="bg-primary text-primary-foreground border-0 text-[10px]">In Progress</Badge>
    );

  return (
    <div className="glass-card-hover p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground leading-tight flex-1">{task.title}</h3>
        {statusBadge}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-sm">{project?.icon}</span>
          {project?.name ?? "Unknown"}
        </span>
        {isOverdue && (
          <Badge className="bg-[var(--color-pending)] text-white border-0 text-[10px] gap-1">
            <AlertTriangle className="w-3 h-3" />
            OVERDUE
          </Badge>
        )}
      </div>

      {hasBlocker && (
        <div className="rounded-md p-2 bg-[var(--color-pending)]/10 border border-[var(--color-pending)]/30">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-pending)] mb-0.5">Blocker</p>
          <p className="text-xs text-[var(--color-pending)] font-medium">{task.blocker}</p>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map((a, i) => (
            <a
              key={i}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
            >
              {a.type === "file" ? <Paperclip className="w-3 h-3 shrink-0" /> : <LinkIcon className="w-3 h-3 shrink-0" />}
              <span className="truncate">{a.name}</span>
            </a>
          ))}
        </div>
      )}

      {task.completion_link && task.status === "done" && (
        <a
          href={task.completion_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[var(--color-completed)] hover:underline font-medium"
        >
          <CheckCircle2 className="w-3 h-3" />
          View deliverable
        </a>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          {task.deadline && (
            <span className={`flex items-center gap-1 ${isOverdue ? "text-[var(--color-pending)] font-semibold" : ""}`}>
              <CalendarClock className="w-3 h-3" />
              {format(new Date(task.deadline), "MMM d")}
            </span>
          )}
          {task.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.duration}
            </span>
          )}
          <div className="flex items-center -space-x-1.5">
            {assignee && (
              <span
                title={assignee.display_name}
                className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center ring-1 ring-background"
              >
                {assignee.avatar_initials}
              </span>
            )}
            {collaborators.map((c) =>
              c ? (
                <span
                  key={c.user_id}
                  title={c.display_name}
                  className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[9px] font-bold flex items-center justify-center ring-1 ring-background"
                >
                  {c.avatar_initials}
                </span>
              ) : null
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {canEdit && onEdit && (
            <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {task.status === "pending" && onMoveTask && canEdit && (
            <button onClick={() => onMoveTask(task.id, "in-progress")} className="p-1 rounded hover:bg-accent text-primary transition-colors" title="Start task">
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {task.status === "in-progress" && onMoveTask && canEdit && (
            <button onClick={() => onMoveTask(task.id, "done")} className="p-1 rounded hover:bg-accent text-[var(--color-completed)] transition-colors" title="Mark done">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
          {task.status === "done" && onMoveTask && canEdit && (
            <button onClick={() => onMoveTask(task.id, "in-progress")} className="p-1 rounded hover:bg-accent text-muted-foreground transition-colors" title="Reopen">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && onDelete && (
            <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-[var(--color-pending)] transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
