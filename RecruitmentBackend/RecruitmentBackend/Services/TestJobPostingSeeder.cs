using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;

namespace RecruitmentBackend.Services;

/// <summary>
/// Tạo dữ liệu tin tuyển dụng IT phục vụ kiểm thử local. Không tự chạy nếu
/// EnableTestJobSeed không được bật; mã bản ghi test có prefix riêng và không
/// chèn marker kỹ thuật vào nội dung mà người dùng nhìn thấy.
/// </summary>
public static class TestJobPostingSeeder
{
    private const string TestIdSuffix = "-test-it-v4";

    private static readonly (string Name, string Skill, string Description)[] PositionCatalog =
    {
        ("Backend Developer", "C#, .NET, SQL Server, REST API", "Phát triển API và dịch vụ backend cho nền tảng tuyển dụng."),
        ("Frontend Developer", "React, TypeScript, HTML, CSS", "Xây dựng giao diện web có khả năng mở rộng và truy cập tốt."),
        ("Full-stack Developer", "React, TypeScript, .NET, SQL", "Phát triển tính năng end-to-end từ giao diện đến cơ sở dữ liệu."),
        ("DevOps Engineer", "Docker, Kubernetes, CI/CD, Linux", "Tự động hóa triển khai, giám sát và vận hành hạ tầng cloud."),
        ("Cloud Engineer", "AWS, Azure, Terraform, Networking", "Thiết kế và tối ưu hạ tầng cloud an toàn, có khả năng mở rộng."),
        ("Site Reliability Engineer", "Kubernetes, SLO, Observability, Python", "Đảm bảo độ tin cậy, hiệu năng và khả năng phục hồi của hệ thống."),
        ("QA Automation Engineer", "Selenium, Cypress, API Testing, CI/CD", "Xây dựng bộ kiểm thử tự động và kiểm soát chất lượng phát hành."),
        ("Data Analyst", "SQL, Python, Power BI, Statistics", "Phân tích dữ liệu vận hành và xây dựng báo cáo hỗ trợ quyết định."),
        ("Data Engineer", "Python, Spark, Airflow, Data Warehouse", "Xây dựng pipeline dữ liệu tin cậy cho báo cáo và AI."),
        ("Machine Learning Engineer", "Python, TensorFlow, MLOps, SQL", "Đưa mô hình machine learning từ thử nghiệm lên môi trường vận hành."),
        ("Cybersecurity Engineer", "SIEM, IAM, Network Security, Incident Response", "Theo dõi, phát hiện và xử lý rủi ro an toàn thông tin."),
        ("Network Engineer", "TCP/IP, Firewall, Routing, Monitoring", "Thiết kế và vận hành mạng doanh nghiệp ổn định, bảo mật."),
        ("Business Analyst", "BPMN, SQL, Agile, Requirements", "Phân tích yêu cầu và kết nối nghiệp vụ với đội phát triển."),
        ("Product Manager", "Roadmap, Product Analytics, Agile", "Xây dựng định hướng sản phẩm dựa trên nhu cầu người dùng và dữ liệu."),
        ("UI/UX Designer", "Figma, Design System, User Research", "Thiết kế trải nghiệm nhất quán cho sản phẩm số."),
        ("Technical Project Manager", "Agile, Jira, Risk Management, Stakeholder", "Điều phối dự án công nghệ, tiến độ, rủi ro và các bên liên quan.")
    };

    private static readonly (string Token, string[] Names)[] LevelCatalog =
    {
        ("intern", new[] { "Intern", "Thực tập sinh" }),
        ("fresher", new[] { "Fresher" }),
        ("junior", new[] { "Junior" }),
        ("middle", new[] { "Middle" }),
        ("senior", new[] { "Senior" }),
        ("lead", new[] { "Team Leader", "Trưởng nhóm" })
    };

