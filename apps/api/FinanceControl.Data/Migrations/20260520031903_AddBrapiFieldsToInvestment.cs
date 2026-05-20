using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FinanceControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBrapiFieldsToInvestment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InvestmentDividends_Transactions_LinkedTransactionId",
                table: "InvestmentDividends");

            migrationBuilder.DropForeignKey(
                name: "FK_Investments_Accounts_AccountId",
                table: "Investments");

            migrationBuilder.DropTable(
                name: "AreaCategories");

            migrationBuilder.DropColumn(
                name: "Date",
                table: "InvestmentDividends");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Investments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "AssetType",
                table: "Investments",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Investments",
                type: "text",
                nullable: false,
                defaultValue: "BRL");

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Investments",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "InvestmentDividends",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "InvestmentDividends",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<DateOnly>(
                name: "LastDatePrior",
                table: "InvestmentDividends",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "PaymentDate",
                table: "InvestmentDividends",
                type: "date",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "InvestmentPriceHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    InvestmentId = table.Column<int>(type: "integer", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Price = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvestmentPriceHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InvestmentPriceHistories_Investments_InvestmentId",
                        column: x => x.InvestmentId,
                        principalTable: "Investments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Investments_UserId",
                table: "Investments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_InvestmentDividends_UserId",
                table: "InvestmentDividends",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_InvestmentPriceHistories_InvestmentId_Date",
                table: "InvestmentPriceHistories",
                columns: new[] { "InvestmentId", "Date" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_InvestmentDividends_Transactions_LinkedTransactionId",
                table: "InvestmentDividends",
                column: "LinkedTransactionId",
                principalTable: "Transactions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_InvestmentDividends_Users_UserId",
                table: "InvestmentDividends",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Investments_Accounts_AccountId",
                table: "Investments",
                column: "AccountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Investments_Users_UserId",
                table: "Investments",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InvestmentDividends_Transactions_LinkedTransactionId",
                table: "InvestmentDividends");

            migrationBuilder.DropForeignKey(
                name: "FK_InvestmentDividends_Users_UserId",
                table: "InvestmentDividends");

            migrationBuilder.DropForeignKey(
                name: "FK_Investments_Accounts_AccountId",
                table: "Investments");

            migrationBuilder.DropForeignKey(
                name: "FK_Investments_Users_UserId",
                table: "Investments");

            migrationBuilder.DropTable(
                name: "InvestmentPriceHistories");

            migrationBuilder.DropIndex(
                name: "IX_Investments_UserId",
                table: "Investments");

            migrationBuilder.DropIndex(
                name: "IX_InvestmentDividends_UserId",
                table: "InvestmentDividends");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Investments");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Investments");

            migrationBuilder.DropColumn(
                name: "LastDatePrior",
                table: "InvestmentDividends");

            migrationBuilder.DropColumn(
                name: "PaymentDate",
                table: "InvestmentDividends");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Investments",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<int>(
                name: "AssetType",
                table: "Investments",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<int>(
                name: "Type",
                table: "InvestmentDividends",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "InvestmentDividends",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AddColumn<DateOnly>(
                name: "Date",
                table: "InvestmentDividends",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.CreateTable(
                name: "AreaCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AreaId = table.Column<int>(type: "integer", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AreaCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AreaCategories_Areas_AreaId",
                        column: x => x.AreaId,
                        principalTable: "Areas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AreaCategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AreaCategories_AreaId",
                table: "AreaCategories",
                column: "AreaId");

            migrationBuilder.CreateIndex(
                name: "IX_AreaCategories_CategoryId",
                table: "AreaCategories",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_InvestmentDividends_Transactions_LinkedTransactionId",
                table: "InvestmentDividends",
                column: "LinkedTransactionId",
                principalTable: "Transactions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Investments_Accounts_AccountId",
                table: "Investments",
                column: "AccountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
