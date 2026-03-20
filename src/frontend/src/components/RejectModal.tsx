import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRejectCase } from "../hooks/useQueries";

const REJECTION_REASONS = [
  "Insufficient Information",
  "Conflict of Interest",
  "Invalid Documentation",
  "Client Declined",
  "Jurisdiction Issue",
  "Duplicate Case",
];

interface RejectModalProps {
  open: boolean;
  onClose: () => void;
  caseId: bigint;
  caseNumber: string;
  clientName: string;
}

export function RejectModal({
  open,
  onClose,
  caseId,
  caseNumber,
  clientName,
}: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const rejectCase = useRejectCase();

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a rejection reason");
      return;
    }
    try {
      await rejectCase.mutateAsync({ caseId, reason, comments });
      toast.success(`Case ${caseNumber} rejected`);
      setReason("");
      setComments("");
      onClose();
    } catch (_e) {
      toast.error("Failed to reject case. Please try again.");
    }
  };

  const handleClose = () => {
    setReason("");
    setComments("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-ocid="reject.dialog">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-destructive">
            Reject Case — {caseNumber}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{clientName}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reject-reason" className="text-sm font-medium">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reject-reason" data-ocid="reject.select">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reject-comments" className="text-sm font-medium">
              Additional Comments
            </Label>
            <Textarea
              id="reject-comments"
              placeholder="Provide any additional context or notes..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="resize-none"
              data-ocid="reject.textarea"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            data-ocid="reject.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={rejectCase.isPending || !reason}
            data-ocid="reject.confirm_button"
          >
            {rejectCase.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rejecting...
              </>
            ) : (
              "Confirm Rejection"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