    public static async Task<int> SeedAsync(AppDbContext context)
    {
        var recruiterIds = await context.Recruiters.AsNoTracking()
            .Join(context.Accounts.AsNoTracking().Where(item => item.Role == "Recruiter" && item.Status == "Active"),
                recruiter => recruiter.AccountID,
                account => account.AccountID,
                (recruiter, _) => recruiter.RecruiterID)
            .ToListAsync();
        if (recruiterIds.Count == 0)
        {
            Console.WriteLine("[TEST-DATA] Bỏ qua seed tin IT: chưa có tài khoản HR active.");
            return 0;
        }

        var category = await context.Categories.FirstOrDefaultAsync(item =>
            item.Name.ToLower() == "công nghệ thông tin" || item.Name.ToLower() == "cong nghe thong tin");
        if (category == null)
        {
            category = new Category { Name = "Công nghệ thông tin", Description = "Dữ liệu kiểm thử ngành CNTT", IsActive = true };
            context.Categories.Add(category);
            await context.SaveChangesAsync();
        }

        var branches = new List<Branch>();
        foreach (var branchName in new[] { "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Cần Thơ" })
        {
            var branch = await context.Branches.FirstOrDefaultAsync(item => item.BranchName == branchName);
            if (branch == null)
            {
                branch = new Branch
                {
                    BranchName = branchName,
                    Address = $"Văn phòng kiểm thử - {branchName}",
                    Phone = "0000000000",
                    IsActive = true
                };
                context.Branches.Add(branch);
                await context.SaveChangesAsync();
            }
            branches.Add(branch);
        }
        var positions = new List<Position>();
        foreach (var item in PositionCatalog)
        {
            var position = await context.Positions.FirstOrDefaultAsync(current =>
                current.CategoryID == category.CategoryID && current.PositionName == item.Name);
            if (position == null)
            {
                position = new Position { CategoryID = category.CategoryID, PositionName = item.Name, IsActive = true };
                context.Positions.Add(position);
                await context.SaveChangesAsync();
            }
            positions.Add(position);
        }

        var levels = new List<JobLevel>();
        foreach (var entry in LevelCatalog)
        {
            var level = await context.JobLevels.FirstOrDefaultAsync(item =>
                entry.Names.Contains(item.Name) && item.IsActive);
            if (level != null) levels.Add(level);
        }
        if (levels.Count == 0)
        {
            Console.WriteLine("[TEST-DATA] Bỏ qua seed tin IT: chưa có danh mục cấp bậc active.");
            return 0;
        }

        // Dọn fixture cũ trong phạm vi marker. Chỉ xóa job chưa có ứng viên;
        // job đã phát sinh hồ sơ được giữ lại và đóng để bảo toàn dữ liệu.
        var legacyTestJobs = await context.JobPostings
            .Where(item => item.JobDescription.StartsWith("[TEST-DATA-IT"))
            .ToListAsync();
        var legacyJobIds = legacyTestJobs.Select(item => item.JobID).ToList();
        var jobsWithApplications = await context.Applications
            .Where(item => legacyJobIds.Contains(item.JobID))
            .Select(item => item.JobID)
            .Distinct()
            .ToListAsync();
        var deletableTestJobs = legacyTestJobs
            .Where(item => jobsWithApplications.Contains(item.JobID) == false)
            .ToList();
        var retainedTestJobs = legacyTestJobs
            .Where(item => jobsWithApplications.Contains(item.JobID))
            .ToList();
        foreach (var retainedJob in retainedTestJobs) retainedJob.Status = "Closed";
        var deletableJobIds = deletableTestJobs.Select(item => item.JobID).ToList();
        var deletableCriteria = await context.JobCriteria
            .Where(item => deletableJobIds.Contains(item.JobID))
            .ToListAsync();
        context.JobCriteria.RemoveRange(deletableCriteria);
        context.JobPostings.RemoveRange(deletableTestJobs);
        if (deletableTestJobs.Count > 0 || retainedTestJobs.Count > 0)
        {
            await context.SaveChangesAsync();
        }

        var existingTestJobs = await context.JobPostings
            .Where(item => item.JobID.StartsWith("test-it-v4-") || item.JobID.EndsWith(TestIdSuffix))
            .ToListAsync();
        foreach (var existingJob in existingTestJobs)
        {
            var existingPosition = positions.FirstOrDefault(item => item.PositionID == existingJob.PositionID);
            if (existingPosition == null) continue;
            if (existingJob.JobDescription.Contains("TRÁCH NHIỆM CHUYÊN MÔN") == false)
                existingJob.JobDescription += BuildRoleResponsibilities(existingPosition.PositionName);
            if (existingJob.JobDescription.Contains("TRÁCH NHIỆM CHÍNH") == false)
                existingJob.JobDescription += BuildSharedDescription(existingJob.SalaryMin, existingJob.SalaryMax);
            if (existingJob.JobRequirement.Contains("YÊU CẦU THEO VỊ TRÍ") == false)
                existingJob.JobRequirement += BuildRoleRequirements(existingPosition.PositionName);
            if (existingJob.JobRequirement.Contains("YÊU CẦU CHI TIẾT") == false)
                existingJob.JobRequirement += BuildSharedRequirements();
        }
        if (existingTestJobs.Count > 0)
        {
            await context.SaveChangesAsync();
        }

        var existingJobIds = existingTestJobs.Select(item => item.JobID).ToList();
        var existingCriteria = await context.JobCriteria
            .Where(item => existingJobIds.Contains(item.JobID))
            .ToListAsync();
        foreach (var existingJob in existingTestJobs)
        {
            var currentCriteria = existingCriteria.Where(item => item.JobID == existingJob.JobID).ToList();
            if (currentCriteria.Count >= 5) continue;

            var position = positions.FirstOrDefault(item => item.PositionID == existingJob.PositionID);
            var levelIndex = levels.FindIndex(item => item.JobLevelID == existingJob.JobLevelID);
            if (position == null || levelIndex < 0) continue;

            context.JobCriteria.RemoveRange(currentCriteria);
            var positionInfo = PositionCatalog.FirstOrDefault(item => item.Name == position.PositionName);
            context.JobCriteria.AddRange(BuildCriteria(existingJob.JobID, positionInfo, levelIndex));
        }

        await context.SaveChangesAsync();

        var existingCount = existingTestJobs.Count;
        if (existingCount >= PositionCatalog.Length)
        {
            Console.WriteLine($"[TEST-DATA] Đã có {existingCount} tin IT kiểm thử, không tạo trùng.");
            return 0;
        }

        var created = 0;
        var now = DateTime.Now;

        for (var positionIndex = 0; positionIndex < positions.Count; positionIndex++)
        {
            var positionInfo = PositionCatalog[positionIndex];
            var levelIndex = positionIndex % levels.Count;
            var level = levels[levelIndex];
            {
                var branch = branches[positionIndex % branches.Count];
                var createdAt = now.AddDays(-((positionIndex * 3) + levelIndex * 11));
                var deadline = now.AddDays(15 + positionIndex);
                var minSalary = 8 + levelIndex * 5 + (positionIndex % 3) * 2;
                var maxSalary = minSalary + 7;
                var job = new JobPosting
                {
                    // Mã hiển thị bắt đầu bằng GUID trung tính; hậu tố chỉ phục vụ
                    // nhận diện/dọn fixture và không nằm trong nội dung tin.
                    JobID = Guid.NewGuid().ToString("N") + TestIdSuffix,
                    RecruiterID = recruiterIds[(positionIndex + levelIndex) % recruiterIds.Count],
                    PositionID = positions[positionIndex].PositionID,
                    BranchID = branch.BranchID,
                    CategoryID = category.CategoryID,
                    JobLevelID = level.JobLevelID,
                    StartDate = createdAt.Date,
                    MaxCandidates = 2 + (positionIndex % 5),
                    SalaryMin = minSalary,
                    SalaryMax = maxSalary,
                    JobDescription = $"{positionInfo.Name} ({level.Name})\n{positionInfo.Description}\nLàm việc tại {branch.BranchName}, phối hợp với các nhóm sản phẩm và kỹ thuật."
                        + BuildRoleResponsibilities(positionInfo.Name)
                        + BuildSharedDescription(minSalary, maxSalary),
                    JobRequirement = $"Kỹ năng trọng tâm: {positionInfo.Skill}."
                        + BuildRoleRequirements(positionInfo.Name)
                        + BuildSharedRequirements(),
                    JDExtractedSkills = JsonSerializer.Serialize(positionInfo.Skill.Split(", ")),
                    Deadline = deadline,
                    Status = "Pending",
                    RejectReason = "",
                    ApprovedBy = "",
                    ApprovedAt = null,
                    CreatedAt = createdAt,
                    ViewCount = (positionIndex + 1) * 37 + levelIndex * 19
                };

                context.JobPostings.Add(job);
                context.JobCriteria.AddRange(BuildCriteria(job.JobID, positionInfo, levelIndex));
                created++;
            }
        }

        await context.SaveChangesAsync();
        Console.WriteLine($"[TEST-DATA] Đã tạo {created} tin IT và tiêu chí cấu trúc.");
        return created;
    }

