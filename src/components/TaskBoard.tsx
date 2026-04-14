import type { Task, ProjectKey } from "@/lib/data";
import { TaskCard } from "./TaskCard";

interface TaskBoardProps {
  tasks: Task[];
  selectedProject: ProjectKey | "all";
  onMoveTask: (taskId: string, newStatus: Task["status"]) => void;
}

export function TaskBoard({ tasks, selectedProject, onMoveTask }: TaskBoardProps) {
  const filtered = selectedProject === "all" ? tasks : tasks.filter(t => t.project === selectedProject);
  const pending = filtered.filter(t => t.status === "pending");
  const inProgress = filtered.filter(t => t.status === "in-progress");
  const done = filtered.filter(t => t.status === "done");

  const columns = [
    { title: "Pending", tasks: pending, accent: "border-warning/50" },
    { title: "In Progress", tasks: inProgress, accent: "border-primary/50" },
    { title: "Done", tasks: done, accent: "border-success/50" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((col) => (
        <div key={col.title} className="space-y-3">
          <div className={`flex items-center gap-2 pb-2 border-b ${col.accent}`}>
            <h2 className="text-sm font-semibold text-foreground">{col.title}</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {col.tasks.length}
            </span>
          </div>
          <div className="space-y-3">
            {col.tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
            ) : (
              col.tasks.map((task) => (
                <TaskCard key={task.id} task={task} onMoveTask={onMoveTask} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
