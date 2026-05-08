import type { DashboardSummary } from "@/lib/types/dashboard.types";
import type { AccountItem } from "@/lib/types/accounts.types";
import type { TransactionItem } from "@/lib/types/transactions.types";
import type { Budget } from "@/lib/types/budgets.types";
import type { InvestmentPortfolio } from "@/lib/types/investments.types";
import type { Goal } from "@/lib/types/goal.types";
import type { Category } from "@/lib/types/categories.types";
import type { UserProfile } from "@/lib/types/profile.types";
import type {
  AnalyticsSummaryResponse,
  MonthlyData,
  DaySpend,
  CategoryMonthlyData,
  NetWorthPoint,
  NetWorthProjectionResponse,
  NetWorthProjectionPoint,
  PassiveIncomeProjectionResponse,
  FinancialMilestonesResponse,
  PortfolioCompositionProjectionResponse,
  RealNetWorthResponse,
  BalanceEvolutionPoint,
  FutureCommitmentsItem,
  BalanceProjectionResponse,
  CommitmentsImpactResponse,
  InvestmentEvolutionResponse,
  ProfitabilityTotals,
  AnnualReturnsResponse,
  ProfitabilityVsBenchmarksResponse,
  InvestmentLaunchesResponse,
  CategoryProjection,
} from "@/lib/types/analytics.types";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const MOCK_DASHBOARD: DashboardSummary = {
  balanceSummary: {
    totalIncome:      850000,
    totalExpenses:    560000,
    balance:          290000,
    netWorth:         4820000,
    incomeChange:     12.43,
    expenseChange:    -3.78,
    balanceChange:    30.04,
    netWorthChange:   5.24,
    previousIncome:   756000,   // R$ 7.560,00
    previousExpenses: 582000,   // R$ 5.820,00
    previousBalance:  222000,   // R$ 2.220,00
    previousNetWorth: 4580000,  // R$ 45.800,00
  },
  recentTransactions: [
    { id: 1, description: "Supermercado Extra",   value:  34750, type: "Expense", transactionDate: "2026-05-06", subCategoryName: "Alimentação", categoryName: "Moradia",     isRecurring: false, isAutomatic: false },
    { id: 2, description: "Salário maio",          value: 850000, type: "Income",  transactionDate: "2026-05-05", subCategoryName: "Salário",     categoryName: "Renda",       isRecurring: true,  isAutomatic: true  },
    { id: 3, description: "Netflix",               value:   5590, type: "Expense", transactionDate: "2026-05-04", subCategoryName: "Streaming",   categoryName: "Lazer",       isRecurring: true,  isAutomatic: true  },
    { id: 4, description: "Farmácia São João",     value:   8700, type: "Expense", transactionDate: "2026-05-03", subCategoryName: "Saúde",       categoryName: "Saúde",       isRecurring: false, isAutomatic: false },
    { id: 5, description: "Ifood — Jantar",        value:   6290, type: "Expense", transactionDate: "2026-05-02", subCategoryName: "Restaurante", categoryName: "Alimentação", isRecurring: false, isAutomatic: false },
    { id: 6, description: "Freelance design",      value: 120000, type: "Income",  transactionDate: "2026-05-01", subCategoryName: "Freelance",   categoryName: "Renda",       isRecurring: false, isAutomatic: false },
  ],
  budgetSummary: {
    totalExpected:   500000,
    totalSpent:      384200,
    spentPercentage: 76.84,
    hasAllocations:  true,
    topSubCategories: [
      { subCategoryName: "Aluguel",       categoryName: "Moradia",     categoryColor: "#4A9EFF", allocated: 180000, spent: 180000, spentPercentage: 100.0 },
      { subCategoryName: "Alimentação",   categoryName: "Alimentação", categoryColor: "#F5A623", allocated: 120000, spent:  98400, spentPercentage:  82.0 },
      { subCategoryName: "Transporte",    categoryName: "Transporte",  categoryColor: "#00D4A0", allocated:  80000, spent:  61200, spentPercentage:  76.5 },
    ],
  },
  topCategories: [
    { categoryName: "Moradia",     color: "#4A9EFF", totalSpent: 172000 },
    { categoryName: "Alimentação", color: "#F5A623", totalSpent: 125000 },
    { categoryName: "Transporte",  color: "#00D4A0", totalSpent:  84000 },
    { categoryName: "Lazer",       color: "#7C6FE0", totalSpent:  68000 },
    { categoryName: "Saúde",       color: "#F25F5C", totalSpent:  52000 },
    { categoryName: "Outros",      color: "#8A95A3", totalSpent:  59000 },
  ],
};

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const MOCK_ACCOUNTS: AccountItem[] = [
  { id: 1, name: "Nubank",              type: "Checking", currentAmount:  482300, isDefaultAccount: true  },
  { id: 2, name: "Itaú Conta Corrente", type: "Checking", currentAmount:  198700, isDefaultAccount: false },
  { id: 3, name: "XP Investimentos",   type: "Savings",  currentAmount: 1540000, isDefaultAccount: false },
  { id: 4, name: "Cartão de Crédito",  type: "Credit",   currentAmount:  -89400, isDefaultAccount: false },
  { id: 5, name: "Carteira",           type: "Cash",     currentAmount:   15000, isDefaultAccount: false },
];

// ─── Transactions ─────────────────────────────────────────────────────────────

