import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Project } from "@/hooks/use-data";
import { Archive, ArchiveRestore, Plus } from "lucide-react";
import { toast } from "sonner";

interface ProjectManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  onCreate: (p: { name: string; key: string; color: string; icon: string }) => Promise<void>;
  onUpdate: (id: string, p: Partial<Project>) => Promise<void>;
  onArchive: (id: string, archived: boolean) => Promise<void>;
}

export function ProjectManager({ open, onOpenChange, projects, onCreate, onUpdate, onArchive }: ProjectManagerProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate({
        name: name.trim(),
        key: name.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 30),
        color: "#fd4f05",
        icon,
      });
      setName("");
      setIcon("📁");
      toast.success("Project created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Projects</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex gap-2 items-end">
          <div className="w-16 space-y-1">
            <Label htmlFor="picon" className="text-xs">Icon</Label>
            <Input id="picon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} className="text-center" />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="pname" className="text-xs">New Project</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" />
          </div>
          <Button type="submit" disabled={saving} size="icon"><Plus className="w-4 h-4" /></Button>
        </form>

        <div className="max-h-80 overflow-y-auto space-y-1 -mx-2 px-2">
          {projects.map((p) => (
            <div key={p.id} className={`flex items-center gap-2 p-2 rounded hover:bg-accent ${p.archived ? "opacity-50" : ""}`}>
              <Input value={p.icon} onChange={(e) => onUpdate(p.id, { icon: e.target.value })} maxLength={2} className="w-12 text-center" />
              <Input value={p.name} onChange={(e) => onUpdate(p.id, { name: e.target.value })} className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onArchive(p.id, !p.archived)}
                title={p.archived ? "Unarchive" : "Archive"}
              >
                {p.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
