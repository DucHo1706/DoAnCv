using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RecruitmentBackend.Data;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260821213000_AddTalentPoolRecruiterOwnership")]
    public class AddTalentPoolRecruiterOwnership : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // SQL Server resolves column names before executing the whole batch.
            // Add the compatibility column in a separate command so the following
            // data migration can safely reference it on databases that do not yet
            // have RecruiterID.
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.TalentPoolCandidates', 'RecruiterID') IS NULL
    ALTER TABLE dbo.TalentPoolCandidates ADD RecruiterID nvarchar(450) NULL;
");

            migrationBuilder.Sql(@"
UPDATE pool
SET RecruiterID = owner.RecruiterID
FROM dbo.TalentPoolCandidates pool
OUTER APPLY (
    SELECT TOP (1) source.RecruiterID
    FROM (
        SELECT interaction.CreatedByRecruiterID AS RecruiterID, interaction.CreatedAt AS EventAt
        FROM dbo.TalentPoolInteractions interaction
        WHERE interaction.TalentPoolCandidateID = pool.TalentPoolCandidateID
          AND interaction.CreatedByRecruiterID IS NOT NULL
        UNION ALL
        SELECT job.RecruiterID, application.AppliedAt
        FROM dbo.Applications application
        INNER JOIN dbo.CandidateCVs cv ON cv.CVID = application.CVID
        INNER JOIN dbo.JobPostings job ON job.JobID = application.JobID
        WHERE cv.CandidateID = pool.CandidateID
          AND job.RecruiterID IS NOT NULL
    ) source
    ORDER BY source.EventAt DESC
) owner
WHERE pool.RecruiterID IS NULL AND owner.RecruiterID IS NOT NULL;

;WITH duplicateOwnership AS (
    SELECT TalentPoolCandidateID,
           ROW_NUMBER() OVER (
               PARTITION BY RecruiterID, CandidateID
               ORDER BY LastUpdatedAt DESC, TalentPoolCandidateID DESC
           ) AS DuplicateOrder
    FROM dbo.TalentPoolCandidates
    WHERE RecruiterID IS NOT NULL
)
UPDATE pool
SET RecruiterID = NULL
FROM dbo.TalentPoolCandidates pool
INNER JOIN duplicateOwnership duplicateRow
    ON duplicateRow.TalentPoolCandidateID = pool.TalentPoolCandidateID
WHERE duplicateRow.DuplicateOrder > 1;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TalentPoolCandidates_RecruiterID_CandidateID' AND object_id = OBJECT_ID('dbo.TalentPoolCandidates'))
    CREATE UNIQUE INDEX IX_TalentPoolCandidates_RecruiterID_CandidateID
    ON dbo.TalentPoolCandidates(RecruiterID, CandidateID)
    WHERE RecruiterID IS NOT NULL;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TalentPoolCandidates_RecruiterID_CandidateID' AND object_id = OBJECT_ID('dbo.TalentPoolCandidates'))
    DROP INDEX IX_TalentPoolCandidates_RecruiterID_CandidateID ON dbo.TalentPoolCandidates;
IF COL_LENGTH('dbo.TalentPoolCandidates', 'RecruiterID') IS NOT NULL
    ALTER TABLE dbo.TalentPoolCandidates DROP COLUMN RecruiterID;
");
        }
    }
}