export const MOCK_TRANSACTIONS: TransactionItem[] = [
  { id:  1, budgetId: 1, description: "Salário maio",          value: 850000, type: "Income",  transactionDate: "2026-05-05", paymentType: "Recurring",   paymentMethod: "Debit",  installmentNumber: null, totalInstallments: null, subCategoryId:  1, subCategoryName: "Salário",        accountId: 1, accountName: "Nubank",  recurringTransactionId: 10, parentTransactionId: null },
  { id:  2, budgetId: null, description: "Freelance design UI", value: 120000, type: "Income",  transactionDate: "2026-05-01", paymentType: "OneTime",     paymentMethod: null,     installmentNumber: null, totalInstallments: null, subCategoryId:  2, subCategoryName: "Freelance",      accountId: 1, accountName: "Nubank",  recurringTransactionId: null, parentTransactionId: null },
  { id:  3, budgetId: 1, description: "Aluguel",               value: 180000, type: "Expense", transactionDate: "2026-05-05", paymentType: "Recurring",   paymentMethod: "Debit",  installmentNumber: null, totalInstallments: null, subCategoryId:  3, subCategoryName: "Aluguel",        accountId: 1, accountName: "Nubank",  recurringTransactionId: 12, parentTransactionId: null },
  { id:  4, budgetId: 1, description: "Supermercado Extra",    value:  34750, type: "Expense", transactionDate: "2026-05-06", paymentType: "OneTime",     paymentMethod: "Debit",  installmentNumber: null, totalInstallments: null, subCategoryId:  4, subCategoryName: "Alimentação",    accountId: 1, accountName: "Nubank",  recurringTransactionId: null, parentTransactionId: null },
  { id:  5, budgetId: 1, description: "Ifood — Jantar",        value:   6290, type: "Expense", transactionDate: "2026-05-02", paymentType: "OneTime",     paymentMethod: "Credit", installmentNumber: null, totalInstallments: null, subCategoryId:  5, subCategoryName: "Restaurante",    accountId: 4, accountName: "Cartão",  recurringTransactionId: null, parentTransactionId: null },
  { id:  6, budgetId: 1, description: "Netflix",               value:   5590, type: "Expense", transactionDate: "2026-05-04", paymentType: "Recurring",   paymentMethod: "Credit", installmentNumber: null, totalInstallments: null, subCategoryId:  6, subCategoryName: "Streaming",      accountId: 4, accountName: "Cartão",  recurringTransactionId: 11, parentTransactionId: null },
  { id:  7, budgetId: 1, description: "Spotify",               value:   1990, type: "Expense", transactionDate: "2026-05-04", paymentType: "Recurring",   paymentMethod: "Credit", installmentNumber: null, totalInstallments: null, subCategoryId:  6, subCategoryName: "Streaming",      accountId: 4, accountName: "Cartão",  recurringTransactionId: 13, parentTransactionId: null },
  { id:  8, budgetId: 1, description: "Farmácia São João",     value:   8700, type: "Expense", transactionDate: "2026-05-03", paymentType: "OneTime",     paymentMethod: "Credit", installmentNumber: null, totalInstallments: null, subCategoryId:  7, subCategoryName: "Saúde",          accountId: 4, accountName: "Cartão",  recurringTransactionId: null, parentTransactionId: null },
  { id:  9, budgetId: 1, description: "Gasolina Shell",        value:  15000, type: "Expense", transactionDate: "2026-05-03", paymentType: "OneTime",     paymentMethod: "Debit",  installmentNumber: null, totalInstallments: null, subCategoryId:  8, subCategoryName: "Combustível",    accountId: 1, accountName: "Nubank",  recurringTransactionId: null, parentTransactionId: null },
  { id: 10, budgetId: 1, description: "Uber",                  value:   2850, type: "Expense", transactionDate: "2026-05-02", paymentType: "OneTime",     paymentMethod: "Credit", installmentNumber: null, totalInstallments: null, subCategoryId:  9, subCategoryName: "Aplicativo",     accountId: 4, accountName: "Cartão",  recurringTransactionId: null, parentTransactionId: null },
  { id: 11, budgetId: 1, description: "Academia Smart Fit",    value:  10990, type: "Expense", transactionDate: "2026-05-01", paymentType: "Recurring",   paymentMethod: "Credit", installmentNumber: null, totalInstallments: null, subCategoryId: 10, subCategoryName: "Academia",       accountId: 4, accountName: "Cartão",  recurringTransactionId: 14, parentTransactionId: null },
  { id: 12, budgetId: 1, description: "Ingresso cinema",       value:   4600, type: "Expense", transactionDate: "2026-04-30", paymentType: "OneTime",     paymentMethod: "Credit", installmentNumber: null, totalInstallments: null, subCategoryId: 11, subCategoryName: "Entretenimento", accountId: 4, accountName: "Cartão",  recurringTransactionId: null, parentTransactionId: null },
  { id: 13, budgetId: 1, description: "Energia elétrica",      value:  18500, type: "Expense", transactionDate: "2026-04-28", paymentType: "Recurring",   paymentMethod: "Debit",  installmentNumber: null, totalInstallments: null, subCategoryId: 12, subCategoryName: "Energia",        accountId: 1, accountName: "Nubank",  recurringTransactionId: 15, parentTransactionId: null },
  { id: 14, budgetId: 1, description: "Internet Vivo",         value:   9990, type: "Expense", transactionDate: "2026-04-27", paymentType: "Recurring",   paymentMethod: "Debit",  installmentNumber: null, totalInstallments: null, subCategoryId: 13, subCategoryName: "Internet",       accountId: 1, accountName: "Nubank",  recurringTransactionId: 16, parentTransactionId: null },
  { id: 15, budgetId: 1, description: "MacBook Pro 14",        value:  58250, type: "Expense", transactionDate: "2026-05-06", paymentType: "Installment", paymentMethod: "Credit", installmentNumber: 2,    totalInstallments: 12,   subCategoryId: 14, subCategoryName: "Eletrônicos",    accountId: 4, accountName: "Cartão",  recurringTransactionId: null, parentTransactionId: null },
];

