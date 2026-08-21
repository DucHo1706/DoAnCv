using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    [DbContext(typeof(RecruitmentBackend.Data.AppDbContext))]
    [Migration("20260821113000_AddCandidateCvDomains")]
    partial class AddCandidateCvDomains
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
            // The schema operation is defined in the migration Up method. The current
            // model snapshot is maintained separately and remains the source of truth.
        }
    }
}