    private static string BuildSharedDescription(decimal salaryMin, decimal salaryMax)
    {
        return $"""

        TRÁCH NHIỆM CHÍNH:
        - Phân tích yêu cầu, đề xuất giải pháp và triển khai công việc theo kế hoạch của nhóm.
        - Phối hợp với Product, QA, Design và các bên liên quan để bàn giao đúng tiến độ.
        - Viết tài liệu kỹ thuật, cập nhật tiến độ, chủ động nhận diện và xử lý rủi ro.
        - Tham gia review, cải tiến quy trình và chia sẻ kiến thức trong đội ngũ.

        QUYỀN LỢI:
        - Thu nhập dự kiến {salaryMin:0.#}–{salaryMax:0.#} triệu đồng/tháng, trao đổi theo năng lực.
        - Thử việc, bảo hiểm và ngày nghỉ theo chính sách công ty.
        - Được cấp thiết bị làm việc, đào tạo nội bộ và tham gia các dự án thực tế.
        - Môi trường Agile, phối hợp đa phòng ban; có thể làm việc linh hoạt theo chính sách chi nhánh.
        """;
    }

    private static string BuildSharedRequirements()
    {
        return """
        YÊU CẦU CHI TIẾT:
        - Có nền tảng phù hợp với vị trí, tư duy logic và khả năng tự học công nghệ mới.
        - Giao tiếp rõ ràng, làm việc nhóm tốt, chủ động quản lý thời gian và cam kết tiến độ.
        - Có thể đọc tài liệu kỹ thuật tiếng Anh; ưu tiên ứng viên có dự án cá nhân, portfolio hoặc kinh nghiệm thực tế.
        - Ứng viên cần mô tả rõ vai trò, công cụ đã sử dụng và kết quả đạt được trong CV.
        """;
    }