// ─── Budgets ──────────────────────────────────────────────────────────────────

export const MOCK_BUDGETS: Budget[] = [
  {
    id: 1, name: "Gastos Mensais", recurrence: "Monthly", isActive: true,
    startDate: "2026-05-01", endDate: "2026-05-31",
    totalAllocated: 500000, totalSpent: 384200, spentPercentage: 76.84,
    allocations: [
      { id: 1, subCategoryId: 1, subCategoryName: "Alimentação",  categoryName: "Alimentação", categoryColor: "#F5A623", areaName: "Necessidades", areaColor: "#4A9EFF", allocated: 120000, spent:  98400, spentPercentage:  82.0 },
      { id: 2, subCategoryId: 2, subCategoryName: "Aluguel",      categoryName: "Moradia",     categoryColor: "#4A9EFF", areaName: "Necessidades", areaColor: "#4A9EFF", allocated: 180000, spent: 180000, spentPercentage: 100.0 },
      { id: 3, subCategoryId: 3, subCategoryName: "Transporte",   categoryName: "Transporte",  categoryColor: "#00D4A0", areaName: "Necessidades", areaColor: "#4A9EFF", allocated:  80000, spent:  61200, spentPercentage:  76.5 },
      { id: 4, subCategoryId: 4, subCategoryName: "Lazer",        categoryName: "Lazer",       categoryColor: "#7C6FE0", areaName: "Pessoal",      areaColor: "#7C6FE0", allocated:  60000, spent:  44800, spentPercentage:  74.7 },
      { id: 5, subCategoryId: 5, subCategoryName: "Saúde",        categoryName: "Saúde",       categoryColor: "#F25F5C", areaName: "Pessoal",      areaColor: "#7C6FE0", allocated:  60000, spent:      0, spentPercentage:   0.0 },
    ],
  },
  {
    id: 2, name: "Fundo de Emergência", recurrence: "Monthly", isActive: true,
    startDate: "2026-05-01", endDate: "2026-05-31",
    totalAllocated: 100000, totalSpent: 85000, spentPercentage: 85.0,
    allocations: [
      { id: 6, subCategoryId: 6, subCategoryName: "Reserva", categoryName: "Poupança", categoryColor: "#00C98D", areaName: "Reservas", areaColor: "#00C98D", allocated: 100000, spent: 85000, spentPercentage: 85.0 },
    ],
  },
  {
    id: 3, name: "Viagem — Julho", recurrence: "Monthly", isActive: true,
    startDate: "2026-05-01", endDate: "2026-07-31",
    totalAllocated: 80000, totalSpent: 22000, spentPercentage: 27.5,
    allocations: [
      { id: 7, subCategoryId: 7, subCategoryName: "Passagens",  categoryName: "Viagem", categoryColor: "#F5A623", areaName: "Viagem", areaColor: "#F5A623", allocated: 40000, spent: 22000, spentPercentage: 55.0 },
      { id: 8, subCategoryId: 8, subCategoryName: "Hospedagem", categoryName: "Viagem", categoryColor: "#F5A623", areaName: "Viagem", areaColor: "#F5A623", allocated: 40000, spent:     0, spentPercentage:  0.0 },
    ],
  },
  {
    id: 4, name: "Férias 2025", recurrence: "Monthly", isActive: false,
    startDate: "2025-01-01", endDate: "2025-12-31",
    totalAllocated: 150000, totalSpent: 150000, spentPercentage: 100.0,
    allocations: [
      { id: 9, subCategoryId: 9, subCategoryName: "Viagem", categoryName: "Lazer", categoryColor: "#7C6FE0", areaName: "Lazer", areaColor: "#7C6FE0", allocated: 150000, spent: 150000, spentPercentage: 100.0 },
    ],
  },
];

// ─── Investments ──────────────────────────────────────────────────────────────

