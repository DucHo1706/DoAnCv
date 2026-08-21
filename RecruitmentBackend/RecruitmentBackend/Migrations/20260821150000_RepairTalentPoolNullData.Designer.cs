using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    [DbContext(typeof(RecruitmentBackend.Data.AppDbContext))]
    [Migration("20260821150000_RepairTalentPoolNullData")]
    partial class RepairTalentPoolNullData
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
            // This migration only normalizes legacy data; it does not change the model.
        }
    }
}
