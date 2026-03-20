import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Case } from "../backend";
import { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

export type SortMode = "default" | "hearingDate" | "clientName" | "caseNumber";

export function useGetCases(sortMode: SortMode) {
  const { actor, isFetching } = useActor();
  return useQuery<Array<Case & { id: bigint }>>({
    queryKey: ["cases", sortMode],
    queryFn: async () => {
      if (!actor) return [];
      let cases: Case[];
      if (sortMode === "hearingDate") {
        cases = await actor.getCasesSortedByHearingDate();
      } else if (sortMode === "clientName") {
        cases = await actor.getCasesSortedByClientName();
      } else if (sortMode === "caseNumber") {
        cases = await actor.getCasesSortedByCaseNumber();
      } else {
        cases = await actor.getAllCases();
      }
      return cases.map((c, i) => ({ ...c, id: BigInt(i) }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAcceptCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      caseId,
      files,
      khationNo,
    }: { caseId: bigint; files: File[]; khationNo: string }) => {
      if (!actor) throw new Error("No actor");
      const blobs = await Promise.all(
        files.map(async (file) => {
          const buf = await file.arrayBuffer();
          return ExternalBlob.fromBytes(new Uint8Array(buf));
        }),
      );
      await actor.acceptCase(caseId, blobs, khationNo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useRejectCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      caseId,
      reason,
      comments,
    }: { caseId: bigint; reason: string; comments: string }) => {
      if (!actor) throw new Error("No actor");
      await actor.rejectCase(caseId, reason, comments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useAddCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      caseNumber,
      clientName,
      hearingDate,
      jlNo,
      mutionNo,
    }: {
      caseNumber: string;
      clientName: string;
      hearingDate: bigint;
      jlNo: string;
      mutionNo: string;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.addCase(caseNumber, clientName, hearingDate, jlNo, mutionNo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useEditCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      caseId,
      caseNumber,
      clientName,
      hearingDate,
      jlNo,
      mutionNo,
    }: {
      caseId: bigint;
      caseNumber: string;
      clientName: string;
      hearingDate: bigint;
      jlNo: string;
      mutionNo: string;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.editCase(
        caseId,
        caseNumber,
        clientName,
        hearingDate,
        jlNo,
        mutionNo,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}
