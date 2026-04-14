import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { TaskCard } from "@/components/TaskCard";
import { useTaskStore, useAppState } from "@/lib/store";
import { Archive as ArchiveIcon } from "lucide-react";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "Archive — TM Work OS" },
      { name: "description", content: "Completed tasks archive" },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const { taskList } = useTaskStore();
  const { selectedProject, setSelectedProject } = useAppState();

  const filtered = selectedProject === "all"
    ? taskList.filter(t => t.status === "done")
    : taskList.filter(t => t.status === "done" && t.project === selectedProject);

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar selectedProject={selectedProject} onSelectProject={setSelectedProject} />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <ArchiveIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Archive</h1>
            <span className="text-sm text-muted-foreground">({filtered.length} completed)</span>
          </div>
          {filtered.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-muted-foreground">No completed tasks yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
