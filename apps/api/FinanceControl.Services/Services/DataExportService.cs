using FinanceControl.Data.Data;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Response.Export;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// Builds the "download everything you have on me" file.
    /// </summary>
    /// <remarks>
    /// Every query is scoped by UserId and every one of them is a projection — the export
    /// is the one place where accidentally serialising an entity would hand out a password
    /// hash, so entities never leave this class.
    /// </remarks>
    public class DataExportService : IDataExportService
    {
        private const string ExportNotice =
            "Exportação completa dos dados desta conta. Valores monetários estão em centavos " +
            "(1234 = R$ 12,34). Não estão incluídos: senha (armazenada apenas como hash e " +
            "irrecuperável por definição), tokens de sessão, códigos de verificação, dispositivos " +
            "confiáveis e o histórico de notificações — todos são artefatos de segurança ou de " +
            "funcionamento interno, não dados fornecidos por você. O texto integral dos documentos " +
            "aceitos está em /api/legal/{type}?version={version}.";

        private readonly ApplicationDbContext _context;

        public DataExportService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<UserDataExportResponseDto?> ExportUserDataAsync(int userId)
        {
            var profile = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => new ExportUserProfileDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    EmailVerifiedAt = u.EmailVerifiedAt,
                    TwoFactorEnabled = u.TwoFactorEnabled,
                    PreferredCurrency = u.PreferredCurrency,
                    PreferredLanguage = u.PreferredLanguage,
                    Country = u.Country,
                    CreatedAt = u.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (profile is null)
                return null;

            var preferences = await _context.UserPreferences
                .AsNoTracking()
                .Where(p => p.UserId == userId)
                .Select(p => new ExportUserPreferencesDto
                {
                    CurrencyCode = p.CurrencyCode,
                    Locale = p.Locale,
                    AnalyticsConfig = p.AnalyticsConfig
                })
                .FirstOrDefaultAsync();

            var consents = await _context.UserConsents
                .AsNoTracking()
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.AcceptedAt)
                .Select(c => new ExportConsentDto
                {
                    DocumentType = c.LegalDocument.Type,
                    DocumentVersion = c.LegalDocument.Version,
                    DocumentHash = c.LegalDocument.ContentHash,
                    AcceptedAt = c.AcceptedAt,
                    IpAddress = c.IpAddress,
                    UserAgent = c.UserAgent
                })
                .ToListAsync();

            var accounts = await _context.Accounts
                .AsNoTracking()
                .Where(a => a.UserId == userId)
                .OrderBy(a => a.Id)
                .Select(a => new ExportAccountDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    Type = a.Type,
                    IsDefaultAccount = a.IsDefaultAccount,
                    IsSystem = a.IsSystem,
                    GoalAmount = a.GoalAmount,
                    BillingDueDay = a.BillingDueDay,
                    BillingClosingDay = a.BillingClosingDay,
                    CreditLimit = a.CreditLimit,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            var categories = await _context.Categories
                .AsNoTracking()
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.Name)
                .Select(c => new ExportCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Color = c.Color,
                    IsSystem = c.IsSystem,
                    SubCategories = c.SubCategories
                        .OrderBy(s => s.Name)
                        .Select(s => new ExportSubCategoryDto
                        {
                            Id = s.Id,
                            Name = s.Name,
                            Emoji = s.Emoji,
                            IsSystem = s.IsSystem
                        })
                        .ToList()
                })
                .ToListAsync();

            var tags = await _context.Tags
                .AsNoTracking()
                .Where(t => t.UserId == userId)
                .OrderBy(t => t.Name)
                .Select(t => new ExportTagDto { Id = t.Id, Name = t.Name })
                .ToListAsync();

            var transactions = await _context.Transactions
                .AsNoTracking()
                .Where(t => t.UserId == userId)
                .OrderBy(t => t.TransactionDate).ThenBy(t => t.Id)
                .Select(t => new ExportTransactionDto
                {
                    Id = t.Id,
                    Description = t.Description,
                    Value = t.Value,
                    Type = t.Type,
                    TransactionDate = t.TransactionDate,
                    PaymentType = t.PaymentType,
                    PaymentMethod = t.PaymentMethod,
                    AccountId = t.AccountId,
                    AccountName = t.Account.Name,
                    DestinationAccountId = t.DestinationAccountId,
                    SubCategoryId = t.SubCategoryId,
                    SubCategoryName = t.SubCategory.Name,
                    CategoryName = t.SubCategory.Category.Name,
                    BudgetId = t.BudgetId,
                    RecurringTransactionId = t.RecurringTransactionId,
                    ParentTransactionId = t.ParentTransactionId,
                    InstallmentNumber = t.InstallmentNumber,
                    TotalInstallments = t.TotalInstallments,
                    Tags = t.Tags.Select(tag => tag.Name).ToList(),
                    CreatedAt = t.CreatedAt
                })
                .ToListAsync();

            var recurringTransactions = await _context.RecurringTransactions
                .AsNoTracking()
                .Where(r => r.UserId == userId)
                .OrderBy(r => r.Id)
                .Select(r => new ExportRecurringTransactionDto
                {
                    Id = r.Id,
                    Description = r.Description,
                    Value = r.Value,
                    Type = r.Type,
                    Recurrence = r.Recurrence,
                    StartDate = r.StartDate,
                    EndDate = r.EndDate,
                    IsActive = r.IsActive,
                    AccountId = r.AccountId,
                    AccountName = r.Account.Name,
                    SubCategoryId = r.SubCategoryId,
                    SubCategoryName = r.SubCategory.Name,
                    BudgetId = r.BudgetId,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            var budgets = await _context.Budgets
                .AsNoTracking()
                .Where(b => b.UserId == userId)
                .OrderBy(b => b.Id)
                .Select(b => new ExportBudgetDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    StartDate = b.StartDate,
                    Recurrence = b.Recurrence,
                    IsActive = b.IsActive,
                    CreatedAt = b.CreatedAt,
                    Areas = _context.Areas
                        .Where(a => a.BudgetId == b.Id && a.UserId == userId)
                        .OrderBy(a => a.Name)
                        .Select(a => new ExportAreaDto
                        {
                            Id = a.Id,
                            Name = a.Name,
                            Allocations = a.BudgetSubcategoryAllocations
                                .Where(al => al.BudgetId == b.Id)
                                .Select(al => new ExportAllocationDto
                                {
                                    Id = al.Id,
                                    SubCategoryId = al.SubCategoryId,
                                    SubCategoryName = al.SubCategory.Name,
                                    ExpectedValue = al.ExpectedValue,
                                    AllocationType = al.AllocationType
                                })
                                .ToList()
                        })
                        .ToList()
                })
                .ToListAsync();

            var goals = await _context.Goals
                .AsNoTracking()
                .Where(g => g.UserId == userId)
                .OrderBy(g => g.Id)
                .Select(g => new ExportGoalDto
                {
                    Id = g.Id,
                    Name = g.Name,
                    Description = g.Description,
                    Type = g.Type,
                    TargetAmount = g.TargetAmount,
                    Priority = g.Priority,
                    Status = g.Status,
                    Color = g.Color,
                    TargetDate = g.TargetDate,
                    IncludeInNetWorth = g.IncludeInNetWorth,
                    AchievedAt = g.AchievedAt,
                    AccountId = g.AccountId,
                    Url = g.Url,
                    TargetAssetType = g.TargetAssetType,
                    TargetTicker = g.TargetTicker,
                    CreatedAt = g.CreatedAt
                })
                .ToListAsync();

            var investments = await _context.Investments
                .AsNoTracking()
                .Where(i => i.UserId == userId)
                .OrderBy(i => i.Id)
                .Select(i => new ExportInvestmentDto
                {
                    Id = i.Id,
                    Ticker = i.MarketAsset.Ticker,
                    AssetName = i.MarketAsset.Name,
                    AssetType = i.MarketAsset.AssetType,
                    Broker = i.Broker,
                    CurrentQuantity = i.CurrentQuantity,
                    AveragePrice = i.AveragePrice,
                    MaturityDate = i.MaturityDate,
                    ExpectedYieldPct = i.ExpectedYieldPct,
                    AccountId = i.AccountId,
                    CreatedAt = i.CreatedAt,
                    Transactions = i.Transactions
                        .OrderBy(t => t.Date)
                        .Select(t => new ExportInvestmentTransactionDto
                        {
                            Id = t.Id,
                            Operation = t.Operation,
                            Date = t.Date,
                            Quantity = t.Quantity,
                            UnitPrice = t.UnitPrice,
                            OtherCosts = t.OtherCosts,
                            TotalValue = t.TotalValue,
                            LinkedTransactionId = t.LinkedTransactionId
                        })
                        .ToList(),
                    Dividends = i.Dividends
                        .OrderBy(d => d.PaymentDate)
                        .Select(d => new ExportInvestmentDividendDto
                        {
                            Id = d.Id,
                            Type = d.Type,
                            PaymentDate = d.PaymentDate,
                            LastDatePrior = d.LastDatePrior,
                            Amount = d.Amount,
                            LinkedTransactionId = d.LinkedTransactionId
                        })
                        .ToList()
                })
                .ToListAsync();

            var alertRules = await _context.AlertRules
                .AsNoTracking()
                .Where(a => a.UserId == userId)
                .OrderBy(a => a.Id)
                .Select(a => new ExportAlertRuleDto
                {
                    Id = a.Id,
                    Ticker = a.MarketAsset.Ticker,
                    Direction = a.Direction,
                    TargetValue = a.TargetValue,
                    IsActive = a.IsActive,
                    IsTriggered = a.IsTriggered,
                    TriggeredAt = a.TriggeredAt,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            var notificationPreferences = await _context.NotificationPreferences
                .AsNoTracking()
                .Where(p => p.UserId == userId)
                .Select(p => new ExportNotificationPreferenceDto
                {
                    RecurrenceChargedEnabled = p.RecurrenceChargedEnabled,
                    CardDueEnabled = p.CardDueEnabled,
                    CardDueDaysAhead = p.CardDueDaysAhead,
                    CardClosingEnabled = p.CardClosingEnabled,
                    CardClosingDaysAhead = p.CardClosingDaysAhead,
                    BudgetAlertEnabled = p.BudgetAlertEnabled,
                    BudgetWarningPercent = p.BudgetWarningPercent
                })
                .FirstOrDefaultAsync();

            return new UserDataExportResponseDto
            {
                ExportedAt = DateTime.UtcNow,
                Notice = ExportNotice,
                Profile = profile,
                Preferences = preferences,
                Consents = consents,
                Accounts = accounts,
                Categories = categories,
                Tags = tags,
                Transactions = transactions,
                RecurringTransactions = recurringTransactions,
                Budgets = budgets,
                Goals = goals,
                Investments = investments,
                AlertRules = alertRules,
                NotificationPreferences = notificationPreferences
            };
        }
    }
}
