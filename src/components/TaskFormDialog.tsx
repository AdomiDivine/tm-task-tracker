import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Tables } from "@/integrations/supabase/types";
import type { Task, Attachment } from "@/hooks/use-data";
import { AttachmentsField } from "./AttachmentsField";
import { toast } from "sonner";
import { dateStringToWAT6PM, isoToWATDateString } from "@/lib/deadline";
import { notifyTaskAssignment } from "@/lib/notify";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Tables<"projects">[];
  members: (Tables<"profiles"> & { role: string })[];
  defaultProjectId?: string;
  task?: Task | null;
  currentUserId: string;
  currentUserName: string;
  onCreate: (input: {
    title: string;
    project_id: string;
    assignee_id: string | null;
    collaborator_ids: string[];
    duration: string;
    deadline: string | null;
    blocker: string;
    attachments: Attachment[];
    created_by: string;
  }) => Promise<{ id: string } | null | unknown>;
  onUpdate?: (taskId: string, patch: Partial<Tables<"tasks">>, collaboratorIds: string[]) => Promise<void>;
}

export function TaskFormDialog({ open, onOpenChange, projects, members, defaultProjectId, task, currentUserId, currentUserName, onCreate, onUpdate }: TaskFormDialogProps) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [deadlineDate, setDeadlineDate] = useState(""); // YYYY-MM-DD
  const [blocker, setBlocker] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saving, setSaving] = useState(false);

  const visibleProjects = projects.filter((p) => !p.archived);

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title);
        setProjectId(task.project_id);
        setAssigneeId(task.assignee_id ?? currentUserId);
        setCollaborators((task.collaborator_ids ?? []).filter((id) => id !== task.assignee_id));
        setDeadlineDate(task.deadline ? isoToWATDateString(task.deadline) : "");
        setBlocker(task.blocker);
        setAttachments(Array.isArray(task.attachments) ? (task.attachments as unknown as Attachment[]) : []);
      } else {
        setTitle("");
        setProjectId(defaultProjectId && defaultProjectId !== "all" ? defaultProjectId : visibleProjects[0]?.id ?? "");
        setAssigneeId(currentUserId);
        setCollaborators([]);
        setDeadlineDate("");
        setBlocker("");
        setAttachments([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task]);

  function toggleCollab(id: string) {
    setCollaborators((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Task name is required"); return; }
    if (!projectId) { toast.error("Project is required"); return; }
    setSaving(true);
    try {
      // Dedup: never include the assignee in collaborators
      const collabIds = Array.from(new Set(collaborators.filter((id) => id && id !== assigneeId)));
      const deadlineIso = deadlineDate ? dateStringToWAT6PM(deadlineDate) : null;

      if (task && onUpdate) {
        const previousMembers = new Set([
          ...(task.assignee_id ? [task.assignee_id] : []),
          ...(task.collaborator_ids ?? []),
        ]);
        await onUpdate(task.id, {
          title: title.trim(),
          project_id: projectId,
          assignee_id: assigneeId || null,
          deadline: deadlineIso,
          blocker,
          attachments: attachments as unknown as Tables<"tasks">["attachments"],
        }, collabIds);

        // Notify newly added members
        const allNewMembers = [assigneeId, ...collabIds].filter((id) => id && !previousMembers.has(id));
        if (allNewMembers.length > 0) {
          await notifyTaskAssignment({
            recipientUserIds: allNewMembers,
            actorId: currentUserId,
            actorName: currentUserName,
            taskTitle: title.trim(),
            taskId: task.id,
          });
        }
        toast.success("Task updated");
      } else {
        const created = await onCreate({
          title: title.trim(),
          project_id: projectId,
          assignee_id: assigneeId || null,
          collaborator_ids: collabIds,
          duration: "",
          deadline: deadlineIso,
          blocker,
          attachments,
          created_by: currentUserId,
        });
        const newTaskId = (created as { id?: string } | null)?.id;
        if (newTaskId) {
          await notifyTaskAssignment({
            recipientUserIds: [assigneeId, ...collabIds],
            actorId: currentUserId,
            actorName: currentUserName,
            taskTitle: title.trim(),
            taskId: newTaskId,
          });
        }
        toast.success("Task created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Default deadline date suggestion: today (in WAT)
  const todayWAT = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Name *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                <SelectContent>
                  {visibleProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Primary Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>{m.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {members.length > 1 && (
            <div className="space-y-2">
              <Label>Add Members (Collaborators)</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-border rounded-md">
                {members.filter((m) => m.user_id !== assigneeId).map((m) => (
                  <label key={m.user_id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-accent rounded px-2 py-1">
                    <Checkbox checked={collaborators.includes(m.user_id)} onCheckedChange={() => toggleCollab(m.user_id)} />
                    {m.display_name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline Date</Label>
            <Input
              id="deadline"
              type="date"
              value={deadlineDate}
              min={todayWAT}
              onChange={(e) => setDeadlineDate(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">Auto-set to 6:00 PM (WAT) on the selected date.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blocker">Blocker / Dependency</Label>
            <Textarea
              id="blocker"
              placeholder="Anything blocking this task?"
              value={blocker}
              onChange={(e) => setBlocker(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments & Resources</Label>
            <AttachmentsField value={attachments} onChange={setAttachments} userId={currentUserId} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : task ? "Save Changes" : "Create Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
