using System.Net;
using System.Text;
using System.Text.Json;

namespace FinanceControl.Tests.Helpers
{
    /// <summary>
    /// Stands in for the Pluggy API: authenticates anyone, answers by method and path (query
    /// ignored unless a route reads it), and records every call.
    /// </summary>
    public sealed class FakePluggyHandler : HttpMessageHandler
    {
        private readonly Dictionary<string, Func<HttpRequestMessage, HttpResponseMessage>> _routes = new();

        public List<(HttpMethod Method, string Path, string Query)> Calls { get; } = [];

        /// Transactions served by GET v2/transactions, per Pluggy account id.
        public Dictionary<string, List<object>> Transactions { get; } = new();

        public FakePluggyHandler()
        {
            On(HttpMethod.Post, "auth", HttpStatusCode.OK, new { apiKey = "test-api-key" });
            _routes[$"{HttpMethod.Get} v2/transactions"] = request =>
            {
                var query = System.Web.HttpUtility.ParseQueryString(request.RequestUri!.Query);
                var accountId = query["accountId"] ?? string.Empty;
                var ids = query["ids"]?.Split(',').ToHashSet();
                var rows = Transactions.GetValueOrDefault(accountId) ?? [];
                if (ids is not null)
                    rows = rows.Where(r => ids.Contains(JsonSerializer.SerializeToElement(r).GetProperty("id").GetString()!)).ToList();
                return Json(HttpStatusCode.OK, new { results = rows, next = (string?)null });
            };
        }

        public FakePluggyHandler On(HttpMethod method, string path, HttpStatusCode status, object body)
        {
            _routes[$"{method} {path}"] = _ => Json(status, body);
            return this;
        }

        public int CountOf(HttpMethod method, string path) =>
            Calls.Count(c => c.Method == method && c.Path == path);

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var path = request.RequestUri!.AbsolutePath.TrimStart('/');
            Calls.Add((request.Method, path, request.RequestUri.Query));

            return Task.FromResult(_routes.TryGetValue($"{request.Method} {path}", out var respond)
                ? respond(request)
                : Json(HttpStatusCode.NotFound, new { code = 404, message = "no route" }));
        }

        private static HttpResponseMessage Json(HttpStatusCode status, object body) => new(status)
        {
            Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
        };
    }
}
