namespace FinanceControl.Services.Pluggy
{
    /// <summary>
    /// Pluggy's transaction category (English description, e.g. "Food delivery") → the key
    /// of one of our default subcategories (see UserSeedData).
    /// </summary>
    /// <remarks>
    /// Matched by description rather than by Pluggy's numeric id: the descriptions are
    /// readable, so a wrong rule is easy to spot, and the specific entries are listed before
    /// the broad ones ("Food delivery" before "Food"). Only a fallback — the user's own
    /// history decides first, and a category is null when Pluggy's enrichment is not part
    /// of the plan.
    /// </remarks>
    public static class PluggyCategoryMap
    {
        private static readonly (string Fragment, string SubCategoryKey)[] Rules =
        [
            // Income
            ("salary", "salary"),
            ("retirement", "retirementIncome"),
            ("pension", "retirementIncome"),
            ("dividends", "dividends"),
            ("proceeds", "yield"),
            ("cashback", "reimbursement"),
            ("refund", "reimbursement"),

            // Housing
            ("rent", "rent"),
            ("electricity", "electricity"),
            ("water", "water"),
            ("gas stations", "fuel"),
            ("gas station", "fuel"),
            ("gas", "gas"),
            ("internet", "internet"),
            ("mobile", "phone"),
            ("telecommunications", "phone"),
            ("tv", "cableTV"),

            // Food
            ("food delivery", "delivery"),
            ("groceries", "grocery"),
            ("supermarket", "grocery"),
            ("eating out", "restaurant"),
            ("food and drinks", "restaurant"),

            // Transport
            ("taxi", "rideshare"),
            ("ride", "rideshare"),
            ("public transportation", "publicTransit"),
            ("parking", "parking"),
            ("vehicle maintenance", "vehicleMaint"),
            ("vehicle insurance", "carInsurance"),
            ("airport", "flight"),
            ("airline", "flight"),

            // Health
            ("pharmacy", "pharmacy"),
            ("dentist", "dentist"),
            ("health insurance", "healthInsurance"),
            ("hospital", "doctorVisit"),
            ("clinic", "doctorVisit"),
            ("gym", "gym"),
            ("fitness", "gym"),

            // Education
            ("university", "collegeCourse"),
            ("online courses", "collegeCourse"),
            ("school", "collegeCourse"),
            ("bookstore", "books"),

            // Leisure and shopping
            ("video streaming", "streaming"),
            ("music streaming", "streaming"),
            ("gaming", "games"),
            ("cinema", "cinemaTheater"),
            ("theater", "cinemaTheater"),
            ("concerts", "shows"),
            ("travel", "travel"),
            ("accomodation", "travel"),
            ("accommodation", "travel"),
            ("clothing", "clothes"),
            ("pet", "pet"),
            ("donations", "charity"),
            ("life insurance", "lifeInsurance"),
            ("digital services", "apps"),
        ];

        public static string? Resolve(string? pluggyCategory)
        {
            if (string.IsNullOrWhiteSpace(pluggyCategory))
                return null;

            var text = pluggyCategory.ToLowerInvariant();
            foreach (var (fragment, key) in Rules)
            {
                if (ContainsWord(text, fragment))
                    return key;
            }
            return null;
        }

        // Whole words only: "tv" must not match inside another word.
        private static bool ContainsWord(string text, string fragment)
        {
            var index = 0;
            while ((index = text.IndexOf(fragment, index, StringComparison.Ordinal)) >= 0)
            {
                var before = index == 0 || !char.IsLetter(text[index - 1]);
                var afterIndex = index + fragment.Length;
                var after = afterIndex >= text.Length || !char.IsLetter(text[afterIndex]);
                if (before && after)
                    return true;
                index = afterIndex;
            }
            return false;
        }
    }
}
