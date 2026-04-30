import { useQuery } from "@tanstack/react-query";
import type { WishlistItem } from "@/lib/types/profile.types";

const MOCK_WISHLIST: WishlistItem[] = [
  {
    id: 1,
    name: "MacBook Pro M4",
    targetPrice: 1599900,
    currentPrice: 1759900,
    url: null,
    priority: "High",
    createdAt: "2026-02-10",
    notes: "Modelo 14\" com 16GB RAM",
    priceHistory: [
      { date: "2025-10-01", price: 1899900 },
      { date: "2025-11-01", price: 1859900 },
      { date: "2025-12-01", price: 1849900 },
      { date: "2026-01-01", price: 1829900 },
      { date: "2026-02-01", price: 1799900 },
      { date: "2026-03-01", price: 1779900 },
      { date: "2026-04-01", price: 1759900 },
    ],
  },
  {
    id: 2,
    name: "Tênis Nike Air Max 270",
    targetPrice: 69900,
    currentPrice: 79900,
    url: null,
    priority: "Medium",
    createdAt: "2026-03-05",
    notes: null,
    priceHistory: [
      { date: "2026-01-01", price: 89900 },
      { date: "2026-02-01", price: 84900 },
      { date: "2026-03-01", price: 84900 },
      { date: "2026-04-01", price: 79900 },
    ],
  },
  {
    id: 3,
    name: "Kindle Paperwhite",
    targetPrice: 49900,
    currentPrice: 49900,
    url: null,
    priority: "Low",
    createdAt: "2026-03-20",
    notes: "16GB, à prova d'água",
    priceHistory: [
      { date: "2026-01-01", price: 59900 },
      { date: "2026-02-01", price: 54900 },
      { date: "2026-03-01", price: 52900 },
      { date: "2026-04-01", price: 49900 },
    ],
  },
  {
    id: 4,
    name: "Curso de Inglês Anual",
    targetPrice: 120000,
    currentPrice: null,
    url: null,
    priority: "High",
    createdAt: "2026-04-01",
    notes: "Plataforma Preply ou iTalki",
    priceHistory: [],
  },
];

const USE_MOCK = true;

export const useWishlist = () =>
  useQuery<WishlistItem[]>({
    queryKey: ["wishlist"],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_WISHLIST) : Promise.resolve(MOCK_WISHLIST),
    staleTime: 5 * 60 * 1000,
  });
