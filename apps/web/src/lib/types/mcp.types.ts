export type McpScope = {
  name: string;
  description: string;
};

export type McpInfo = {
  serverUrl: string;
  scopes: McpScope[];
};

/** An AI client connected through the OAuth flow. */
export type McpConnection = {
  id: number;
  clientName: string;
  clientUri: string | null;
  redirectHost: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
};

/** A personal access token. Only the prefix is ever returned after creation. */
export type McpToken = {
  id: number;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
};

export type CreateMcpTokenRequest = {
  name: string;
  scopes: string[];
  expiresInDays: number;
};

export type CreateMcpTokenResponse = {
  /** The full token — returned this one time only. */
  token: string;
  item: McpToken;
};

export type OAuthConsentRequest = {
  requestId: string;
  clientName: string;
  clientUri: string | null;
  redirectHost: string;
  scopes: McpScope[];
  expiresAt: string;
};

export type OAuthDecisionResponse = {
  redirectUrl: string;
};
