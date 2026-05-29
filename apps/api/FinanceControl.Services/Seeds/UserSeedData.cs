namespace FinanceControl.Services.Seeds
{
    /// <summary>
    /// Defines the default categories, subcategories, and account to be seeded on user registration.
    /// Strings are keyed by locale ("pt-BR", "en-US"). Falls back to "en-US" for unknown locales.
    /// </summary>
    public static class UserSeedData
    {
        // (categoryKey, hexColor, subcategoryKey[])
        private static readonly (string Cat, string Color, string[] Subs)[] _structure =
        [
            // Expense
            ("housing",       "#4a9eff", ["rent", "condoFee", "electricity", "water", "internet", "gas", "cableTV", "phone"]),
            ("food",          "#f5a623", ["grocery", "restaurant", "delivery", "bakery", "fastFood"]),
            ("transport",     "#7c6fe0", ["fuel", "parking", "publicTransit", "rideshare", "vehicleMaint", "carInsurance", "flight"]),
            ("health",        "#f25f5c", ["doctorVisit", "pharmacy", "gym", "healthInsurance", "labTests", "dentist"]),
            ("education",     "#00c98d", ["collegeCourse", "schoolSupplies", "books", "certifications"]),
            ("entertainment", "#f5ce42", ["cinemaTheater", "games", "travel", "outings", "hobbies", "sports", "shows", "cinema"]),
            ("clothing",      "#00d4a0", ["clothes", "shoes", "accessories"]),
            ("subscriptions", "#4a9eff", ["streaming", "apps", "magazines"]),
            ("personal",      "#e07b9a", ["hairdresser", "pet", "charity"]),
            ("otherExpense",  "#8a95a3", ["otherExpenses"]),
            // Income
            ("work",          "#00c98d", ["salary", "mealVoucher", "freelance", "overtime", "bonus"]),
            ("investments",   "#7c6fe0", ["yield", "dividends", "lifeInsurance"]),
            ("retirement",    "#00c98d", ["retirementIncome"]),
            ("otherIncome",   "#f5ce42", ["gift", "itemSale", "reimbursement", "otherIncome"]),
        ];

        // emoji per subcategory key (locale-independent)
        private static readonly Dictionary<string, string> _emojis = new()
        {
            ["rent"]            = "🏠",
            ["condoFee"]        = "🏢",
            ["electricity"]     = "💡",
            ["water"]           = "💧",
            ["internet"]        = "📶",
            ["gas"]             = "🔥",
            ["cableTV"]         = "📺",
            ["grocery"]         = "🛒",
            ["restaurant"]      = "🍽️",
            ["delivery"]        = "🛵",
            ["bakery"]          = "🥐",
            ["fastFood"]        = "🍔",
            ["fuel"]            = "⛽",
            ["parking"]         = "🅿️",
            ["publicTransit"]   = "🚌",
            ["rideshare"]       = "🚗",
            ["vehicleMaint"]    = "🔧",
            ["doctorVisit"]     = "🩺",
            ["pharmacy"]        = "💊",
            ["gym"]             = "🏋️",
            ["healthInsurance"] = "🏥",
            ["labTests"]        = "🧪",
            ["collegeCourse"]   = "🎓",
            ["schoolSupplies"]  = "🎒",
            ["books"]           = "📚",
            ["certifications"]  = "📜",
            ["cinemaTheater"]   = "🎬",
            ["games"]           = "🎮",
            ["travel"]          = "✈️",
            ["outings"]         = "🎡",
            ["hobbies"]         = "🎨",
            ["clothes"]         = "👕",
            ["shoes"]           = "👟",
            ["accessories"]     = "👜",
            ["streaming"]       = "📺",
            ["apps"]            = "📱",
            ["magazines"]       = "📰",
            ["otherExpenses"]   = "💸",
            ["phone"]           = "📱",
            ["carInsurance"]    = "🚗",
            ["flight"]          = "✈️",
            ["dentist"]         = "🦷",
            ["sports"]          = "⚽",
            ["shows"]           = "🎤",
            ["cinema"]          = "🎥",
            ["hairdresser"]     = "💇",
            ["pet"]             = "🐾",
            ["charity"]         = "🤝",
            ["salary"]          = "💼",
            ["mealVoucher"]     = "🍱",
            ["freelance"]       = "💻",
            ["overtime"]        = "⏰",
            ["bonus"]           = "🎁",
            ["yield"]           = "📈",
            ["dividends"]       = "💰",
            ["lifeInsurance"]   = "🛡️",
            ["retirementIncome"] = "🏦",
            ["gift"]            = "🎀",
            ["itemSale"]        = "🏷️",
            ["reimbursement"]   = "↩️",
            ["otherIncome"]     = "💵",
        };

        private static readonly Dictionary<string, Dictionary<string, string>> _labels =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ["pt-BR"] = new Dictionary<string, string>
                {
                    // Categories
                    ["housing"]       = "Moradia",
                    ["food"]          = "Alimentação",
                    ["transport"]     = "Transporte",
                    ["health"]        = "Saúde",
                    ["education"]     = "Educação",
                    ["entertainment"] = "Entretenimento",
                    ["clothing"]      = "Vestuário",
                    ["subscriptions"] = "Assinaturas",
                    ["personal"]      = "Pessoal",
                    ["otherExpense"]  = "Outros",
                    ["work"]          = "Trabalho",
                    ["investments"]   = "Investimentos",
                    ["retirement"]    = "Aposentadoria",
                    ["otherIncome"]   = "Outras receitas",
                    // Subcategories
                    ["rent"]            = "Aluguel",
                    ["condoFee"]        = "Condomínio",
                    ["electricity"]     = "Luz",
                    ["water"]           = "Água",
                    ["internet"]        = "Internet",
                    ["gas"]             = "Gás",
                    ["cableTV"]         = "TV a cabo",
                    ["grocery"]         = "Supermercado",
                    ["restaurant"]      = "Restaurante",
                    ["delivery"]        = "Delivery",
                    ["bakery"]          = "Padaria",
                    ["fastFood"]        = "Fast food",
                    ["fuel"]            = "Combustível",
                    ["parking"]         = "Estacionamento",
                    ["publicTransit"]   = "Transporte público",
                    ["rideshare"]       = "Uber/99",
                    ["vehicleMaint"]    = "Manutenção do veículo",
                    ["doctorVisit"]     = "Consulta médica",
                    ["pharmacy"]        = "Farmácia",
                    ["gym"]             = "Academia",
                    ["healthInsurance"] = "Plano de saúde",
                    ["labTests"]        = "Exames",
                    ["collegeCourse"]   = "Faculdade/Curso",
                    ["schoolSupplies"]  = "Material escolar",
                    ["books"]           = "Livros",
                    ["certifications"]  = "Certificações",
                    ["cinemaTheater"]   = "Cinema/Teatro",
                    ["games"]           = "Games",
                    ["travel"]          = "Viagens",
                    ["outings"]         = "Passeios",
                    ["hobbies"]         = "Hobbies",
                    ["sports"]          = "Esportes",
                    ["shows"]           = "Shows",
                    ["cinema"]          = "Cinema",
                    ["clothes"]         = "Roupas",
                    ["shoes"]           = "Calçados",
                    ["accessories"]     = "Acessórios",
                    ["streaming"]       = "Streaming (Netflix/Spotify)",
                    ["apps"]            = "Aplicativos",
                    ["magazines"]       = "Revistas",
                    ["otherExpenses"]   = "Outros gastos",
                    ["phone"]           = "Telefone",
                    ["carInsurance"]    = "Seguro do carro",
                    ["flight"]          = "Voo",
                    ["dentist"]         = "Dentista",
                    ["hairdresser"]     = "Cabeleireiro",
                    ["pet"]             = "Pet",
                    ["charity"]         = "Caridade",
                    ["salary"]          = "Salário",
                    ["mealVoucher"]     = "Vale alimentação/refeição",
                    ["freelance"]       = "Freela",
                    ["overtime"]        = "Hora extra",
                    ["bonus"]           = "Bônus",
                    ["yield"]           = "Rendimento",
                    ["dividends"]       = "Dividendos",
                    ["lifeInsurance"]   = "Seguro de vida",
                    ["retirementIncome"] = "Aposentadoria",
                    ["gift"]            = "Presente",
                    ["itemSale"]        = "Venda de item",
                    ["reimbursement"]   = "Reembolso",
                    ["otherIncome"]     = "Outras receitas",
                    // Account
                    ["wallet"]          = "Carteira",
                },
                ["en-US"] = new Dictionary<string, string>
                {
                    // Categories
                    ["housing"]       = "Housing",
                    ["food"]          = "Food",
                    ["transport"]     = "Transport",
                    ["health"]        = "Health",
                    ["education"]     = "Education",
                    ["entertainment"] = "Entertainment",
                    ["clothing"]      = "Clothing",
                    ["subscriptions"] = "Subscriptions",
                    ["personal"]      = "Personal",
                    ["otherExpense"]  = "Other",
                    ["work"]          = "Work",
                    ["investments"]   = "Investments",
                    ["retirement"]    = "Retirement",
                    ["otherIncome"]   = "Other income",
                    // Subcategories
                    ["rent"]            = "Rent",
                    ["condoFee"]        = "Condo fee",
                    ["electricity"]     = "Electricity",
                    ["water"]           = "Water",
                    ["internet"]        = "Internet",
                    ["gas"]             = "Gas",
                    ["cableTV"]         = "Cable TV",
                    ["grocery"]         = "Grocery",
                    ["restaurant"]      = "Restaurant",
                    ["delivery"]        = "Delivery",
                    ["bakery"]          = "Bakery",
                    ["fastFood"]        = "Fast food",
                    ["fuel"]            = "Fuel",
                    ["parking"]         = "Parking",
                    ["publicTransit"]   = "Public transit",
                    ["rideshare"]       = "Rideshare (Uber/99)",
                    ["vehicleMaint"]    = "Vehicle maintenance",
                    ["doctorVisit"]     = "Doctor visit",
                    ["pharmacy"]        = "Pharmacy",
                    ["gym"]             = "Gym",
                    ["healthInsurance"] = "Health insurance",
                    ["labTests"]        = "Lab tests",
                    ["collegeCourse"]   = "College/Course",
                    ["schoolSupplies"]  = "School supplies",
                    ["books"]           = "Books",
                    ["certifications"]  = "Certifications",
                    ["cinemaTheater"]   = "Cinema/Theater",
                    ["games"]           = "Games",
                    ["travel"]          = "Travel",
                    ["outings"]         = "Outings",
                    ["hobbies"]         = "Hobbies",
                    ["sports"]          = "Sports",
                    ["shows"]           = "Shows",
                    ["cinema"]          = "Cinema",
                    ["clothes"]         = "Clothes",
                    ["shoes"]           = "Shoes",
                    ["accessories"]     = "Accessories",
                    ["streaming"]       = "Streaming (Netflix/Spotify)",
                    ["apps"]            = "Apps",
                    ["magazines"]       = "Magazines",
                    ["otherExpenses"]   = "Other expenses",
                    ["phone"]           = "Phone",
                    ["carInsurance"]    = "Car insurance",
                    ["flight"]          = "Flight",
                    ["dentist"]         = "Dentist",
                    ["hairdresser"]     = "Hairdresser",
                    ["pet"]             = "Pet",
                    ["charity"]         = "Charity",
                    ["salary"]          = "Salary",
                    ["mealVoucher"]     = "Meal voucher",
                    ["freelance"]       = "Freelance",
                    ["overtime"]        = "Overtime",
                    ["bonus"]           = "Bonus",
                    ["yield"]           = "Yield",
                    ["dividends"]       = "Dividends",
                    ["lifeInsurance"]   = "Life insurance",
                    ["retirementIncome"] = "Retirement",
                    ["gift"]            = "Gift",
                    ["itemSale"]        = "Item sale",
                    ["reimbursement"]   = "Reimbursement",
                    ["otherIncome"]     = "Other income",
                    // Account
                    ["wallet"]          = "Wallet",
                },
            };

        private static Dictionary<string, string> GetLocale(string? preferredLanguage)
        {
            var locale = preferredLanguage ?? "en-US";
            return _labels.TryGetValue(locale, out var map) ? map : _labels["en-US"];
        }

        public static (string CategoryName, string Color, (string SubName, string Emoji)[] Subs)[] GetCategories(string? preferredLanguage)
        {
            var map = GetLocale(preferredLanguage);
            return _structure
                .Select(s => (
                    map[s.Cat],
                    s.Color,
                    s.Subs.Select(k => (map[k], _emojis[k])).ToArray()
                ))
                .ToArray();
        }

        public static string GetWalletName(string? preferredLanguage)
        {
            var map = GetLocale(preferredLanguage);
            return map["wallet"];
        }
    }
}
