import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  Bell,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Edit2,
  Eye,
  LayoutDashboard,
  Mail,
  Plus,
  Scale,
  Search,
  Settings,
  SortAsc,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { Case } from "./backend";
import { AcceptModal } from "./components/AcceptModal";
import { AddCaseModal } from "./components/AddCaseModal";
import { CaseEnquiryModal } from "./components/CaseEnquiryModal";
import { EditCaseModal } from "./components/EditCaseModal";
import { RejectModal } from "./components/RejectModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { type SortMode, useGetCases, useIsAdmin } from "./hooks/useQueries";

const queryClient = new QueryClient();

function formatDate(nanos: bigint): string {
  const ms = Number(nanos / 1_000_000n);
  if (ms === 0) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
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

type CaseWithId = Case & { id: bigint };

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Briefcase, label: "Cases" },
  { icon: Users, label: "Clients" },
  { icon: Calendar, label: "Calendar" },
  { icon: BarChart2, label: "Reports" },
  { icon: Settings, label: "Settings" },
];

const NOW_MS = Date.now();
const DAY_MS = 86_400_000;

function useHearingAlerts(cases: CaseWithId[]) {
  return useMemo(() => {
    const urgent: CaseWithId[] = [];
    const warning: CaseWithId[] = [];
    for (const c of cases) {
      if (c.hearingDate === 0n) continue;
      const diffMs = Number(c.hearingDate / 1_000_000n) - NOW_MS;
      if (diffMs < 0) continue;
      const diffDays = diffMs / DAY_MS;
      if (diffDays <= 7) urgent.push(c);
      else if (diffDays <= 30) warning.push(c);
    }
    return { urgent, warning };
  }, [cases]);
}

