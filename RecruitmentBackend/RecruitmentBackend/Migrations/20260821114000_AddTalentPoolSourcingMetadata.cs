using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    public partial class AddTalentPoolSourcingMetadata : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.TalentPoolCandidates', 'DomainJson') IS NULL ALTER TABLE dbo.TalentPoolCandidates ADD DomainJson nvarchar(max) NOT NULL CONSTRAINT DF_TalentPoolCandidates_DomainJson DEFAULT N'[]';
IF COL_LENGTH('dbo.TalentPoolCandidates', 'TargetPositionsJson') IS NULL ALTER TABLE dbo.TalentPoolCandidates ADD TargetPositionsJson nvarchar(max) NOT NULL CONSTRAINT DF_TalentPoolCandidates_TargetPositionsJson DEFAULT N'[]';
IF COL_LENGTH('dbo.TalentPoolCandidates', 'JobLevel') IS NULL ALTER TABLE dbo.TalentPoolCandidates ADD JobLevel nvarchar(max) NULL;
IF COL_LENGTH('dbo.TalentPoolCandidates', 'SourcingPriority') IS NULL ALTER TABLE dbo.TalentPoolCandidates ADD SourcingPriority nvarchar(max) NOT NULL CONSTRAINT DF_TalentPoolCandidates_SourcingPriority DEFAULT N'Normal';
IF COL_LENGTH('dbo.TalentPoolCandidates', 'SourcingStage') IS NULL ALTER TABLE dbo.TalentPoolCandidates ADD SourcingStage nvarchar(max) NOT NULL CONSTRAINT DF_TalentPoolCandidates_SourcingStage DEFAULT N'Saved';
IF COL_LENGTH('dbo.TalentPoolCandidates', 'TagsJson') IS NULL ALTER TABLE dbo.TalentPoolCandidates ADD TagsJson nvarchar(max) NOT NULL CONSTRAINT DF_TalentPoolCandidates_TagsJson DEFAULT N'[]';
IF COL_LENGTH('dbo.TalentPoolCandidates', 'ExpectedSalary') IS NULL ALTER TABLE dbo.TalentPoolCandidates ADD ExpectedSalary decimal(18,2) NULL;
IF COL_LENGTH('dbo.TalentPoolCandidates', 'AvailableFrom') IS NULL ALTER TABLE dbo.TalentPoolCandidates ADD AvailableFrom datetime2 NULL;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn("DomainJson", "TalentPoolCandidates");
            migrationBuilder.DropColumn("TargetPositionsJson", "TalentPoolCandidates");
            migrationBuilder.DropColumn("JobLevel", "TalentPoolCandidates");
            migrationBuilder.DropColumn("SourcingPriority", "TalentPoolCandidates");
            migrationBuilder.DropColumn("SourcingStage", "TalentPoolCandidates");
            migrationBuilder.DropColumn("TagsJson", "TalentPoolCandidates");
            migrationBuilder.DropColumn("ExpectedSalary", "TalentPoolCandidates");
            migrationBuilder.DropColumn("AvailableFrom", "TalentPoolCandidates");
        }
    }
}
