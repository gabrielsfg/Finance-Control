using System.Security.Cryptography;
using System.Text;

namespace FinanceControl.Services.Mcp
{
    /// <summary>
    /// Opaque credentials for the MCP server: random, prefixed by kind, stored only as
    /// SHA-256 hashes. The prefixes let the authentication handler tell a personal token
    /// from an OAuth access token without a lookup, and make a leaked token recognisable
    /// to secret scanners.
    /// </summary>
    public static class McpTokenHelper
    {
        public const string AccessTokenPrefix = "qtm_at_";
        public const string RefreshTokenPrefix = "qtm_rt_";
        public const string PersonalTokenPrefix = "qtm_pat_";
        public const string AuthorizationCodePrefix = "qtm_ac_";

        public static string NewToken(string prefix) => prefix + RandomString(32);

        /// <summary>An unguessable id for URLs, such as the consent request.</summary>
        public static string NewPublicId() => RandomString(24);

        public static string Hash(string token)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        /// <summary>PKCE S256: BASE64URL(SHA256(code_verifier)) must equal the stored challenge.</summary>
        public static bool VerifyPkce(string codeVerifier, string codeChallenge)
        {
            if (string.IsNullOrEmpty(codeVerifier) || codeVerifier.Length is < 43 or > 128)
                return false;

            var computed = Base64Url(SHA256.HashData(Encoding.ASCII.GetBytes(codeVerifier)));
            return CryptographicOperations.FixedTimeEquals(
                Encoding.ASCII.GetBytes(computed),
                Encoding.ASCII.GetBytes(codeChallenge));
        }

        private static string RandomString(int byteCount) => Base64Url(RandomNumberGenerator.GetBytes(byteCount));

        private static string Base64Url(byte[] bytes) =>
            Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }
}
