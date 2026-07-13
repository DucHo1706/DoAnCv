using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddInterviewSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InterviewSchedules",
                columns: table => new
                {
                    ScheduleID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ApplicationID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    InterviewDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Format = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LocationOrLink = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    MeetingID = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Passcode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewSchedules", x => x.ScheduleID);
                    table.ForeignKey(
                        name: "FK_InterviewSchedules_Applications_ApplicationID",
                        column: x => x.ApplicationID,
                        principalTable: "Applications",
                        principalColumn: "ApplicationID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InterviewSchedules_ApplicationID",
                table: "InterviewSchedules",
                column: "ApplicationID",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InterviewSchedules");
        }
    }
}
