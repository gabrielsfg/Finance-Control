using System.Text.Json;

namespace FinanceControl.Shared.Dtos.Request
{
    public class ConfirmAiActionRequestDto
    {
        /// <summary>
        /// The proposal as the user edited it on the card, in the same shape as the action's
        /// payload. Null confirms the proposal unchanged. Either way it goes through the
        /// regular validators before anything is written.
        /// </summary>
        public JsonElement? Payload { get; set; }
    }
}