    private static string BuildRoleResponsibilities(string positionName)
    {
        var details = positionName switch
        {
            "Backend Developer" => "- Thiết kế API có phân quyền, validation và mã lỗi nhất quán.\n- Tối ưu truy vấn SQL, cache và xử lý đồng thời.\n- Viết unit/integration test cho các luồng nghiệp vụ quan trọng.",
            "Frontend Developer" => "- Chuyển thiết kế Figma thành giao diện responsive và dễ truy cập.\n- Quản lý state, biểu mẫu và luồng lỗi từ API.\n- Đo Core Web Vitals và tối ưu kích thước bundle.",
            "Full-stack Developer" => "- Phát triển trọn vẹn tính năng từ schema, API đến giao diện.\n- Thiết kế contract giữa frontend và backend.\n- Theo dõi lỗi production và cải tiến khả năng quan sát.",
            "DevOps Engineer" => "- Chuẩn hóa pipeline build, test và triển khai nhiều môi trường.\n- Quản lý container, secret và cấu hình bằng IaC.\n- Xây dựng cảnh báo, dashboard và quy trình rollback.",
            "Cloud Engineer" => "- Thiết kế network, compute, storage và quyền truy cập trên cloud.\n- Tự động hóa provisioning bằng Terraform.\n- Theo dõi chi phí, bảo mật và khả năng phục hồi.",
            "Site Reliability Engineer" => "- Xây dựng SLI/SLO và error budget cho dịch vụ.\n- Điều tra sự cố bằng log, metric và trace.\n- Tự động hóa runbook và diễn tập khôi phục.",
            "QA Automation Engineer" => "- Thiết kế test plan dựa trên rủi ro sản phẩm.\n- Tự động hóa UI/API và tích hợp vào CI.\n- Phân tích defect leakage và chất lượng bản phát hành.",
            "Data Analyst" => "- Làm rõ câu hỏi kinh doanh và định nghĩa KPI.\n- Làm sạch dữ liệu, viết truy vấn và kiểm tra sai lệch.\n- Xây dựng dashboard kèm diễn giải có thể hành động.",
            "Data Engineer" => "- Xây dựng batch/stream pipeline có kiểm soát chất lượng.\n- Mô hình hóa kho dữ liệu và quản lý lineage.\n- Tối ưu độ trễ, chi phí và khả năng chạy lại pipeline.",
            "Machine Learning Engineer" => "- Chuẩn bị feature, huấn luyện và đánh giá mô hình.\n- Đóng gói inference service và theo dõi model drift.\n- Thiết kế thí nghiệm có baseline và tiêu chí chấp nhận.",
            "Cybersecurity Engineer" => "- Giám sát sự kiện, phân loại cảnh báo và điều tra bất thường.\n- Đánh giá lỗ hổng, quyền truy cập và cấu hình bảo mật.\n- Cập nhật playbook ứng phó và báo cáo nguyên nhân gốc.",
            "Network Engineer" => "- Thiết kế routing, VLAN, firewall và kết nối chi nhánh.\n- Theo dõi băng thông, độ trễ và tính sẵn sàng.\n- Xử lý sự cố mạng và duy trì sơ đồ cấu hình.",
            "Business Analyst" => "- Khảo sát stakeholder và mô hình hóa quy trình hiện tại.\n- Viết user story, acceptance criteria và tài liệu BPMN.\n- Kiểm soát thay đổi phạm vi và hỗ trợ UAT.",
            "Product Manager" => "- Nghiên cứu nhu cầu, xác định vấn đề và giả thuyết sản phẩm.\n- Ưu tiên roadmap theo tác động và chi phí.\n- Theo dõi chỉ số sau phát hành và quyết định vòng lặp tiếp theo.",
            "UI/UX Designer" => "- Thực hiện user research và tổng hợp insight.\n- Thiết kế user flow, prototype và kiểm thử khả dụng.\n- Duy trì component, token và tài liệu design system.",
            "Technical Project Manager" => "- Lập kế hoạch phạm vi, nguồn lực, phụ thuộc và mốc bàn giao.\n- Theo dõi rủi ro, ngân sách và thay đổi.\n- Điều phối họp, quyết định và báo cáo cho stakeholder.",
            _ => "- Thực hiện đầu việc chuyên môn theo mục tiêu của nhóm.\n- Đo lường kết quả và chủ động đề xuất cải tiến."
        };
        return $"\n\nTRÁCH NHIỆM CHUYÊN MÔN:\n{details}";
    }

