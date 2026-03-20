import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Calendar, FileText, Hash, User } from "lucide-react";
import type { Case } from "../backend";

type CaseWithId = Case & { id: bigint };

interface CaseEnquiryModalProps {
  open: boolean;
  onClose: () => void;
  caseItem: CaseWithId;
}

function formatDate(nanos: bigint): string {
  if (nanos === 0n) return "Not Set";
  const ms = Number(nanos / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusConfig(status: Case["status"]) {
  switch (status.__kind__) {
    case "scheduled":
      return {
        label: "Scheduled",
        className: "bg-blue-100 text-blue-700 border-blue-200",
      };
    case "pending":
      return {
        label: "Pending",
        className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      };
    case "reviewing":
      return {
        label: "Reviewing",
        className: "bg-orange-100 text-orange-700 border-orange-200",
      };
    case "accepted":
      return {
        label: "Accepted",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    case "rejected":
      return {
        label: "Rejected",
        className: "bg-red-100 text-red-700 border-red-200",
      };
    default:
      return {
        label: "Unknown",
        className: "bg-gray-100 text-gray-700 border-gray-200",
      };
  }
}

function DetailRow({
  label,
  value,
}: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function CaseEnquiryModal({
  open,
  onClose,
  caseItem,
}: CaseEnquiryModalProps) {
  const statusCfg = getStatusConfig(caseItem.status);
  const isRejected = caseItem.status.__kind__ === "rejected";
  const isAccepted = caseItem.status.__kind__ === "accepted";
  const rejectedData = isRejected
    ? (
        caseItem.status as {
          __kind__: "rejected";
          rejected: { reason: string; comments: string };
        }
      ).rejected
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-ocid="enquiry.dialog">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Case Enquiry
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Current Status
            </span>
            <Badge
              variant="outline"
              className={`text-xs font-semibold ${statusCfg.className}`}
            >
              {statusCfg.label}
            </Badge>
          </div>

          <Separator />

          {/* Case identifiers */}
          <div className="grid grid-cols-2 gap-4">
            <DetailRow
              label="Case Number"
              value={<span className="font-mono">{caseItem.caseNumber}</span>}
            />
            <DetailRow label="J.L. No" value={caseItem.jlNo || "—"} />
            <DetailRow label="Mution No." value={caseItem.mutionNo || "—"} />
            {isAccepted && (
              <DetailRow
                label="Khation No."
                value={caseItem.khationNo || "—"}
              />
            )}
          </div>

          <Separator />

          {/* Client & dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <DetailRow label="Client Name" value={caseItem.clientName} />
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <DetailRow
                label="Hearing Date"
                value={
                  <span
                    className={
                      caseItem.hearingDate === 0n ? "text-muted-foreground" : ""
                    }
                  >
                    {formatDate(caseItem.hearingDate)}
                  </span>
                }
              />
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <DetailRow
                label="Created Date"
                value={formatDate(caseItem.createdDate)}
              />
            </div>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <DetailRow
                label="Documents"
                value={`${caseItem.documents.length} file(s)`}
              />
            </div>
          </div>

          {/* Rejection info */}
          {isRejected && rejectedData && (
            <>
              <Separator />
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                  Rejection Details
                </p>
                <p className="text-sm text-red-800">
                  <span className="font-medium">Reason:</span>{" "}
                  {rejectedData.reason}
                </p>
                {rejectedData.comments && (
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Comments:</span>{" "}
                    {rejectedData.comments}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
