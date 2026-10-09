import { api } from "./axios";
import type {
  CreateMcpTokenRequest,
  CreateMcpTokenResponse,
  McpConnection,
  McpInfo,
  McpToken,
  OAuthConsentRequest,
  OAuthDecisionResponse,
} from "@/lib/types/mcp.types";

export const mcpApi = {
  getInfo: async (): Promise<McpInfo> => {
    const response = await api.get<McpInfo>("/mcp/info");
    return response.data;
  },

  listConnections: async (): Promise<McpConnection[]> => {
    const response = await api.get<McpConnection[]>("/mcp/connections");
    return response.data;
  },

  /** Revokes immediately and answers with the updated list. */
  revokeConnection: async (id: number): Promise<McpConnection[]> => {
    const response = await api.delete<McpConnection[]>(`/mcp/connections/${id}`);
    return response.data;
  },

  listTokens: async (): Promise<McpToken[]> => {
    const response = await api.get<McpToken[]>("/mcp/tokens");
    return response.data;
  },

  createToken: async (data: CreateMcpTokenRequest): Promise<CreateMcpTokenResponse> => {
    const response = await api.post<CreateMcpTokenResponse>("/mcp/tokens", data);
    return response.data;
  },

  revokeToken: async (id: number): Promise<McpToken[]> => {
    const response = await api.delete<McpToken[]>(`/mcp/tokens/${id}`);
    return response.data;
  },
};

/** The consent step of the MCP OAuth flow — the browser lands on /oauth/consent. */
export const oauthApi = {
  getRequest: async (requestId: string): Promise<OAuthConsentRequest> => {
    const response = await api.get<OAuthConsentRequest>(
      `/oauth/requests/${encodeURIComponent(requestId)}`,
    );
    return response.data;
  },

  approve: async (requestId: string): Promise<OAuthDecisionResponse> => {
    const response = await api.post<OAuthDecisionResponse>(
      `/oauth/requests/${encodeURIComponent(requestId)}/approve`,
    );
    return response.data;
  },

  deny: async (requestId: string): Promise<OAuthDecisionResponse> => {
    const response = await api.post<OAuthDecisionResponse>(
      `/oauth/requests/${encodeURIComponent(requestId)}/deny`,
    );
    return response.data;
  },
};
