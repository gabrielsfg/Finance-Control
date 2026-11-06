namespace FinanceControl.Shared.Enums
{
    public enum EnumFeedbackType
    {
        /// Something is broken or behaving wrongly.
        Bug,

        /// An idea, a request, or anything the user would like to see.
        Suggestion,

        /// A report of an incorrect or inappropriate AI answer or analysis. Carries the id
        /// of the reported chat message or analysis.
        AiContent
    }
}
