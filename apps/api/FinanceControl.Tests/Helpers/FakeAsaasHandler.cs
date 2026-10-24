using System.Net;
using System.Text;

namespace FinanceControl.Tests.Helpers
{
    /// <summary>
    /// Stands in for the Asaas API: answers by method and path, and records every call so a
    /// test can assert what was (and was not) sent.
    /// </summary>
    public sealed class FakeAsaasHandler : HttpMessageHandler
    {
        private readonly Dictionary<string, Func<HttpResponseMessage>> _routes = new();

        public List<(HttpMethod Method, string Path, string? Body)> Calls { get; } = [];

        public FakeAsaasHandler()
        {
            On(HttpMethod.Post, "customers", HttpStatusCode.OK, """{"id":"cus_test"}""");
            On(HttpMethod.Put, "customers/cus_test", HttpStatusCode.OK, """{"id":"cus_test"}""");
            On(HttpMethod.Post, "creditCard/tokenizeCreditCard", HttpStatusCode.OK,
                """{"creditCardToken":"tok_123","creditCardBrand":"VISA","creditCardNumber":"4242"}""");
            On(HttpMethod.Post, "payments", HttpStatusCode.OK,
                """{"id":"pay_1","status":"CONFIRMED","value":34.99,"invoiceUrl":"https://asaas.test/i/pay_1"}""");
        }

        public FakeAsaasHandler On(HttpMethod method, string path, HttpStatusCode status, string json)
        {
            _routes[$"{method} {path}"] = () => new HttpResponseMessage(status)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            return this;
        }

        public FakeAsaasHandler Throws(HttpMethod method, string path)
        {
            _routes[$"{method} {path}"] = () => throw new HttpRequestException("connection reset");
            return this;
        }

        public int CountOf(HttpMethod method, string path) =>
            Calls.Count(c => c.Method == method && c.Path == path);

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var path = request.RequestUri!.AbsolutePath.TrimStart('/');
            if (path.StartsWith("v3/"))
                path = path[3..];

            var body = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
            Calls.Add((request.Method, path, body));

            return _routes.TryGetValue($"{request.Method} {path}", out var respond)
                ? respond()
                : new HttpResponseMessage(HttpStatusCode.NotFound)
                {
                    Content = new StringContent("""{"errors":[{"code":"not_found","description":"no route"}]}""")
                };
        }
    }
}
