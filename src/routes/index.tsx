import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TaskBoard } from "@/components/TaskBoard";
import { StatsBar } from "@/components/StatsBar";
import { MemberStats } from "@/components/MemberStats";
import { AppSidebar } from "@/components/AppSidebar";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { ProjectManager } from "@/components/ProjectManager";
import { NotificationBell } from "@/components/NotificationBell";
import { MarkDoneDialog } from "@/components/MarkDoneDialog";
import { useAuth } from "@/hooks/use-auth";
import { useProjects, useTasks, useMembers, type Task } from "@/hooks/use-data";
import { useNotifications } from "@/hooks/use-notifications";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TM Work OS — Dashboard" },
      { name: "description", content: "Takeout Media task management dashboard" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, role, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { projects, createProject, updateProject, archiveProject } = useProjects();
  const { tasks, moveTask, createTask, updateTask, deleteTask, updateCollaborators } = useTasks();
  const { members } = useMembers();
  const [selectedProject, setSelectedProject] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [pmOpen, setPmOpen] = useState(false);
  const [markDoneTask, setMarkDoneTask] = useState<Task | null>(null);

  useNotifications(tasks, user?.id);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  if (authLoading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  const isAdmin = role === "admin";
  const visibleTasks = tasks.filter((t) => t.status !== "done");

  function handleMove(taskId: string, newStatus: string) {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;
    if (newStatus === "done") {
      setMarkDoneTask(t);
      return;
    }
    moveTask(taskId, newStatus);
  }

  async function handleConfirmDone(link: string) {
    if (!markDoneTask) return;
    try {
      await updateTask(markDoneTask.id, {
        status: "done",
        completion_link: link || markDoneTask.completion_link || "",
      });
      toast.success(link ? "Task completed with deliverable" : "Task completed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleDelete(taskId: string) {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(taskId);
      toast.success("Task deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleUpdate(taskId: string, patch: Partial<import("@/integrations/supabase/types").Tables<"tasks">>, collabs: string[]) {
    await updateTask(taskId, patch);
    await updateCollaborators(taskId, collabs);
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        profile={profile}
        role={role}
        onSignOut={signOut}
        onManageProjects={isAdmin ? () => setPmOpen(true) : undefined}
      />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Takeout Media</p>
              <h1 className="text-2xl font-bold gradient-text">Work OS Dashboard</h1>
            </div>
            <NotificationBell userId={user.id} />
          </div>

          <MemberStats tasks={tasks} userId={user.id} displayName={profile.display_name} />

          {isAdmin && <StatsBar tasks={visibleTasks} projects={projects} selectedProject={selectedProject} />}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {isAdmin ? "All Active Tasks" : "My Tasks"}
            </h2>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> New Task
            </Button>
          </div>

          <TaskBoard
            tasks={visibleTasks}
            projects={projects}
            members={members}
            selectedProject={selectedProject}
            currentUserId={user.id}
            isAdmin={isAdmin}
            onMoveTask={handleMove}
            onEdit={setEditTask}
            onDelete={handleDelete}
          />
        </div>
      </main>

      <TaskFormDialog
        open={createOpen || editTask !== null}
        onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditTask(null); } }}
        projects={projects}
        members={members}
        defaultProjectId={selectedProject}
        task={editTask}
        currentUserId={user.id}
        currentUserName={profile.display_name}
        onCreate={createTask}
        onUpdate={handleUpdate}
      />

      <MarkDoneDialog
        open={markDoneTask !== null}
        onOpenChange={(o) => { if (!o) setMarkDoneTask(null); }}
        taskTitle={markDoneTask?.title ?? ""}
        onConfirm={handleConfirmDone}
      />

      {isAdmin && (
        <ProjectManager
          open={pmOpen}
          onOpenChange={setPmOpen}
          projects={projects}
          onCreate={createProject}
          onUpdate={updateProject}
          onArchive={archiveProject}
        />
      )}
    </div>
  );
}
