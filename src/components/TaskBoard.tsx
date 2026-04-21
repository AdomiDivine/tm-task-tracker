import type { Tables } from "@/integrations/supabase/types";
import type { Task } from "@/hooks/use-data";
import { TaskCard } from "./TaskCard";

interface TaskBoardProps {
  tasks: Task[];
  projects: Tables<"projects">[];
  members: { user_id: string; display_name: string; avatar_initials: string }[];
  selectedProject: string;
  currentUserId?: string;
  isAdmin?: boolean;
  onMoveTask: (taskId: string, newStatus: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskBoard({ tasks, projects, members, selectedProject, currentUserId, isAdmin, onMoveTask, onEdit, onDelete }: TaskBoardProps) {
  const filtered = selectedProject === "all" ? tasks : tasks.filter((t) => t.project_id === selectedProject);
  const pending = filtered.filter((t) => t.status === "pending");
  const inProgress = filtered.filter((t) => t.status === "in-progress");
  const done = filtered.filter((t) => t.status === "done");

  const columns = [
    { title: "Pending", tasks: pending, dot: "bg-[var(--color-pending)]" },
    { title: "In Progress", tasks: inProgress, dot: "bg-primary" },
    { title: "Completed", tasks: done, dot: "bg-[var(--color-completed)]" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((col) => (
        <div key={col.title} className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <span className={`w-2 h-2 rounded-full ${col.dot}`} />
            <h2 className="text-sm font-semibold text-foreground">{col.title}</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{col.tasks.length}</span>
          </div>
          <div className="space-y-3">
            {col.tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
            ) : (
              col.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projects={projects}
                  members={members}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onMoveTask={onMoveTask}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
