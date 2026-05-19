import type { AssetCategory, TaxResult } from "@/lib/types/simulation";

// ---------------------------------------------------------------------------
// IOF — tabela regressiva (dia → % sobre o ganho)
// ---------------------------------------------------------------------------
const IOF_TABLE: Record<number, number> = {
  1: 0.96, 2: 0.93, 3: 0.90, 4: 0.86, 5: 0.83,
  6: 0.80, 7: 0.76, 8: 0.73, 9: 0.70, 10: 0.66,
  11: 0.63, 12: 0.60, 13: 0.56, 14: 0.53, 15: 0.50,
  16: 0.46, 17: 0.43, 18: 0.40, 19: 0.36, 20: 0.33,
  21: 0.30, 22: 0.26, 23: 0.23, 24: 0.20, 25: 0.16,
  26: 0.13, 27: 0.10, 28: 0.06, 29: 0.03, 30: 0.00,
};

// ---------------------------------------------------------------------------
// IR — tabela regressiva renda fixa / tesouro (dias → alíquota)
// ---------------------------------------------------------------------------
export function irRateFixedIncome(days: number): number {
  if (days <= 180) return 0.225;
  if (days <= 360) return 0.20;
  if (days <= 720) return 0.175;
  return 0.15;
}

export function irRateLabel(days: number): string {
  if (days <= 180) return "22,5% (até 6 meses)";
  if (days <= 360) return "20,0% (6–12 meses)";
  if (days <= 720) return "17,5% (1–2 anos)";
  return "15,0% (acima de 2 anos)";
}

export function calculateIof(grossGain: number, days: number): number {
  if (days >= 30) return 0;
  const capped = Math.max(1, Math.min(days, 29));
  const rate = (IOF_TABLE[capped] ?? 0) / 100;
  return Math.round(grossGain * rate);
}

// ---------------------------------------------------------------------------
// Cálculo de IR + IOF no resgate — snapshot final
// ---------------------------------------------------------------------------
export function calculateTax(
  invested: number,
  finalGross: number,
  months: number,
  assetCategory: AssetCategory,
): TaxResult {
  const days = months * 30;
  const grossGain = Math.max(0, finalGross - invested);

  if (grossGain === 0)
    return { grossGain: 0, taxRate: 0, taxAmount: 0, netGain: 0, netFinal: invested, iofAmount: 0 };

  let iofAmount = 0;
  let taxRate   = 0;
  let taxAmount = 0;

  switch (assetCategory) {
    case "renda_fixa_bancaria":
    case "tesouro_direto": {
      iofAmount = calculateIof(grossGain, days);
      const gainAfterIof = grossGain - iofAmount;
      taxRate   = irRateFixedIncome(days);
      taxAmount = Math.round(gainAfterIof * taxRate);
      break;
    }
    case "fundo_curto_prazo":
    case "fundo_longo_prazo": {
      const base = assetCategory === "fundo_curto_prazo" ? 0.20 : 0.15;
      taxRate   = base + 0.015; // come-cotas drag approximation
      taxAmount = Math.round(grossGain * taxRate);
      break;
    }
    case "acoes":
      taxRate   = 0.15;
      taxAmount = Math.round(grossGain * 0.15);
      break;
    case "fii":
      taxRate   = 0.20;
      taxAmount = Math.round(grossGain * 0.20);
      break;
    case "cripto":
    case "internacional":
      taxRate   = 0.15;
      taxAmount = Math.round(grossGain * 0.15);
      break;
  }

  const netGain  = grossGain - iofAmount - taxAmount;
  const netFinal = invested + netGain;
  return { grossGain, taxRate, taxAmount, netGain, netFinal, iofAmount };
}

// ---------------------------------------------------------------------------
// Ponto mensal completo
// ---------------------------------------------------------------------------
export interface MonthlyPoint {
  month:       number;   // 1-based
  year:        number;   // year number from start (1 = first year)
  label:       string;   // "Mês 1", "Jan/Ano 1", etc.
  shortLabel:  string;   // compact for dense charts

  // Acumulados
  invested:    number;   // centavos aportados até aqui
  grossValue:  number;   // patrimônio bruto acumulado
  grossGain:   number;   // lucro bruto acumulado

  // Tributação acumulada (snapshot: se resgatasse agora)
  iofAmount:   number;
  irAmount:    number;
  totalTax:    number;
  netValue:    number;   // líquido se resgatasse agora
  netGain:     number;

  // Rendimento do mês
  monthlyGrossIncome: number;  // quanto rendeu bruto neste mês
  monthlyNetIncome:   number;  // quanto iria pro bolso se resgatasse neste mês (incremental)

  // Alíquota vigente
  irRate:      number;   // decimal ex: 0.15
  irRateLabel: string;

  // Métricas
  returnPct:       number;  // % rendimento bruto total s/ investido
  annualizedReturn: number; // % a.a. equivalente até agora
}

