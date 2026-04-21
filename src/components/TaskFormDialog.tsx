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

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Tables<"projects">[];
  members: (Tables<"profiles"> & { role: string })[];
  defaultProjectId?: string;
  task?: Task | null;
  currentUserId: string;
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
  }) => Promise<unknown>;
  onUpdate?: (taskId: string, patch: Partial<Tables<"tasks">>, collaboratorIds: string[]) => Promise<void>;
}

export function TaskFormDialog({ open, onOpenChange, projects, members, defaultProjectId, task, currentUserId, onCreate, onUpdate }: TaskFormDialogProps) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");
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
        setCollaborators(task.collaborator_ids ?? []);
        setDuration(task.duration);
        setDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "");
        setBlocker(task.blocker);
        setAttachments(Array.isArray(task.attachments) ? (task.attachments as unknown as Attachment[]) : []);
      } else {
        setTitle("");
        setProjectId(defaultProjectId && defaultProjectId !== "all" ? defaultProjectId : visibleProjects[0]?.id ?? "");
        setAssigneeId(currentUserId);
        setCollaborators([]);
        setDuration("");
        setDeadline("");
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
    if (!title.trim() || !projectId) {
      toast.error("Title and project required");
      return;
    }
    setSaving(true);
    try {
      const collabIds = collaborators.filter((id) => id !== assigneeId);
      if (task && onUpdate) {
        await onUpdate(task.id, {
          title: title.trim(),
          project_id: projectId,
          assignee_id: assigneeId || null,
          duration,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          blocker,
          attachments: attachments as unknown as Tables<"tasks">["attachments"],
        }, collabIds);
        toast.success("Task updated");
      } else {
        await onCreate({
          title: title.trim(),
          project_id: projectId,
          assignee_id: assigneeId || null,
          collaborator_ids: collabIds,
          duration,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          blocker,
          attachments,
          created_by: currentUserId,
        });
        toast.success("Task created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Name *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
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
              <Label>Collaborators</Label>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" placeholder="e.g. 2h" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
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
            <Label>Attachments & Deliverables</Label>
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