export const MOCK_INVESTMENTS: InvestmentPortfolio = {
  investments: [
    { id: 1, ticker: "MXRF11", name: "Maxi Renda FII",            assetType: "FII",          assetClass: "Fundos Imobiliários", broker: "XP",  accountId: 3, currentQuantity: 120, averagePrice:  1012, currentPrice:  1085, currentValue:  130200, totalInvested:  121440, totalReturn:  8760, totalReturnPercent: 7.21, lastPriceUpdate: "2026-05-07", maturityDate: null, expectedYieldPct: null },
    { id: 2, ticker: "PETR4",  name: "Petrobras PN",              assetType: "Acao",         assetClass: "Ações BR",            broker: "XP",  accountId: 3, currentQuantity:  50, averagePrice:  3640, currentPrice:  3890, currentValue:  194500, totalInvested:  182000, totalReturn: 12500, totalReturnPercent: 6.87, lastPriceUpdate: "2026-05-07", maturityDate: null, expectedYieldPct: null },
    { id: 3, ticker: "BOVA11", name: "iShares Ibovespa ETF",      assetType: "ETF",          assetClass: "ETF",                 broker: "XP",  accountId: 3, currentQuantity:  80, averagePrice:  9850, currentPrice: 10240, currentValue:  819200, totalInvested:  788000, totalReturn: 31200, totalReturnPercent: 3.96, lastPriceUpdate: "2026-05-07", maturityDate: null, expectedYieldPct: null },
    { id: 4, ticker: "SELIC29", name: "Tesouro Selic 2029",       assetType: "TesouroDireto",assetClass: "Renda Fixa",          broker: "XP",  accountId: 3, currentQuantity:   2, averagePrice: 1248900, currentPrice: 1289400, currentValue: 2578800, totalInvested: 2497800, totalReturn: 81000, totalReturnPercent: 3.24, lastPriceUpdate: "2026-05-07", maturityDate: "2029-03-01", expectedYieldPct: 10.5 },
    { id: 5, ticker: "KNRI11", name: "Kinea Renda Imobiliária",   assetType: "FII",          assetClass: "Fundos Imobiliários", broker: "XP",  accountId: 3, currentQuantity:  60, averagePrice: 15200, currentPrice: 16100, currentValue:  966000, totalInvested:  912000, totalReturn: 54000, totalReturnPercent: 5.92, lastPriceUpdate: "2026-05-07", maturityDate: null, expectedYieldPct: null },
  ],
  currentValue:       4688700,
  totalInvested:      4501240,
  totalReturn:         187460,
  totalReturnPercent:    4.16,
  allocations: [
    { assetType: "TesouroDireto", assetClass: "Renda Fixa",          value: 2578800, percent: 55.0, color: "#4A9EFF" },
    { assetType: "ETF",           assetClass: "ETF",                  value:  819200, percent: 17.5, color: "#7C6FE0" },
    { assetType: "FII",           assetClass: "Fundos Imobiliários",  value: 1096200, percent: 23.4, color: "#00C98D" },
    { assetType: "Acao",          assetClass: "Ações BR",             value:  194500, percent:  4.1, color: "#F5A623" },
  ],
};

// ─── Goals ────────────────────────────────────────────────────────────────────

export const MOCK_GOALS: Goal[] = [
  { id: 1, name: "MacBook Pro M4",          type: "Item",       targetAmount:  1299900, priority: "High",   status: "Active",   description: 'MacBook Pro 14" M4 Pro',       url: "https://apple.com", targetDate: null,         latestCheckpointAmount:  1124900 },
  { id: 2, name: "Viagem para o Japão",     type: "Item",       targetAmount:  1500000, priority: "Medium", status: "Active",   description: "Passagem + hotel por 15 dias", url: null,                targetDate: "2027-03-01", latestCheckpointAmount:   380000 },
  { id: 3, name: "Reserva de Emergência",   type: "Investment", targetAmount:  3000000, priority: "High",   status: "Active",   description: "6 meses de gastos",            url: null,                targetDate: "2026-12-01", latestCheckpointAmount:  2146000 },
  { id: 4, name: "Independência Financeira",type: "Investment", targetAmount: 30000000, priority: "Low",    status: "Active",   description: "Renda passiva ≥ R$10k/mês",    url: null,                targetDate: "2040-01-01", latestCheckpointAmount:  4688700 },
  { id: 5, name: "PlayStation 5 Pro",       type: "Item",       targetAmount:   599900, priority: "Low",    status: "Achieved", description: null,                           url: null,                targetDate: null,         latestCheckpointAmount:   599900 },
];

// ─── Categories ───────────────────────────────────────────────────────────────

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: "Renda",        color: "#00C98D", isSystem: true,  subCategories: [{ id: 1, categoryId: 1, categoryName: "Renda",        name: "Salário"       }, { id: 2,  categoryId: 1, categoryName: "Renda",        name: "Freelance"      }] },
  { id: 2, name: "Moradia",      color: "#4A9EFF", isSystem: false, subCategories: [{ id: 3, categoryId: 2, categoryName: "Moradia",      name: "Aluguel"       }, { id: 4,  categoryId: 2, categoryName: "Moradia",      name: "Energia"        }, { id: 5,  categoryId: 2, categoryName: "Moradia",      name: "Internet"  }] },
  { id: 3, name: "Alimentação",  color: "#F5A623", isSystem: false, subCategories: [{ id: 6, categoryId: 3, categoryName: "Alimentação",  name: "Supermercado"  }, { id: 7,  categoryId: 3, categoryName: "Alimentação",  name: "Restaurante"    }] },
  { id: 4, name: "Lazer",        color: "#7C6FE0", isSystem: false, subCategories: [{ id: 8, categoryId: 4, categoryName: "Lazer",        name: "Streaming"     }, { id: 9,  categoryId: 4, categoryName: "Lazer",        name: "Entretenimento" }] },
  { id: 5, name: "Saúde",        color: "#F25F5C", isSystem: false, subCategories: [{ id:10, categoryId: 5, categoryName: "Saúde",        name: "Farmácia"      }, { id: 11, categoryId: 5, categoryName: "Saúde",        name: "Academia"       }] },
  { id: 6, name: "Transporte",   color: "#00D4A0", isSystem: false, subCategories: [{ id:12, categoryId: 6, categoryName: "Transporte",   name: "Combustível"   }, { id: 13, categoryId: 6, categoryName: "Transporte",   name: "Aplicativo"     }] },
  { id: 7, name: "Tecnologia",   color: "#F5CE42", isSystem: false, subCategories: [{ id:14, categoryId: 7, categoryName: "Tecnologia",   name: "Eletrônicos"   }, { id: 15, categoryId: 7, categoryName: "Tecnologia",   name: "Software"       }] },
];

