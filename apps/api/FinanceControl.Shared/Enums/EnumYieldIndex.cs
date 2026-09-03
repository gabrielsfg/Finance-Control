namespace FinanceControl.Shared.Enums
{
    /// <summary>
    /// What a fixed-income position earns against. Chosen by the user when registering a
    /// CDB, LCI, LCA or similar, because those assets have no quote anywhere to fetch.
    /// </summary>
    public enum EnumYieldIndex
    {
        /// <summary>A percentage of the CDI — "110% do CDI". The rate is that percentage.</summary>
        Cdi,

        /// <summary>Inflation plus a real spread — "IPCA + 6%". The rate is the annual spread.</summary>
        Ipca,

        /// <summary>A flat annual rate agreed up front — "12% ao ano". The rate is that rate.</summary>
        Prefixed
    }
}
