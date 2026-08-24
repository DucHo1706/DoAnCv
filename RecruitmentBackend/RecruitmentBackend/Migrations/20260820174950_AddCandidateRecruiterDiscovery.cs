using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddCandidateRecruiterDiscovery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "RecruiterContactAllowed",
                table: "Candidates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RecruiterDiscoveryEnabled",
                table: "Candidates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "RecruiterDiscoveryExpiresAt",
                table: "Candidates",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RecruiterDiscoveryUpdatedAt",
                table: "Candidates",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RecruiterContactAllowed",
                table: "Candidates");

            migrationBuilder.DropColumn(
                name: "RecruiterDiscoveryEnabled",
                table: "Candidates");

            migrationBuilder.DropColumn(
                name: "RecruiterDiscoveryExpiresAt",
                table: "Candidates");

            migrationBuilder.DropColumn(
                name: "RecruiterDiscoveryUpdatedAt",
                table: "Candidates");
        }
    }
}