// ─── Profile ──────────────────────────────────────────────────────────────────

export const MOCK_PROFILE: UserProfile = {
  id: 1,
  name: "Gabriel Silva",
  email: "gabriel@financecontrol.app",
};

// ─── Analytics — Summary ──────────────────────────────────────────────────────

const MOCK_BEST_MONTH = { month: 1, year: 2026, label: "Jan/26", totalIncome: 830000, totalExpense: 590000, balance: 240000 };
const MOCK_WORST_MONTH = { month: 12, year: 2025, label: "Dez/25", totalIncome: 910000, totalExpense: 680000, balance: 230000 };

export const MOCK_ANALYTICS_SUMMARY: AnalyticsSummaryResponse = {
  avgMonthlyIncome:   831429,
  avgMonthlyExpense:  577857,
  avgMonthlyBalance:  253571,
  bestMonth:  MOCK_BEST_MONTH,
  worstMonth: MOCK_WORST_MONTH,
  categoryBreakdown: {
    maxSpent: 172000,
    items: [
      { categoryId: 1, categoryName: "Moradia",     color: "#4A9EFF", totalSpent: 172000, percent: 30.7, change:   2.1 },
      { categoryId: 2, categoryName: "Alimentação", color: "#F5A623", totalSpent: 125000, percent: 22.3, change:  -1.4 },
      { categoryId: 3, categoryName: "Transporte",  color: "#00D4A0", totalSpent:  84000, percent: 15.0, change:   0.5 },
      { categoryId: 4, categoryName: "Lazer",       color: "#7C6FE0", totalSpent:  68000, percent: 12.1, change:   3.8 },
      { categoryId: 5, categoryName: "Saúde",       color: "#F25F5C", totalSpent:  52000, percent:  9.3, change:  -0.9 },
      { categoryId: 6, categoryName: "Outros",      color: "#8A95A3", totalSpent:  59000, percent: 10.5, change: null  },
    ],
  },
};

// ─── Analytics — Monthly ──────────────────────────────────────────────────────

export const MOCK_ANALYTICS_MONTHLY: MonthlyData[] = [
  { month:  6, year: 2025, label: "Jun/25", totalIncome: 680000, totalExpense: 490000, balance: 190000 },
  { month:  7, year: 2025, label: "Jul/25", totalIncome: 710000, totalExpense: 520000, balance: 190000 },
  { month:  8, year: 2025, label: "Ago/25", totalIncome: 695000, totalExpense: 505000, balance: 190000 },
  { month:  9, year: 2025, label: "Set/25", totalIncome: 730000, totalExpense: 495000, balance: 235000 },
  { month: 10, year: 2025, label: "Out/25", totalIncome: 760000, totalExpense: 530000, balance: 230000 },
  { month: 11, year: 2025, label: "Nov/25", totalIncome: 720000, totalExpense: 510000, balance: 210000 },
  { month: 12, year: 2025, label: "Dez/25", totalIncome: 910000, totalExpense: 680000, balance: 230000 },
  { month:  1, year: 2026, label: "Jan/26", totalIncome: 830000, totalExpense: 590000, balance: 240000 },
  { month:  2, year: 2026, label: "Fev/26", totalIncome: 780000, totalExpense: 540000, balance: 240000 },
  { month:  3, year: 2026, label: "Mar/26", totalIncome: 870000, totalExpense: 600000, balance: 270000 },
  { month:  4, year: 2026, label: "Abr/26", totalIncome: 820000, totalExpense: 555000, balance: 265000 },
  { month:  5, year: 2026, label: "Mai/26", totalIncome: 850000, totalExpense: 560000, balance: 290000 },
];

// ─── Analytics — Heatmap ──────────────────────────────────────────────────────

export const MOCK_ANALYTICS_HEATMAP: DaySpend[] = [
  { date: "2026-05-01", total:  10990, income: 120000, net:  109010, state: "Income3",  vsLastMonth: null },
  { date: "2026-05-02", total:   9140, income:      0, net:   -9140, state: "Expense1", vsLastMonth: -1500 },
  { date: "2026-05-03", total:  23700, income:      0, net:  -23700, state: "Expense2", vsLastMonth: 5000 },
  { date: "2026-05-04", total:   7580, income:      0, net:   -7580, state: "Expense1", vsLastMonth: -800 },
  { date: "2026-05-05", total: 180000, income: 850000, net:  670000, state: "Income4",  vsLastMonth: null },
  { date: "2026-05-06", total:  34750, income:      0, net:  -34750, state: "Expense3", vsLastMonth: 8000 },
  ...Array.from({ length: 25 }, (_, i) => ({
    date: `2026-05-${String(i + 7).padStart(2, "0")}`,
    total: 0, income: 0, net: 0, state: "Empty" as const, vsLastMonth: null,
  })),
];

