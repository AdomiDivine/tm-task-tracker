import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/use-auth";
import { useProjects, useMembers } from "@/hooks/use-data";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Shield, Crown, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { ProjectLeadsManager } from "@/components/ProjectLeadsManager";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "User Management — TM Work OS" },
      { name: "description", content: "Manage team roles and permissions" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { user, role, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { members, setUserRole } = useMembers();
  const [selectedProject, setSelectedProject] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
    else if (!authLoading && user && role !== "admin") navigate({ to: "/" });
  }, [authLoading, user, role, navigate]);

  if (authLoading || !user || !profile || role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdating(userId);
    try {
      await setUserRole(userId, newRole as "admin" | "team_lead" | "member");
      toast.success("Role updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdating(null);
    }
  }

  const roleIcon = (r: string) =>
    r === "admin" ? <Crown className="w-3.5 h-3.5 text-primary" /> :
    r === "team_lead" ? <Shield className="w-3.5 h-3.5 text-[var(--color-completed)]" /> :
    <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        profile={profile}
        role={role}
        onSignOut={signOut}
      />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            </div>
            <NotificationBell userId={user.id} />
          </div>

          <div className="glass-card p-6">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="pb-3">Member</th>
                  <th className="pb-3">SBU</th>
                  <th className="pb-3">Current Role</th>
                  <th className="pb-3 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => (
                  <tr key={m.user_id} className="text-sm">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                          {m.avatar_initials}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{m.display_name}</p>
                          {m.user_id === user.id && <p className="text-[10px] text-primary">You</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">{m.sbu}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium">
                        {roleIcon(m.role)}
                        {m.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Select
                        value={m.role}
                        onValueChange={(v) => handleRoleChange(m.user_id, v)}
                        disabled={updating === m.user_id || m.user_id === user.id}
                      >
                        <SelectTrigger className="w-36 ml-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="team_lead">Team Lead</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-muted-foreground mt-4">
              You can't change your own role to prevent locking yourself out.
            </p>
          </div>

          <ProjectLeadsManager projects={projects} members={members} />
        </div>
      </main>
    </div>
  );
}
