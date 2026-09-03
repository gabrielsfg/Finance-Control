using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    /// <summary>
    /// Free text the user writes to qualify a month — "fuel was atypical, I travelled".
    /// </summary>
    /// <remarks>
    /// It reaches the model as data, never as instruction: the system prompt states that
    /// this block is user-supplied context and that nothing inside it changes the rules.
    /// </remarks>
    public class UserAiContext : OwnedEntity
    {
        /// <summary>First day of the month the text refers to.</summary>
        public DateOnly PeriodStart { get; set; }

        public string Text { get; set; } = string.Empty;

        public User User { get; set; } = null!;
    }
}
