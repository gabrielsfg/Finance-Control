import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goalsApi } from "@/lib/api/goals";
import type { Goal, CreateGoalRequest, UpdateGoalRequest, GoalType, GoalStatus } from "@/lib/types/goal.types";

const MOCK_GOALS: Goal[] = [
  {
    id: 1,
    name: "MacBook Pro M4",
    description: 'Modelo 14" com 16GB RAM',
    type: "Item",
    targetAmount: 1599900,
    priority: "High",
    status: "Active",
    url: "https://www.apple.com/br/macbook-pro/",
    imageUrl: null,
    targetDate: null,
    latestCheckpointAmount: 1759900,
    createdAt: "2026-02-10T00:00:00Z",
    updatedAt: null,
  },
  {
    id: 2,
    name: "Tênis Nike Air Max 270",
    description: null,
    type: "Item",
    targetAmount: 69900,
    priority: "Medium",
    status: "Active",
    url: null,
    imageUrl: null,
    targetDate: null,
    latestCheckpointAmount: 79900,
    createdAt: "2026-03-05T00:00:00Z",
    updatedAt: null,
  },
  {
    id: 3,
    name: "Kindle Paperwhite",
    description: "16GB, à prova d'água",
    type: "Item",
    targetAmount: 49900,
    priority: "Low",
    status: "Active",
    url: null,
    imageUrl: null,
    targetDate: null,
    latestCheckpointAmount: 49900,
    createdAt: "2026-03-20T00:00:00Z",
    updatedAt: null,
  },
  {
    id: 4,
    name: "Curso de Inglês Anual",
    description: "Plataforma Preply ou iTalki",
    type: "Item",
    targetAmount: 120000,
    priority: "High",
    status: "Achieved",
    url: null,
    imageUrl: null,
    targetDate: null,
    latestCheckpointAmount: null,
    createdAt: "2026-04-01T00:00:00Z",
    updatedAt: "2026-04-20T00:00:00Z",
  },
  {
    id: 5,
    name: "Reserva de emergência",
    description: "6 meses de custo de vida",
    type: "Investment",
    targetAmount: 3600000,
    priority: "High",
    status: "Active",
    url: null,
    imageUrl: null,
    targetDate: "2027-12-31",
    latestCheckpointAmount: 2150000,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: null,
  },
  {
    id: 6,
    name: "Patrimônio R$ 500k",
    description: "Primeiro grande marco de patrimônio",
    type: "Investment",
    targetAmount: 50000000,
    priority: "Medium",
    status: "Active",
    url: null,
    imageUrl: null,
    targetDate: "2030-06-30",
    latestCheckpointAmount: 21500000,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: null,
  },
];

const USE_MOCK = true;

export const useGoals = (params?: { type?: GoalType; status?: GoalStatus }) =>
  useQuery({
    queryKey: ["goals", params],
    queryFn: () => {
      if (USE_MOCK) {
        let result = MOCK_GOALS;
        if (params?.type) result = result.filter((g) => g.type === params.type);
        if (params?.status) result = result.filter((g) => g.status === params.status);
        return Promise.resolve(result);
      }
      return goalsApi.getAll(params);
    },
    staleTime: 60_000,
  });

export const useGoalDetail = (id: number) =>
  useQuery({
    queryKey: ["goals", id],
    queryFn: () => goalsApi.getById(id),
    staleTime: 60_000,
  });

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalRequest) => goalsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGoalRequest }) => goalsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => goalsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useRecordCheckpoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => goalsApi.recordCheckpoint(id, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};

export const useAchieveGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => goalsApi.achieve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
};