// ---------------------------------------------------------------------------
// Simulação mês a mês completa
// ---------------------------------------------------------------------------
export function simulateMonthly(
  initialCents: number,
  monthlyCents: number,
  annualRatePct: number,
  totalMonths: number,
  assetCategory: AssetCategory,
): MonthlyPoint[] {
  const monthlyRate = annualRatePct / 100 / 12;
  const points: MonthlyPoint[] = [];

  let grossValue = initialCents;
  let invested   = initialCents;
  let prevGross  = initialCents;

  for (let m = 1; m <= totalMonths; m++) {
    // Aplica rendimento depois do aporte
    grossValue = grossValue * (1 + monthlyRate) + monthlyCents;
    invested  += monthlyCents;

    const yr          = Math.ceil(m / 12);
    const moInYear    = ((m - 1) % 12) + 1;
    const days        = m * 30;
    const grossGain   = Math.max(0, grossValue - invested);

    const iof   = calculateIof(grossGain, days);
    const irRate = irRateForCategory(assetCategory, days);
    const ir    = Math.round((grossGain - iof) * irRate);
    const total = iof + ir;
    const net   = grossValue - total;

    const monthlyGrossIncome = Math.round(grossValue - prevGross - monthlyCents);
    // Rendimento líquido incremental: diferença de net entre meses
    const prevTax  = m > 1 ? points[m - 2].totalTax : 0;
    const prevNet  = m > 1 ? points[m - 2].netValue  : initialCents;
    const monthlyNetIncome = Math.round(net - prevNet - monthlyCents);

    const annualizedReturn =
      m > 0 && invested > 0
        ? Math.round(
            (Math.pow(grossValue / Math.max(initialCents, 1), 12 / m) - 1) * 10000
          ) / 100
        : 0;

    points.push({
      month:       m,
      year:        yr,
      label:       `Mês ${m} (Ano ${yr})`,
      shortLabel:  m % 12 === 0 ? `Ano ${yr}` : `M${m}`,
      invested:    Math.round(invested),
      grossValue:  Math.round(grossValue),
      grossGain:   Math.round(grossGain),
      iofAmount:   iof,
      irAmount:    ir,
      totalTax:    total,
      netValue:    Math.round(net),
      netGain:     Math.round(grossGain - total),
      monthlyGrossIncome,
      monthlyNetIncome,
      irRate,
      irRateLabel: irRateLabelForCategory(assetCategory, days),
      returnPct:
        invested > 0 ? Math.round((grossGain / invested) * 10000) / 100 : 0,
      annualizedReturn,
    });

    prevGross = grossValue;
  }

  return points;
}

function irRateForCategory(cat: AssetCategory, days: number): number {
  switch (cat) {
    case "renda_fixa_bancaria":
    case "tesouro_direto":
      return irRateFixedIncome(days);
    case "fundo_curto_prazo":
      return 0.215; // 20% come-cotas + drag
    case "fundo_longo_prazo":
      return 0.165; // 15% come-cotas + drag
    case "fii":
      return 0.20;
    case "acoes":
    case "cripto":
    case "internacional":
      return 0.15;
  }
}

function irRateLabelForCategory(cat: AssetCategory, days: number): string {
  switch (cat) {
    case "renda_fixa_bancaria":
    case "tesouro_direto":
      return irRateLabel(days);
    case "fundo_curto_prazo":
      return "Come-cotas 20% semestral";
    case "fundo_longo_prazo":
      return "Come-cotas 15% semestral";
    case "fii":
      return "20% sobre ganho de capital";
    case "acoes":
      return "15% swing trade (isento até R$20k/mês)";
    case "cripto":
      return "15% sobre ganho";
    case "internacional":
      return "15% sobre ganho de capital";
  }
}

// ---------------------------------------------------------------------------
// Agregação: mensais → anuais (para o toggle de granularidade)
// ---------------------------------------------------------------------------
export function aggregateAnnual(points: MonthlyPoint[]): MonthlyPoint[] {
  const byYear = new Map<number, MonthlyPoint[]>();
  for (const p of points) {
    if (!byYear.has(p.year)) byYear.set(p.year, []);
    byYear.get(p.year)!.push(p);
  }
  return Array.from(byYear.entries()).map(([yr, pts]) => {
    const last = pts[pts.length - 1];
    const monthlyGross = pts.reduce((s, p) => s + p.monthlyGrossIncome, 0);
    const monthlyNet   = pts.reduce((s, p) => s + p.monthlyNetIncome, 0);
    return { ...last, shortLabel: `Ano ${yr}`, monthlyGrossIncome: monthlyGross, monthlyNetIncome: monthlyNet };
  });
}

// ---------------------------------------------------------------------------
// Legacy helper kept for GoalProjection / ScenarioComparator compat
// ---------------------------------------------------------------------------
export function simulateCompound(
  initialCents: number,
  monthlyCents: number,
  annualRatePct: number,
  months: number,
): Array<{ month: number; label: string; shortLabel: string; total: number; invested: number; interest: number }> {
  const rate = annualRatePct / 100 / 12;
  const all: Array<{ month: number; label: string; shortLabel: string; total: number; invested: number; interest: number }> = [];
  let total    = initialCents;
  let invested = initialCents;

  for (let m = 1; m <= months; m++) {
    total    = total * (1 + rate) + monthlyCents;
    invested += monthlyCents;
    const yr = Math.ceil(m / 12);
    all.push({
      month:      m,
      label:      `Mês ${m} (Ano ${yr})`,
      shortLabel: m % 12 === 0 ? `Ano ${yr}` : `M${m}`,
      total:      Math.round(total),
      invested:   Math.round(invested),
      interest:   Math.round(total - invested),
    });
  }
  return all;
}

// Aggregate compound points to annual
export function aggregateCompoundAnnual(
  all: ReturnType<typeof simulateCompound>,
): ReturnType<typeof simulateCompound> {
  const byYear = new Map<number, ReturnType<typeof simulateCompound>[number]>();
  for (const p of all) {
    byYear.set(p.month % 12 === 0 ? p.month / 12 : Math.ceil(p.month / 12), p);
  }
  return Array.from(byYear.values());
}
