import { useQuery } from "@tanstack/react-query";
import { subcategoriesApi } from "@/lib/api/subcategories";
import type { SubCategoryItem } from "@/lib/types/transactions.types";

const MOCK_SUBCATEGORIES: SubCategoryItem[] = [
  { id: 1, categoryId: 1, categoryName: "Receita", categoryColor: "#00C98D", name: "Salário" },
  { id: 9, categoryId: 1, categoryName: "Receita", categoryColor: "#00C98D", name: "Freelance" },
  { id: 12, categoryId: 1, categoryName: "Receita", categoryColor: "#00C98D", name: "Dividendos" },
  { id: 2, categoryId: 2, categoryName: "Moradia", categoryColor: "#4A9EFF", name: "Aluguel" },
  { id: 3, categoryId: 3, categoryName: "Alimentação", categoryColor: "#F5A623", name: "Supermercado" },
  { id: 4, categoryId: 3, categoryName: "Alimentação", categoryColor: "#F5A623", name: "Delivery" },
  { id: 5, categoryId: 4, categoryName: "Transporte", categoryColor: "#00D4A0", name: "Aplicativo" },
  { id: 10, categoryId: 4, categoryName: "Transporte", categoryColor: "#00D4A0", name: "Combustível" },
  { id: 6, categoryId: 5, categoryName: "Lazer", categoryColor: "#7C6FE0", name: "Streaming" },
  { id: 11, categoryId: 5, categoryName: "Lazer", categoryColor: "#7C6FE0", name: "Lazer" },
  { id: 7, categoryId: 6, categoryName: "Educação", categoryColor: "#F5CE42", name: "Eletrônicos" },
  { id: 8, categoryId: 7, categoryName: "Saúde", categoryColor: "#F25F5C", name: "Saúde" },
];

const USE_MOCK = true;

export const useSubCategories = () =>
  useQuery<SubCategoryItem[]>({
    queryKey: ["subcategories"],
    queryFn: () =>
      USE_MOCK ? Promise.resolve(MOCK_SUBCATEGORIES) : subcategoriesApi.getAll(),
    staleTime: 5 * 60_000,
  });
