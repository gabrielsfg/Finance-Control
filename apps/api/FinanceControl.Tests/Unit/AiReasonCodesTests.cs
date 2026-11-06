using System.Net;
using FinanceControl.Services.Ai;

namespace FinanceControl.Tests.Unit
{
    /// <summary>
    /// The generation log keeps a reason for twelve months, so it may only ever hold a fixed
    /// code — never a provider message, which can echo back part of what was sent.
    /// </summary>
    public class AiReasonCodesTests
    {
        [Fact]
        public void FromException_UsesTheHttpStatus()
        {
            var exception = new HttpRequestException("rate limited", null, HttpStatusCode.TooManyRequests);

            Assert.Equal("provider_error_429", AiReasonCodes.FromException(exception));
        }

        [Fact]
        public void FromException_Timeout()
        {
            Assert.Equal(AiReasonCodes.ProviderTimeout, AiReasonCodes.FromException(new TaskCanceledException("timed out")));
        }

        [Fact]
        public void FromException_NeverCarriesTheMessage()
        {
            var code = AiReasonCodes.FromException(new InvalidOperationException("PIX JOAO SILVA 123.456.789-00"));

            Assert.Equal(AiReasonCodes.ProviderError, code);
            Assert.DoesNotContain("JOAO", code);
        }
    }
}
