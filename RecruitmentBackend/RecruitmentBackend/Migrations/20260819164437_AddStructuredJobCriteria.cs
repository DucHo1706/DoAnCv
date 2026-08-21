using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RecruitmentBackend.Data;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260819164437_AddStructuredJobCriteria")]
    public partial class AddStructuredJobCriteria : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(name: "CriterionType", table: "JobCriteria", type: "nvarchar(40)", maxLength: 40, nullable: false, defaultValue: "CUSTOM");
            migrationBuilder.AddColumn<int>(name: "DisplayOrder", table: "JobCriteria", type: "int", nullable: false, defaultValue: 0);
            migrationBuilder.AddColumn<string>(name: "EvaluationGuidance", table: "JobCriteria", type: "nvarchar(1000)", maxLength: 1000, nullable: true);
            migrationBuilder.AddColumn<string>(name: "EvidenceSources", table: "JobCriteria", type: "nvarchar(500)", maxLength: 500, nullable: false, defaultValue: "SKILLS,EXPERIENCE,PROJECTS");
            migrationBuilder.AddColumn<bool>(name: "IsActive", table: "JobCriteria", type: "bit", nullable: false, defaultValue: true);
            migrationBuilder.AddColumn<int>(name: "MinDurationMonths", table: "JobCriteria", type: "int", nullable: true);
            migrationBuilder.AddColumn<string>(name: "Operator", table: "JobCriteria", type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "EXISTS");
            migrationBuilder.AddColumn<string>(name: "PriorityLevel", table: "JobCriteria", type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PREFERRED");
            migrationBuilder.AddColumn<string>(name: "TargetValue", table: "JobCriteria", type: "nvarchar(500)", maxLength: 500, nullable: true);
            migrationBuilder.Sql("UPDATE [JobCriteria] SET [TargetValue] = [Name] WHERE [TargetValue] IS NULL OR LTRIM(RTRIM([TargetValue])) = ''");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "CriterionType", table: "JobCriteria");
            migrationBuilder.DropColumn(name: "DisplayOrder", table: "JobCriteria");
            migrationBuilder.DropColumn(name: "EvaluationGuidance", table: "JobCriteria");
            migrationBuilder.DropColumn(name: "EvidenceSources", table: "JobCriteria");
            migrationBuilder.DropColumn(name: "IsActive", table: "JobCriteria");
            migrationBuilder.DropColumn(name: "MinDurationMonths", table: "JobCriteria");
            migrationBuilder.DropColumn(name: "Operator", table: "JobCriteria");
            migrationBuilder.DropColumn(name: "PriorityLevel", table: "JobCriteria");
            migrationBuilder.DropColumn(name: "TargetValue", table: "JobCriteria");
        }
    }
}
