using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FinanceControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLegalAlignmentV3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RetentionNoticeSentAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AiInsightId",
                table: "UserFeedbacks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AiMessageId",
                table: "UserFeedbacks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EarlyTerminatedAt",
                table: "Subscriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AsaasInvoiceId",
                table: "SubscriptionCharges",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvoicePdfUrl",
                table: "SubscriptionCharges",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvoiceStatus",
                table: "SubscriptionCharges",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ManualRefundPending",
                table: "SubscriptionCharges",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "RefundedAmount",
                table: "SubscriptionCharges",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AccessLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    SourcePort = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BillingRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FormerUserId = table.Column<int>(type: "integer", nullable: false),
                    AsaasCustomerId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CpfHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Plan = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Cycle = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BillingMethod = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    InstallmentCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    Amount = table.Column<int>(type: "integer", nullable: false),
                    RefundedAmount = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ConfirmedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RefundedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AsaasPaymentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    AsaasInstallmentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    AsaasInvoiceId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    InvoicePdfUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TrialUsages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CpfHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrialUsages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_CreatedAt",
                table: "AccessLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_UserId_CreatedAt",
                table: "AccessLogs",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BillingRecords_CreatedAt",
                table: "BillingRecords",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_BillingRecords_FormerUserId",
                table: "BillingRecords",
                column: "FormerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TrialUsages_CpfHash",
                table: "TrialUsages",
                column: "CpfHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccessLogs");

            migrationBuilder.DropTable(
                name: "BillingRecords");

            migrationBuilder.DropTable(
                name: "TrialUsages");

            migrationBuilder.DropColumn(
                name: "RetentionNoticeSentAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AiInsightId",
                table: "UserFeedbacks");

            migrationBuilder.DropColumn(
                name: "AiMessageId",
                table: "UserFeedbacks");

            migrationBuilder.DropColumn(
                name: "EarlyTerminatedAt",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "AsaasInvoiceId",
                table: "SubscriptionCharges");

            migrationBuilder.DropColumn(
                name: "InvoicePdfUrl",
                table: "SubscriptionCharges");

            migrationBuilder.DropColumn(
                name: "InvoiceStatus",
                table: "SubscriptionCharges");

            migrationBuilder.DropColumn(
                name: "ManualRefundPending",
                table: "SubscriptionCharges");

            migrationBuilder.DropColumn(
                name: "RefundedAmount",
                table: "SubscriptionCharges");
        }
    }
}
