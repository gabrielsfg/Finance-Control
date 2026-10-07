using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddChatSummary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SummarizedUntilMessageId",
                table: "AiConversations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Summary",
                table: "AiConversations",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SummarizedUntilMessageId",
                table: "AiConversations");

            migrationBuilder.DropColumn(
                name: "Summary",
                table: "AiConversations");
        }
    }
}
