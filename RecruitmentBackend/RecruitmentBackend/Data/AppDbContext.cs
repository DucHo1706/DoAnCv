﻿﻿using Microsoft.EntityFrameworkCore;
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

        // 3. Module Recruitment
        public DbSet<JobPosting> JobPostings { get; set; }
        public DbSet<CandidateCV> CandidateCVs { get; set; }
        public DbSet<Application> Applications { get; set; }
        public DbSet<AIEvaluation> AIEvaluations { get; set; }
        public DbSet<JobCriterion> JobCriteria { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<TalentPoolCandidate> TalentPoolCandidates { get; set; }
        public DbSet<TalentPoolInteraction> TalentPoolInteractions { get; set; }
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
        }
    }
}