    private static string BuildRoleRequirements(string positionName)
    {
        var proof = positionName switch
        {
            "Backend Developer" or "Full-stack Developer" => "API đã triển khai, thiết kế database và ví dụ xử lý lỗi/hiệu năng",
            "Frontend Developer" => "portfolio giao diện, kiến thức accessibility và ví dụ tối ưu hiệu năng",
            "DevOps Engineer" or "Cloud Engineer" or "Site Reliability Engineer" => "pipeline hoặc hạ tầng mẫu, monitoring và kịch bản xử lý sự cố",
            "QA Automation Engineer" => "test plan, test automation và báo cáo lỗi có mức độ ưu tiên",
            "Data Analyst" => "dashboard, truy vấn SQL và cách kiểm chứng chất lượng dữ liệu",
            "Data Engineer" => "pipeline dữ liệu, mô hình kho dữ liệu và cơ chế retry/idempotency",
            "Machine Learning Engineer" => "repository mô hình, metric đánh giá và quy trình triển khai/giám sát",
            "Cybersecurity Engineer" or "Network Engineer" => "lab, sơ đồ hệ thống hoặc case study điều tra sự cố",
            "Business Analyst" => "BPMN, user story và acceptance criteria từ một dự án",
            "Product Manager" => "case study discovery, roadmap và chỉ số sản phẩm",
            "UI/UX Designer" => "portfolio thể hiện research, luồng thiết kế và usability test",
            "Technical Project Manager" => "kế hoạch dự án, risk register và báo cáo tiến độ",
            _ => "dự án hoặc sản phẩm chứng minh năng lực liên quan"
        };
        return $"\n\nYÊU CẦU THEO VỊ TRÍ:\n- Có {proof}.\n- Trình bày rõ bối cảnh, vai trò cá nhân, hành động và kết quả; không yêu cầu bịa số liệu.";
    }

