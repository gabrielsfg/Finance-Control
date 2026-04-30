import { useQuery } from "@tanstack/react-query";
import type { Budget } from "@/lib/types/budgets.types";

const MOCK_BUDGETS: Budget[] = [
  {
    id: 1,
    name: "Orçamento Mensal — Abril",
    recurrence: "Monthly",
    startDate: "2026-04-01",
    endDate: "2026-04-30",
    totalAllocated: 680000,
    totalSpent: 493320,
    spentPercentage: 72.5,
    allocations: [
      { id: 1, subCategoryId: 1, subCategoryName: "Aluguel", categoryName: "Moradia", categoryColor: "#4A9EFF", areaName: "Fixos", areaColor: "#4A9EFF", allocated: 220000, spent: 220000, spentPercentage: 100 },
      { id: 7, subCategoryId: 7, subCategoryName: "Energia", categoryName: "Moradia", categoryColor: "#4A9EFF", areaName: "Fixos", areaColor: "#4A9EFF", allocated: 18000, spent: 12400, spentPercentage: 68.9 },
      { id: 8, subCategoryId: 8, subCategoryName: "Internet", categoryName: "Moradia", categoryColor: "#4A9EFF", areaName: "Fixos", areaColor: "#4A9EFF", allocated: 12000, spent: 11990, spentPercentage: 99.9 },
      { id: 2, subCategoryId: 2, subCategoryName: "Supermercado", categoryName: "Alimentação", categoryColor: "#F5A623", areaName: "Alimentação", areaColor: "#F5A623", allocated: 50000, spent: 31240, spentPercentage: 62.5 },
      { id: 3, subCategoryId: 3, subCategoryName: "Delivery", categoryName: "Alimentação", categoryColor: "#F5A623", areaName: "Alimentação", areaColor: "#F5A623", allocated: 20000, spent: 28990, spentPercentage: 144.9 },
      { id: 4, subCategoryId: 4, subCategoryName: "Combustível", categoryName: "Transporte", categoryColor: "#00C98D", areaName: "Transporte", areaColor: "#00C98D", allocated: 25000, spent: 18000, spentPercentage: 72 },
      { id: 5, subCategoryId: 5, subCategoryName: "Academia", categoryName: "Saúde", categoryColor: "#F25F5C", areaName: "Saúde & Bem-estar", areaColor: "#F25F5C", allocated: 10000, spent: 9900, spentPercentage: 99 },
      { id: 9, subCategoryId: 9, subCategoryName: "Farmácia", categoryName: "Saúde", categoryColor: "#F25F5C", areaName: "Saúde & Bem-estar", areaColor: "#F25F5C", allocated: 15000, spent: 4300, spentPercentage: 28.7 },
      { id: 6, subCategoryId: 6, subCategoryName: "Netflix", categoryName: "Lazer", categoryColor: "#7C6FE0", areaName: "Lazer & Pessoal", areaColor: "#7C6FE0", allocated: 5500, spent: 5500, spentPercentage: 100 },
      { id: 10, subCategoryId: 10, subCategoryName: "Roupas", categoryName: "Pessoal", categoryColor: "#00D4A0", areaName: "Lazer & Pessoal", areaColor: "#7C6FE0", allocated: 30000, spent: 0, spentPercentage: 0 },
    ],
  },
  {
    id: 2,
    name: "Viagem Europa — Julho",
    recurrence: "Monthly",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    totalAllocated: 1200000,
    totalSpent: 320000,
    spentPercentage: 26.7,
    allocations: [
      { id: 11, subCategoryId: 11, subCategoryName: "Passagem Aérea", categoryName: "Viagem", categoryColor: "#4A9EFF", allocated: 600000, spent: 320000, spentPercentage: 53.3 },
      { id: 12, subCategoryId: 12, subCategoryName: "Hospedagem", categoryName: "Viagem", categoryColor: "#4A9EFF", allocated: 400000, spent: 0, spentPercentage: 0 },
      { id: 13, subCategoryId: 13, subCategoryName: "Passeios", categoryName: "Viagem", categoryColor: "#4A9EFF", allocated: 200000, spent: 0, spentPercentage: 0 },
    ],
  },
];

const USE_MOCK = true;

export const useBudgets = () =>
  useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_BUDGETS) : Promise.resolve([]),
  });
