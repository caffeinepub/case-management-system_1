import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAcceptCase } from "../hooks/useQueries";

interface AcceptModalProps {
  open: boolean;
  onClose: () => void;
  caseId: bigint;
  caseNumber: string;
  clientName: string;
}

export function AcceptModal({
  open,
  onClose,
  caseId,
  caseNumber,
  clientName,
}: AcceptModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [khationNo, setKhationNo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const acceptCase = useAcceptCase();

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const pdfs = Array.from(newFiles).filter(
      (f) => f.type === "application/pdf",
    );
    if (pdfs.length < newFiles.length) {
      toast.error("Only PDF files are accepted");
    }
    setFiles((prev) => [...prev, ...pdfs]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!khationNo.trim()) {
      toast.error("Please enter the Khation Number");
      return;
    }
    try {
      await acceptCase.mutateAsync({
        caseId,
        files,
        khationNo: khationNo.trim(),
      });
      toast.success(`Case ${caseNumber} accepted successfully`);
      setFiles([]);
      setKhationNo("");
      onClose();
    } catch (_e) {
      toast.error("Failed to accept case. Please try again.");
    }
  };

  const handleClose = () => {
    setFiles([]);
    setKhationNo("");
    onClose();
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-ocid="accept.dialog">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Accept Case — {caseNumber}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{clientName}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="khation-no">
              Khation Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="khation-no"
              placeholder="Enter Khation Number"
              value={khationNo}
              onChange={(e) => setKhationNo(e.target.value)}
              data-ocid="accept.input"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Upload Documents (PDF)
            </Label>

            <button
              type="button"
              data-ocid="accept.dropzone"
              className={`w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/40"
              }`}
              onClick={triggerFileInput}
              onKeyDown={(e) => e.key === "Enter" && triggerFileInput()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Drag & drop PDF files here or{" "}
                <span className="text-primary font-medium">browse</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
                data-ocid="accept.upload_button"
              />
            </button>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2"
                  >
                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            data-ocid="accept.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={acceptCase.isPending}
            className="bg-primary text-primary-foreground"
            data-ocid="accept.confirm_button"
          >
            {acceptCase.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Accepting...
              </>
            ) : (
              "Accept Case"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
