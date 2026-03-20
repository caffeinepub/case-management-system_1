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
import { useState } from "react";
import { toast } from "sonner";
import { useAddCase } from "../hooks/useQueries";
import { HearingDatePicker } from "./HearingDatePicker";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface AddCaseModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddCaseModal({ open, onClose }: AddCaseModalProps) {
  const [caseNumber, setCaseNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [jlNo, setJlNo] = useState("");
  const [mutionNo, setMutionNo] = useState("");
  const [hearingDateStr, setHearingDateStr] = useState("");
  const [caseDate] = useState(todayStr);
  const addCase = useAddCase();

  const resetForm = () => {
    setCaseNumber("");
    setClientName("");
    setJlNo("");
    setMutionNo("");
    setHearingDateStr("");
  };

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
      await addCase.mutateAsync({
        caseNumber: caseNumber.trim(),
        clientName: clientName.trim(),
        hearingDate,
        jlNo: jlNo.trim(),
        mutionNo: mutionNo.trim(),
      });
      toast.success(`Case ${caseNumber} added successfully`);
      resetForm();
      onClose();
    } catch (_e) {
      toast.error("Failed to add case. Please try again.");
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-ocid="addcase.dialog">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Add New Case
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Auto Case Date */}
          <div className="space-y-2">
            <Label htmlFor="case-date">Case Date (Auto)</Label>
            <Input
              id="case-date"
              type="date"
              value={caseDate}
              readOnly
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
              data-ocid="addcase.case_date"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="case-number">
                Case Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="case-number"
                placeholder="e.g. CASE-2024-001"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                data-ocid="addcase.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jl-no">
                J.L. No <span className="text-destructive">*</span>
              </Label>
              <Input
                id="jl-no"
                placeholder="e.g. JL-001"
                value={jlNo}
                onChange={(e) => setJlNo(e.target.value)}
                data-ocid="addcase.input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mution-no">
              Mution No. <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mution-no"
              placeholder="e.g. MT-2024-001"
              value={mutionNo}
              onChange={(e) => setMutionNo(e.target.value)}
              data-ocid="addcase.input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-name"
              placeholder="Full name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              data-ocid="addcase.input"
            />
          </div>

          <div className="space-y-2">
            <Label>Hearing Date (Optional)</Label>
            <HearingDatePicker
              value={hearingDateStr}
              onChange={setHearingDateStr}
              data-ocid="addcase.hearing_date"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            data-ocid="addcase.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={addCase.isPending}
            data-ocid="addcase.submit_button"
          >
            {addCase.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Case"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
