import { createFileRoute } from "@tanstack/react-router";
import { TaskBoard } from "@/components/TaskBoard";
import { StatsBar } from "@/components/StatsBar";
import { Leaderboard } from "@/components/Leaderboard";
import { useTaskStore, useAppState } from "@/lib/store";
import { AppSidebar } from "@/components/AppSidebar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TM Work OS — Dashboard" },
      { name: "description", content: "Takeout Media project-based task management dashboard" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { taskList, moveTask } = useTaskStore();
  const { currentRole, selectedProject, setSelectedProject } = useAppState();

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar selectedProject={selectedProject} onSelectProject={setSelectedProject} />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <StatsBar tasks={taskList} selectedProject={selectedProject} />
          <TaskBoard tasks={taskList} selectedProject={selectedProject} onMoveTask={moveTask} />
          {currentRole === "admin" && (
            <Leaderboard tasks={taskList} />
          )}
        </div>
      </main>
    </div>
  );
}
