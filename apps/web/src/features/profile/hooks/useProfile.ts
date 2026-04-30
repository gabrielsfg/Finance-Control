import { useQuery } from "@tanstack/react-query";
import type { UserProfile } from "@/lib/types/profile.types";

const MOCK_PROFILE: UserProfile = {
  id: "usr_001",
  name: "Gabriel Silva",
  email: "gabriel@email.com",
  plan: "Free",
  createdAt: "2024-01-15",
  currency: "BRL",
  language: "pt-BR",
  notificationsEnabled: true,
};

const USE_MOCK = true;

export const useProfile = () =>
  useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => USE_MOCK ? Promise.resolve(MOCK_PROFILE) : Promise.resolve(MOCK_PROFILE),
  });
