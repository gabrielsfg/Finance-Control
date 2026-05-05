"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useUIStore } from "@/lib/stores/uiStore";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "@/lib/api/accounts";
import { categoriesApi } from "@/lib/api/categories";
import { investmentsApi } from "@/lib/api/investments";
import { transactionsApi } from "@/lib/api/transactions";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useUIStore();
  const qc = useQueryClient();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [theme]);

  // Prefetch silencioso para o search global funcionar mesmo sem visitar as páginas.
  // staleTime espelhado dos hooks de cada feature para evitar refetches redundantes.
  useEffect(() => {
    qc.prefetchQuery({ queryKey: ["accounts"],      queryFn: accountsApi.getAll,              staleTime: 60_000 });
    qc.prefetchQuery({ queryKey: ["categories"],    queryFn: categoriesApi.getAll,            staleTime: 60_000 });
    qc.prefetchQuery({ queryKey: ["investments"],   queryFn: investmentsApi.getPortfolio,     staleTime: 5 * 60_000 });
    qc.prefetchQuery({ queryKey: ["transactions"],  queryFn: transactionsApi.getAll,          staleTime: 60_000 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
