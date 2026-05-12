"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recurrencesApi } from "@/lib/api/recurrences";
import { MOCK_RECURRENCES } from "@/lib/mocks/recurrencesMock";
import type { RecurrencePageData, CreateRecurringRequest, UpdateRecurringRequest } from "@/lib/types/recurrences.types";

const USE_MOCK = true;
const KEY = ["recurrences"] as const;

export function useRecurrencePage() {
  return useQuery<RecurrencePageData>({
    queryKey: KEY,
    queryFn: USE_MOCK ? () => MOCK_RECURRENCES : () => recurrencesApi.getPage(),
  });
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringRequest) => recurrencesApi.createRecurring(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRecurringRequest }) =>
      recurrencesApi.updateRecurring(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCancelRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recurrencesApi.cancelRecurring(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recurrencesApi.deleteRecurring(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
