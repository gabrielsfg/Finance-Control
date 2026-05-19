using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FinanceControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class GoalTransferSeed_AccountServiceFixes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GoalCheckpoints");

            migrationBuilder.AddColumn<int>(
                name: "DestinationAccountId",
                table: "Transactions",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<DateOnly>(
                name: "TargetDate",
                table: "Goals",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1),
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AccountId",
                table: "Goals",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AchievedAt",
                table: "Goals",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Goals",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IncludeInNetWorth",
                table: "Goals",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TargetAssetType",
                table: "Goals",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetTicker",
                table: "Goals",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsSystem",
                table: "Accounts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_DestinationAccountId",
                table: "Transactions",
                column: "DestinationAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Goals_AccountId",
                table: "Goals",
                column: "AccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_Goals_Accounts_AccountId",
                table: "Goals",
                column: "AccountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Accounts_DestinationAccountId",
                table: "Transactions",
                column: "DestinationAccountId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Goals_Accounts_AccountId",
                table: "Goals");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Accounts_DestinationAccountId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_DestinationAccountId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Goals_AccountId",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "DestinationAccountId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "AccountId",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "AchievedAt",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "IncludeInNetWorth",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "TargetAssetType",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "TargetTicker",
                table: "Goals");

            migrationBuilder.DropColumn(
                name: "IsSystem",
                table: "Accounts");

            migrationBuilder.AlterColumn<DateOnly>(
                name: "TargetDate",
                table: "Goals",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date");

            migrationBuilder.CreateTable(
                name: "GoalCheckpoints",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GoalId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<int>(type: "integer", nullable: false),
                    RecordedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GoalCheckpoints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GoalCheckpoints_Goals_GoalId",
                        column: x => x.GoalId,
                        principalTable: "Goals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GoalCheckpoints_GoalId",
                table: "GoalCheckpoints",
                column: "GoalId");
        }
    }
}
