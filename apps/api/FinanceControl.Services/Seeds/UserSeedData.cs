namespace FinanceControl.Services.Seeds
{
    /// <summary>
    /// Defines the default categories, subcategories, and account to be seeded on user registration.
    /// Strings are keyed by locale ("pt-BR", "en-US"). Falls back to "en-US" for unknown locales.
    /// </summary>
    public static class UserSeedData
    {
        // (categoryKey, subcategoryKey[])
        private static readonly (string Cat, string[] Subs)[] _structure = new[]
        {
            // Expense
            ("housing",       new[] { "rent", "condoFee", "electricity", "water", "internet", "gas", "cableTV" }),
            ("food",          new[] { "grocery", "restaurant", "delivery", "bakery", "fastFood" }),
            ("transport",     new[] { "fuel", "parking", "publicTransit", "rideshare", "vehicleMaint" }),
            ("health",        new[] { "doctorVisit", "pharmacy", "gym", "healthInsurance", "labTests" }),
            ("education",     new[] { "collegeCourse", "schoolSupplies", "books", "certifications" }),
            ("entertainment", new[] { "cinemaTheater", "games", "travel", "outings", "hobbies" }),
            ("clothing",      new[] { "clothes", "shoes", "accessories" }),
            ("subscriptions", new[] { "streaming", "apps", "magazines" }),
            ("pets",          new[] { "petFood", "vet", "grooming" }),
            ("otherExpense",  new[] { "otherExpenses" }),
            // Income
            ("work",          new[] { "salary", "freelance", "overtime", "bonus" }),
            ("investments",   new[] { "yield", "dividends", "rentalIncome" }),
            ("otherIncome",   new[] { "gift", "itemSale", "reimbursement", "otherIncome" }),
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
                    ["pets"]          = "Pets",
                    ["otherExpense"]  = "Outros",
                    ["work"]          = "Trabalho",
                    ["investments"]   = "Investimentos",
                    ["otherIncome"]   = "Outras receitas",
                    // Subcategories
                    ["rent"]          = "🏠 Aluguel",
                    ["condoFee"]      = "🏢 Condomínio",
                    ["electricity"]   = "💡 Luz",
                    ["water"]         = "💧 Água",
                    ["internet"]      = "📶 Internet",
                    ["gas"]           = "🔥 Gás",
                    ["cableTV"]       = "📺 TV a cabo",
                    ["grocery"]       = "🛒 Supermercado",
                    ["restaurant"]    = "🍽️ Restaurante",
                    ["delivery"]      = "🛵 Delivery",
                    ["bakery"]        = "🥐 Padaria",
                    ["fastFood"]      = "🍔 Fast food",
                    ["fuel"]          = "⛽ Combustível",
                    ["parking"]       = "🅿️ Estacionamento",
                    ["publicTransit"] = "🚌 Transporte público",
                    ["rideshare"]     = "🚗 Uber/99",
                    ["vehicleMaint"]  = "🔧 Manutenção do veículo",
                    ["doctorVisit"]   = "🩺 Consulta médica",
                    ["pharmacy"]      = "💊 Farmácia",
                    ["gym"]           = "🏋️ Academia",
                    ["healthInsurance"] = "🏥 Plano de saúde",
                    ["labTests"]      = "🧪 Exames",
                    ["collegeCourse"] = "🎓 Faculdade/Curso",
                    ["schoolSupplies"]= "🎒 Material escolar",
                    ["books"]         = "📚 Livros",
                    ["certifications"]= "📜 Certificações",
                    ["cinemaTheater"] = "🎬 Cinema/Teatro",
                    ["games"]         = "🎮 Games",
                    ["travel"]        = "✈️ Viagens",
                    ["outings"]       = "🎡 Passeios",
                    ["hobbies"]       = "🎨 Hobbies",
                    ["clothes"]       = "👕 Roupas",
                    ["shoes"]         = "👟 Calçados",
                    ["accessories"]   = "👜 Acessórios",
                    ["streaming"]     = "📺 Streaming (Netflix/Spotify)",
                    ["apps"]          = "📱 Aplicativos",
                    ["magazines"]     = "📰 Revistas",
                    ["petFood"]       = "🐾 Ração",
                    ["vet"]           = "🐶 Veterinário",
                    ["grooming"]      = "🛁 Banho e tosa",
                    ["otherExpenses"] = "💸 Outros gastos",
                    ["salary"]        = "💼 Salário",
                    ["freelance"]     = "💻 Freela",
                    ["overtime"]      = "⏰ Hora extra",
                    ["bonus"]         = "🎁 Bônus",
                    ["yield"]         = "📈 Rendimento",
                    ["dividends"]     = "💰 Dividendos",
                    ["rentalIncome"]  = "🏠 Aluguel recebido",
                    ["gift"]          = "🎀 Presente",
                    ["itemSale"]      = "🏷️ Venda de item",
                    ["reimbursement"] = "↩️ Reembolso",
                    ["otherIncome"]   = "💵 Outras receitas",
                    // Account
                    ["wallet"]        = "Carteira",
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
                    ["pets"]          = "Pets",
                    ["otherExpense"]  = "Other",
                    ["work"]          = "Work",
                    ["investments"]   = "Investments",
                    ["otherIncome"]   = "Other income",
                    // Subcategories
                    ["rent"]          = "🏠 Rent",
                    ["condoFee"]      = "🏢 Condo fee",
                    ["electricity"]   = "💡 Electricity",
                    ["water"]         = "💧 Water",
                    ["internet"]      = "📶 Internet",
                    ["gas"]           = "🔥 Gas",
                    ["cableTV"]       = "📺 Cable TV",
                    ["grocery"]       = "🛒 Grocery",
                    ["restaurant"]    = "🍽️ Restaurant",
                    ["delivery"]      = "🛵 Delivery",
                    ["bakery"]        = "🥐 Bakery",
                    ["fastFood"]      = "🍔 Fast food",
                    ["fuel"]          = "⛽ Fuel",
                    ["parking"]       = "🅿️ Parking",
                    ["publicTransit"] = "🚌 Public transit",
                    ["rideshare"]     = "🚗 Rideshare (Uber/99)",
                    ["vehicleMaint"]  = "🔧 Vehicle maintenance",
                    ["doctorVisit"]   = "🩺 Doctor visit",
                    ["pharmacy"]      = "💊 Pharmacy",
                    ["gym"]           = "🏋️ Gym",
                    ["healthInsurance"] = "🏥 Health insurance",
                    ["labTests"]      = "🧪 Lab tests",
                    ["collegeCourse"] = "🎓 College/Course",
                    ["schoolSupplies"]= "🎒 School supplies",
                    ["books"]         = "📚 Books",
                    ["certifications"]= "📜 Certifications",
                    ["cinemaTheater"] = "🎬 Cinema/Theater",
                    ["games"]         = "🎮 Games",
                    ["travel"]        = "✈️ Travel",
                    ["outings"]       = "🎡 Outings",
                    ["hobbies"]       = "🎨 Hobbies",
                    ["clothes"]       = "👕 Clothes",
                    ["shoes"]         = "👟 Shoes",
                    ["accessories"]   = "👜 Accessories",
                    ["streaming"]     = "📺 Streaming (Netflix/Spotify)",
                    ["apps"]          = "📱 Apps",
                    ["magazines"]     = "📰 Magazines",
                    ["petFood"]       = "🐾 Pet food",
                    ["vet"]           = "🐶 Vet",
                    ["grooming"]      = "🛁 Grooming",
                    ["otherExpenses"] = "💸 Other expenses",
                    ["salary"]        = "💼 Salary",
                    ["freelance"]     = "💻 Freelance",
                    ["overtime"]      = "⏰ Overtime",
                    ["bonus"]         = "🎁 Bonus",
                    ["yield"]         = "📈 Yield",
                    ["dividends"]     = "💰 Dividends",
                    ["rentalIncome"]  = "🏠 Rental income",
                    ["gift"]          = "🎀 Gift",
                    ["itemSale"]      = "🏷️ Item sale",
                    ["reimbursement"] = "↩️ Reimbursement",
                    ["otherIncome"]   = "💵 Other income",
                    // Account
                    ["wallet"]        = "Wallet",
                },
            };

        private static Dictionary<string, string> GetLocale(string? preferredLanguage)
        {
            var locale = preferredLanguage ?? "en-US";
            return _labels.TryGetValue(locale, out var map) ? map : _labels["en-US"];
        }

        public static (string CategoryName, string[] SubcategoryNames)[] GetCategories(string? preferredLanguage)
        {
            var map = GetLocale(preferredLanguage);
            return _structure
                .Select(s => (map[s.Cat], s.Subs.Select(k => map[k]).ToArray()))
                .ToArray();
        }

        public static string GetWalletName(string? preferredLanguage)
        {
            var map = GetLocale(preferredLanguage);
            return map["wallet"];
        }
    }
}
