using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddTalentPoolTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TalentPoolCandidates",
                columns: table => new
                {
                    TalentPoolCandidateID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CandidateID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LatestCVID = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HighlightSkillsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HighestAiScore = table.Column<int>(type: "int", nullable: false),
                    HighestScoreJobTitle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CurrentAvailabilityStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastAppliedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastUpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TalentPoolCandidates", x => x.TalentPoolCandidateID);
                });

            migrationBuilder.CreateTable(
                name: "TalentPoolInteractions",
                columns: table => new
                {
                    InteractionID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    TalentPoolCandidateID = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ApplicationID = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    JobID = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AiScore = table.Column<int>(type: "int", nullable: true),
                    StatusSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedByRecruiterID = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TalentPoolInteractions", x => x.InteractionID);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TalentPoolCandidates_CandidateID",
                table: "TalentPoolCandidates",
                column: "CandidateID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TalentPoolCandidates");

            migrationBuilder.DropTable(
                name: "TalentPoolInteractions");
        }
    }
}
