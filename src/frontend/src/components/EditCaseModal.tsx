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
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Case } from "../backend";
import { useEditCase } from "../hooks/useQueries";
import { HearingDatePicker } from "./HearingDatePicker";

type CaseWithId = Case & { id: bigint };

interface EditCaseModalProps {
  open: boolean;
  onClose: () => void;
  caseItem: CaseWithId;
}

function toDateInputValue(nanos: bigint): string {
  if (nanos === 0n) return "";
  const ms = Number(nanos / 1_000_000n);
  return new Date(ms).toISOString().split("T")[0];
}

export function EditCaseModal({ open, onClose, caseItem }: EditCaseModalProps) {
  const [caseNumber, setCaseNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [jlNo, setJlNo] = useState("");
  const [mutionNo, setMutionNo] = useState("");
  const [hearingDateStr, setHearingDateStr] = useState("");
  const editCase = useEditCase();

  useEffect(() => {
    if (open && caseItem) {
      setCaseNumber(caseItem.caseNumber);
      setClientName(caseItem.clientName);
      setJlNo(caseItem.jlNo);
      setMutionNo(caseItem.mutionNo);
      setHearingDateStr(toDateInputValue(caseItem.hearingDate));
    }
  }, [open, caseItem]);

  const handleSubmit = async () => {
    if (
      !caseNumber.trim() ||
      !clientName.trim() ||
      !jlNo.trim() ||
      !mutionNo.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    const hearingDate = hearingDateStr
      ? BigInt(new Date(hearingDateStr).getTime()) * 1_000_000n
      : 0n;
    try {
      await editCase.mutateAsync({
        caseId: caseItem.id,
        caseNumber: caseNumber.trim(),
        clientName: clientName.trim(),
        hearingDate,
        jlNo: jlNo.trim(),
        mutionNo: mutionNo.trim(),
      });
      toast.success(`Case ${caseNumber} updated successfully`);
      onClose();
    } catch (_e) {
      toast.error("Failed to update case. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-ocid="editcase.dialog">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Edit Case</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-case-number">
                Case Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-case-number"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                data-ocid="editcase.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-jl-no">
                J.L. No <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-jl-no"
                value={jlNo}
                onChange={(e) => setJlNo(e.target.value)}
                data-ocid="editcase.input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-mution-no">
              Mution No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-mution-no"
              value={mutionNo}
              onChange={(e) => setMutionNo(e.target.value)}
              data-ocid="editcase.input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              data-ocid="editcase.input"
            />
          </div>

          <div className="space-y-2">
            <Label>Hearing Date (Optional)</Label>
            <HearingDatePicker
              value={hearingDateStr}
              onChange={setHearingDateStr}
              data-ocid="editcase.hearing_date"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-ocid="editcase.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={editCase.isPending}
            data-ocid="editcase.save_button"
          >
            {editCase.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
