import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackDrawer } from "./FeedbackDrawer";

const create = vi.fn();

vi.mock("@/lib/api/feedback", () => ({
  feedbackApi: {
    create: (...args: unknown[]) => create(...args),
  },
}));

function renderDrawer(onClose = vi.fn()) {
  // Retries would stretch the failure case into the test timeout.
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <FeedbackDrawer open onClose={onClose} />
    </QueryClientProvider>,
  );

  return { onClose };
}

describe("FeedbackDrawer", () => {
  beforeEach(() => {
    create.mockReset();
    create.mockResolvedValue({ id: 1 });
  });

  it("opens on the bug option with both choices offered", () => {
    renderDrawer();

    expect(screen.getByRole("button", { name: /Problema/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Sugestão/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("refuses a summary shorter than three characters", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.type(screen.getByLabelText("Resumo"), "ab");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByText("Escreva pelo menos 3 caracteres")).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it("sends the chosen type, the trimmed text and the source", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: /Sugestão/ }));
    await user.type(screen.getByLabelText("Resumo"), "  Filtrar o extrato por tag  ");
    await user.type(screen.getByLabelText(/Detalhes/), "Ajudaria a fechar o mês.");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        type: "Suggestion",
        title: "Filtrar o extrato por tag",
        description: "Ajudaria a fechar o mês.",
        source: "web",
      }),
    );
  });

  it("omits an empty description instead of sending an empty string", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.type(screen.getByLabelText("Resumo"), "O saldo não atualiza");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ description: undefined }),
      ),
    );
  });

  it("replaces the form with a confirmation once it lands", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.type(screen.getByLabelText("Resumo"), "O saldo não atualiza");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByText("Recebemos, obrigado!")).toBeInTheDocument();
    expect(screen.queryByLabelText("Resumo")).not.toBeInTheDocument();
  });

  it("keeps the typed text on the screen when the request fails", async () => {
    create.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderDrawer();

    await user.type(screen.getByLabelText("Resumo"), "O saldo não atualiza");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(
      await screen.findByText("Não foi possível enviar agora. Tente novamente."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Resumo")).toHaveValue("O saldo não atualiza");
  });
});
