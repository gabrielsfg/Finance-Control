"use client";

import dynamic from "next/dynamic";
import { useUIStore } from "@/lib/stores/uiStore";
import type { ConnectToken } from "@/lib/types/openFinance.types";

// The widget touches window on import; it only ever renders in the browser.
const PluggyConnect = dynamic(() => import("react-pluggy-connect").then((m) => m.PluggyConnect), {
  ssr: false,
});

type Props = {
  token: ConnectToken;
  /** The item id Pluggy created (or updated). The backend takes it from here. */
  onSuccess: (itemId: string) => void;
  /** The widget failed; the message is Pluggy's, already in Portuguese. */
  onError: (message: string, itemId?: string) => void;
  onClose: () => void;
};

/**
 * Pluggy Connect: the user picks the bank and authorizes it there. Callbacks only drive
 * the screen — the backend learns the outcome from Pluggy's webhooks too, so closing
 * the tab halfway loses nothing.
 */
export function PluggyWidget({ token, onSuccess, onError, onClose }: Props) {
  const theme = useUIStore((s) => s.theme);

  return (
    <PluggyConnect
      connectToken={token.accessToken}
      includeSandbox={token.includeSandbox}
      updateItem={token.updateItemId ?? undefined}
      connectorTypes={token.includeSandbox ? undefined : ["PERSONAL_BANK"]}
      countries={["BR"]}
      products={["ACCOUNTS", "CREDIT_CARDS", "TRANSACTIONS", "INVESTMENTS"]}
      language="pt"
      theme={theme === "dark" ? "dark" : "light"}
      onSuccess={({ item }) => onSuccess(item.id)}
      onError={(error) => onError(error.message, error.data?.item?.id)}
      onClose={onClose}
    />
  );
}
