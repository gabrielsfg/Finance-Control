using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Billing
{
    /// <summary>The two secrets of the billing data: the CPF hash and the card token cipher.</summary>
    /// <remarks>
    /// The keys come from configuration rather than ASP.NET Data Protection on purpose:
    /// Data Protection keys live on the container's disk by default and vanish on redeploy,
    /// which here would silently destroy every stored card token.
    /// </remarks>
    public class BillingSecrets
    {
        private const int NonceSize = 12;
        private const int TagSize = 16;

        private readonly BillingSettings _settings;

        public BillingSecrets(IOptions<BillingSettings> settings)
        {
            _settings = settings.Value;
        }

        /// HMAC-SHA256 of the digits. Deterministic, so it can be looked up, and keyed, so a
        /// leaked table cannot be reversed by hashing all ~10⁹ possible CPFs.
        public string HashCpf(string normalizedCpf)
        {
            var key = Encoding.UTF8.GetBytes(RequireKey(_settings.CpfHashKey, "BillingSettings:CpfHashKey"));
            var hash = HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(normalizedCpf));
            return Convert.ToHexString(hash);
        }

        /// AES-GCM; the output is base64(nonce | tag | ciphertext).
        public string ProtectCardToken(string token)
        {
            var key = GetCardKey();
            var plaintext = Encoding.UTF8.GetBytes(token);
            var nonce = RandomNumberGenerator.GetBytes(NonceSize);
            var tag = new byte[TagSize];
            var ciphertext = new byte[plaintext.Length];

            using (var aes = new AesGcm(key, TagSize))
                aes.Encrypt(nonce, plaintext, ciphertext, tag);

            return Convert.ToBase64String([.. nonce, .. tag, .. ciphertext]);
        }

        public string UnprotectCardToken(string protectedToken)
        {
            var key = GetCardKey();
            var data = Convert.FromBase64String(protectedToken);
            var nonce = data.AsSpan(0, NonceSize);
            var tag = data.AsSpan(NonceSize, TagSize);
            var ciphertext = data.AsSpan(NonceSize + TagSize);
            var plaintext = new byte[ciphertext.Length];

            using (var aes = new AesGcm(key, TagSize))
                aes.Decrypt(nonce, ciphertext, tag, plaintext);

            return Encoding.UTF8.GetString(plaintext);
        }

        private byte[] GetCardKey()
        {
            var key = Convert.FromBase64String(RequireKey(_settings.CardTokenKey, "BillingSettings:CardTokenKey"));
            if (key.Length != 32)
                throw new InvalidOperationException("BillingSettings:CardTokenKey must be the base64 of 32 bytes.");
            return key;
        }

        // Failing loudly beats hashing with an empty key: an empty HMAC key still "works",
        // and every hash made with it would have to be thrown away later.
        private static string RequireKey(string value, string name) =>
            string.IsNullOrWhiteSpace(value)
                ? throw new InvalidOperationException($"{name} is not configured.")
                : value;
    }
}
