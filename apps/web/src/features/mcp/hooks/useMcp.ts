import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mcpApi, oauthApi } from "@/lib/api/mcp";
import type { CreateMcpTokenRequest } from "@/lib/types/mcp.types";

export const useMcpInfo = () =>
  useQuery({
    queryKey: ["mcp", "info"],
    queryFn: mcpApi.getInfo,
    // The server URL and the scope list are configuration — they do not change in a session.
    staleTime: Infinity,
  });

export const useMcpConnections = () =>
  useQuery({
    queryKey: ["mcp", "connections"],
    queryFn: mcpApi.listConnections,
  });

export const useRevokeMcpConnection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mcpApi.revokeConnection(id),
    onSuccess: (updated) => queryClient.setQueryData(["mcp", "connections"], updated),
  });
};

export const useMcpTokens = () =>
  useQuery({
    queryKey: ["mcp", "tokens"],
    queryFn: mcpApi.listTokens,
  });

export const useCreateMcpToken = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMcpTokenRequest) => mcpApi.createToken(data),
    // Only the new item is returned, so the list is refetched rather than rebuilt here.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mcp", "tokens"] }),
  });
};

export const useRevokeMcpToken = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mcpApi.revokeToken(id),
    onSuccess: (updated) => queryClient.setQueryData(["mcp", "tokens"], updated),
  });
};

export const useOAuthRequest = (requestId: string | null) =>
  useQuery({
    queryKey: ["oauth", "request", requestId],
    queryFn: () => oauthApi.getRequest(requestId as string),
    enabled: !!requestId,
    // 404/410 mean expired or unknown — retrying cannot change that.
    retry: false,
    staleTime: Infinity,
  });

export const useOAuthDecision = () =>
  useMutation({
    mutationFn: ({ requestId, approve }: { requestId: string; approve: boolean }) =>
      approve ? oauthApi.approve(requestId) : oauthApi.deny(requestId),
  });
