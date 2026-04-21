import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onConfirm: (link: string) => void | Promise<void>;
}

export function MarkDoneDialog({ open, onOpenChange, taskTitle, onConfirm }: Props) {
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setLink("");
  }, [open]);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirm(link.trim());
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[var(--color-completed)]" />
            Mark as completed
          </DialogTitle>
          <DialogDescription>
            Would you like to add a link or document to <span className="font-medium text-foreground">"{taskTitle}"</span>?
            This is optional — you can skip it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="deliverable-link">Resource link (optional)</Label>
          <Input
            id="deliverable-link"
            placeholder="https://drive.google.com/..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            type="url"
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleConfirm()} disabled={submitting}>
            Skip & complete
          </Button>
          <Button onClick={handleConfirm} disabled={submitting} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {link.trim() ? "Add link & complete" : "Mark complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
