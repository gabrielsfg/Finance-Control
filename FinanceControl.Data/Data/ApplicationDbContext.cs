using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FinanceControl.Shared.Helpers;

namespace FinanceControl.Data.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Budget> Budgets { get; set; } 

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
            var entries = ChangeTracker .Entries<BaseEntity>();
            var dateTimeBrasilia = TimeZoneInfo
                .ConvertTimeFromUtc(
                    DateTime.UtcNow,
                    TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time")
                );

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                    entry.Property("CreatedAt").CurrentValue = dateTimeBrasilia;
                else if (entry.State == EntityState.Modified)
                    entry.Property("UpdatedAt").CurrentValue = dateTimeBrasilia;
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }
    }
}