function AppContent() {
  const { login, loginStatus, identity, clear } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;

  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [acceptModal, setAcceptModal] = useState<CaseWithId | null>(null);
  const [rejectModal, setRejectModal] = useState<CaseWithId | null>(null);
  const [addCaseOpen, setAddCaseOpen] = useState(false);
  const [editModal, setEditModal] = useState<CaseWithId | null>(null);
  const [enquiryModal, setEnquiryModal] = useState<CaseWithId | null>(null);

  const { data: cases = [], isLoading } = useGetCases(sortMode);
  const { data: isAdmin } = useIsAdmin();

  const { urgent, warning } = useHearingAlerts(cases);

  const filteredCases = useMemo(() => {
    let result = cases;
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status.__kind__ === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(q) ||
          c.clientName.toLowerCase().includes(q) ||
          c.jlNo.toLowerCase().includes(q) ||
          c.mutionNo.toLowerCase().includes(q),
      );
    }
    return result;
  }, [cases, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = cases.length;
    const active = cases.filter(
      (c) =>
        c.status.__kind__ === "scheduled" || c.status.__kind__ === "reviewing",
    ).length;
    const pending = cases.filter((c) => c.status.__kind__ === "pending").length;
    const nextHearing = cases
      .map((c) => c.hearingDate)
      .filter((d) => d > 0n)
      .sort((a, b) => (a < b ? -1 : 1))[0];
    return { total, active, pending, nextHearing };
  }, [cases]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl shadow-card p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">LexCase</span>
          </div>
          <p className="text-muted-foreground text-sm text-center">
            Legal case management system. Sign in to access your dashboard.
          </p>
          <Button
            className="w-full"
            onClick={login}
            disabled={loginStatus === "logging-in"}
            data-ocid="login.primary_button"
          >
            {loginStatus === "logging-in" ? "Signing in..." : "Sign In"}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full bg-card border-b border-border h-16 flex items-center px-6 gap-4 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Scale className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">LexCase</span>
        </div>

        <div className="flex-1 max-w-lg mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cases, clients, J.L. No..."
              className="pl-9 bg-background border-border h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-ocid="header.search_input"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="relative p-2 rounded-lg hover:bg-accent transition-colors"
                  aria-label="Hearing Alerts"
                  data-ocid="header.toggle"
                >
                  <Bell
                    className={`h-5 w-5 ${
                      urgent.length > 0
                        ? "text-red-500 animate-pulse"
                        : warning.length > 0
                          ? "text-yellow-500"
                          : "text-muted-foreground"
                    }`}
                  />
                  {urgent.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {urgent.length}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {urgent.length > 0
                  ? `${urgent.length} case(s) with hearings within 7 days`
                  : warning.length > 0
                    ? `${warning.length} case(s) with hearings within 30 days`
                    : "No upcoming hearing alerts"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Messages"
          >
            <Mail className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
            onClick={clear}
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">JS</span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-none">John Smith</p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Admin" : "User"}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="w-full bg-card border-b border-border px-6">
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              type="button"
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
              data-ocid={`nav.${label.toLowerCase()}.link`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 w-full px-6 py-6">
        {/* Hearing Alarm Banners */}
        <AnimatePresence>
          {urgent.length > 0 && (
            <motion.div
              key="urgent-banner"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-4 bg-red-50 border border-red-300 rounded-lg p-4"
              data-ocid="alarm.urgent.panel"
            >
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-red-600 animate-pulse flex-shrink-0" />
                <p className="text-sm font-bold text-red-700">
                  HEARING ALERT: {urgent.length} case(s) have hearings within 7
                  days
                </p>
              </div>
              <div className="space-y-1 ml-6">
                {urgent.map((c) => (
                  <button
                    key={`${c.caseNumber}-urgent`}
                    type="button"
                    onClick={() => setEnquiryModal(c)}
                    className="flex items-center gap-2 text-xs text-red-700 hover:text-red-900 hover:underline transition-colors"
                    data-ocid="alarm.urgent.button"
                  >
                    <AlertCircle className="h-3 w-3" />
                    <span className="font-semibold">{c.caseNumber}</span>
                    <span>—</span>
                    <span>{c.clientName}</span>
                    <span className="text-red-500">
                      ({formatDate(c.hearingDate)})
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {warning.length > 0 && (
            <motion.div
              key="warning-banner"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-4 bg-yellow-50 border border-yellow-300 rounded-lg p-4"
              data-ocid="alarm.warning.panel"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <p className="text-sm font-bold text-yellow-700">
                  HEARING REMINDER: {warning.length} case(s) have hearings
                  within 30 days
                </p>
              </div>
              <div className="space-y-1 ml-6">
                {warning.map((c) => (
                  <button
                    key={`${c.caseNumber}-warning`}
                    type="button"
                    onClick={() => setEnquiryModal(c)}
                    className="flex items-center gap-2 text-xs text-yellow-700 hover:text-yellow-900 hover:underline transition-colors"
                    data-ocid="alarm.warning.button"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span className="font-semibold">{c.caseNumber}</span>
                    <span>—</span>
                    <span>{c.clientName}</span>
                    <span className="text-yellow-500">
                      ({formatDate(c.hearingDate)})
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page title + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Current Cases Overview
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="h-8 text-xs w-36"
                data-ocid="cases.filter.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => setAddCaseOpen(true)}
              className="h-8 text-xs"
              data-ocid="cases.add_new.primary_button"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add New Case
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Cases",
              value: stats.total,
              color: "text-foreground",
            },
            { label: "Active", value: stats.active, color: "text-blue-600" },
            {
              label: "Pending Review",
              value: stats.pending,
              color: "text-yellow-600",
            },
            {
              label: "Next Hearing",
              value: stats.nextHearing ? formatDate(stats.nextHearing) : "—",
              color: "text-emerald-600",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-card border border-border rounded-lg p-4 shadow-xs"
            >
              <p className="text-xs text-muted-foreground font-medium mb-1">
                {label}
              </p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Cases table card */}
        <div className="bg-card border border-border rounded-lg shadow-xs">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-base">Active Cases</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddCaseOpen(true)}
              className="h-8 text-xs"
              data-ocid="cases.table_add.secondary_button"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add New Cases
            </Button>
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30 flex-wrap">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium mr-1">
              Sort:
            </span>
            {(
              [
                ["default", "Default"],
                ["hearingDate", "By Hearing Date"],
                ["clientName", "By Name"],
                ["caseNumber", "By Case Number"],
              ] as [SortMode, string][]
            ).map(([mode, label]) => (
              <button
                type="button"
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  sortMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
                data-ocid={`cases.sort_${mode}.tab`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="p-5 space-y-3" data-ocid="cases.loading_state">
              {Array.from({ length: 5 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredCases.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
              data-ocid="cases.empty_state"
            >
              <Briefcase className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No cases found</p>
              <p className="text-xs mt-1">
                Try adjusting your filters or add a new case.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="cases.table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[120px]">
                      Case No.
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[100px]">
                      J.L. No
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[110px]">
                      Mution No.
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[110px]">
                      Case Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[120px]">
                      Hearing Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[110px]">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[300px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredCases.map((c, idx) => {
                      const statusCfg = getStatusConfig(c.status);
                      const isRejected = c.status.__kind__ === "rejected";
                      const rejectedData = isRejected
                        ? (
                            c.status as {
                              __kind__: "rejected";
                              rejected: { reason: string; comments: string };
                            }
                          ).rejected
                        : null;
                      const isAccepted = c.status.__kind__ === "accepted";
                      const canAccept =
                        !isAccepted && c.status.__kind__ !== "rejected";
                      const canReject =
                        !isRejected && c.status.__kind__ !== "accepted";

                      return (
                        <motion.tr
                          key={`${c.caseNumber}-${idx}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                          data-ocid={`cases.item.${idx + 1}`}
                        >
                          <TableCell className="font-mono text-xs font-medium">
                            {c.caseNumber}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {c.jlNo || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {c.mutionNo || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(c.createdDate)}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {c.clientName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(c.hearingDate)}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs font-medium cursor-default ${statusCfg.className}`}
                                  >
                                    {statusCfg.label}
                                  </Badge>
                                </TooltipTrigger>
                                {isRejected && rejectedData && (
                                  <TooltipContent className="max-w-xs">
                                    <p className="font-semibold text-xs mb-1">
                                      Rejected: {rejectedData.reason}
                                    </p>
                                    {rejectedData.comments && (
                                      <p className="text-xs text-muted-foreground">
                                        {rejectedData.comments}
                                      </p>
                                    )}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap">
                              {/* Enquiry */}
                              <button
                                type="button"
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-muted/60 text-muted-foreground hover:bg-muted transition-colors border border-border"
                                onClick={() => setEnquiryModal(c)}
                                data-ocid={`cases.view.button.${idx + 1}`}
                              >
                                <Eye className="h-3 w-3" />
                                Enquiry
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors border border-violet-200"
                                onClick={() => setEditModal(c)}
                                data-ocid={`cases.edit_button.${idx + 1}`}
                              >
                                <Edit2 className="h-3 w-3" />
                                Edit
                              </button>

                              {canAccept && (
                                <button
                                  type="button"
                                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                                  onClick={() => setAcceptModal(c)}
                                  data-ocid={`cases.accept.button.${idx + 1}`}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Accept
                                </button>
                              )}

                              {canReject && (
                                <button
                                  type="button"
                                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200"
                                  onClick={() => setRejectModal(c)}
                                  data-ocid={`cases.reject.button.${idx + 1}`}
                                >
                                  <XCircle className="h-3 w-3" />
                                  Reject
                                </button>
                              )}

                              {isRejected && rejectedData && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-200 cursor-help"
                                      >
                                        <AlertCircle className="h-3 w-3" />
                                        Why Rejected
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      className="max-w-xs"
                                      side="left"
                                    >
                                      <p className="font-semibold text-xs mb-1">
                                        Reason: {rejectedData.reason}
                                      </p>
                                      {rejectedData.comments && (
                                        <p className="text-xs">
                                          {rejectedData.comments}
                                        </p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-card px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} LexCase. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <span className="hover:text-foreground transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-foreground transition-colors cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:text-foreground transition-colors cursor-pointer">
              Help
            </span>
          </div>
          <span>
            Built with ♥ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>

      {/* Modals */}
      {acceptModal && (
        <AcceptModal
          open={!!acceptModal}
          onClose={() => setAcceptModal(null)}
          caseId={acceptModal.id}
          caseNumber={acceptModal.caseNumber}
          clientName={acceptModal.clientName}
        />
      )}
      {rejectModal && (
        <RejectModal
          open={!!rejectModal}
          onClose={() => setRejectModal(null)}
          caseId={rejectModal.id}
          caseNumber={rejectModal.caseNumber}
          clientName={rejectModal.clientName}
        />
      )}
      {editModal && (
        <EditCaseModal
          open={!!editModal}
          onClose={() => setEditModal(null)}
          caseItem={editModal}
        />
      )}
      {enquiryModal && (
        <CaseEnquiryModal
          open={!!enquiryModal}
          onClose={() => setEnquiryModal(null)}
          caseItem={enquiryModal}
        />
      )}
      <AddCaseModal open={addCaseOpen} onClose={() => setAddCaseOpen(false)} />
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
