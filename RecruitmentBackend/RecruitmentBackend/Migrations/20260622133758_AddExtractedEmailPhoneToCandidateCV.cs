using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddExtractedEmailPhoneToCandidateCV : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExtractedEmail",
                table: "CandidateCVs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExtractedPhone",
                table: "CandidateCVs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExtractedEmail",
                table: "CandidateCVs");

            migrationBuilder.DropColumn(
                name: "ExtractedPhone",
                table: "CandidateCVs");
        }
    }
}
