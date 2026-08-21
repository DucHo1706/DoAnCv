using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RecruitmentBackend.Data;

#nullable disable

namespace RecruitmentBackend.Migrations
{
    /// <summary>
    /// Catalog nền là dữ liệu tham chiếu đã duyệt, không phải dữ liệu huấn luyện
    /// và không nằm trong công thức Apriori/HUIM. ID âm giúp rollback chỉ xóa
    /// đúng các dòng do migration này tạo.
    /// </summary>
    [DbContext(typeof(AppDbContext))]
    [Migration("20260821220000_SeedReviewedSkillCatalog")]
    public class SeedReviewedSkillCatalog : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
UPDATE dbo.Skills
SET IsApproved = 0
WHERE LEN(LTRIM(RTRIM(ISNULL(Name, N'')))) = 0
   OR LEN(LTRIM(RTRIM(Name))) > 64
   OR Name LIKE N'%�%'
   OR Name LIKE N'%Ã%'
   OR Name LIKE N'%Â%'
   OR Name LIKE N'%áº%';

DECLARE @Catalog TABLE (Id int NOT NULL, Name nvarchar(100) NOT NULL);
INSERT INTO @Catalog (Id, Name) VALUES
(-2601001, N'C'), (-2601002, N'C++'), (-2601003, N'C#'),
(-2601004, N'.NET'), (-2601005, N'ASP.NET Core'), (-2601006, N'Entity Framework Core'),
(-2601007, N'Java'), (-2601008, N'Spring Boot'), (-2601009, N'Kotlin'),
(-2601010, N'Swift'), (-2601011, N'Python'), (-2601012, N'FastAPI'),
(-2601013, N'Django'), (-2601014, N'Flask'), (-2601015, N'JavaScript'),
(-2601016, N'TypeScript'), (-2601017, N'Node.js'), (-2601018, N'Express.js'),
(-2601019, N'React'), (-2601020, N'Next.js'), (-2601021, N'Angular'),
(-2601022, N'Vue.js'), (-2601023, N'HTML'), (-2601024, N'CSS'),
(-2601025, N'Tailwind CSS'), (-2601026, N'Bootstrap'), (-2601027, N'PHP'),
(-2601028, N'Laravel'), (-2601029, N'Go'), (-2601030, N'Rust'),
(-2601031, N'SQL'), (-2601032, N'SQL Server'), (-2601033, N'MySQL'),
(-2601034, N'PostgreSQL'), (-2601035, N'Oracle Database'), (-2601036, N'MongoDB'),
(-2601037, N'Redis'), (-2601038, N'Elasticsearch'), (-2601039, N'GraphQL'),
(-2601040, N'REST API'), (-2601041, N'Microservices'), (-2601042, N'RabbitMQ'),
(-2601043, N'Apache Kafka'), (-2601044, N'Git'), (-2601045, N'GitHub'),
(-2601046, N'GitLab'), (-2601047, N'CI/CD'), (-2601048, N'GitHub Actions'),
(-2601049, N'Jenkins'), (-2601050, N'Docker'), (-2601051, N'Kubernetes'),
(-2601052, N'Linux'), (-2601053, N'Nginx'), (-2601054, N'Terraform'),
(-2601055, N'Ansible'), (-2601056, N'AWS'), (-2601057, N'Azure'),
(-2601058, N'Google Cloud'), (-2601059, N'Networking'), (-2601060, N'TCP/IP'),
(-2601061, N'Firewall'), (-2601062, N'IAM'), (-2601063, N'SIEM'),
(-2601064, N'Cybersecurity'), (-2601065, N'Incident Response'), (-2601066, N'Observability'),
(-2601067, N'Prometheus'), (-2601068, N'Grafana'), (-2601069, N'Unit Testing'),
(-2601070, N'Integration Testing'), (-2601071, N'API Testing'), (-2601072, N'Manual Testing'),
(-2601073, N'Selenium'), (-2601074, N'Cypress'), (-2601075, N'Playwright'),
(-2601076, N'Jira'), (-2601077, N'Agile'), (-2601078, N'Scrum'),
(-2601079, N'Project Management'), (-2601080, N'Risk Management'), (-2601081, N'BPMN'),
(-2601082, N'Requirements Analysis'), (-2601083, N'Product Roadmap'), (-2601084, N'Product Analytics'),
(-2601085, N'Figma'), (-2601086, N'Design System'), (-2601087, N'User Research'),
(-2601088, N'Prototyping'), (-2601089, N'Power BI'), (-2601090, N'Tableau'),
(-2601091, N'Excel'), (-2601092, N'Pandas'), (-2601093, N'NumPy'),
(-2601094, N'Apache Spark'), (-2601095, N'Apache Airflow'), (-2601096, N'Data Warehouse'),
(-2601097, N'Data Engineering'), (-2601098, N'Data Analysis'), (-2601099, N'Statistics'),
(-2601100, N'Machine Learning'), (-2601101, N'Deep Learning'), (-2601102, N'Scikit-learn'),
(-2601103, N'TensorFlow'), (-2601104, N'PyTorch'), (-2601105, N'Computer Vision'),
(-2601106, N'Natural Language Processing'), (-2601107, N'MLOps'), (-2601108, N'Recruitment'),
(-2601109, N'Talent Acquisition'), (-2601110, N'HRIS'), (-2601111, N'Payroll'),
(-2601112, N'Labor Law'), (-2601113, N'Compensation and Benefits'), (-2601114, N'Employee Relations'),
(-2601115, N'Accounting'), (-2601116, N'Financial Reporting'), (-2601117, N'Financial Analysis'),
(-2601118, N'Audit'), (-2601119, N'Tax'), (-2601120, N'Budgeting'),
(-2601121, N'ERP'), (-2601122, N'SAP'), (-2601123, N'Digital Marketing'),
(-2601124, N'SEO'), (-2601125, N'SEM'), (-2601126, N'Content Marketing'),
(-2601127, N'Content Strategy'), (-2601128, N'Google Analytics'), (-2601129, N'Meta Ads'),
(-2601130, N'Social Media'), (-2601131, N'Branding'), (-2601132, N'Sales'),
(-2601133, N'CRM'), (-2601134, N'Customer Support'), (-2601135, N'Communication'),
(-2601136, N'Negotiation'), (-2601137, N'Event Planning'), (-2601138, N'Warehouse Management'),
(-2601139, N'Supply Chain'), (-2601140, N'Logistics');

SET IDENTITY_INSERT dbo.Skills ON;
INSERT INTO dbo.Skills (Id, Name, IsApproved)
SELECT catalog.Id, catalog.Name, 1
FROM @Catalog catalog
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.Skills currentSkill
    WHERE LOWER(LTRIM(RTRIM(currentSkill.Name))) = LOWER(LTRIM(RTRIM(catalog.Name)))
       OR currentSkill.Id = catalog.Id
);
SET IDENTITY_INSERT dbo.Skills OFF;

UPDATE currentSkill
SET IsApproved = 1
FROM dbo.Skills currentSkill
INNER JOIN @Catalog catalog
    ON LOWER(LTRIM(RTRIM(currentSkill.Name))) = LOWER(LTRIM(RTRIM(catalog.Name)));
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DELETE FROM dbo.Skills
WHERE Id BETWEEN -2601140 AND -2601001;
");
        }
    }
}