    private static IEnumerable<JobCriterion> BuildCriteria(string jobId, (string Name, string Skill, string Description) position, int levelIndex)
    {
        var specialistCriterion = position.Name switch
        {
            var name when name.Contains("DevOps") || name.Contains("Cloud") || name.Contains("Reliability") =>
                ("Vận hành hạ tầng và tự động hóa", "CI/CD; container; cloud; monitoring"),
            var name when name.Contains("Data") || name.Contains("Machine Learning") =>
                ("Dữ liệu và mô hình phân tích", "data pipeline; SQL; Python; model evaluation"),
            var name when name.Contains("QA") =>
                ("Thiết kế và tự động hóa kiểm thử", "test plan; API test; automation; defect analysis"),
            var name when name.Contains("Cybersecurity") || name.Contains("Network") =>
                ("An toàn thông tin và xử lý sự cố", "network; access control; monitoring; incident response"),
            var name when name.Contains("Business Analyst") =>
                ("Phân tích và đặc tả yêu cầu", "BPMN; user story; acceptance criteria; stakeholder"),
            var name when name.Contains("Product") || name.Contains("Project") =>
                ("Quản lý sản phẩm và phối hợp delivery", "roadmap; prioritization; Agile; risk management"),
            var name when name.Contains("UI/UX") =>
                ("Nghiên cứu người dùng và thiết kế trải nghiệm", "user flow; wireframe; Figma; design system"),
            _ => ("Năng lực phát triển sản phẩm", position.Skill)
        };

        return new[]
        {
            new JobCriterion { JobID = jobId, Name = specialistCriterion.Item1, Weight = 35, CriterionType = "SKILL", PriorityLevel = "REQUIRED", Operator = "IN", TargetValue = specialistCriterion.Item2, EvidenceSources = "SKILLS,PROJECTS,EXPERIENCE", EvaluationGuidance = "Đối chiếu công cụ, dự án và kết quả đã thực hiện.", DisplayOrder = 1 },
            new JobCriterion { JobID = jobId, Name = "Kinh nghiệm theo cấp bậc", Weight = 20, CriterionType = "TOTAL_EXPERIENCE", PriorityLevel = levelIndex <= 1 ? "PREFERRED" : "REQUIRED", Operator = "MINIMUM", MinDurationMonths = Math.Max(1, levelIndex * 18), TargetValue = $"Tối thiểu {Math.Max(1, levelIndex * 18)} tháng kinh nghiệm liên quan", EvidenceSources = "EXPERIENCE", DisplayOrder = 2 },
            new JobCriterion { JobID = jobId, Name = "Dự án hoặc sản phẩm đã triển khai", Weight = 20, CriterionType = "CUSTOM", PriorityLevel = "PREFERRED", Operator = "EXISTS", TargetValue = "Có dự án nêu rõ vai trò, quy mô và kết quả định lượng", EvidenceSources = "PROJECTS,EXPERIENCE", DisplayOrder = 3 },
            new JobCriterion { JobID = jobId, Name = "Tư duy phân tích và giải quyết vấn đề", Weight = 15, CriterionType = "CUSTOM", PriorityLevel = "PREFERRED", Operator = "EXISTS", TargetValue = "Phân tích nguyên nhân; đề xuất giải pháp; đo lường kết quả", EvidenceSources = "EXPERIENCE,PROJECTS", DisplayOrder = 4 },
            new JobCriterion { JobID = jobId, Name = "Giao tiếp và làm việc liên chức năng", Weight = 10, CriterionType = "CUSTOM", PriorityLevel = "PREFERRED", Operator = "EXISTS", TargetValue = "Giao tiếp; tài liệu hóa; phối hợp nhóm", EvidenceSources = "EXPERIENCE,EDUCATION", DisplayOrder = 5 }
        };
    }
}
