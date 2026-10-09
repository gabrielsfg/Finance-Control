using System.Text.Json.Nodes;
using FinanceControl.Services.Ai;

namespace FinanceControl.Tests.Unit
{
    /// <summary>
    /// The privacy policy says CPF, e-mail, card and bank details never reach a model
    /// provider. These cases are taken from the shapes real statement lines come in.
    /// </summary>
    public class AiPayloadSanitizerTests
    {
        [Theory]
        [InlineData("PIX ENVIADO JOAO SILVA 123.456.789-00", "PIX ENVIADO JOAO SILVA [CPF]")]
        [InlineData("PIX RECEBIDO 12345678900", "PIX RECEBIDO [CPF]")]
        [InlineData("TED 12.345.678/0001-90 FORNECEDOR", "TED [CNPJ] FORNECEDOR")]
        [InlineData("PAGTO 12345678000190", "PAGTO [CNPJ]")]
        [InlineData("COMPRA CARTAO 4111 1111 1111 1111", "COMPRA CARTAO [cartão]")]
        [InlineData("COMPRA 4111-1111-1111-1111 LOJA", "COMPRA [cartão] LOJA")]
        [InlineData("contato joao.silva@gmail.com", "contato [e-mail]")]
        [InlineData("PIX CHAVE 123e4567-e89b-12d3-a456-426614174000", "PIX CHAVE [chave Pix]")]
        [InlineData("PIX (11) 98765-4321 MARIA", "PIX [telefone] MARIA")]
        [InlineData("PIX +55 11 98765-4321", "PIX [telefone]")]
        [InlineData("TRANSF AG 1234 CC 56789-0", "TRANSF [dados bancários] [dados bancários]")]
        [InlineData("deposito conta: 998877-1", "deposito [dados bancários]")]
        public void ScrubText_MasksIdentifiers(string input, string expected)
        {
            Assert.Equal(expected, AiPayloadSanitizer.ScrubText(input));
        }

        [Theory]
        [InlineData("UBER *TRIP")]
        [InlineData("IFOOD *RESTAURANTE 25/09")]
        [InlineData("NETFLIX.COM")]
        [InlineData("Parcela 3/12 MAGAZINE")]
        [InlineData("R$ 1.240,00")]
        [InlineData("2026-09-26")]
        [InlineData("PETR4")]
        public void ScrubText_LeavesOrdinaryDescriptionsAlone(string input)
        {
            Assert.Equal(input, AiPayloadSanitizer.ScrubText(input));
        }

        [Fact]
        public void SanitizeJson_RemovesIdentityPropertiesAtAnyDepth()
        {
            const string json = """
                {
                  "userId": 7,
                  "email": "a@b.com",
                  "firstName": "Ana",
                  "accounts": [
                    { "id": 1, "name": "Nubank", "accountNumber": "12345-6", "balance": 1000 }
                  ],
                  "nested": { "Cpf": "123.456.789-00", "keep": true }
                }
                """;

            var node = JsonNode.Parse(AiPayloadSanitizer.SanitizeJson(json))!.AsObject();

            Assert.False(node.ContainsKey("userId"));
            Assert.False(node.ContainsKey("email"));
            Assert.Equal("Ana", node["firstName"]!.GetValue<string>());

            var account = node["accounts"]![0]!.AsObject();
            Assert.False(account.ContainsKey("accountNumber"));
            Assert.Equal("Nubank", account["name"]!.GetValue<string>());
            Assert.Equal(1000, account["balance"]!.GetValue<int>());

            var nested = node["nested"]!.AsObject();
            Assert.False(nested.ContainsKey("Cpf"));
            Assert.True(nested["keep"]!.GetValue<bool>());
        }

        [Fact]
        public void SanitizeJson_ScrubsStringValues()
        {
            const string json = """{ "description": "PIX 123.456.789-00", "value": 5000 }""";

            var node = JsonNode.Parse(AiPayloadSanitizer.SanitizeJson(json))!.AsObject();

            Assert.Equal("PIX [CPF]", node["description"]!.GetValue<string>());
            Assert.Equal(5000, node["value"]!.GetValue<int>());
        }

        [Fact]
        public void Serialize_SanitizesObjects()
        {
            var json = AiPayloadSanitizer.Serialize(new { Email = "x@y.com", Description = "joao@x.com" });

            Assert.DoesNotContain("x@y.com", json);
            Assert.DoesNotContain("joao@x.com", json);
            Assert.Contains("[e-mail]", json);
        }
    }
}
