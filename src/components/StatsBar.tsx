import type { Tables } from "@/integrations/supabase/types";
import type { Task } from "@/hooks/use-data";
import { ClipboardList, Clock, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

interface StatsBarProps {
  tasks: Task[];
  projects: Tables<"projects">[];
  selectedProject: string;
}

export function StatsBar({ tasks, projects, selectedProject }: StatsBarProps) {
  const filtered = selectedProject === "all" ? tasks : tasks.filter((t) => t.project_id === selectedProject);
  const total = filtered.length;
  const pending = filtered.filter((t) => t.status === "pending").length;
  const inProgress = filtered.filter((t) => t.status === "in-progress").length;
  const done = filtered.filter((t) => t.status === "done").length;
  const blockers = filtered.filter((t) => t.blocker.length > 0).length;

  const projectName =
    selectedProject === "all" ? "All Projects" : projects.find((p) => p.id === selectedProject)?.name ?? "Project";

  const stats = [
    { label: "Total", value: total, icon: ClipboardList, color: "text-foreground" },
    { label: "Pending", value: pending, icon: AlertCircle, color: "text-[var(--color-pending)]" },
    { label: "In Progress", value: inProgress, icon: Clock, color: "text-primary" },
    { label: "Completed", value: done, icon: CheckCircle2, color: "text-[var(--color-completed)]" },
    { label: "Blockers", value: blockers, icon: AlertTriangle, color: "text-[var(--color-pending)]" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{projectName}</h1>
        <p className="text-sm text-muted-foreground">{total} tasks · {Math.round(total === 0 ? 0 : (done / total) * 100)}% complete</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
