using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RecruitmentBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddCriterionGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CriterionGroups",
                columns: table => new
                {
                    CriterionGroupID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    EvaluationMode = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CriterionGroups", x => x.CriterionGroupID);
                });

            migrationBuilder.InsertData(
                table: "CriterionGroups",
                columns: new[] { "CriterionGroupID", "CreatedAt", "Description", "DisplayOrder", "EvaluationMode", "IsActive", "Name", "UpdatedAt" },
                values: new object[,]
                {
                    { "criterion-certification", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 50, "CERTIFICATION", true, "Chứng chỉ", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { "criterion-custom", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 80, "CUSTOM", true, "Tiêu chí riêng", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { "criterion-education", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 40, "EDUCATION", true, "Học vấn", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { "criterion-language", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 60, "LANGUAGE", true, "Ngoại ngữ", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { "criterion-location", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 70, "LOCATION_WORK_MODE", true, "Địa điểm / hình thức làm việc", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { "criterion-skill", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 10, "SKILL", true, "Kỹ năng", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { "criterion-skill-experience", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 30, "SKILL_EXPERIENCE", true, "Kinh nghiệm theo kỹ năng", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { "criterion-total-experience", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, 20, "TOTAL_EXPERIENCE", true, "Tổng kinh nghiệm liên quan", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_CriterionGroups_Name",
                table: "CriterionGroups",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CriterionGroups");
        }
    }
}
