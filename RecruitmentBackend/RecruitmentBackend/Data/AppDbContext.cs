using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // 1. Module Account
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Candidate> Candidates { get; set; }
        public DbSet<Recruiter> Recruiters { get; set; }
        public DbSet<RecruiterBranch> RecruiterBranches { get; set; }

        // 2. Module System
        public DbSet<Branch> Branches { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<JobLevel> JobLevels { get; set; }
        public DbSet<Position> Positions { get; set; }
        public DbSet<Skill> Skills { get; set; }
        public DbSet<SkillAlias> SkillAliases { get; set; }
        public DbSet<SkillObservation> SkillObservations { get; set; }

        // 3. Module Recruitment
        public DbSet<JobPosting> JobPostings { get; set; }
        public DbSet<CandidateCV> CandidateCVs { get; set; }
        public DbSet<CandidateCvDomain> CandidateCvDomains { get; set; }
        public DbSet<CvBuilderDocument> CvBuilderDocuments { get; set; }
        public DbSet<Application> Applications { get; set; }
        public DbSet<AiEvaluationTask> AiEvaluationTasks { get; set; }
        public DbSet<ApplicationStatusHistory> ApplicationStatusHistories { get; set; }
        public DbSet<AIEvaluation> AIEvaluations { get; set; }
        public DbSet<JobCriterion> JobCriteria { get; set; }
        public DbSet<CriterionGroup> CriterionGroups { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<TalentPoolCandidate> TalentPoolCandidates { get; set; }
        public DbSet<TalentPoolInteraction> TalentPoolInteractions { get; set; }
        public DbSet<InterviewSchedule> InterviewSchedules { get; set; }
        public DbSet<EmailLog> EmailLogs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<SavedJob> SavedJobs { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Role> Roles { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cấu hình Khóa chính phức hợp (Composite Key) cho bảng trung gian HR - Chi Nhánh
            modelBuilder.Entity<RecruiterBranch>()
                .HasKey(rb => new { rb.RecruiterID, rb.BranchID });

            // Liên kết 1-1 giữa Application và AIEvaluation
            modelBuilder.Entity<Application>()
                .HasOne(a => a.AIEvaluation)
                .WithOne()
                .HasForeignKey<AIEvaluation>(ai => ai.ApplicationID)
                .OnDelete(DeleteBehavior.Cascade); // Nếu xóa đơn ứng tuyển thì tự động xóa luôn kết quả đánh giá AI

            modelBuilder.Entity<Application>()
                .HasOne(application => application.AiEvaluationTask)
                .WithOne(task => task.Application)
                .HasForeignKey<AiEvaluationTask>(task => task.ApplicationID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<AiEvaluationTask>()
                .HasIndex(task => task.ApplicationID)
                .IsUnique();
            modelBuilder.Entity<AiEvaluationTask>()
                .HasIndex(task => new { task.Status, task.NotBeforeUtc });
            modelBuilder.Entity<CandidateCV>()
                .HasIndex(cv => cv.ContentHash);

            modelBuilder.Entity<CandidateCvDomain>()
                .HasIndex(x => new { x.CVID, x.Domain })
                .IsUnique();

            modelBuilder.Entity<CandidateCvDomain>()
                .Property(x => x.Confidence)
                .HasPrecision(5, 2);

            modelBuilder.Entity<TalentPoolCandidate>()
                .Property(x => x.ExpectedSalary)
                .HasPrecision(18, 2);

            modelBuilder.Entity<CandidateCvDomain>()
                .HasOne(x => x.CandidateCV)
                .WithMany()
                .HasForeignKey(x => x.CVID)
                .OnDelete(DeleteBehavior.Cascade);

            // Liên kết 1-1 giữa Application và InterviewSchedule
            modelBuilder.Entity<Application>()
                .HasOne(a => a.InterviewSchedule)
                .WithOne(isched => isched.Application)
                .HasForeignKey<InterviewSchedule>(isched => isched.ApplicationID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Category>()
                .HasOne(c => c.ParentCategory)
                .WithMany(c => c.SubCategories)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<JobLevel>()
                .HasOne(l => l.ParentLevel)
                .WithMany(l => l.SubLevels)
                .HasForeignKey(l => l.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TalentPoolCandidate>()
                .HasIndex(talentPoolCandidate => talentPoolCandidate.CandidateID)
                .IsUnique(false);
            modelBuilder.Entity<TalentPoolCandidate>()
                .HasIndex(talentPoolCandidate => new { talentPoolCandidate.RecruiterID, talentPoolCandidate.CandidateID })
                .IsUnique()
                .HasFilter("[RecruiterID] IS NOT NULL");

            // Tạo Index tối ưu hóa truy vấn tìm kiếm/lọc thống kê (Performance Optimization)
            modelBuilder.Entity<JobPosting>()
                .HasIndex(j => j.Status);
            modelBuilder.Entity<CriterionGroup>()
                .HasIndex(group => group.Name)
                .IsUnique();
            modelBuilder.Entity<CriterionGroup>().HasData(
                new CriterionGroup { CriterionGroupID = "criterion-skill", Name = "Kỹ năng", EvaluationMode = "SKILL", DisplayOrder = 10, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) },
                new CriterionGroup { CriterionGroupID = "criterion-total-experience", Name = "Tổng kinh nghiệm liên quan", EvaluationMode = "TOTAL_EXPERIENCE", DisplayOrder = 20, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) },
                new CriterionGroup { CriterionGroupID = "criterion-skill-experience", Name = "Kinh nghiệm theo kỹ năng", EvaluationMode = "SKILL_EXPERIENCE", DisplayOrder = 30, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) },
                new CriterionGroup { CriterionGroupID = "criterion-education", Name = "Học vấn", EvaluationMode = "EDUCATION", DisplayOrder = 40, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) },
                new CriterionGroup { CriterionGroupID = "criterion-certification", Name = "Chứng chỉ", EvaluationMode = "CERTIFICATION", DisplayOrder = 50, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) },
                new CriterionGroup { CriterionGroupID = "criterion-language", Name = "Ngoại ngữ", EvaluationMode = "LANGUAGE", DisplayOrder = 60, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) },
                new CriterionGroup { CriterionGroupID = "criterion-location", Name = "Địa điểm / hình thức làm việc", EvaluationMode = "LOCATION_WORK_MODE", DisplayOrder = 70, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) },
                new CriterionGroup { CriterionGroupID = "criterion-custom", Name = "Tiêu chí riêng", EvaluationMode = "CUSTOM", DisplayOrder = 80, CreatedAt = new DateTime(2026, 1, 1), UpdatedAt = new DateTime(2026, 1, 1) }
            );
            modelBuilder.Entity<JobPosting>()
                .HasIndex(j => j.CreatedAt);
            modelBuilder.Entity<JobPosting>()
                .Property(j => j.RecruiterID)
                .HasMaxLength(450);
            modelBuilder.Entity<JobPosting>()
                .Property(j => j.BranchID)
                .HasMaxLength(450);
            modelBuilder.Entity<JobPosting>()
                .Property(j => j.PositionID)
                .HasMaxLength(450);
            modelBuilder.Entity<JobPosting>()
                .HasIndex(j => j.RecruiterID);
            modelBuilder.Entity<JobPosting>()
                .HasIndex(j => j.BranchID);

            modelBuilder.Entity<Application>()
                .HasIndex(a => a.AppliedAt);

            modelBuilder.Entity<ApplicationStatusHistory>()
                .HasOne(history => history.Application)
                .WithMany(application => application.StatusHistory)
                .HasForeignKey(history => history.ApplicationID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ApplicationStatusHistory>()
                .HasIndex(history => new { history.ApplicationID, history.ChangedAtUtc });
            modelBuilder.Entity<ApplicationStatusHistory>()
                .HasIndex(history => new { history.ChangedAtUtc, history.ToStatus });

            modelBuilder.Entity<CvBuilderDocument>()
                .HasIndex(document => new { document.CandidateID, document.UpdatedAt });
            modelBuilder.Entity<CvBuilderDocument>()
                .Property(document => document.ContentJson)
                .HasColumnType("nvarchar(max)");
            modelBuilder.Entity<CvBuilderDocument>()
                .Property(document => document.SettingsJson)
                .HasColumnType("nvarchar(max)");

            modelBuilder.Entity<AuditLog>()
                .HasIndex(al => al.CreatedAt);

            // Cấu hình Kiểu Dữ liệu Decimal Precision chuẩn cho SQL Server / PostgreSQL
            modelBuilder.Entity<AIEvaluation>()
                .Property(e => e.FitScore)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<AIEvaluation>()
                .Property(e => e.WhiteboxScore)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<AIEvaluation>()
                .Property(e => e.BlackboxScore)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<JobPosting>()
                .Property(j => j.SalaryMin)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<JobPosting>()
                .Property(j => j.SalaryMax)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<JobPosting>()
                .HasOne(job => job.RepostedFromJob)
                .WithMany(job => job.RepostedJobs)
                .HasForeignKey(job => job.RepostedFromJobID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SkillAlias>()
                .HasOne(alias => alias.Skill)
                .WithMany(skill => skill.Aliases)
                .HasForeignKey(alias => alias.SkillID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<SkillAlias>()
                .HasIndex(alias => alias.NormalizedAlias)
                .IsUnique();
            modelBuilder.Entity<SkillAlias>()
                .HasIndex(alias => alias.SkillID);

            modelBuilder.Entity<SkillObservation>()
                .Property(observation => observation.Confidence)
                .HasPrecision(5, 2);
            modelBuilder.Entity<SkillObservation>()
                .HasIndex(observation => new
                {
                    observation.SourceType,
                    observation.SourceEntityID,
                    observation.NormalizedCandidate
                })
                .IsUnique();
            modelBuilder.Entity<SkillObservation>()
                .HasIndex(observation => new { observation.Status, observation.NormalizedCandidate });
            modelBuilder.Entity<SkillObservation>()
                .HasIndex(observation => observation.LastObservedAtUtc);

            modelBuilder.Entity<JobPosting>()
                .HasIndex(job => new { job.CampaignGroupID, job.RecruitmentRound })
                .IsUnique()
                .HasFilter("[CampaignGroupID] IS NOT NULL");

            // Seed 3 vai trò mặc định (giữ nguyên dữ liệu như bản in-memory cũ)
            var seedCreatedAt = new DateTime(2026, 1, 1);
            modelBuilder.Entity<Role>().HasData(
                new Role
                {
                    RoleID = "1",
                    Name = "Admin",
                    Description = "Quản trị viên toàn quyền hệ thống tuyển dụng & AI",
                    PermissionsRaw = "manage_users,approve_jobs,publish_close_jobs,manage_roles,view_audit_logs,manage_branches,view_reports,train_ai_models",
                    CreatedAt = seedCreatedAt
                },
                new Role
                {
                    RoleID = "2",
                    Name = "Recruiter",
                    Description = "Nhà tuyển dụng (Trưởng phòng / Chuyên viên HR)",
                    PermissionsRaw = "create_jobs,publish_close_jobs,view_candidates,view_ai_scores,send_interview_emails,manage_talent_pool",
                    CreatedAt = seedCreatedAt
                },
                new Role
                {
                    RoleID = "3",
                    Name = "Candidate",
                    Description = "Ứng viên tìm việc & nộp hồ sơ CV",
                    PermissionsRaw = "apply_jobs,view_jobs,manage_profile,use_chatbot",
                    CreatedAt = seedCreatedAt
                }
            );
        }
    }
}
