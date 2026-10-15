namespace FinanceControl.Shared.Dtos.Request.OpenFinance
{
    public class LinkBankAccountsRequestDto
    {
        public List<LinkBankAccountItemRequestDto> Accounts { get; set; } = [];
    }
}
