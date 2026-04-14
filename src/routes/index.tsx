import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TaskBoard } from "@/components/TaskBoard";
import { StatsBar } from "@/components/StatsBar";
import { Leaderboard } from "@/components/Leaderboard";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/use-auth";
import { useProjects, useTasks, useMembers } from "@/hooks/use-data";
import { useState, useEffect } from "react";

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
  const { user, role, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { tasks, moveTask } = useTasks();
  const { members } = useMembers();
  const [selectedProject, setSelectedProject] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        profile={profile}
        role={role}
        onSignOut={signOut}
      />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <StatsBar tasks={tasks} projects={projects} selectedProject={selectedProject} />
          <TaskBoard
            tasks={tasks}
            projects={projects}
            members={members}
            selectedProject={selectedProject}
            onMoveTask={moveTask}
          />
          {role === "admin" && <Leaderboard tasks={tasks} members={members} />}
        </div>
      </main>
    </div>
  );
}
