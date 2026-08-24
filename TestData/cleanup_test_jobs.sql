/*
   Dọn fixture tuyển dụng IT đã tạo cho khóa luận.
   Chỉ tác động JobPostings có marker [TEST-DATA-IT...
   Không xóa Applications/CV; job đã có hồ sơ được giữ lại và đóng.
   Chạy trên database local sau khi đã kiểm tra đúng connection.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @TestJobs TABLE (JobID nvarchar(450) PRIMARY KEY);

INSERT INTO @TestJobs (JobID)
SELECT JobID
FROM JobPostings
WHERE CHARINDEX('[TEST-DATA-IT', JobDescription) = 1;

UPDATE job
SET Status = 'Closed'
FROM JobPostings job
WHERE EXISTS (SELECT 1 FROM @TestJobs testJob WHERE testJob.JobID = job.JobID)
  AND EXISTS (SELECT 1 FROM Applications app WHERE app.JobID = job.JobID);

DELETE criterion
FROM JobCriteria criterion
WHERE EXISTS (SELECT 1 FROM @TestJobs testJob WHERE testJob.JobID = criterion.JobID)
  AND NOT EXISTS (SELECT 1 FROM Applications app WHERE app.JobID = criterion.JobID);

DELETE job
FROM JobPostings job
WHERE EXISTS (SELECT 1 FROM @TestJobs testJob WHERE testJob.JobID = job.JobID)
  AND NOT EXISTS (SELECT 1 FROM Applications app WHERE app.JobID = job.JobID);

SELECT
    SUM(CASE WHEN EXISTS (SELECT 1 FROM Applications app WHERE app.JobID = testJob.JobID) THEN 1 ELSE 0 END) AS RetainedWithApplications,
    SUM(CASE WHEN NOT EXISTS (SELECT 1 FROM Applications app WHERE app.JobID = testJob.JobID) THEN 1 ELSE 0 END) AS DeletedWithoutApplications
FROM @TestJobs testJob;

COMMIT TRANSACTION;
