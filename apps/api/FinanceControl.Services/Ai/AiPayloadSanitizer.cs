using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// The single exit point for anything that leaves the server towards a model — the
    /// in-app Claude calls and the MCP tool results alike.
    /// </summary>
    /// <remarks>
    /// Two layers. Structured payloads lose every property whose name identifies a person
    /// or a credential, whatever DTO it came from. Free text — transaction descriptions,
    /// account names, the user's own context note — is scrubbed for the identifiers a bank
    /// statement tends to carry inline ("PIX JOAO 123.456.789-00"). The privacy policy
    /// promises that CPF, e-mail, card and bank details never reach a provider; this class
    /// is what makes that promise true, so every rule here has a test.
    /// <para>
    /// Order matters in <see cref="ScrubText"/>: the longer numeric patterns run first, so
    /// a CNPJ is not half-eaten by the CPF rule, and a CPF or a phone with +55 is not mistaken
    /// for a card.
    /// </para>
    /// </remarks>
    public static class AiPayloadSanitizer
    {
        public const string EmailMask = "[e-mail]";
        public const string CnpjMask = "[CNPJ]";
        public const string CpfMask = "[CPF]";
        public const string CardMask = "[cartão]";
        public const string PhoneMask = "[telefone]";
        public const string PixKeyMask = "[chave Pix]";
        public const string BankDetailsMask = "[dados bancários]";

        /// <summary>
        /// Property names removed from any structured payload, compared case-insensitively.
        /// Ids of the user's own records (accounts, categories) stay: the model needs them
        /// to refer back to a record, and they identify nothing outside this database.
        /// </summary>
        private static readonly HashSet<string> BlockedProperties = new(StringComparer.OrdinalIgnoreCase)
        {
            "userId", "email", "emailAddress", "password", "passwordHash",
            "cpf", "cnpj", "document", "documentNumber", "rg",
            "phone", "phoneNumber", "address",
            "token", "accessToken", "refreshToken", "apiKey", "secret",
            "cardNumber", "accountNumber", "agency", "branch", "pixKey"
        };

        private static readonly Regex Email = new(
            @"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}",
            RegexOptions.Compiled);

        private static readonly Regex PixRandomKey = new(
            @"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b",
            RegexOptions.Compiled);

        private static readonly Regex Cnpj = new(
            @"(?<!\d)\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}(?!\d)",
            RegexOptions.Compiled);

        private static readonly Regex Cpf = new(
            @"(?<!\d)\d{3}\.?\d{3}\.?\d{3}-?\d{2}(?!\d)",
            RegexOptions.Compiled);

        /// <summary>13 to 19 digits, optionally grouped by spaces or dashes — every card length in use.</summary>
        private static readonly Regex Card = new(
            @"(?<!\d)\d(?:[ \-]?\d){12,18}(?!\d)",
            RegexOptions.Compiled);

        /// <summary>A Brazilian mobile or landline with area code, optionally with +55.</summary>
        private static readonly Regex Phone = new(
            @"(?<!\d)(?:\+?55[\s\-]?)?(?:\(\d{2}\)\s?|\d{2}[\s\-])9?\d{4}[\s\-]?\d{4}(?!\d)",
            RegexOptions.Compiled);

        /// <summary>"ag 1234", "agência: 0001", "cc 12345-6", "conta 998877-0".</summary>
        private static readonly Regex BankDetails = new(
            @"\b(?:ag(?:[eê]ncia)?|conta(?:\s+corrente)?|c/c|cc)\.?\s*:?\s*\d[\d.\-]{2,}",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public static string ScrubText(string? text)
        {
            if (string.IsNullOrEmpty(text))
                return text ?? string.Empty;

            var scrubbed = Email.Replace(text, EmailMask);
            scrubbed = PixRandomKey.Replace(scrubbed, PixKeyMask);
            scrubbed = BankDetails.Replace(scrubbed, BankDetailsMask);
            scrubbed = Cnpj.Replace(scrubbed, CnpjMask);
            scrubbed = Cpf.Replace(scrubbed, CpfMask);
            scrubbed = Phone.Replace(scrubbed, PhoneMask);
            scrubbed = Card.Replace(scrubbed, CardMask);

            return scrubbed;
        }

        /// <summary>Sanitizes an already serialized JSON payload. Invalid JSON is scrubbed as text.</summary>
        public static string SanitizeJson(string json)
        {
            JsonNode? node;
            try
            {
                node = JsonNode.Parse(json);
            }
            catch (JsonException)
            {
                return ScrubText(json);
            }

            return SanitizeNode(node)?.ToJsonString() ?? "null";
        }

        /// <summary>Serializes a value and sanitizes the result in one step.</summary>
        public static string Serialize<T>(T value, JsonSerializerOptions? options = null)
        {
            var node = JsonSerializer.SerializeToNode(value, options);
            return SanitizeNode(node)?.ToJsonString(options) ?? "null";
        }

        public static JsonNode? SanitizeNode(JsonNode? node)
        {
            switch (node)
            {
                case null:
                    return null;

                case JsonObject obj:
                    foreach (var key in obj.Select(p => p.Key).ToList())
                    {
                        if (BlockedProperties.Contains(key))
                        {
                            obj.Remove(key);
                            continue;
                        }

                        var child = obj[key];
                        var sanitized = SanitizeNode(child);
                        if (!ReferenceEquals(child, sanitized))
                            obj[key] = sanitized;
                    }
                    return obj;

                case JsonArray array:
                    for (var i = 0; i < array.Count; i++)
                    {
                        var child = array[i];
                        var sanitized = SanitizeNode(child);
                        if (!ReferenceEquals(child, sanitized))
                            array[i] = sanitized;
                    }
                    return array;

                case JsonValue value when value.TryGetValue<string>(out var text):
                    var scrubbed = ScrubText(text);
                    return scrubbed == text ? value : JsonValue.Create(scrubbed);

                default:
                    return node;
            }
        }
    }
}
