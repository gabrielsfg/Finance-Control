using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Transactions: composite indexes for analytics and dashboard queries
            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId_TransactionDate",
                table: "Transactions",
                columns: new[] { "UserId", "TransactionDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId_Type_TransactionDate",
                table: "Transactions",
                columns: new[] { "UserId", "Type", "TransactionDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId_PaymentType_TransactionDate",
                table: "Transactions",
                columns: new[] { "UserId", "PaymentType", "TransactionDate" });

            // Budgets: quick lookup of active budget per user
            migrationBuilder.CreateIndex(
                name: "IX_Budgets_UserId_IsActive",
                table: "Budgets",
                columns: new[] { "UserId", "IsActive" });

            // RecurringTransactions: job queries active rules
            migrationBuilder.CreateIndex(
                name: "IX_RecurringTransactions_IsActive_EndDate",
                table: "RecurringTransactions",
                columns: new[] { "IsActive", "EndDate" });

            // InvestmentTransactions: analytics filters by user + date + operation
            migrationBuilder.CreateIndex(
                name: "IX_InvestmentTransactions_UserId_Date_Operation",
                table: "InvestmentTransactions",
                columns: new[] { "UserId", "Date", "Operation" });

            // InvestmentDividends: passive income and dividend analytics
            migrationBuilder.CreateIndex(
                name: "IX_InvestmentDividends_UserId_PaymentDate",
                table: "InvestmentDividends",
                columns: new[] { "UserId", "PaymentDate" });

            // BudgetSubcategoryAllocations: subquery in transaction projections
            migrationBuilder.CreateIndex(
                name: "IX_BudgetSubcategoryAllocations_SubCategoryId_BudgetId",
                table: "BudgetSubcategoryAllocations",
                columns: new[] { "SubCategoryId", "BudgetId" });

            migrationBuilder.CreateIndex(
                name: "IX_BudgetSubcategoryAllocations_BudgetId_AllocationType",
                table: "BudgetSubcategoryAllocations",
                columns: new[] { "BudgetId", "AllocationType" });

            // Tags: lookup by name within user scope
            migrationBuilder.CreateIndex(
                name: "IX_Tags_UserId_Name",
                table: "Tags",
                columns: new[] { "UserId", "Name" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Transactions_UserId_TransactionDate",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_UserId_Type_TransactionDate",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_UserId_PaymentType_TransactionDate",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Budgets_UserId_IsActive",
                table: "Budgets");

            migrationBuilder.DropIndex(
                name: "IX_RecurringTransactions_IsActive_EndDate",
                table: "RecurringTransactions");

            migrationBuilder.DropIndex(
                name: "IX_InvestmentTransactions_UserId_Date_Operation",
                table: "InvestmentTransactions");

            migrationBuilder.DropIndex(
                name: "IX_InvestmentDividends_UserId_PaymentDate",
                table: "InvestmentDividends");

            migrationBuilder.DropIndex(
                name: "IX_BudgetSubcategoryAllocations_SubCategoryId_BudgetId",
                table: "BudgetSubcategoryAllocations");

            migrationBuilder.DropIndex(
                name: "IX_BudgetSubcategoryAllocations_BudgetId_AllocationType",
                table: "BudgetSubcategoryAllocations");

            migrationBuilder.DropIndex(
                name: "IX_Tags_UserId_Name",
                table: "Tags");
        }
    }
}
