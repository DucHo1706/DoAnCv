using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RecruitmentBackend.Data;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260821233000_AddJobRepostingLifecycle")]
    public class AddJobRepostingLifecycle : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CampaignGroupID",
                table: "JobPostings",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecruitmentRound",
                table: "JobPostings",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "RepostedFromJobID",
                table: "JobPostings",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobPostings_CampaignGroupID_RecruitmentRound",
                table: "JobPostings",
                columns: new[] { "CampaignGroupID", "RecruitmentRound" },
                unique: true,
                filter: "[CampaignGroupID] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_JobPostings_RepostedFromJobID",
                table: "JobPostings",
                column: "RepostedFromJobID");

            migrationBuilder.AddForeignKey(
                name: "FK_JobPostings_JobPostings_RepostedFromJobID",
                table: "JobPostings",
                column: "RepostedFromJobID",
                principalTable: "JobPostings",
                principalColumn: "JobID",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobPostings_JobPostings_RepostedFromJobID",
                table: "JobPostings");

            migrationBuilder.DropIndex(
                name: "IX_JobPostings_CampaignGroupID_RecruitmentRound",
                table: "JobPostings");

            migrationBuilder.DropIndex(
                name: "IX_JobPostings_RepostedFromJobID",
                table: "JobPostings");

            migrationBuilder.DropColumn(name: "CampaignGroupID", table: "JobPostings");
            migrationBuilder.DropColumn(name: "RecruitmentRound", table: "JobPostings");
            migrationBuilder.DropColumn(name: "RepostedFromJobID", table: "JobPostings");
        }
    }
}
