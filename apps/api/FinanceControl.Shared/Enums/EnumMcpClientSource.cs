namespace FinanceControl.Shared.Enums
{
    /// How an MCP client became known: Dynamic Client Registration (RFC 7591), or a
    /// Client ID Metadata Document whose https URL is the client_id itself.
    public enum EnumMcpClientSource
    {
        Registered,
        MetadataDocument
    }
}
