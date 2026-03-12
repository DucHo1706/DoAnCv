using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Models;
using System.Net;

namespace RecruitmentBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Job> Jobs { get; set; }
        public DbSet<CandidateProfile> CandidateProfiles { get; set; }
        public DbSet<Skill> Skills { get; set; }
        public DbSet<Category> Categories { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CandidateProfile>()
                .HasOne(c => c.Job)
                .WithMany(j => j.Candidates)
                .HasForeignKey(c => c.JobId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
