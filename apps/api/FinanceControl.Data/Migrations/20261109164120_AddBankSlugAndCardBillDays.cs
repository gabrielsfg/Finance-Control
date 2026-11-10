using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBankSlugAndCardBillDays : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BankSlug",
                table: "BankConnections",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExternalBillClosingDay",
                table: "BankConnectionAccounts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExternalBillDueDay",
                table: "BankConnectionAccounts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankSlug",
                table: "Accounts",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BankSlug",
                table: "BankConnections");

            migrationBuilder.DropColumn(
                name: "ExternalBillClosingDay",
                table: "BankConnectionAccounts");

            migrationBuilder.DropColumn(
                name: "ExternalBillDueDay",
                table: "BankConnectionAccounts");

            migrationBuilder.DropColumn(
                name: "BankSlug",
                table: "Accounts");
        }
    }
}
