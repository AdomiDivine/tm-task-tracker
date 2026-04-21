import type { Task } from "@/hooks/use-data";
import { ClipboardList, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface MemberStatsProps {
  tasks: Task[];
  userId: string;
  displayName: string;
}

export function MemberStats({ tasks, userId, displayName }: MemberStatsProps) {
  const mine = tasks.filter(
    (t) => t.assignee_id === userId || t.collaborator_ids?.includes(userId) || t.created_by === userId
  );
  const total = mine.length;
  const pending = mine.filter((t) => t.status === "pending").length;
  const inProgress = mine.filter((t) => t.status === "in-progress").length;
  const done = mine.filter((t) => t.status === "done").length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  // Progress circle math
  const size = 92;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;

  const stats = [
    { label: "Total", value: total, icon: ClipboardList, color: "text-foreground" },
    { label: "In Progress", value: inProgress, icon: Clock, color: "text-primary" },
    { label: "Completed", value: done, icon: CheckCircle2, color: "text-[var(--color-completed)]" },
    { label: "Pending", value: pending, icon: AlertCircle, color: "text-[var(--color-pending)]" },
  ];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-muted)" strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-foreground">{progress}%</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Welcome back</p>
          <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{done} of {total} tasks completed</p>
        </div>
        <div className="grid grid-cols-2 gap-3 flex-1">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <div>
                <p className="text-base font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
