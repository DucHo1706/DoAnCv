using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    /// <inheritdoc />
    public partial class them_thuoc_tinh_CandidateCV : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Degree",
                table: "CandidateCVs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Major",
                table: "CandidateCVs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "University",
                table: "CandidateCVs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "YearsOfExperience",
                table: "CandidateCVs",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Degree",
                table: "CandidateCVs");

            migrationBuilder.DropColumn(
                name: "Major",
                table: "CandidateCVs");

            migrationBuilder.DropColumn(
                name: "University",
                table: "CandidateCVs");

            migrationBuilder.DropColumn(
                name: "YearsOfExperience",
                table: "CandidateCVs");
        }
    }
}
