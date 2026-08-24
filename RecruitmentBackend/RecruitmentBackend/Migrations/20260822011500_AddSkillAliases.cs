using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RecruitmentBackend.Data;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260822011500_AddSkillAliases")]
    public class AddSkillAliases : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SkillAliases",
                columns: table => new
                {
                    SkillAliasID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SkillID = table.Column<int>(type: "int", nullable: false),
                    Alias = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NormalizedAlias = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkillAliases", x => x.SkillAliasID);
                    table.ForeignKey(
                        name: "FK_SkillAliases_Skills_SkillID",
                        column: x => x.SkillID,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SkillAliases_NormalizedAlias",
                table: "SkillAliases",
                column: "NormalizedAlias",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SkillAliases_SkillID",
                table: "SkillAliases",
                column: "SkillID");

            migrationBuilder.Sql(@"
DECLARE @SeedAliases TABLE (
    CanonicalName nvarchar(100) NOT NULL,
    Alias nvarchar(100) NOT NULL,
    NormalizedAlias nvarchar(120) NOT NULL
);

INSERT INTO @SeedAliases (CanonicalName, Alias, NormalizedAlias) VALUES
(N'.NET', N'dotnet', N'dotnet'),
(N'ASP.NET Core', N'ASPNet Core', N'aspnet core'),
(N'Entity Framework Core', N'EF Core', N'ef core'),
(N'Entity Framework Core', N'EFCore', N'efcore'),
(N'JavaScript', N'JS', N'js'),
(N'JavaScript', N'ECMAScript', N'ecmascript'),
(N'TypeScript', N'TS', N'ts'),
(N'Node.js', N'NodeJS', N'nodejs'),
(N'Node.js', N'Node JS', N'node js'),
(N'Express.js', N'ExpressJS', N'expressjs'),
(N'React', N'ReactJS', N'reactjs'),
(N'React', N'React.js', N'react js'),
(N'Next.js', N'NextJS', N'nextjs'),
(N'Next.js', N'Next JS', N'next js'),
(N'Angular', N'AngularJS', N'angularjs'),
(N'Vue.js', N'VueJS', N'vuejs'),
(N'Vue.js', N'Vue JS', N'vue js'),
(N'Go', N'Golang', N'golang'),
(N'SQL Server', N'MSSQL', N'mssql'),
(N'SQL Server', N'Microsoft SQL Server', N'microsoft sql server'),
(N'SQL Server', N'MS SQL Server', N'ms sql server'),
(N'PostgreSQL', N'Postgres', N'postgres'),
(N'MongoDB', N'Mongo', N'mongo'),
(N'Elasticsearch', N'Elastic Search', N'elastic search'),
(N'REST API', N'RESTful API', N'restful api'),
(N'REST API', N'RESTful Web Service', N'restful web service'),
(N'Apache Kafka', N'Kafka', N'kafka'),
(N'Apache Spark', N'Spark', N'spark'),
(N'Apache Airflow', N'Airflow', N'airflow'),
(N'CI/CD', N'CICD', N'cicd'),
(N'GitHub Actions', N'GH Actions', N'gh actions'),
(N'Kubernetes', N'K8s', N'k8s'),
(N'AWS', N'Amazon Web Services', N'amazon web services'),
(N'Azure', N'Microsoft Azure', N'microsoft azure'),
(N'Google Cloud', N'GCP', N'gcp'),
(N'Google Cloud', N'Google Cloud Platform', N'google cloud platform'),
(N'Terraform', N'HashiCorp Terraform', N'hashicorp terraform'),
(N'Power BI', N'PowerBI', N'powerbi'),
(N'Scikit-learn', N'sklearn', N'sklearn'),
(N'Machine Learning', N'ML', N'ml'),
(N'Deep Learning', N'DL', N'dl'),
(N'Natural Language Processing', N'NLP', N'nlp'),
(N'MLOps', N'ML Ops', N'ml ops'),
(N'Unit Testing', N'Unit Tests', N'unit tests'),
(N'Integration Testing', N'Integration Tests', N'integration tests'),
(N'API Testing', N'API Tests', N'api tests'),
(N'SEO', N'Search Engine Optimization', N'search engine optimization'),
(N'SEM', N'Search Engine Marketing', N'search engine marketing'),
(N'Google Analytics', N'GA4', N'ga4'),
(N'Meta Ads', N'Facebook Ads', N'facebook ads'),
(N'Meta Ads', N'FB Ads', N'fb ads'),
(N'CRM', N'Customer Relationship Management', N'customer relationship management'),
(N'ERP', N'Enterprise Resource Planning', N'enterprise resource planning'),
(N'HRIS', N'Human Resources Information System', N'human resources information system'),
(N'SIEM', N'Security Information and Event Management', N'security information and event management'),
(N'IAM', N'Identity and Access Management', N'identity and access management'),
(N'Warehouse Management', N'WMS', N'wms'),
(N'Supply Chain', N'SCM', N'scm');

;WITH CanonicalSkills AS (
    SELECT Id, Name,
           ROW_NUMBER() OVER (PARTITION BY LOWER(LTRIM(RTRIM(Name))) ORDER BY IsApproved DESC, Id) AS RowOrder
    FROM dbo.Skills
    WHERE IsApproved = 1
)
INSERT INTO dbo.SkillAliases (SkillID, Alias, NormalizedAlias)
SELECT skill.Id, seed.Alias, seed.NormalizedAlias
FROM @SeedAliases seed
INNER JOIN CanonicalSkills skill
    ON LOWER(LTRIM(RTRIM(skill.Name))) = LOWER(LTRIM(RTRIM(seed.CanonicalName)))
   AND skill.RowOrder = 1
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.SkillAliases currentAlias
    WHERE currentAlias.NormalizedAlias = seed.NormalizedAlias
);
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "SkillAliases");
        }
    }
}
