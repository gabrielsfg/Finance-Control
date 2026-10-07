using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FinanceControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAiAssistantAndMcp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AiEnabled",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AlterColumn<string>(
                name: "Kind",
                table: "AiGenerationLogs",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30);

            migrationBuilder.AddColumn<string>(
                name: "Feature",
                table: "AiGenerationLogs",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "SpendingInsight");

            migrationBuilder.CreateTable(
                name: "AiConversations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    LastMessageAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiConversations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiConversations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "McpAccessLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GrantId = table.Column<int>(type: "integer", nullable: true),
                    PersonalTokenId = table.Column<int>(type: "integer", nullable: true),
                    ToolName = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    IsError = table.Column<bool>(type: "boolean", nullable: false),
                    DurationMs = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_McpAccessLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_McpAccessLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "McpAuthorizationRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PublicId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ClientId = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RedirectUri = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CodeChallenge = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Scopes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    State = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Resource = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_McpAuthorizationRequests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "McpClients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClientId = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ClientName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    ClientUri = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RedirectUris = table.Column<string>(type: "jsonb", nullable: false),
                    Source = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    MetadataFetchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_McpClients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "McpGrants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClientId = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ClientName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    RedirectUri = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Scopes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CodeHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CodeChallenge = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    CodeExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AccessTokenHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    AccessTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RefreshTokenHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    RefreshTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_McpGrants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_McpGrants_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "McpPersonalTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    TokenHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Prefix = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Scopes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_McpPersonalTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_McpPersonalTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AiMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ConversationId = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    ToolCalls = table.Column<string>(type: "jsonb", nullable: true),
                    InputTokens = table.Column<int>(type: "integer", nullable: false),
                    OutputTokens = table.Column<int>(type: "integer", nullable: false),
                    IsError = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiMessages_AiConversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "AiConversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AiPendingActions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ConversationId = table.Column<int>(type: "integer", nullable: false),
                    MessageId = table.Column<int>(type: "integer", nullable: true),
                    Kind = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Payload = table.Column<string>(type: "jsonb", nullable: false),
                    TargetId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResultId = table.Column<int>(type: "integer", nullable: true),
                    Error = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiPendingActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiPendingActions_AiConversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "AiConversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiGenerationLogs_UserId_Feature_CreatedAt",
                table: "AiGenerationLogs",
                columns: new[] { "UserId", "Feature", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AiConversations_UserId_LastMessageAt",
                table: "AiConversations",
                columns: new[] { "UserId", "LastMessageAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AiMessages_ConversationId_CreatedAt",
                table: "AiMessages",
                columns: new[] { "ConversationId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AiPendingActions_ConversationId_MessageId",
                table: "AiPendingActions",
                columns: new[] { "ConversationId", "MessageId" });

            migrationBuilder.CreateIndex(
                name: "IX_McpAccessLogs_UserId_CreatedAt",
                table: "McpAccessLogs",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_McpAuthorizationRequests_PublicId",
                table: "McpAuthorizationRequests",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_McpClients_ClientId",
                table: "McpClients",
                column: "ClientId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_McpGrants_AccessTokenHash",
                table: "McpGrants",
                column: "AccessTokenHash");

            migrationBuilder.CreateIndex(
                name: "IX_McpGrants_CodeHash",
                table: "McpGrants",
                column: "CodeHash");

            migrationBuilder.CreateIndex(
                name: "IX_McpGrants_RefreshTokenHash",
                table: "McpGrants",
                column: "RefreshTokenHash");

            migrationBuilder.CreateIndex(
                name: "IX_McpGrants_UserId",
                table: "McpGrants",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_McpPersonalTokens_TokenHash",
                table: "McpPersonalTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_McpPersonalTokens_UserId",
                table: "McpPersonalTokens",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiMessages");

            migrationBuilder.DropTable(
                name: "AiPendingActions");

            migrationBuilder.DropTable(
                name: "McpAccessLogs");

            migrationBuilder.DropTable(
                name: "McpAuthorizationRequests");

            migrationBuilder.DropTable(
                name: "McpClients");

            migrationBuilder.DropTable(
                name: "McpGrants");

            migrationBuilder.DropTable(
                name: "McpPersonalTokens");

            migrationBuilder.DropTable(
                name: "AiConversations");

            migrationBuilder.DropIndex(
                name: "IX_AiGenerationLogs_UserId_Feature_CreatedAt",
                table: "AiGenerationLogs");

            migrationBuilder.DropColumn(
                name: "AiEnabled",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Feature",
                table: "AiGenerationLogs");

            migrationBuilder.AlterColumn<string>(
                name: "Kind",
                table: "AiGenerationLogs",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldNullable: true);
        }
    }
}
