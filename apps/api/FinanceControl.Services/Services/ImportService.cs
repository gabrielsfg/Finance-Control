using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml;
using Anthropic.SDK;
using Anthropic.SDK.Constants;
using Anthropic.SDK.Messaging;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response.Import;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FinanceControl.Services.Services;

public class ImportService : IImportService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public ImportService(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<Result<ParseImportFileResponseDto>> ParseFileAsync(Stream fileStream, string fileName, int accountId, int userId)
    {
        var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);
        if (account is null)
            return Result<ParseImportFileResponseDto>.Failure("Account not found.");

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (extension is not ".ofx" and not ".csv")
            return Result<ParseImportFileResponseDto>.Failure("Only OFX and CSV files are supported.");

        List<RawTransaction> rawTransactions;
        try
        {
            rawTransactions = extension == ".ofx"
                ? await ParseOfxAsync(fileStream)
                : await ParseCsvAsync(fileStream);
        }
        catch (Exception ex)
        {
            return Result<ParseImportFileResponseDto>.Failure($"Failed to parse file: {ex.Message}");
        }

        if (rawTransactions.Count == 0)
            return Result<ParseImportFileResponseDto>.Failure("No transactions found in the file.");

        var subcategories = await _context.SubCategories
            .Where(s => s.UserId == userId)
            .Select(s => new { s.Id, s.Name })
            .ToListAsync();

        var existingTransactions = await _context.Transactions
            .Where(t => t.UserId == userId && t.AccountId == accountId)
            .Select(t => new { t.Value, t.TransactionDate, t.Description })
            .ToListAsync();

        var categorized = await CategorizeWithClaudeAsync(rawTransactions, subcategories.Select(s => $"{s.Id}:{s.Name}").ToList());

        var result = new List<ParsedTransactionItemDto>();
        foreach (var item in categorized)
        {
            var sub = subcategories.FirstOrDefault(s => s.Id == item.SuggestedSubCategoryId);

            var isDuplicate = false;
            string? duplicateReason = null;

            // Check for exact duplicate (same date + value + similar description)
            var potentialDup = existingTransactions.FirstOrDefault(e =>
                e.TransactionDate == item.Date &&
                e.Value == item.Value &&
                IsSimilarDescription(e.Description, item.Description));

            if (potentialDup is not null)
            {
                isDuplicate = true;
                duplicateReason = "Transaction with same date, value and description already exists.";
            }

            // Check for installment already existing
            if (!isDuplicate && item.PaymentType == EnumPaymentType.Installment && item.InstallmentNumber.HasValue)
            {
                var installmentExists = existingTransactions.Any(e =>
                    e.Value == item.Value &&
                    IsSimilarDescription(e.Description, item.Description));

                if (installmentExists)
                {
                    isDuplicate = true;
                    duplicateReason = "An installment with the same value and description already exists.";
                }
            }

            result.Add(new ParsedTransactionItemDto
            {
                ExternalId = item.ExternalId,
                Date = item.Date,
                Description = item.Description,
                Value = item.Value,
                Type = item.Type,
                SuggestedSubCategoryId = item.SuggestedSubCategoryId,
                SuggestedSubCategoryName = sub?.Name,
                PaymentType = item.PaymentType,
                TotalInstallments = item.TotalInstallments,
                InstallmentNumber = item.InstallmentNumber,
                IsDuplicate = isDuplicate,
                DuplicateReason = duplicateReason,
            });
        }

        return Result<ParseImportFileResponseDto>.Success(new ParseImportFileResponseDto
        {
            Transactions = result,
            TotalFound = result.Count,
            DuplicatesFound = result.Count(r => r.IsDuplicate),
        });
    }

    public async Task<Result<int>> ConfirmImportAsync(ImportTransactionsRequestDto requestDto, int userId)
    {
        var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == requestDto.AccountId && a.UserId == userId);
        if (account is null)
            return Result<int>.Failure("Account not found.");

        var subcategoryIds = requestDto.Transactions
            .Where(t => t.SubCategoryId.HasValue)
            .Select(t => t.SubCategoryId!.Value)
            .Distinct()
            .ToList();

        var validSubcategoryIds = await _context.SubCategories
            .Where(s => subcategoryIds.Contains(s.Id) && s.UserId == userId)
            .Select(s => s.Id)
            .ToHashSetAsync();

        int savedCount = 0;

        foreach (var item in requestDto.Transactions)
        {
            if (item.SubCategoryId.HasValue && !validSubcategoryIds.Contains(item.SubCategoryId.Value))
                return Result<int>.Failure($"SubCategory {item.SubCategoryId} not found.");

            if (item.PaymentType == EnumPaymentType.Installment && item.TotalInstallments.HasValue && item.InstallmentNumber == 1)
            {
                // Create parent installment transaction
                var parent = new Transaction
                {
                    UserId = userId,
                    AccountId = requestDto.AccountId,
                    SubCategoryId = item.SubCategoryId ?? 0,
                    Value = item.Value,
                    Type = item.Type,
                    Description = item.Description,
                    TransactionDate = item.Date,
                    PaymentType = EnumPaymentType.Installment,
                    InstallmentNumber = 1,
                    TotalInstallments = item.TotalInstallments,
                };
                _context.Transactions.Add(parent);
                await _context.SaveChangesAsync();

                for (int i = 2; i <= item.TotalInstallments; i++)
                {
                    var installment = new Transaction
                    {
                        UserId = userId,
                        AccountId = requestDto.AccountId,
                        SubCategoryId = item.SubCategoryId ?? 0,
                        ParentTransactionId = parent.Id,
                        Value = item.Value,
                        Type = item.Type,
                        Description = item.Description,
                        TransactionDate = item.Date.AddMonths(i - 1),
                        PaymentType = EnumPaymentType.Installment,
                        InstallmentNumber = i,
                        TotalInstallments = item.TotalInstallments,
                    };
                    _context.Transactions.Add(installment);
                }

                savedCount++;
            }
            else if (item.PaymentType != EnumPaymentType.Installment || item.InstallmentNumber == 1)
            {
                // OneTime or first installment already handled, skip subsequent installments from import
                var transaction = new Transaction
                {
                    UserId = userId,
                    AccountId = requestDto.AccountId,
                    DestinationAccountId = item.DestinationAccountId,
                    SubCategoryId = item.SubCategoryId ?? 0,
                    Value = item.Value,
                    Type = item.Type,
                    Description = item.Description,
                    TransactionDate = item.Date,
                    PaymentType = item.PaymentType,
                };
                _context.Transactions.Add(transaction);
                savedCount++;
            }
        }

        await _context.SaveChangesAsync();
        return Result<int>.Success(savedCount);
    }

    // ── OFX Parser ───────────────────────────────────────────────────────────

    // Matches each STMTTRN block regardless of SGML vs XML style
    private static readonly Regex StmtTrnBlockRegex = new(
        @"<STMTTRN>(.*?)</STMTTRN>",
        RegexOptions.Singleline | RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // Matches a leaf field: <TAGNAME>value  (SGML — no closing tag needed)
    private static readonly Regex OfxFieldRegex = new(
        @"<([A-Z0-9.]+)>\s*([^<\r\n]+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static async Task<List<RawTransaction>> ParseOfxAsync(Stream fileStream)
    {
        // Try UTF-8 first (XML-style OFX), fall back to Windows-1252 (SGML-style from Brazilian banks)
        using var ms = new MemoryStream();
        await fileStream.CopyToAsync(ms);
        var bytes = ms.ToArray();

        string content;
        try
        {
            content = Encoding.UTF8.GetString(bytes);
            if (content.Contains('�'))
                content = Encoding.GetEncoding(1252).GetString(bytes);
        }
        catch
        {
            content = Encoding.GetEncoding(1252).GetString(bytes);
        }

        var transactions = new List<RawTransaction>();

        foreach (Match block in StmtTrnBlockRegex.Matches(content))
        {
            var body = block.Groups[1].Value;
            var fields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (Match field in OfxFieldRegex.Matches(body))
                fields[field.Groups[1].Value] = field.Groups[2].Value.Trim();

            fields.TryGetValue("DTPOSTED", out var dtPosted);
            fields.TryGetValue("TRNAMT", out var trnAmt);
            fields.TryGetValue("TRNTYPE", out var trnType);
            fields.TryGetValue("FITID", out var fitId);
            fields.TryGetValue("MEMO", out var memo);
            fields.TryGetValue("NAME", out var name);

            if (string.IsNullOrEmpty(dtPosted) || string.IsNullOrEmpty(trnAmt))
                continue;

            if (!TryParseOfxDate(dtPosted, out var date))
                continue;

            if (!decimal.TryParse(trnAmt, NumberStyles.Any, CultureInfo.InvariantCulture, out var amountDecimal))
                continue;

            var valueInCents = (int)Math.Round(Math.Abs(amountDecimal) * 100);
            var description = !string.IsNullOrEmpty(memo) ? memo : (name ?? string.Empty);
            description = CleanOfxDescription(description);
            var type = DetermineTypeFromOfx(trnType, amountDecimal);

            transactions.Add(new RawTransaction
            {
                ExternalId = fitId ?? Guid.NewGuid().ToString(),
                Date = date,
                Description = description,
                Value = valueInCents,
                Type = type,
                RawType = trnType ?? string.Empty,
            });
        }

        return transactions;
    }

    private static bool TryParseOfxDate(string raw, out DateOnly date)
    {
        // Formats: 20260520, 20260520031903, 20260520000000[-3:BRT]
        var digits = Regex.Match(raw, @"^\d{8}");
        if (digits.Success && DateTime.TryParseExact(digits.Value, "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
        {
            date = DateOnly.FromDateTime(dt);
            return true;
        }
        date = default;
        return false;
    }

    private static EnumTransactionType DetermineTypeFromOfx(string? trnType, decimal amount)
    {
        if (trnType is "XFER" or "TRANSFER")
            return EnumTransactionType.Transfer;
        return amount >= 0 ? EnumTransactionType.Income : EnumTransactionType.Expense;
    }

    private static string CleanOfxDescription(string description)
    {
        // Remove patterns like: Pix recebido: "Cp :12345678-NAME" → NAME
        var match = Regex.Match(description, @"""[^""]*?-([^""]+)""");
        if (match.Success)
            return match.Groups[1].Value.Trim();

        // Remove surrounding quotes
        description = description.Trim('"');
        return description;
    }

    // ── CSV Parser ────────────────────────────────────────────────────────────

    private static async Task<List<RawTransaction>> ParseCsvAsync(Stream fileStream)
    {
        // Try UTF-8 first, fall back to Windows-1252
        using var ms = new MemoryStream();
        await fileStream.CopyToAsync(ms);
        var bytes = ms.ToArray();

        string content;
        try
        {
            content = Encoding.UTF8.GetString(bytes);
            // Check for common corruption signs
            if (content.Contains("Ã") || content.Contains("â"))
                content = Encoding.GetEncoding(1252).GetString(bytes);
        }
        catch
        {
            content = Encoding.GetEncoding(1252).GetString(bytes);
        }

        var lines = content.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length < 2)
            return [];

        // Find the header line (contains date-like column name)
        int headerIndex = -1;
        string[]? headers = null;
        char delimiter = ',';

        for (int i = 0; i < Math.Min(lines.Length, 10); i++)
        {
            var tryDelimiters = new[] { ',', ';', '\t' };
            foreach (var d in tryDelimiters)
            {
                var parts = lines[i].Split(d);
                if (parts.Length >= 2 && IsHeaderLine(parts))
                {
                    headerIndex = i;
                    headers = parts.Select(p => p.Trim().ToLowerInvariant()).ToArray();
                    delimiter = d;
                    break;
                }
            }
            if (headerIndex >= 0) break;
        }

        if (headers is null)
            return [];

        // Map column indices
        int dateCol = FindColumn(headers, ["data", "date", "dt"]);
        int descCol = FindColumn(headers, ["lançamento", "lancamento", "title", "descricao", "descrição", "historico", "histórico", "memo", "description"]);
        int valueCol = FindColumn(headers, ["valor", "value", "amount", "trnamt"]);
        int typeCol = FindColumn(headers, ["tipo", "type", "trntype"]);

        if (dateCol < 0 || descCol < 0 || valueCol < 0)
            return [];

        var transactions = new List<RawTransaction>();

        for (int i = headerIndex + 1; i < lines.Length; i++)
        {
            var cols = SplitCsvLine(lines[i], delimiter);
            if (cols.Length <= Math.Max(dateCol, Math.Max(descCol, valueCol)))
                continue;

            var dateStr = cols[dateCol].Trim();
            var desc = cols[descCol].Trim().Trim('"');
            var valueStr = cols[valueCol].Trim().Replace("\"", "").Replace(".", "").Replace(",", ".");

            if (string.IsNullOrEmpty(dateStr) || string.IsNullOrEmpty(desc) || string.IsNullOrEmpty(valueStr))
                continue;

            if (!TryParseCsvDate(dateStr, out var date))
                continue;

            if (!decimal.TryParse(valueStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
                continue;

            var valueInCents = (int)Math.Round(Math.Abs(amount) * 100);
            if (valueInCents == 0)
                continue;

            var rawType = typeCol >= 0 && cols.Length > typeCol ? cols[typeCol].Trim() : string.Empty;
            var type = DetermineTypeFromCsv(rawType, amount);

            transactions.Add(new RawTransaction
            {
                ExternalId = Guid.NewGuid().ToString(),
                Date = date,
                Description = desc,
                Value = valueInCents,
                Type = type,
                RawType = rawType,
            });
        }

        return transactions;
    }

    private static bool IsHeaderLine(string[] parts)
    {
        var lower = parts.Select(p => p.Trim().ToLowerInvariant()).ToArray();
        return lower.Any(p => p is "data" or "date" or "valor" or "value" or "amount");
    }

    private static int FindColumn(string[] headers, string[] candidates)
    {
        foreach (var candidate in candidates)
            for (int i = 0; i < headers.Length; i++)
                if (headers[i].Contains(candidate))
                    return i;
        return -1;
    }

    private static string[] SplitCsvLine(string line, char delimiter)
    {
        var result = new List<string>();
        var current = new StringBuilder();
        bool inQuotes = false;

        foreach (var ch in line)
        {
            if (ch == '"') { inQuotes = !inQuotes; continue; }
            if (ch == delimiter && !inQuotes) { result.Add(current.ToString()); current.Clear(); continue; }
            current.Append(ch);
        }
        result.Add(current.ToString());
        return result.ToArray();
    }

    private static readonly string[] CsvDateFormats = ["dd/MM/yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "d/M/yyyy", "yyyy/MM/dd"];

    private static bool TryParseCsvDate(string raw, out DateOnly date)
    {
        var formats = CsvDateFormats;
        foreach (var fmt in formats)
            if (DateOnly.TryParseExact(raw, fmt, CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
                return true;
        date = default;
        return false;
    }

    private static EnumTransactionType DetermineTypeFromCsv(string rawType, decimal amount)
    {
        var lower = rawType.ToLowerInvariant();
        if (lower.Contains("transfer") || lower.Contains("transf"))
            return EnumTransactionType.Transfer;
        return amount >= 0 ? EnumTransactionType.Income : EnumTransactionType.Expense;
    }

    // ── Claude Categorization ────────────────────────────────────────────────

    private async Task<List<CategorizedTransaction>> CategorizeWithClaudeAsync(
        List<RawTransaction> transactions,
        List<string> subcategories)
    {
        var apiKey = _configuration["Claude:ApiKey"];
        var client = new AnthropicClient(apiKey);

        var subcategoryList = string.Join("\n", subcategories.Select(s => $"- {s}"));
        var transactionList = string.Join("\n", transactions.Select((t, i) =>
            $"{i}|{t.Date:yyyy-MM-dd}|{t.Description}|{t.Value}|{t.Type}|{t.RawType}"));

        var systemPrompt = """
            You are a financial transaction categorizer for a Brazilian personal finance app.
            You will receive a list of bank transactions and a list of available subcategories.
            For each transaction, return a JSON array with categorization.

            Rules:
            - Match each transaction to the most appropriate subcategory from the list
            - If no subcategory fits, use null for subcategoryId
            - Detect installments: if description contains "Parcela X/Y" or "X/Y", set paymentType to "Installment", totalInstallments to Y, installmentNumber to X
            - Transfers between accounts (PIX between own accounts, fatura payment) should have type "Transfer"
            - All monetary values are already in cents (integers)
            - Return ONLY valid JSON, no explanation

            Response format (array with one object per transaction, in same order as input):
            [
              {
                "index": 0,
                "subcategoryId": 5,
                "paymentType": "OneTime",
                "totalInstallments": null,
                "installmentNumber": null
              }
            ]

            PaymentType values: "OneTime", "Installment", "Recurring"
            """;

        var userMessage = $"""
            Available subcategories (id:name):
            {subcategoryList}

            Transactions (index|date|description|valueCents|type|rawType):
            {transactionList}
            """;

        var response = await client.Messages.GetClaudeMessageAsync(new MessageParameters
        {
            Model = AnthropicModels.Claude45Haiku,
            MaxTokens = 4096,
            Messages = [new Message(RoleType.User, userMessage)],
            System = [new SystemMessage(systemPrompt)],
        });

        var jsonText = response.Message.ToString().Trim();

        // Extract JSON array if wrapped in markdown
        var jsonMatch = Regex.Match(jsonText, @"\[[\s\S]*\]");
        if (jsonMatch.Success)
            jsonText = jsonMatch.Value;

        var categorizations = JsonSerializer.Deserialize<List<ClaudeCategorization>>(jsonText,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];

        var result = new List<CategorizedTransaction>();
        for (int i = 0; i < transactions.Count; i++)
        {
            var raw = transactions[i];
            var cat = categorizations.FirstOrDefault(c => c.Index == i);

            result.Add(new CategorizedTransaction
            {
                ExternalId = raw.ExternalId,
                Date = raw.Date,
                Description = raw.Description,
                Value = raw.Value,
                Type = raw.Type,
                SuggestedSubCategoryId = cat?.SubcategoryId,
                PaymentType = Enum.TryParse<EnumPaymentType>(cat?.PaymentType, out var pt) ? pt : EnumPaymentType.OneTime,
                TotalInstallments = cat?.TotalInstallments,
                InstallmentNumber = cat?.InstallmentNumber,
            });
        }

        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static bool IsSimilarDescription(string? a, string? b)
    {
        if (string.IsNullOrEmpty(a) || string.IsNullOrEmpty(b))
            return false;

        a = a.ToLowerInvariant().Trim();
        b = b.ToLowerInvariant().Trim();

        if (a == b) return true;

        // Consider similar if one contains the other (truncated bank names)
        if (a.Length > 5 && b.Length > 5)
            return a.Contains(b[..Math.Min(10, b.Length)]) || b.Contains(a[..Math.Min(10, a.Length)]);

        return false;
    }

    // ── Internal models ───────────────────────────────────────────────────────

    private record RawTransaction
    {
        public string ExternalId { get; init; } = string.Empty;
        public DateOnly Date { get; init; }
        public string Description { get; init; } = string.Empty;
        public int Value { get; init; }
        public EnumTransactionType Type { get; init; }
        public string RawType { get; init; } = string.Empty;
    }

    private record CategorizedTransaction
    {
        public string ExternalId { get; init; } = string.Empty;
        public DateOnly Date { get; init; }
        public string Description { get; init; } = string.Empty;
        public int Value { get; init; }
        public EnumTransactionType Type { get; init; }
        public int? SuggestedSubCategoryId { get; init; }
        public EnumPaymentType PaymentType { get; init; }
        public int? TotalInstallments { get; init; }
        public int? InstallmentNumber { get; init; }
    }

    private class ClaudeCategorization
    {
        public int Index { get; set; }
        public int? SubcategoryId { get; set; }
        public string? PaymentType { get; set; }
        public int? TotalInstallments { get; set; }
        public int? InstallmentNumber { get; set; }
    }
}
