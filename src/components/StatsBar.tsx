import type { Task, ProjectKey } from "@/lib/data";
import { projects } from "@/lib/data";
import { ClipboardList, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface StatsBarProps {
  tasks: Task[];
  selectedProject: ProjectKey | "all";
}

export function StatsBar({ tasks, selectedProject }: StatsBarProps) {
  const filtered = selectedProject === "all" ? tasks : tasks.filter(t => t.project === selectedProject);
  const total = filtered.length;
  const pending = filtered.filter(t => t.status === "pending").length;
  const inProgress = filtered.filter(t => t.status === "in-progress").length;
  const done = filtered.filter(t => t.status === "done").length;
  const blockers = filtered.filter(t => t.blocker.length > 0).length;

  const projectName = selectedProject === "all"
    ? "All Projects"
    : projects.find(p => p.key === selectedProject)?.name ?? selectedProject;

  const stats = [
    { label: "Total Tasks", value: total, icon: ClipboardList, color: "text-foreground" },
    { label: "In Progress", value: inProgress, icon: Clock, color: "text-primary" },
    { label: "Completed", value: done, icon: CheckCircle2, color: "text-success" },
    { label: "Blockers", value: blockers, icon: AlertTriangle, color: "text-blocker" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{projectName}</h1>
        <p className="text-sm text-muted-foreground">
          {pending} pending · {inProgress} in progress · {done} done
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-4 flex items-center gap-3">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
