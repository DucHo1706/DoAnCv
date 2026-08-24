using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    public partial class RepairTalentPoolNullData : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
UPDATE dbo.TalentPoolCandidates SET DomainJson = N'[]' WHERE DomainJson IS NULL;
UPDATE dbo.TalentPoolCandidates SET TargetPositionsJson = N'[]' WHERE TargetPositionsJson IS NULL;
UPDATE dbo.TalentPoolCandidates SET SourcingPriority = N'Normal' WHERE SourcingPriority IS NULL;
UPDATE dbo.TalentPoolCandidates SET SourcingStage = N'Saved' WHERE SourcingStage IS NULL;
UPDATE dbo.TalentPoolCandidates SET TagsJson = N'[]' WHERE TagsJson IS NULL;
UPDATE dbo.TalentPoolCandidates SET HighestAiScore = 0 WHERE HighestAiScore IS NULL;
UPDATE dbo.TalentPoolCandidates SET LastUpdatedAt = SYSUTCDATETIME() WHERE LastUpdatedAt IS NULL;
UPDATE dbo.TalentPoolCandidates SET IsActive = 1 WHERE IsActive IS NULL;
UPDATE dbo.TalentPoolCandidates SET LatestCVID = N'' WHERE LatestCVID IS NULL;
UPDATE dbo.TalentPoolCandidates SET FullName = N'' WHERE FullName IS NULL;
UPDATE dbo.TalentPoolCandidates SET Email = N'' WHERE Email IS NULL;
UPDATE dbo.TalentPoolCandidates SET Phone = N'' WHERE Phone IS NULL;
UPDATE dbo.TalentPoolCandidates SET HighlightSkillsJson = N'[]' WHERE HighlightSkillsJson IS NULL;
UPDATE dbo.TalentPoolCandidates SET HighestScoreJobTitle = N'' WHERE HighestScoreJobTitle IS NULL;
UPDATE dbo.TalentPoolCandidates SET CurrentAvailabilityStatus = N'' WHERE CurrentAvailabilityStatus IS NULL;
UPDATE dbo.TalentPoolCandidates SET Source = N'Application' WHERE Source IS NULL;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Data normalization is intentionally irreversible; no rows are deleted.
        }
    }
}
