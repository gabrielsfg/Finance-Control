namespace FinanceControl.Services.Ai.Tools
{
    /// <summary>
    /// A tool refused its input. The message goes back to the model as an error result so
    /// it can correct the call, so it is written for the model to read.
    /// </summary>
    public class AiToolException : Exception
    {
        public AiToolException(string message) : base(message)
        {
        }
    }
}