// ─── Analytics — Category Evolution ──────────────────────────────────────────

export const MOCK_CATEGORY_EVOLUTION: CategoryMonthlyData[] = [
  { label: "Nov/25", "Moradia": 160000, "Alimentação": 110000, "Transporte": 72000, "Lazer": 58000 },
  { label: "Dez/25", "Moradia": 168000, "Alimentação": 138000, "Transporte": 89000, "Lazer": 92000 },
  { label: "Jan/26", "Moradia": 165000, "Alimentação": 118000, "Transporte": 78000, "Lazer": 61000 },
  { label: "Fev/26", "Moradia": 162000, "Alimentação": 115000, "Transporte": 75000, "Lazer": 55000 },
  { label: "Mar/26", "Moradia": 170000, "Alimentação": 122000, "Transporte": 82000, "Lazer": 65000 },
  { label: "Abr/26", "Moradia": 169000, "Alimentação": 120000, "Transporte": 80000, "Lazer": 64000 },
  { label: "Mai/26", "Moradia": 172000, "Alimentação": 125000, "Transporte": 84000, "Lazer": 68000 },
];

// ─── Analytics — Net Worth ────────────────────────────────────────────────────

export const MOCK_NET_WORTH: NetWorthPoint[] = [
  { label: "Nov/25", assets: 6800000, liabilities:  950000, netWorth: 5850000 },
  { label: "Dez/25", assets: 7050000, liabilities:  920000, netWorth: 6130000 },
  { label: "Jan/26", assets: 7180000, liabilities:  900000, netWorth: 6280000 },
  { label: "Fev/26", assets: 7350000, liabilities:  880000, netWorth: 6470000 },
  { label: "Mar/26", assets: 7540000, liabilities:  860000, netWorth: 6680000 },
  { label: "Abr/26", assets: 7730000, liabilities:  840000, netWorth: 6890000 },
  { label: "Mai/26", assets: 7960000, liabilities:  820000, netWorth: 7140000 },
];

// ─── Analytics — Balance Evolution ───────────────────────────────────────────

export const MOCK_BALANCE_EVOLUTION: BalanceEvolutionPoint[] = [
  { date: "2026-05-01", balance:  120000 },
  { date: "2026-05-02", balance:  112000 },
  { date: "2026-05-03", balance:   88300 },
  { date: "2026-05-04", balance:   80720 },
  { date: "2026-05-05", balance:  750720 },
  { date: "2026-05-06", balance:  715970 },
];

// ─── Analytics — Net Worth Projection ────────────────────────────────────────

const makeProjectionPoint = (month: number, year: number, netWorth: number): NetWorthProjectionPoint => ({ month, year, netWorth });

export const MOCK_NET_WORTH_PROJECTION: NetWorthProjectionResponse = {
  currentNetWorth:    7140000,
  monthlyAvgGrowth:       3.8,
  monthsUntilZero:       null,
  monthsUntilTarget:       18,
  targetAmount:      12000000,
  historical: MOCK_NET_WORTH.map((p, i) => makeProjectionPoint(((4 + i) % 12) + 1, i < 2 ? 2025 : 2026, p.netWorth)),
  projected: Array.from({ length: 12 }, (_, i) => makeProjectionPoint((5 + i) % 12 + 1, i < 8 ? 2026 : 2027, 7140000 + (i + 1) * 280000)),
};

// ─── Analytics — Category Projection ─────────────────────────────────────────

export const MOCK_CATEGORY_PROJECTION: CategoryProjection[] = [
  { categoryId: 1, categoryName: "Moradia",     spentSoFar: 172000, projectedTotal: 208000, historicalMonthlyAvg: 166000, monthElapsedPercent: 22, spentPercent: 82 },
  { categoryId: 2, categoryName: "Alimentação", spentSoFar: 125000, projectedTotal: 148000, historicalMonthlyAvg: 121000, monthElapsedPercent: 22, spentPercent: 103 },
  { categoryId: 3, categoryName: "Transporte",  spentSoFar:  84000, projectedTotal:  96000, historicalMonthlyAvg:  79400, monthElapsedPercent: 22, spentPercent: 106 },
  { categoryId: 4, categoryName: "Lazer",       spentSoFar:  68000, projectedTotal:  74000, historicalMonthlyAvg:  68000, monthElapsedPercent: 22, spentPercent: 100 },
];

// ─── Analytics — Passive Income ──────────────────────────────────────────────

export const MOCK_PASSIVE_INCOME: PassiveIncomeProjectionResponse = {
  currentMonthlyPassiveIncome: 450000,
  projectedAnnualPassiveIncome: 5400000,
  monthlyLivingCost: 560000,
  coveragePercent: 80.4,
  monthsUntilFinancialFreedom: 14,
  history: [
    { year: 2026, month: 1, passiveIncome: 320000, livingCost: 590000 },
    { year: 2026, month: 2, passiveIncome: 340000, livingCost: 540000 },
    { year: 2026, month: 3, passiveIncome: 380000, livingCost: 600000 },
    { year: 2026, month: 4, passiveIncome: 410000, livingCost: 555000 },
    { year: 2026, month: 5, passiveIncome: 450000, livingCost: 560000 },
  ],
  projected: Array.from({ length: 24 }, (_, i) => ({ year: 2026 + Math.floor((5 + i) / 12), month: (5 + i) % 12 + 1, passiveIncome: 450000 + i * 35000, livingCost: 560000 })),
};

