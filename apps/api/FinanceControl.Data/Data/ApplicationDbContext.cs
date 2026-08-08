using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using FinanceControl.Domain.Common;

namespace FinanceControl.Data.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Budget> Budgets { get; set; } 
        public DbSet<SubCategory> SubCategories { get; set; }
        public DbSet<Area> Areas { get; set; }
        public DbSet<BudgetSubcategoryAllocation> BudgetSubcategoryAllocations { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<RecurringTransaction> RecurringTransactions { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<SecurityCode> SecurityCodes { get; set; }
        public DbSet<TrustedDevice> TrustedDevices { get; set; }
        public DbSet<UserPreferences> UserPreferences { get; set; }
        public DbSet<Goal> Goals { get; set; }
        public DbSet<MarketAsset> MarketAssets { get; set; }
        public DbSet<Investment> Investments { get; set; }
        public DbSet<InvestmentTransaction> InvestmentTransactions { get; set; }
        public DbSet<InvestmentDividend> InvestmentDividends { get; set; }
        public DbSet<MarketPriceHistory> MarketPriceHistories { get; set; }
        public DbSet<MarketPriceIntraday> MarketPriceIntradays { get; set; }
        public DbSet<MarketAssetFundamentals> MarketAssetFundamentals { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<NotificationPreference> NotificationPreferences { get; set; }
        public DbSet<AlertRule> AlertRules { get; set; }

        public override int SaveChanges()
        {
            UpdateOrCreateEntity();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateOrCreateEntity();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateOrCreateEntity()
        {
            var entries = ChangeTracker.Entries<BaseEntity>();

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                    entry.Property("CreatedAt").CurrentValue = DateTime.UtcNow;
                else if (entry.State == EntityState.Modified)
                    entry.Property("UpdatedAt").CurrentValue = DateTime.UtcNow;
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }
    }
}
