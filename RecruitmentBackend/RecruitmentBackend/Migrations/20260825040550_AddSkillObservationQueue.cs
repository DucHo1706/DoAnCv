using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddSkillObservationQueue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Confidence",
                table: "CandidateCvDomains",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.CreateTable(
                name: "SkillObservations",
                columns: table => new
                {
                    SkillObservationID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SourceType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SourceEntityID = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    DisplayText = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NormalizedCandidate = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    EvidenceText = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SourceSection = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Confidence = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    ResolvedSkillID = table.Column<int>(type: "int", nullable: true),
                    ReviewNote = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FirstObservedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastObservedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkillObservations", x => x.SkillObservationID);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SkillObservations_LastObservedAtUtc",
                table: "SkillObservations",
                column: "LastObservedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_SkillObservations_SourceType_SourceEntityID_NormalizedCandidate",
                table: "SkillObservations",
                columns: new[] { "SourceType", "SourceEntityID", "NormalizedCandidate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SkillObservations_Status_NormalizedCandidate",
                table: "SkillObservations",
                columns: new[] { "Status", "NormalizedCandidate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SkillObservations");

            migrationBuilder.AlterColumn<decimal>(
                name: "Confidence",
                table: "CandidateCvDomains",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(5,2)",
                oldPrecision: 5,
                oldScale: 2);
        }
    }
}
