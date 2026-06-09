using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FinanceControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeparateMarketAssetsFromInvestments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InvestmentPriceHistories");

            migrationBuilder.DropIndex(
                name: "IX_Investments_UserId",
                table: "Investments");

            migrationBuilder.DropColumn(
                name: "AssetType",
                table: "Investments");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Investments");

            migrationBuilder.DropColumn(
                name: "CurrentPrice",
                table: "Investments");

            migrationBuilder.DropColumn(
                name: "LastPriceUpdate",
                table: "Investments");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Investments");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Investments");

            migrationBuilder.DropColumn(
                name: "Ticker",
                table: "Investments");

            migrationBuilder.AddColumn<int>(
                name: "MarketAssetId",
                table: "Investments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "MarketAssets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Ticker = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    AssetType = table.Column<string>(type: "text", nullable: false),
                    CurrentPrice = table.Column<long>(type: "bigint", nullable: false),
                    LastPriceUpdate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    Currency = table.Column<string>(type: "text", nullable: false, defaultValue: "BRL"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketAssets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketPriceHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MarketAssetId = table.Column<int>(type: "integer", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Price = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketPriceHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MarketPriceHistories_MarketAssets_MarketAssetId",
                        column: x => x.MarketAssetId,
                        principalTable: "MarketAssets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Investments_MarketAssetId",
                table: "Investments",
                column: "MarketAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Investments_UserId_MarketAssetId",
                table: "Investments",
                columns: new[] { "UserId", "MarketAssetId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketAssets_Ticker",
                table: "MarketAssets",
                column: "Ticker",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketPriceHistories_MarketAssetId_Date",
                table: "MarketPriceHistories",
                columns: new[] { "MarketAssetId", "Date" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Investments_MarketAssets_MarketAssetId",
                table: "Investments",
                column: "MarketAssetId",
                principalTable: "MarketAssets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Investments_MarketAssets_MarketAssetId",
                table: "Investments");

            migrationBuilder.DropTable(
                name: "MarketPriceHistories");

            migrationBuilder.DropTable(
                name: "MarketAssets");

            migrationBuilder.DropIndex(
                name: "IX_Investments_MarketAssetId",
                table: "Investments");

            migrationBuilder.DropIndex(
                name: "IX_Investments_UserId_MarketAssetId",
                table: "Investments");

            migrationBuilder.DropColumn(
                name: "MarketAssetId",
                table: "Investments");

            migrationBuilder.AddColumn<string>(
                name: "AssetType",
                table: "Investments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Investments",
                type: "text",
                nullable: false,
                defaultValue: "BRL");

            migrationBuilder.AddColumn<long>(
                name: "CurrentPrice",
                table: "Investments",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastPriceUpdate",
                table: "Investments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Investments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Investments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Ticker",
                table: "Investments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "InvestmentPriceHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    InvestmentId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Price = table.Column<long>(type: "bigint", nullable: false),
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
                name: "IX_InvestmentPriceHistories_InvestmentId_Date",
                table: "InvestmentPriceHistories",
                columns: new[] { "InvestmentId", "Date" },
                unique: true);
        }
    }
}
