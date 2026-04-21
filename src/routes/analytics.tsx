import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { Leaderboard } from "@/components/Leaderboard";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/use-auth";
import { useProjects, useTasks, useMembers } from "@/hooks/use-data";
import { useState, useEffect, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Download, AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { startOfWeek, startOfMonth, subWeeks, subMonths, isWithinInterval, endOfWeek, endOfMonth, isBefore } from "date-fns";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Team Workload — TM Work OS" },
      { name: "description", content: "Team performance & blockers" },
    ],
  }),
  component: AnalyticsPage,
});

type Period = "weekly" | "monthly";

function AnalyticsPage() {
  const { user, role, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { members } = useMembers();
  const [selectedProject, setSelectedProject] = useState("all");
  const [period, setPeriod] = useState<Period>("weekly");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
    else if (!authLoading && user && role !== "admin") navigate({ to: "/" });
  }, [authLoading, user, role, navigate]);

  const { current, previous } = useMemo(() => {
    const now = new Date();
    if (period === "weekly") {
      return {
        current: { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) },
        previous: { start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }) },
      };
    }
    return {
      current: { start: startOfMonth(now), end: endOfMonth(now) },
      previous: { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) },
    };
  }, [period]);

  if (authLoading || !user || !profile || role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  const projectFiltered = selectedProject === "all" ? tasks : tasks.filter((t) => t.project_id === selectedProject);

  const inPeriod = projectFiltered.filter((t) => isWithinInterval(new Date(t.created_at), current));
  const completedInPeriod = inPeriod.filter((t) => t.status === "done").length;
  const totalInPeriod = inPeriod.length;
  const completionPct = totalInPeriod === 0 ? 0 : Math.round((completedInPeriod / totalInPeriod) * 100);

  // Rollover: created in previous period, not done, deadline passed before current period start (or no deadline)
  const rollover = projectFiltered.filter(
    (t) =>
      isWithinInterval(new Date(t.created_at), previous) &&
      t.status !== "done" &&
      (!t.deadline || isBefore(new Date(t.deadline), current.start))
  );

  function exportCSV() {
    const headers = ["Task", "Assignee", "Project", "Status", "Deadline", "Blocker", "Deliverable"];
    const rows = projectFiltered.map((t) => [
      t.title,
      members.find((m) => m.user_id === t.assignee_id)?.display_name ?? "",
      projects.find((p) => p.id === t.project_id)?.name ?? "",
      t.status,
      t.deadline ?? "",
      t.blocker,
      t.completion_link,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tm-workos-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const projectStats = projects.filter((p) => !p.archived).map((p) => {
    const pTasks = tasks.filter((t) => t.project_id === p.id);
    const done = pTasks.filter((t) => t.status === "done").length;
    const total = pTasks.length;
    return { ...p, done, total, progress: total === 0 ? 0 : Math.round((done / total) * 100) };
  });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar projects={projects} selectedProject={selectedProject} onSelectProject={setSelectedProject} profile={profile} role={role} onSignOut={signOut} />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Team Workload</h1>
            </div>
            <div className="flex items-center gap-3">
              <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <TabsList>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
              <NotificationBell userId={user.id} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{period === "weekly" ? "This Week" : "This Month"}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{completionPct}%</p>
              <p className="text-xs text-muted-foreground mt-1">{completedInPeriod} of {totalInPeriod} tasks completed</p>
              <Progress value={completionPct} className="h-1.5 mt-3" />
            </div>
            <div className="glass-card p-5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <RotateCw className="w-3 h-3" /> Rollover
              </p>
              <p className="text-3xl font-bold text-[var(--color-pending)] mt-1">{rollover.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Unfinished from previous {period === "weekly" ? "week" : "month"}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Blockers</p>
              <p className="text-3xl font-bold text-[var(--color-pending)] mt-1">
                {tasks.filter((t) => t.blocker.length > 0 && t.status !== "done").length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Across all projects</p>
            </div>
          </div>

          {rollover.length > 0 && (
            <div className="glass-card p-6 space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-[var(--color-pending)]" />
                Rollover Tasks
              </h2>
              <ul className="space-y-2">
                {rollover.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-[var(--color-pending)]/5 border border-[var(--color-pending)]/20">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {members.find((m) => m.user_id === t.assignee_id)?.display_name ?? "Unassigned"} · {projects.find((p) => p.id === t.project_id)?.name}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-pending)] font-bold">{t.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Project Progress</h2>
            <div className="space-y-4">
              {projectStats.map((p) => (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.icon}</span>
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{p.progress}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={p.progress} className="flex-1 h-1.5" />
                    <span className="text-[10px] text-muted-foreground">{p.done}/{p.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[var(--color-pending)]" />
              Active Blockers
            </h2>
            <div className="space-y-3">
              {tasks.filter((t) => t.blocker.length > 0 && t.status !== "done").length === 0 ? (
                <p className="text-sm text-muted-foreground">No active blockers 🎉</p>
              ) : (
                tasks.filter((t) => t.blocker.length > 0 && t.status !== "done").map((t) => (
                  <div key={t.id} className="flex items-start gap-3 p-3 bg-[var(--color-pending)]/10 border border-[var(--color-pending)]/30 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-[var(--color-pending)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.title}</p>
                      <p className="text-xs text-[var(--color-pending)] mt-1 font-medium">{t.blocker}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {members.find((m) => m.user_id === t.assignee_id)?.display_name ?? "Unassigned"} · {projects.find((p) => p.id === t.project_id)?.name}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Leaderboard tasks={tasks} members={members} />
        </div>
      </main>
    </div>
  );
}
