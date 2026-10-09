namespace FinanceControl.Shared.Dtos.Request
{
    public class ApproveMcpAuthorizationRequestDto
    {
        /// <summary>A subset of the requested scopes the user kept checked. Null approves all of them.</summary>
        public List<string>? Scopes { get; set; }
    }
}
