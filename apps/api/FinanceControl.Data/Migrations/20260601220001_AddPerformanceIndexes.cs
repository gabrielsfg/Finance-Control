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
            migrationBuilder.DropForeignKey(
                name: "FK_InvestmentTransactions_Transactions_LinkedTransactionId",
                table: "InvestmentTransactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_UserId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Tags_UserId",
                table: "Tags");

            migrationBuilder.DropIndex(
                name: "IX_InvestmentDividends_UserId",
                table: "InvestmentDividends");

            migrationBuilder.DropIndex(
                name: "IX_BudgetSubcategoryAllocations_BudgetId",
                table: "BudgetSubcategoryAllocations");

            migrationBuilder.DropIndex(
                name: "IX_BudgetSubcategoryAllocations_SubCategoryId",
                table: "BudgetSubcategoryAllocations");

            migrationBuilder.DropIndex(
                name: "IX_Budgets_UserId",
                table: "Budgets");

            migrationBuilder.AddForeignKey(
                name: "FK_InvestmentTransactions_Transactions_LinkedTransactionId",
                table: "InvestmentTransactions",
                column: "LinkedTransactionId",
                principalTable: "Transactions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InvestmentTransactions_Transactions_LinkedTransactionId",
                table: "InvestmentTransactions");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId",
                table: "Transactions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_UserId",
                table: "Tags",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_InvestmentDividends_UserId",
                table: "InvestmentDividends",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BudgetSubcategoryAllocations_BudgetId",
                table: "BudgetSubcategoryAllocations",
                column: "BudgetId");

            migrationBuilder.CreateIndex(
                name: "IX_BudgetSubcategoryAllocations_SubCategoryId",
                table: "BudgetSubcategoryAllocations",
                column: "SubCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Budgets_UserId",
                table: "Budgets",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_InvestmentTransactions_Transactions_LinkedTransactionId",
                table: "InvestmentTransactions",
                column: "LinkedTransactionId",
                principalTable: "Transactions",
                principalColumn: "Id");
        }
    }
}