// ─── Analytics — Milestones ───────────────────────────────────────────────────

export const MOCK_MILESTONES: FinancialMilestonesResponse = {
  milestones: [
    { label: "Início da jornada",           date: "2024-01-01", netWorthAtDate: 1200000, type: "journey_start"       },
    { label: "Primeiro investimento",       date: "2024-03-15", netWorthAtDate: 1500000, type: "investment_start"    },
    { label: "Patrimônio R$50k",            date: "2025-02-01", netWorthAtDate: 5000000, type: "net_worth_milestone" },
    { label: "Pico do portfólio",           date: "2025-11-01", netWorthAtDate: 6200000, type: "peak"                },
    { label: "3 meses poupando >30%",       date: "2026-03-01", netWorthAtDate: 6680000, type: "savings_streak"      },
  ],
  timeline: [
    { year: 2024, month:  1, netWorth: 1200000 },
    { year: 2024, month:  6, netWorth: 2800000 },
    { year: 2024, month: 12, netWorth: 4500000 },
    { year: 2025, month:  6, netWorth: 5600000 },
    { year: 2025, month: 11, netWorth: 6200000 },
    { year: 2026, month:  1, netWorth: 6280000 },
    { year: 2026, month:  5, netWorth: 7140000 },
  ],
};

// ─── Analytics — Portfolio Composition ───────────────────────────────────────

export const MOCK_PORTFOLIO_COMPOSITION: PortfolioCompositionProjectionResponse = {
  data: Array.from({ length: 12 }, (_, i) => ({
    year: 2026 + Math.floor((5 + i) / 12),
    month: (5 + i) % 12 + 1,
    isProjected: i > 0,
    breakdown: [
      { assetClass: "Renda Fixa",         value: Math.round((2578800 + i * 30000) * (55 - i * 0.3) / 100) },
      { assetClass: "ETF",                value: Math.round((819200  + i * 20000) * (17.5 + i * 0.2) / 100) },
      { assetClass: "Fundos Imobiliários",value: Math.round((1096200 + i * 18000) * (23.4 + i * 0.1) / 100) },
      { assetClass: "Ações BR",           value: Math.round((194500  + i * 12000) * (4.1 + i * 0.1) / 100) },
    ],
  })),
  assetClasses: ["Renda Fixa", "ETF", "Fundos Imobiliários", "Ações BR"],
};

// ─── Analytics — Real Net Worth ───────────────────────────────────────────────

export const MOCK_REAL_NET_WORTH: RealNetWorthResponse = {
  points: MOCK_NET_WORTH.map((p, i) => ({
    year: i < 2 ? 2025 : 2026,
    month: ((4 + i) % 12) + 1,
    nominalNetWorth: p.netWorth,
    realNetWorth:    Math.round(p.netWorth * (1 - i * 0.004)),
    accumulatedInflationPct: i * 0.4,
  })),
  totalNominalGrowthPct: 22.1,
  totalRealGrowthPct:    14.8,
  totalInflationPct:      6.2,
};

// ─── Analytics — Future Commitments ──────────────────────────────────────────

export const MOCK_FUTURE_COMMITMENTS: FutureCommitmentsItem[] = [
  { month: 6,  year: 2026, totalCommitted: 208490, installments: [{ description: "Aluguel", value: 180000 }, { description: "MacBook Pro 3/12", value: 58250 }, { description: "Internet", value: 9990 }] },
  { month: 7,  year: 2026, totalCommitted: 208490, installments: [{ description: "Aluguel", value: 180000 }, { description: "MacBook Pro 4/12", value: 58250 }] },
  { month: 8,  year: 2026, totalCommitted: 199990, installments: [{ description: "Aluguel", value: 180000 }, { description: "MacBook Pro 5/12", value: 58250 }] },
  { month: 9,  year: 2026, totalCommitted: 199990, installments: [{ description: "Aluguel", value: 180000 }, { description: "MacBook Pro 6/12", value: 58250 }] },
  { month: 10, year: 2026, totalCommitted: 199990, installments: [{ description: "Aluguel", value: 180000 }, { description: "MacBook Pro 7/12", value: 58250 }] },
  { month: 11, year: 2026, totalCommitted: 199990, installments: [{ description: "Aluguel", value: 180000 }, { description: "MacBook Pro 8/12", value: 58250 }] },
];

// ─── Analytics — Balance Projection ──────────────────────────────────────────

export const MOCK_BALANCE_PROJECTION: BalanceProjectionResponse = {
  currentBalance:   482300,
  projectedBalance: 754000,
  dailyAvgIncome:    28333,
  dailyAvgExpense:   18667,
  actual: [
    { date: "2026-05-01", balance: 120000 },
    { date: "2026-05-02", balance: 112000 },
    { date: "2026-05-03", balance:  88300 },
    { date: "2026-05-04", balance:  80720 },
    { date: "2026-05-05", balance: 750720 },
    { date: "2026-05-06", balance: 715970 },
    { date: "2026-05-07", balance: 482300 },
  ],
  projected: Array.from({ length: 24 }, (_, i) => ({ date: `2026-05-${String(i + 8).padStart(2, "0")}`, balance: 482300 + (i + 1) * 11350 })),
};

// ─── Analytics — Commitments Impact ──────────────────────────────────────────

