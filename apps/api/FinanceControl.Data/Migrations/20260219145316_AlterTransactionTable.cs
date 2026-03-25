using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class AlterTransactionTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RecurringTransactions_SubCategories_SubcategoryId",
                table: "RecurringTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_SubCategories_SubcategoryId",
                table: "Transactions");

            migrationBuilder.RenameColumn(
                name: "SubcategoryId",
                table: "Transactions",
                newName: "SubCategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_Transactions_SubcategoryId",
                table: "Transactions",
                newName: "IX_Transactions_SubCategoryId");

            migrationBuilder.RenameColumn(
                name: "SubcategoryId",
                table: "RecurringTransactions",
                newName: "SubCategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_RecurringTransactions_SubcategoryId",
                table: "RecurringTransactions",
                newName: "IX_RecurringTransactions_SubCategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_RecurringTransactions_SubCategories_SubCategoryId",
                table: "RecurringTransactions",
                column: "SubCategoryId",
                principalTable: "SubCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_SubCategories_SubCategoryId",
                table: "Transactions",
                column: "SubCategoryId",
                principalTable: "SubCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RecurringTransactions_SubCategories_SubCategoryId",
                table: "RecurringTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_SubCategories_SubCategoryId",
                table: "Transactions");

            migrationBuilder.RenameColumn(
                name: "SubCategoryId",
                table: "Transactions",
                newName: "SubcategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_Transactions_SubCategoryId",
                table: "Transactions",
                newName: "IX_Transactions_SubcategoryId");

            migrationBuilder.RenameColumn(
                name: "SubCategoryId",
                table: "RecurringTransactions",
                newName: "SubcategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_RecurringTransactions_SubCategoryId",
                table: "RecurringTransactions",
                newName: "IX_RecurringTransactions_SubcategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_RecurringTransactions_SubCategories_SubcategoryId",
                table: "RecurringTransactions",
                column: "SubcategoryId",
                principalTable: "SubCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_SubCategories_SubcategoryId",
                table: "Transactions",
                column: "SubcategoryId",
                principalTable: "SubCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
