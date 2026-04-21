import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/hooks/use-data";
import type { Tables } from "@/integrations/supabase/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Shield, X, Plus, FolderKanban } from "lucide-react";
import { toast } from "sonner";

type Member = Tables<"profiles"> & { role: string };

interface ProjectLeadsManagerProps {
  projects: Project[];
  members: Member[];
}

type LeadRow = { id: string; project_id: string; user_id: string };

export function ProjectLeadsManager({ projects, members }: ProjectLeadsManagerProps) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const fetchLeads = useCallback(async () => {
    const { data } = await supabase
      .from("project_members")
      .select("id, project_id, user_id")
      .eq("is_lead", true);
    setLeads((data ?? []) as LeadRow[]);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const teamLeads = members.filter((m) => m.role === "team_lead" || m.role === "admin");
  const activeProjects = projects.filter((p) => !p.archived);

  async function handleAdd() {
    if (!selectedProject || !selectedUser) {
      toast.error("Pick a project and a user");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("project_members")
        .insert({ project_id: selectedProject, user_id: selectedUser, is_lead: true });
      if (error) throw error;
      toast.success("Team Lead assigned");
      setSelectedUser("");
      await fetchLeads();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    setBusy(true);
    try {
      const { error } = await supabase.from("project_members").delete().eq("id", id);
      if (error) throw error;
      await fetchLeads();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const memberName = (uid: string) => members.find((m) => m.user_id === uid)?.display_name ?? "Unknown";
  const projectName = (pid: string) => projects.find((p) => p.id === pid);

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-[var(--color-completed)]" />
        <h2 className="text-lg font-semibold text-foreground">Project Team Leads</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Assign Team Leads to specific projects. Team Leads can manage tasks within their assigned projects.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {activeProjects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select team lead" />
          </SelectTrigger>
          <SelectContent>
            {teamLeads.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Promote a user to Team Lead first
              </div>
            )}
            {teamLeads.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>{m.display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} disabled={busy} className="gap-2">
          <Plus className="w-4 h-4" /> Assign
        </Button>
      </div>

      <div className="space-y-2 pt-2">
        {leads.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No project leads assigned yet.</p>
        ) : (
          activeProjects.map((p) => {
            const projectLeads = leads.filter((l) => l.project_id === p.id);
            if (projectLeads.length === 0) return null;
            return (
              <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <FolderKanban className="w-4 h-4 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.icon} {p.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {projectLeads.map((l) => (
                      <span
                        key={l.id}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-completed)]/15 text-[var(--color-completed)] border border-[var(--color-completed)]/30"
                      >
                        {memberName(l.user_id)}
                        <button
                          type="button"
                          onClick={() => handleRemove(l.id)}
                          disabled={busy}
                          className="hover:text-destructive"
                          aria-label="Remove lead"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {/* Orphan leads (project missing/archived) */}
        {leads.filter((l) => !projectName(l.project_id) || projectName(l.project_id)?.archived).map((l) => (
          <div key={l.id} className="flex items-center gap-2 text-xs text-muted-foreground p-2">
            <span>Lead on archived/missing project: {memberName(l.user_id)}</span>
            <Button size="sm" variant="ghost" onClick={() => handleRemove(l.id)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
