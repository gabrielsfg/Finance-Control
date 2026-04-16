using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class ConvertTimestampsToUtc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Accounts
            migrationBuilder.Sql(@"ALTER TABLE ""Accounts"" ALTER COLUMN ""CreatedAt"" TYPE timestamp with time zone USING ""CreatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""Accounts"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp with time zone USING ""UpdatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""Accounts"" ALTER COLUMN ""CreatedAt"" SET DEFAULT now()");

            // Areas
            migrationBuilder.Sql(@"ALTER TABLE ""Areas"" ALTER COLUMN ""CreatedAt"" TYPE timestamp with time zone USING ""CreatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""Areas"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp with time zone USING ""UpdatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""Areas"" ALTER COLUMN ""CreatedAt"" SET DEFAULT now()");

            // AreaCategories
            migrationBuilder.Sql(@"ALTER TABLE ""AreaCategories"" ALTER COLUMN ""CreatedAt"" TYPE timestamp with time zone USING ""CreatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""AreaCategories"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp with time zone USING ""UpdatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""AreaCategories"" ALTER COLUMN ""CreatedAt"" SET DEFAULT now()");

            // Budgets
            migrationBuilder.Sql(@"ALTER TABLE ""Budgets"" ALTER COLUMN ""CreatedAt"" TYPE timestamp with time zone USING ""CreatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""Budgets"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp with time zone USING ""UpdatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""Budgets"" ALTER COLUMN ""CreatedAt"" SET DEFAULT now()");

            // BudgetSubcategoryAllocations
            migrationBuilder.Sql(@"ALTER TABLE ""BudgetSubcategoryAllocations"" ALTER COLUMN ""CreatedAt"" TYPE timestamp with time zone USING ""CreatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""BudgetSubcategoryAllocations"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp with time zone USING ""UpdatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""BudgetSubcategoryAllocations"" ALTER COLUMN ""CreatedAt"" SET DEFAULT now()");

            // Categories
            migrationBuilder.Sql(@"ALTER TABLE ""Categories"" ALTER COLUMN ""CreatedAt"" TYPE timestamp with time zone USING ""CreatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""Categories"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp with time zone USING ""UpdatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""Categories"" ALTER COLUMN ""CreatedAt"" SET DEFAULT now()");

            // RecurringTransactions
            migrationBuilder.Sql(@"ALTER TABLE ""RecurringTransactions"" ALTER COLUMN ""CreatedAt"" TYPE timestamp with time zone USING ""CreatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""RecurringTransactions"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp with time zone USING ""UpdatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""RecurringTransactions"" ALTER COLUMN ""CreatedAt"" SET DEFAULT now()");

            // RefreshTokens
            migrationBuilder.Sql(@"ALTER TABLE ""RefreshTokens"" ALTER COLUMN ""CreatedAt"" TYPE timestamp with time zone USING ""CreatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""RefreshTokens"" ALTER COLUMN ""ExpiresAt"" TYPE timestamp with time zone USING ""ExpiresAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""RefreshTokens"" ALTER COLUMN ""CreatedAt"" SET DEFAULT now()");

            // SubCategories
            migrationBuilder.Sql(@"ALTER TABLE ""SubCategories"" ALTER COLUMN ""CreatedAt"" TYPE timestamp with time zone USING ""CreatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""SubCategories"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp with time zone USING ""UpdatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""SubCategories"" ALTER COLUMN ""CreatedAt"" SET DEFAULT now()");

            // Transactions
            migrationBuilder.Sql(@"ALTER TABLE ""Transactions"" ALTER COLUMN ""CreatedAt"" TYPE timestamp with time zone USING ""CreatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""Transactions"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp with time zone USING ""UpdatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""Transactions"" ALTER COLUMN ""CreatedAt"" SET DEFAULT now()");

            // Users
            migrationBuilder.Sql(@"ALTER TABLE ""Users"" ALTER COLUMN ""CreatedAt"" TYPE timestamp with time zone USING ""CreatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""Users"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp with time zone USING ""UpdatedAt"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""Users"" ALTER COLUMN ""LockoutEnd"" TYPE timestamp with time zone USING ""LockoutEnd"" AT TIME ZONE 'America/Sao_Paulo'");
            migrationBuilder.Sql(@"ALTER TABLE ""Users"" ALTER COLUMN ""CreatedAt"" SET DEFAULT now()");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Accounts
            migrationBuilder.Sql(@"ALTER TABLE ""Accounts"" ALTER COLUMN ""CreatedAt"" TYPE timestamp without time zone USING ""CreatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""Accounts"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp without time zone USING ""UpdatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""Accounts"" ALTER COLUMN ""CreatedAt"" SET DEFAULT timezone('America/Sao_Paulo', now())");

            // Areas
            migrationBuilder.Sql(@"ALTER TABLE ""Areas"" ALTER COLUMN ""CreatedAt"" TYPE timestamp without time zone USING ""CreatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""Areas"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp without time zone USING ""UpdatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""Areas"" ALTER COLUMN ""CreatedAt"" SET DEFAULT timezone('America/Sao_Paulo', now())");

            // AreaCategories
            migrationBuilder.Sql(@"ALTER TABLE ""AreaCategories"" ALTER COLUMN ""CreatedAt"" TYPE timestamp without time zone USING ""CreatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""AreaCategories"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp without time zone USING ""UpdatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""AreaCategories"" ALTER COLUMN ""CreatedAt"" SET DEFAULT timezone('America/Sao_Paulo', now())");

            // Budgets
            migrationBuilder.Sql(@"ALTER TABLE ""Budgets"" ALTER COLUMN ""CreatedAt"" TYPE timestamp without time zone USING ""CreatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""Budgets"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp without time zone USING ""UpdatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""Budgets"" ALTER COLUMN ""CreatedAt"" SET DEFAULT timezone('America/Sao_Paulo', now())");

            // BudgetSubcategoryAllocations
            migrationBuilder.Sql(@"ALTER TABLE ""BudgetSubcategoryAllocations"" ALTER COLUMN ""CreatedAt"" TYPE timestamp without time zone USING ""CreatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""BudgetSubcategoryAllocations"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp without time zone USING ""UpdatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""BudgetSubcategoryAllocations"" ALTER COLUMN ""CreatedAt"" SET DEFAULT timezone('America/Sao_Paulo', now())");

            // Categories
            migrationBuilder.Sql(@"ALTER TABLE ""Categories"" ALTER COLUMN ""CreatedAt"" TYPE timestamp without time zone USING ""CreatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""Categories"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp without time zone USING ""UpdatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""Categories"" ALTER COLUMN ""CreatedAt"" SET DEFAULT timezone('America/Sao_Paulo', now())");

            // RecurringTransactions
            migrationBuilder.Sql(@"ALTER TABLE ""RecurringTransactions"" ALTER COLUMN ""CreatedAt"" TYPE timestamp without time zone USING ""CreatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""RecurringTransactions"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp without time zone USING ""UpdatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""RecurringTransactions"" ALTER COLUMN ""CreatedAt"" SET DEFAULT timezone('America/Sao_Paulo', now())");

            // RefreshTokens
            migrationBuilder.Sql(@"ALTER TABLE ""RefreshTokens"" ALTER COLUMN ""CreatedAt"" TYPE timestamp without time zone USING ""CreatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""RefreshTokens"" ALTER COLUMN ""ExpiresAt"" TYPE timestamp without time zone USING ""ExpiresAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""RefreshTokens"" ALTER COLUMN ""CreatedAt"" SET DEFAULT timezone('America/Sao_Paulo', now())");

            // SubCategories
            migrationBuilder.Sql(@"ALTER TABLE ""SubCategories"" ALTER COLUMN ""CreatedAt"" TYPE timestamp without time zone USING ""CreatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""SubCategories"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp without time zone USING ""UpdatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""SubCategories"" ALTER COLUMN ""CreatedAt"" SET DEFAULT timezone('America/Sao_Paulo', now())");

            // Transactions
            migrationBuilder.Sql(@"ALTER TABLE ""Transactions"" ALTER COLUMN ""CreatedAt"" TYPE timestamp without time zone USING ""CreatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""Transactions"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp without time zone USING ""UpdatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""Transactions"" ALTER COLUMN ""CreatedAt"" SET DEFAULT timezone('America/Sao_Paulo', now())");

            // Users
            migrationBuilder.Sql(@"ALTER TABLE ""Users"" ALTER COLUMN ""CreatedAt"" TYPE timestamp without time zone USING ""CreatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""Users"" ALTER COLUMN ""UpdatedAt"" TYPE timestamp without time zone USING ""UpdatedAt"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""Users"" ALTER COLUMN ""LockoutEnd"" TYPE timestamp without time zone USING ""LockoutEnd"" AT TIME ZONE 'UTC'");
            migrationBuilder.Sql(@"ALTER TABLE ""Users"" ALTER COLUMN ""CreatedAt"" SET DEFAULT timezone('America/Sao_Paulo', now())");
        }
    }
}
