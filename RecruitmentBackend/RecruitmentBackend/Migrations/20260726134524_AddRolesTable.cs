using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RecruitmentBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddRolesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    RoleID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PermissionsRaw = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.RoleID);
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "RoleID", "CreatedAt", "Description", "Name", "PermissionsRaw" },
                values: new object[,]
                {
                    { "1", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Quản trị viên toàn quyền hệ thống tuyển dụng & AI", "Admin", "manage_users,approve_jobs,publish_close_jobs,manage_roles,view_audit_logs,manage_branches,view_reports,train_ai_models" },
                    { "2", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Nhà tuyển dụng (Trưởng phòng / Chuyên viên HR)", "Recruiter", "create_jobs,publish_close_jobs,view_candidates,view_ai_scores,send_interview_emails,manage_talent_pool" },
                    { "3", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Ứng viên tìm việc & nộp hồ sơ CV", "Candidate", "apply_jobs,view_jobs,manage_profile,use_chatbot" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Roles");
        }
    }
}
