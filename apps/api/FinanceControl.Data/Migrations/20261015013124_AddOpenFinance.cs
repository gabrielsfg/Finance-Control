using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FinanceControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOpenFinance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Plan",
                table: "Users");

            migrationBuilder.AddColumn<Guid>(
                name: "ExternalRef",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalCounterpartId",
                table: "Transactions",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalId",
                table: "Transactions",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ExternalModified",
                table: "Transactions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ExternalProviderId",
                table: "Transactions",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "NeedsReview",
                table: "Transactions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PossibleDuplicate",
                table: "Transactions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "Transactions",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Manual");

            migrationBuilder.AddColumn<int>(
                name: "OwnerUserId",
                table: "MarketAssets",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AsaasWebhookEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    EventType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Payload = table.Column<string>(type: "jsonb", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    NextAttemptAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastError = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AsaasWebhookEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BankConnections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ItemId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ConnectorId = table.Column<int>(type: "integer", nullable: false),
                    ConnectorName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    ConnectorImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ConnectorPrimaryColor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ExecutionStatus = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    LastErrorCode = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    LastErrorMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NextAutoSyncAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConsentExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastManualSyncAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DisconnectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankConnections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BankConnections_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BillingEmailLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Key = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingEmailLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillingEmailLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BillingProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AsaasCustomerId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CpfHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    CardTokenCipher = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    CardBrand = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    CardLast4 = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: true),
                    TrialConsumedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CardFailureCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CardFailureWindowStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillingProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "IgnoredExternalTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExternalId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IgnoredExternalTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IgnoredExternalTransactions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PluggyWebhookEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    EventType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ItemId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Payload = table.Column<string>(type: "jsonb", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    NextAttemptAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastError = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PluggyWebhookEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Subscriptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Plan = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Cycle = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BillingMethod = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    InstallmentCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    Price = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    EndReason = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    TrialEndsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CurrentPeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CurrentPeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CanceledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PendingPlan = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    PendingCycle = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    PendingInstallmentCount = table.Column<int>(type: "integer", nullable: true),
                    IsComplimentary = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Subscriptions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BankConnectionAccounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BankConnectionId = table.Column<int>(type: "integer", nullable: false),
                    ExternalAccountId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ExternalType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ExternalSubtype = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Number = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    AccountId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ImportFromDate = table.Column<DateOnly>(type: "date", nullable: true),
                    InitialImportCompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExternalBalance = table.Column<int>(type: "integer", nullable: true),
                    ExternalBalanceAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExternalCreditLimit = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankConnectionAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BankConnectionAccounts_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BankConnectionAccounts_BankConnections_BankConnectionId",
                        column: x => x.BankConnectionId,
                        principalTable: "BankConnections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BankConnectionAccounts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BankConnectionInvestments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BankConnectionId = table.Column<int>(type: "integer", nullable: false),
                    ExternalInvestmentId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    ExternalType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ExternalSubtype = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    InvestmentId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Balance = table.Column<long>(type: "bigint", nullable: true),
                    AmountOriginal = table.Column<long>(type: "bigint", nullable: true),
                    Quantity = table.Column<decimal>(type: "numeric(28,10)", precision: 28, scale: 10, nullable: true),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankConnectionInvestments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BankConnectionInvestments_BankConnections_BankConnectionId",
                        column: x => x.BankConnectionId,
                        principalTable: "BankConnections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BankConnectionInvestments_Investments_InvestmentId",
                        column: x => x.InvestmentId,
                        principalTable: "Investments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BankConnectionInvestments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionCharges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SubscriptionId = table.Column<int>(type: "integer", nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Plan = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Cycle = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BillingMethod = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    InstallmentCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    Amount = table.Column<int>(type: "integer", nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AsaasPaymentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    AsaasInstallmentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    InvoiceUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    BankSlipUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PixPayload = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    PixQrImage = table.Column<string>(type: "text", nullable: true),
                    PixExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConfirmedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RefundedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionCharges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SubscriptionCharges_Subscriptions_SubscriptionId",
                        column: x => x.SubscriptionId,
                        principalTable: "Subscriptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_ExternalRef",
                table: "Users",
                column: "ExternalRef",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId_ExternalId",
                table: "Transactions",
                columns: new[] { "UserId", "ExternalId" },
                unique: true,
                filter: "\"ExternalId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId_NeedsReview",
                table: "Transactions",
                columns: new[] { "UserId", "NeedsReview" },
                filter: "\"NeedsReview\"");

            migrationBuilder.CreateIndex(
                name: "IX_MarketAssets_OwnerUserId",
                table: "MarketAssets",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AsaasWebhookEvents_EventId",
                table: "AsaasWebhookEvents",
                column: "EventId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AsaasWebhookEvents_Status_CreatedAt",
                table: "AsaasWebhookEvents",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BankConnectionAccounts_AccountId",
                table: "BankConnectionAccounts",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_BankConnectionAccounts_BankConnectionId",
                table: "BankConnectionAccounts",
                column: "BankConnectionId");

            migrationBuilder.CreateIndex(
                name: "IX_BankConnectionAccounts_ExternalAccountId",
                table: "BankConnectionAccounts",
                column: "ExternalAccountId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BankConnectionAccounts_UserId",
                table: "BankConnectionAccounts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BankConnectionInvestments_BankConnectionId",
                table: "BankConnectionInvestments",
                column: "BankConnectionId");

            migrationBuilder.CreateIndex(
                name: "IX_BankConnectionInvestments_ExternalInvestmentId",
                table: "BankConnectionInvestments",
                column: "ExternalInvestmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BankConnectionInvestments_InvestmentId",
                table: "BankConnectionInvestments",
                column: "InvestmentId");

            migrationBuilder.CreateIndex(
                name: "IX_BankConnectionInvestments_UserId",
                table: "BankConnectionInvestments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BankConnections_ItemId",
                table: "BankConnections",
                column: "ItemId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BankConnections_UserId_Status",
                table: "BankConnections",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_BillingEmailLogs_Key",
                table: "BillingEmailLogs",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BillingEmailLogs_UserId",
                table: "BillingEmailLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BillingProfiles_CpfHash",
                table: "BillingProfiles",
                column: "CpfHash");

            migrationBuilder.CreateIndex(
                name: "IX_BillingProfiles_UserId",
                table: "BillingProfiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_IgnoredExternalTransactions_UserId_ExternalId",
                table: "IgnoredExternalTransactions",
                columns: new[] { "UserId", "ExternalId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PluggyWebhookEvents_EventId",
                table: "PluggyWebhookEvents",
                column: "EventId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PluggyWebhookEvents_Status_CreatedAt",
                table: "PluggyWebhookEvents",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionCharges_AsaasInstallmentId",
                table: "SubscriptionCharges",
                column: "AsaasInstallmentId");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionCharges_AsaasPaymentId",
                table: "SubscriptionCharges",
                column: "AsaasPaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionCharges_IdempotencyKey",
                table: "SubscriptionCharges",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionCharges_SubscriptionId",
                table: "SubscriptionCharges",
                column: "SubscriptionId");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionCharges_UserId",
                table: "SubscriptionCharges",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_Status_CurrentPeriodEnd",
                table: "Subscriptions",
                columns: new[] { "Status", "CurrentPeriodEnd" });

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_UserId_Live",
                table: "Subscriptions",
                column: "UserId",
                unique: true,
                filter: "\"Status\" <> 'Expired'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AsaasWebhookEvents");

            migrationBuilder.DropTable(
                name: "BankConnectionAccounts");

            migrationBuilder.DropTable(
                name: "BankConnectionInvestments");

            migrationBuilder.DropTable(
                name: "BillingEmailLogs");

            migrationBuilder.DropTable(
                name: "BillingProfiles");

            migrationBuilder.DropTable(
                name: "IgnoredExternalTransactions");

            migrationBuilder.DropTable(
                name: "PluggyWebhookEvents");

            migrationBuilder.DropTable(
                name: "SubscriptionCharges");

            migrationBuilder.DropTable(
                name: "BankConnections");

            migrationBuilder.DropTable(
                name: "Subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_Users_ExternalRef",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_UserId_ExternalId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_UserId_NeedsReview",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_MarketAssets_OwnerUserId",
                table: "MarketAssets");

            migrationBuilder.DropColumn(
                name: "ExternalRef",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ExternalCounterpartId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "ExternalId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "ExternalModified",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "ExternalProviderId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "NeedsReview",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "PossibleDuplicate",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                table: "MarketAssets");

            migrationBuilder.AddColumn<string>(
                name: "Plan",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Free");
        }
    }
}
