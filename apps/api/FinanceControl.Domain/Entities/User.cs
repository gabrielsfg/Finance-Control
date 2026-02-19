using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string Name { get; set; }
        public Boolean IsActive { get; set; } = true;
    }
}
