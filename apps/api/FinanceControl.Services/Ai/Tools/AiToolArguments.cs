using System.Globalization;
using System.Text.Json;

namespace FinanceControl.Services.Ai.Tools
{
    /// <summary>
    /// Typed, forgiving access to a tool call's arguments. Models occasionally send a
    /// number as a string or omit an optional field; both are handled here, and anything
    /// genuinely invalid becomes an <see cref="AiToolException"/> the model can react to.
    /// </summary>
    public sealed class AiToolArguments
    {
        private readonly IReadOnlyDictionary<string, JsonElement> _values;

        public AiToolArguments(IReadOnlyDictionary<string, JsonElement>? values)
        {
            _values = values ?? new Dictionary<string, JsonElement>();
        }

        public static AiToolArguments FromJson(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new AiToolArguments(null);

            return new AiToolArguments(JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json));
        }

        public bool Has(string name) =>
            _values.TryGetValue(name, out var value) && value.ValueKind is not (JsonValueKind.Null or JsonValueKind.Undefined);

        public string? GetString(string name)
        {
            if (!_values.TryGetValue(name, out var value))
                return null;

            return value.ValueKind switch
            {
                JsonValueKind.String => value.GetString(),
                JsonValueKind.Number => value.GetRawText(),
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                _ => null
            };
        }

        public string RequireString(string name) =>
            GetString(name) is { Length: > 0 } text ? text : throw new AiToolException($"'{name}' is required.");

        public int? GetInt(string name)
        {
            if (!_values.TryGetValue(name, out var value))
                return null;

            if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var number))
                return number;

            if (value.ValueKind == JsonValueKind.Number && value.TryGetDecimal(out var decimalNumber))
                return (int)Math.Round(decimalNumber);

            if (value.ValueKind == JsonValueKind.String && int.TryParse(value.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out number))
                return number;

            if (value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
                return null;

            throw new AiToolException($"'{name}' must be an integer.");
        }

        public int RequireInt(string name) =>
            GetInt(name) ?? throw new AiToolException($"'{name}' is required.");

        public long? GetLong(string name)
        {
            if (!_values.TryGetValue(name, out var value))
                return null;

            if (value.ValueKind == JsonValueKind.Number && value.TryGetInt64(out var number))
                return number;

            if (value.ValueKind == JsonValueKind.String && long.TryParse(value.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out number))
                return number;

            if (value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
                return null;

            throw new AiToolException($"'{name}' must be an integer.");
        }

        public bool? GetBool(string name)
        {
            if (!_values.TryGetValue(name, out var value))
                return null;

            return value.ValueKind switch
            {
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.String when bool.TryParse(value.GetString(), out var parsed) => parsed,
                _ => null
            };
        }

        public DateOnly? GetDate(string name)
        {
            var text = GetString(name);
            if (string.IsNullOrWhiteSpace(text))
                return null;

            if (DateOnly.TryParseExact(text, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                return date;

            throw new AiToolException($"'{name}' must be a date in the format YYYY-MM-DD.");
        }

        public TEnum? GetEnum<TEnum>(string name) where TEnum : struct, Enum
        {
            var text = GetString(name);
            if (string.IsNullOrWhiteSpace(text))
                return null;

            if (Enum.TryParse<TEnum>(text, ignoreCase: true, out var parsed) && Enum.IsDefined(parsed))
                return parsed;

            throw new AiToolException($"'{name}' must be one of: {string.Join(", ", Enum.GetNames<TEnum>())}.");
        }

        public List<int>? GetIntList(string name)
        {
            if (!_values.TryGetValue(name, out var value) || value.ValueKind != JsonValueKind.Array)
                return GetInt(name) is { } single ? [single] : null;

            var list = new List<int>();
            foreach (var item in value.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.Number && item.TryGetInt32(out var number))
                    list.Add(number);
                else if (item.ValueKind == JsonValueKind.String && int.TryParse(item.GetString(), out number))
                    list.Add(number);
                else
                    throw new AiToolException($"'{name}' must be a list of integers.");
            }

            return list.Count == 0 ? null : list;
        }

        public List<string>? GetStringList(string name)
        {
            if (!_values.TryGetValue(name, out var value))
                return null;

            if (value.ValueKind == JsonValueKind.String)
                return [value.GetString()!];

            if (value.ValueKind != JsonValueKind.Array)
                return null;

            var list = value.EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.String)
                .Select(item => item.GetString()!)
                .Where(text => !string.IsNullOrWhiteSpace(text))
                .ToList();

            return list.Count == 0 ? null : list;
        }

        public JsonElement? GetElement(string name) =>
            _values.TryGetValue(name, out var value) && value.ValueKind is not (JsonValueKind.Null or JsonValueKind.Undefined)
                ? value
                : null;
    }
}
