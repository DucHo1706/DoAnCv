/*
   Chay thu cong trong SSMS sau khi chon dung database RecruitInsightAI.
   Muc dich: sua du lieu Talent Pool cu bi NULL, khong xoa ban ghi.
   Script co the chay lai an toan.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.TalentPoolCandidates', N'U') IS NULL
    THROW 51000, 'Khong tim thay bang dbo.TalentPoolCandidates. Hay chon dung database va chay migration truoc.', 1;

/* Kiem tra nhanh truoc khi sua */
SELECT
    COUNT(*) AS TotalRows,
    SUM(CASE WHEN HighestAiScore IS NULL THEN 1 ELSE 0 END) AS NullHighestAiScore,
    SUM(CASE WHEN LastUpdatedAt IS NULL THEN 1 ELSE 0 END) AS NullLastUpdatedAt,
    SUM(CASE WHEN IsActive IS NULL THEN 1 ELSE 0 END) AS NullIsActive
FROM dbo.TalentPoolCandidates;

/* Cac cot metadata sourcing */
UPDATE dbo.TalentPoolCandidates
SET DomainJson = N'[]'
WHERE DomainJson IS NULL;

UPDATE dbo.TalentPoolCandidates
SET TargetPositionsJson = N'[]'
WHERE TargetPositionsJson IS NULL;

UPDATE dbo.TalentPoolCandidates
SET SourcingPriority = N'Normal'
WHERE SourcingPriority IS NULL;

UPDATE dbo.TalentPoolCandidates
SET SourcingStage = N'Saved'
WHERE SourcingStage IS NULL;

UPDATE dbo.TalentPoolCandidates
SET TagsJson = N'[]'
WHERE TagsJson IS NULL;

/* Cac cot duoc entity materialize voi kieu khong nullable */
UPDATE dbo.TalentPoolCandidates
SET HighestAiScore = 0
WHERE HighestAiScore IS NULL;

UPDATE dbo.TalentPoolCandidates
SET LastUpdatedAt = SYSUTCDATETIME()
WHERE LastUpdatedAt IS NULL;

UPDATE dbo.TalentPoolCandidates
SET IsActive = 1
WHERE IsActive IS NULL;

/* Cac chuoi cu co the NULL, chuan hoa ve gia tri rong */
UPDATE dbo.TalentPoolCandidates
SET LatestCVID = N''
WHERE LatestCVID IS NULL;

UPDATE dbo.TalentPoolCandidates
SET FullName = N''
WHERE FullName IS NULL;

UPDATE dbo.TalentPoolCandidates
SET Email = N''
WHERE Email IS NULL;

UPDATE dbo.TalentPoolCandidates
SET Phone = N''
WHERE Phone IS NULL;

UPDATE dbo.TalentPoolCandidates
SET HighlightSkillsJson = N'[]'
WHERE HighlightSkillsJson IS NULL;

UPDATE dbo.TalentPoolCandidates
SET HighestScoreJobTitle = N''
WHERE HighestScoreJobTitle IS NULL;

UPDATE dbo.TalentPoolCandidates
SET CurrentAvailabilityStatus = N''
WHERE CurrentAvailabilityStatus IS NULL;

UPDATE dbo.TalentPoolCandidates
SET Source = N'Application'
WHERE Source IS NULL;

/* Xac nhan khong con NULL o cac cot gay loi */
SELECT
    COUNT(*) AS TotalRows,
    SUM(CASE WHEN HighestAiScore IS NULL THEN 1 ELSE 0 END) AS NullHighestAiScore,
    SUM(CASE WHEN LastUpdatedAt IS NULL THEN 1 ELSE 0 END) AS NullLastUpdatedAt,
    SUM(CASE WHEN IsActive IS NULL THEN 1 ELSE 0 END) AS NullIsActive,
    SUM(CASE WHEN DomainJson IS NULL THEN 1 ELSE 0 END) AS NullDomainJson,
    SUM(CASE WHEN TargetPositionsJson IS NULL THEN 1 ELSE 0 END) AS NullTargetPositionsJson
FROM dbo.TalentPoolCandidates;

COMMIT TRANSACTION;
