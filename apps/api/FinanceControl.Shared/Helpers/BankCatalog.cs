namespace FinanceControl.Shared.Helpers
{
    /// <summary>
    /// The banks, brokers and meal/benefit cards the app knows by name and logo. The slug is what an account stores and
    /// what the clients use to find the logo file (web: <c>public/banks/{slug}.png</c> or <c>.svg</c>).
    /// The web keeps the same list in <c>lib/config/banks.ts</c>; change both together.
    /// </summary>
    public static class BankCatalog
    {
        public sealed record Bank(string Slug, string Name, string[] Contains, string[] Exact);

        public static readonly IReadOnlyList<Bank> Banks =
        [
            new("nubank", "Nubank", ["nubank", "nupagamentos", "nuconta", "nuinvest", "nufinanceira"], ["nu"]),
            new("itau", "Itaú", ["itau"], []),
            new("bradesco", "Bradesco", ["bradesco"], []),
            new("santander", "Santander", ["santander"], []),
            new("banco-do-brasil", "Banco do Brasil", ["bancodobrasil"], ["bb"]),
            new("caixa", "Caixa", ["caixaeconomica"], ["caixa"]),
            new("inter", "Inter", ["bancointer", "intermedium", "interpag"], ["inter"]),
            new("c6", "C6 Bank", ["c6bank", "bancoc6"], ["c6"]),
            new("btg", "BTG Pactual", ["btgpactual", "bancobtg"], ["btg"]),
            new("xp", "XP", ["xpinvestimentos", "bancoxp"], ["xp"]),
            new("picpay", "PicPay", ["picpay"], []),
            new("mercado-pago", "Mercado Pago", ["mercadopago"], []),
            new("pagbank", "PagBank", ["pagbank", "pagseguro"], []),
            new("neon", "Neon", ["banconeon", "neonpagamentos"], ["neon"]),
            new("sicoob", "Sicoob", ["sicoob", "bancoob"], []),
            new("sicredi", "Sicredi", ["sicredi"], []),
            new("banrisul", "Banrisul", ["banrisul"], []),
            new("safra", "Safra", ["safra"], []),
            new("original", "Banco Original", ["bancooriginal"], ["original"]),
            new("pan", "Banco Pan", ["bancopan"], ["pan"]),
            new("bv", "BV", ["bancobv", "bvfinanceira", "votorantim"], ["bv"]),
            new("will", "Will Bank", ["willbank"], []),
            new("next", "Next", ["nextbank", "banconext"], ["next"]),
            new("digio", "Digio", ["digio"], []),
            new("agibank", "Agibank", ["agibank", "agiplan"], []),
            new("porto", "Porto Bank", ["portobank", "portoseguro"], []),
            new("nomad", "Nomad", ["nomad"], []),
            new("rico", "Rico", ["ricoinvestimentos"], ["rico"]),
            new("cora", "Cora", ["corascd", "coradigital"], ["cora"]),
            new("stone", "Stone", ["stonepagamentos", "stoneinstituicao", "bancostone"], ["stone"]),
            new("infinitepay", "InfinitePay", ["infinitepay", "cloudwalk"], []),
            new("bmg", "Banco BMG", ["bancobmg"], ["bmg"]),
            new("mercantil", "Banco Mercantil", ["bancomercantil", "mercantildobrasil"], ["mercantil"]),
            new("brb", "BRB", ["bancodebrasilia", "brbbanco"], ["brb"]),
            new("banestes", "Banestes", ["banestes"], []),
            new("daycoval", "Daycoval", ["daycoval"], []),
            new("sofisa", "Sofisa Direto", ["sofisa"], []),
            new("bs2", "Banco BS2", ["bancobs2"], ["bs2"]),
            new("unicred", "Unicred", ["unicred"], []),
            new("cresol", "Cresol", ["cresol"], []),
            new("clear", "Clear Corretora", ["clearcorretora", "clearinvestimentos"], ["clear"]),
            new("toro", "Toro Investimentos", ["toroinvestimentos", "torocorretora"], ["toro"]),
            new("genial", "Genial Investimentos", ["genialinvestimentos", "bancogenial"], ["genial"]),
            new("agora", "Ágora Investimentos", ["agorainvestimentos", "agoracorretora"], ["agora"]),
            new("avenue", "Avenue", ["avenuesecurities", "avenueinvestimentos"], ["avenue"]),
            new("warren", "Warren", ["warreninvestimentos", "warrenbrasil"], ["warren"]),
            new("orama", "Órama", ["oramainvestimentos", "oramadtvm"], ["orama"]),
            new("modal", "Modal", ["modalmais", "bancomodal"], ["modal"]),
            new("guide", "Guide Investimentos", ["guideinvestimentos"], ["guide"]),
            new("necton", "Necton", ["necton"], []),
            new("ativa", "Ativa Investimentos", ["ativainvestimentos"], ["ativa"]),
            new("mirae", "Mirae Asset", ["miraeasset"], ["mirae"]),
            new("caju", "Caju", ["cajubeneficios", "cajuapp"], ["caju"]),
            new("flash", "Flash", ["flashbeneficios", "flashapp", "flashtecnologia"], ["flash"]),
            new("ifood-beneficios", "iFood Benefícios", ["ifoodbeneficio", "ifoodcard"], []),
            new("alelo", "Alelo", ["alelo"], []),
            new("pluxee", "Pluxee (Sodexo)", ["pluxee", "sodexo"], []),
            new("ticket", "Ticket", ["ticketalimentacao", "ticketrefeicao", "ticketservicos", "edenred"], ["ticket"]),
            new("vr", "VR Benefícios", ["vrbeneficios", "vralimentacao", "vrrefeicao"], ["vr"]),
            new("swile", "Swile", ["swile"], []),
        ];

        public static bool IsKnown(string? slug) =>
            slug is not null && Banks.Any(b => b.Slug == slug);

        public static Bank? Find(string? slug) =>
            slug is null ? null : Banks.FirstOrDefault(b => b.Slug == slug);

        /// <summary>
        /// The bank a free-text name refers to ("Nu Pagamentos S.A.", "Itaú Unibanco"),
        /// or null. Short aliases only match the whole name, so "Inter" never matches
        /// "Internacional".
        /// </summary>
        public static Bank? Match(string? text)
        {
            var key = TextNormalization.ToComparisonKey(text);
            if (key.Length == 0)
                return null;

            return Banks.FirstOrDefault(b => b.Exact.Contains(key))
                ?? Banks.FirstOrDefault(b => b.Contains.Any(key.Contains));
        }

        /// <summary>First bank recognized among several names, in order.</summary>
        public static Bank? MatchAny(IEnumerable<string?> texts)
        {
            foreach (var text in texts)
                if (Match(text) is { } bank)
                    return bank;
            return null;
        }
    }
}
