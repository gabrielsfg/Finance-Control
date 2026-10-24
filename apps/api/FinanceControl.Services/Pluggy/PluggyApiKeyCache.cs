namespace FinanceControl.Services.Pluggy
{
    /// <summary>
    /// Holds the Pluggy API key between calls. Singleton: the typed client is created per
    /// request, but the key is valid for two hours and POST /auth is rate limited, so it
    /// must outlive any one request.
    /// </summary>
    public class PluggyApiKeyCache
    {
        // Pluggy keys last 2h; renewing ten minutes early keeps a long sync from crossing expiry.
        private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(110);

        private readonly SemaphoreSlim _lock = new(1, 1);
        private string? _apiKey;
        private DateTime _expiresAt;

        public async Task<string?> GetAsync(Func<Task<string?>> fetch, CancellationToken cancellationToken)
        {
            if (_apiKey is not null && DateTime.UtcNow < _expiresAt)
                return _apiKey;

            await _lock.WaitAsync(cancellationToken);
            try
            {
                // Another caller may have renewed it while this one waited.
                if (_apiKey is not null && DateTime.UtcNow < _expiresAt)
                    return _apiKey;

                var apiKey = await fetch();
                if (apiKey is not null)
                {
                    _apiKey = apiKey;
                    _expiresAt = DateTime.UtcNow + Lifetime;
                }
                return apiKey;
            }
            finally
            {
                _lock.Release();
            }
        }

        public void Invalidate(string apiKey)
        {
            // Only the key that failed: a concurrent caller may already hold a fresh one.
            if (_apiKey == apiKey)
                _apiKey = null;
        }
    }
}
