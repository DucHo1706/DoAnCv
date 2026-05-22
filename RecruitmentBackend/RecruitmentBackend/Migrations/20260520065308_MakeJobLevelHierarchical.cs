using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    /// <inheritdoc />
    public partial class MakeJobLevelHierarchical : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RankIndex",
                table: "JobLevels");

            migrationBuilder.AddColumn<string>(
                name: "ParentId",
                table: "JobLevels",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobLevels_ParentId",
                table: "JobLevels",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobLevels_JobLevels_ParentId",
                table: "JobLevels",
                column: "ParentId",
                principalTable: "JobLevels",
                principalColumn: "JobLevelID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobLevels_JobLevels_ParentId",
                table: "JobLevels");

            migrationBuilder.DropIndex(
                name: "IX_JobLevels_ParentId",
                table: "JobLevels");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "JobLevels");

            migrationBuilder.AddColumn<int>(
                name: "RankIndex",
                table: "JobLevels",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
