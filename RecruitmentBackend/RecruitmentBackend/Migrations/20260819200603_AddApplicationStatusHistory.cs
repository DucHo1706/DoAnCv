using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationStatusHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ApplicationStatusHistories",
                columns: table => new
                {
                    ApplicationStatusHistoryID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ApplicationID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FromStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ToStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ChangedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ChangedByAccountID = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    Source = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicationStatusHistories", x => x.ApplicationStatusHistoryID);
                    table.ForeignKey(
                        name: "FK_ApplicationStatusHistories_Applications_ApplicationID",
                        column: x => x.ApplicationID,
                        principalTable: "Applications",
                        principalColumn: "ApplicationID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationStatusHistories_ApplicationID_ChangedAtUtc",
                table: "ApplicationStatusHistories",
                columns: new[] { "ApplicationID", "ChangedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationStatusHistories_ChangedAtUtc_ToStatus",
                table: "ApplicationStatusHistories",
                columns: new[] { "ChangedAtUtc", "ToStatus" });

            // Existing rows did not retain transitions. Backfill only the verifiable
            // application-created event; do not invent historical status changes.
            // AppliedAt was stored as Vietnam local time by the legacy application flow.
            migrationBuilder.Sql(@"
                INSERT INTO ApplicationStatusHistories
                    (ApplicationStatusHistoryID, ApplicationID, FromStatus, ToStatus,
                     ChangedAtUtc, ChangedByAccountID, Source)
                SELECT CONVERT(nvarchar(450), NEWID()), ApplicationID, '', 'Applied',
                       DATEADD(hour, -7, AppliedAt), NULL, 'LegacyApplicationCreated'
                FROM Applications;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApplicationStatusHistories");
        }
    }
}
