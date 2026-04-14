import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { Leaderboard } from "@/components/Leaderboard";
import { useTaskStore, useAppState } from "@/lib/store";
import { users, projects, type Task } from "@/lib/data";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — TM Work OS" },
      { name: "description", content: "Team performance analytics and reports" },
    ],
  }),
  component: AnalyticsPage,
});

function exportCSV(tasks: Task[]) {
  const headers = ["Task", "Assignee", "Project", "Status", "Duration", "Blocker"];
  const rows = tasks.map(t => [
    t.title,
    users.find(u => u.id === t.assigneeId)?.name ?? "",
    projects.find(p => p.key === t.project)?.name ?? "",
    t.status,
    t.duration,
    t.blocker,
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tm-workos-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function AnalyticsPage() {
  const { taskList } = useTaskStore();
  const { selectedProject, setSelectedProject } = useAppState();

  const filtered = selectedProject === "all" ? taskList : taskList.filter(t => t.project === selectedProject);

  // Project breakdown
  const projectStats = projects.map(p => {
    const pTasks = taskList.filter(t => t.project === p.key);
    const done = pTasks.filter(t => t.status === "done").length;
    const total = pTasks.length;
    return { ...p, done, total, progress: total === 0 ? 0 : Math.round((done / total) * 100) };
  });

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar selectedProject={selectedProject} onSelectProject={setSelectedProject} />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Global Analytics</h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          {/* Project Breakdown */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Project Progress</h2>
            <div className="space-y-4">
              {projectStats.map((p) => (
                <div key={p.key} className="space-y-1.5">
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

          {/* Blockers Summary */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-blocker" />
              Active Blockers
            </h2>
            <div className="space-y-3">
              {taskList.filter(t => t.blocker.length > 0 && t.status !== "done").length === 0 ? (
                <p className="text-sm text-muted-foreground">No active blockers 🎉</p>
              ) : (
                taskList
                  .filter(t => t.blocker.length > 0 && t.status !== "done")
                  .map(t => (
                    <div key={t.id} className="flex items-start gap-3 p-3 bg-blocker/5 border border-blocker/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-blocker shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.title}</p>
                        <p className="text-xs text-blocker mt-1">{t.blocker}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {users.find(u => u.id === t.assigneeId)?.name} · {projects.find(p => p.key === t.project)?.name}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <Leaderboard tasks={taskList} />
        </div>
      </main>
    </div>
  );
}
