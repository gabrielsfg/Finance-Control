using FinanceControl.Data.Data;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Tests.Helpers
{
    public static class DbContextHelper
    {
        public static ApplicationDbContext CreateInMemory(string? dbName = null)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(dbName ?? Guid.NewGuid().ToString())
                .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            return new ApplicationDbContext(options);
        }
    }
}
