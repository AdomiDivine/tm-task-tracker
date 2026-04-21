import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { Leaderboard } from "@/components/Leaderboard";
import { useAuth } from "@/hooks/use-auth";
import { useProjects, useTasks, useMembers } from "@/hooks/use-data";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Team Workload — TM Work OS" },
      { name: "description", content: "Team performance & blockers" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user, role, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { members } = useMembers();
  const [selectedProject, setSelectedProject] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
    else if (!authLoading && user && role !== "admin") navigate({ to: "/" });
  }, [authLoading, user, role, navigate]);

  if (authLoading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  const filtered = selectedProject === "all" ? tasks : tasks.filter((t) => t.project_id === selectedProject);

  function exportCSV() {
    const headers = ["Task", "Assignee", "Project", "Status", "Deadline", "Duration", "Blocker", "Deliverable"];
    const rows = filtered.map((t) => [
      t.title,
      members.find((m) => m.user_id === t.assignee_id)?.display_name ?? "",
      projects.find((p) => p.id === t.project_id)?.name ?? "",
      t.status,
      t.deadline ?? "",
      t.duration,
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

  const projectStats = projects
    .filter((p) => !p.archived)
    .map((p) => {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Team Workload</h1>
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>

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
                tasks
                  .filter((t) => t.blocker.length > 0 && t.status !== "done")
                  .map((t) => (
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