export const MOCK_COMMITMENTS_IMPACT: CommitmentsImpactResponse = {
  currentBalance: 482300,
  months: MOCK_FUTURE_COMMITMENTS.map((fc) => ({
    month: fc.month,
    year:  fc.year,
    projectedIncome:    850000,
    totalCommitments:   fc.totalCommitted,
    projectedBalance:   850000 - 560000 - fc.totalCommitted,
    isNegative:         (850000 - 560000 - fc.totalCommitted) < 0,
    commitments:        fc.installments,
  })),
};

// ─── Analytics — Investment Evolution ────────────────────────────────────────

export const MOCK_INVESTMENT_EVOLUTION: InvestmentEvolutionResponse = {
  data: MOCK_NET_WORTH.map((p, i) => ({
    label: p.label,
    totalValue:   Math.round(p.netWorth * 0.68),
    totalInvested:Math.round(p.netWorth * 0.65),
    returns:      Math.round(p.netWorth * 0.03),
    dividends:    Math.round(p.netWorth * 0.005),
  })),
  returnPct: 4.16,
  cumulativeDividends: 68400,
};

// ─── Analytics — Profitability Totals ────────────────────────────────────────

export const MOCK_PROFITABILITY_TOTALS: ProfitabilityTotals = {
  allTime:      { returnPct: 4.16, vsCdiPct: -1.34 },
  last12Months: { returnPct: 8.90, vsCdiPct: -0.60 },
  lastMonth:    { returnPct: 0.98, vsCdiPct:  0.06 },
};

// ─── Analytics — Annual Returns ───────────────────────────────────────────────

export const MOCK_ANNUAL_RETURNS: AnnualReturnsResponse = {
  rows: [
    {
      year: 2025,
      annualReturnBps: 890,
      months: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, returnBps: i < 11 ? 60 + (i % 3) * 20 : null })),
    },
    {
      year: 2026,
      annualReturnBps: 420,
      months: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, returnBps: i < 5 ? 70 + (i % 2) * 15 : null })),
    },
  ],
  monthlyCumulatives: [70, 141, 212, 284, 355, null, null, null, null, null, null, null],
  grandTotal: 1340,
};

// ─── Analytics — Profitability vs Benchmarks ─────────────────────────────────

export const MOCK_PROFITABILITY_VS_BENCHMARKS: ProfitabilityVsBenchmarksResponse = {
  points: MOCK_ANALYTICS_MONTHLY.map((m, i) => ({
    label:         m.label,
    portfolioPct:  100 + i * 0.70,
    cdiPct:        100 + i * 0.85,
    ibovPct:       100 + i * 0.50,
    ipcaPlus5Pct:  100 + i * 0.90,
  })),
  totals: {
    portfolioAllTimePct:  4.16,
    cdiAllTimePct:        5.50,
    ibovAllTimePct:       3.20,
    ipcaPlus5AllTimePct:  6.10,
    vsCdiPct:            -1.34,
    vsIbovPct:            0.96,
    vsIpcaPlus5Pct:      -1.94,
  },
};

// ─── Analytics — Investment Launches ─────────────────────────────────────────

export const MOCK_INVESTMENT_LAUNCHES: InvestmentLaunchesResponse = {
  launches: [
    { id: 1, date: "2026-05-06", ticker: "MXRF11", name: "Maxi Renda FII",         assetClass: "Fundos Imobiliários", operation: "buy",  quantity: 20, unitPrice:  1085, totalValue:  21700, broker: "XP" },
    { id: 2, date: "2026-04-22", ticker: "PETR4",  name: "Petrobras PN",            assetClass: "Ações BR",            operation: "buy",  quantity: 10, unitPrice:  3850, totalValue:  38500, broker: "XP" },
    { id: 3, date: "2026-04-15", ticker: "MXRF11", name: "Maxi Renda FII",         assetClass: "Fundos Imobiliários", operation: "buy",  quantity:  0, unitPrice:     0, totalValue:   1320, broker: "XP" },
    { id: 4, date: "2026-03-20", ticker: "KNRI11", name: "Kinea Renda Imobiliária", assetClass: "Fundos Imobiliários", operation: "buy",  quantity:  0, unitPrice:     0, totalValue:   5400, broker: "XP" },
    { id: 5, date: "2026-03-05", ticker: "BOVA11", name: "iShares Ibovespa ETF",   assetClass: "ETF",                 operation: "buy",  quantity: 30, unitPrice:  9950, totalValue: 298500, broker: "XP" },
    { id: 6, date: "2026-02-14", ticker: "SELIC29", name: "Tesouro Selic 2029",    assetClass: "Renda Fixa",          operation: "buy",  quantity:  1, unitPrice: 1255000, totalValue: 1255000, broker: "XP" },
  ],
  monthlyPoints: [
    { label: "Nov/25", bought: 912000, sold:       0 },
    { label: "Dez/25", bought: 200000, sold:       0 },
    { label: "Jan/26", bought: 350000, sold: 1500000 },
    { label: "Fev/26", bought: 1255000, sold:      0 },
    { label: "Mar/26", bought: 299820, sold:       0 },
    { label: "Abr/26", bought:  60200, sold:       0 },
    { label: "Mai/26", bought:  21700, sold:       0 },
  ],
  summary: { totalBought: 3098720, totalSold: 1500000, buyCount: 6, sellCount: 0 },
};
