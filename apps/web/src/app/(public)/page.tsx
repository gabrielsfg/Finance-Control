export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center p-6">
      <div className="from-green to-purple flex h-12 w-12 items-center justify-center rounded-[10px] bg-gradient-to-br">
        <span className="font-display text-xl font-bold text-black dark:text-white">C</span>
      </div>
      <h1 className="font-display font-800 text-text mt-4 text-4xl tracking-tight">
        Controle Financeiro
      </h1>
      <p className="text-text-sub mt-2">Seu dinheiro, organizado</p>
    </div>
  );
}
