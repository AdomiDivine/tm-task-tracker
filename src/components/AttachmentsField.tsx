import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Attachment } from "@/hooks/use-data";
import { Paperclip, Link as LinkIcon, X, Upload } from "lucide-react";
import { toast } from "sonner";

interface AttachmentsFieldProps {
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
  userId: string;
}

export function AttachmentsField({ value, onChange, userId }: AttachmentsFieldProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);

  function addLink() {
    if (!url.trim()) return;
    try {
      new URL(url);
    } catch {
      toast.error("Invalid URL");
      return;
    }
    onChange([...value, { type: "link", name: name.trim() || url, url }]);
    setUrl("");
    setName("");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }
    setUploading(true);
    try {
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("task-attachments").upload(path, file);
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("task-attachments")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr || !signed) throw sErr ?? new Error("Sign failed");
      onChange([...value, { type: "file", name: file.name, url: signed.signedUrl, path }]);
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="space-y-1">
          {value.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-muted px-2 py-1.5 rounded">
              {a.type === "file" ? <Paperclip className="w-3 h-3 shrink-0 text-primary" /> : <LinkIcon className="w-3 h-3 shrink-0 text-primary" />}
              <span className="truncate flex-1">{a.name}</span>
              <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-[var(--color-pending)]">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input placeholder="Label (optional)" value={name} onChange={(e) => setName(e.target.value)} className="text-xs flex-1" />
        <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} className="text-xs flex-[2]" />
        <Button type="button" size="sm" variant="secondary" onClick={addLink}>Add Link</Button>
      </div>
      <label className="flex items-center justify-center gap-2 text-xs px-3 py-2 border border-dashed border-border rounded-md hover:bg-accent cursor-pointer text-muted-foreground">
        <Upload className="w-3.5 h-3.5" />
        {uploading ? "Uploading..." : "Upload file (max 20MB)"}
        <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
    </div>
  );
}
