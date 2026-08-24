from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta


@dataclass(frozen=True)
class JobCriterionFixture:
    name: str
    weight: int
    group: str
    priority: str
    min_duration_months: int | None = None
    guidance: str = ""


@dataclass(frozen=True)
class JobFixture:
    key: str
    category_path: tuple[str, ...]
    position: str
    level_path: tuple[str, ...]
    branch: str
    salary_range: str
    max_candidates: int
    start_date: date
    deadline: date
    description: str
    requirements: str
    criteria: tuple[JobCriterionFixture, ...]


@dataclass(frozen=True)
class _RoleSpec:
    key: str
    category_path: tuple[str, ...]
    position: str
    skills: tuple[str, str, str, str]
    mission: str
    responsibilities: tuple[str, str, str]
    proof: str


_ROOT_IT = ("Công Nghệ Thông Tin",)

_ROLE_SPECS: tuple[_RoleSpec, ...] = (
    _RoleSpec(
        "backend-dotnet", _ROOT_IT, "Backend Developer",
        ("C#", "ASP.NET Core", "SQL Server", "REST API"),
        "phát triển các dịch vụ backend ổn định cho nền tảng tuyển dụng và các luồng nghiệp vụ có dữ liệu nhạy cảm",
        (
            "Phân tích yêu cầu, thiết kế API có phân quyền, validation và mã lỗi nhất quán.",
            "Thiết kế schema, tối ưu truy vấn SQL Server và xử lý giao dịch hoặc đồng thời ở các luồng quan trọng.",
            "Viết unit test, integration test và phối hợp với frontend, QA để kiểm chứng contract trước khi phát hành.",
        ),
        "repository hoặc sản phẩm mô tả rõ API đã xây dựng, mô hình dữ liệu, cách xử lý lỗi và kết quả kiểm thử",
    ),
    _RoleSpec(
        "backend-node", _ROOT_IT, "Backend Node.js Developer",
        ("Node.js", "TypeScript", "PostgreSQL", "Redis"),
        "xây dựng API Node.js có khả năng mở rộng cho sản phẩm web thời gian thực",
        (
            "Thiết kế module TypeScript, contract API và cơ chế xác thực hoặc phân quyền.",
            "Tối ưu truy vấn PostgreSQL, chiến lược cache Redis và xử lý tác vụ bất đồng bộ.",
            "Thiết lập logging, test tự động và theo dõi lỗi để rút ngắn thời gian chẩn đoán sự cố.",
        ),
        "dịch vụ Node.js đã triển khai kèm sơ đồ luồng dữ liệu, chỉ số trước/sau tối ưu và cách kiểm soát lỗi",
    ),
    _RoleSpec(
        "backend-golang", _ROOT_IT, "Golang Software Engineer",
        ("Go", "Microservices", "PostgreSQL", "gRPC"),
        "phát triển dịch vụ Go có độ trễ thấp và ranh giới nghiệp vụ rõ ràng",
        (
            "Thiết kế microservice, giao tiếp gRPC hoặc REST và cơ chế idempotency cho yêu cầu lặp.",
            "Tối ưu goroutine, connection pool và truy cập PostgreSQL dựa trên số liệu profiling.",
            "Bổ sung tracing, circuit breaker và kịch bản phục hồi khi dịch vụ phụ thuộc gặp lỗi.",
        ),
        "dịch vụ Go có benchmark, test cạnh tranh dữ liệu và giải thích quyết định thiết kế",
    ),
    _RoleSpec(
        "backend-python", _ROOT_IT, "Python Developer",
        ("Python", "FastAPI", "PostgreSQL", "Celery"),
        "xây dựng API và tác vụ nền Python phục vụ xử lý dữ liệu tuyển dụng",
        (
            "Phát triển endpoint FastAPI có schema dữ liệu, validation và kiểm soát quyền truy cập.",
            "Thiết kế tác vụ Celery có retry, chống xử lý trùng và theo dõi trạng thái thực thi.",
            "Viết test, đo thời gian xử lý và tối ưu các truy vấn PostgreSQL hoặc luồng I/O.",
        ),
        "dự án Python thể hiện API, worker nền, chiến lược retry và số liệu vận hành",
    ),
    _RoleSpec(
        "java-web", _ROOT_IT, "Lập trình viên Java Web",
        ("Java", "Spring Boot", "PostgreSQL", "Kafka"),
        "phát triển dịch vụ Java hướng sự kiện cho các quy trình nghiệp vụ nhiều trạng thái",
        (
            "Xây dựng REST API Spring Boot, validation và xử lý exception theo chuẩn chung.",
            "Thiết kế transaction, mô hình dữ liệu và sự kiện Kafka có cơ chế chống phát trùng.",
            "Viết test tích hợp, theo dõi metric JVM và phối hợp xử lý vấn đề hiệu năng.",
        ),
        "dịch vụ Spring Boot có test, luồng sự kiện và mô tả cách bảo đảm nhất quán dữ liệu",
    ),
    _RoleSpec(
        "frontend-react", _ROOT_IT, "Frontend Developer",
        ("React", "TypeScript", "HTML", "CSS"),
        "xây dựng giao diện tuyển dụng dễ sử dụng, responsive và có khả năng truy cập",
        (
            "Chuyển thiết kế thành component React có kiểu dữ liệu, state và luồng lỗi rõ ràng.",
            "Tối ưu biểu mẫu, bảng dữ liệu và trải nghiệm trên màn hình nhỏ hoặc kết nối chậm.",
            "Đo Core Web Vitals, viết test giao diện và phối hợp với backend thống nhất API contract.",
        ),
        "portfolio hoặc sản phẩm có mã nguồn, ảnh nhiều kích thước màn hình và số liệu hiệu năng",
    ),
    _RoleSpec(
        "fullstack", _ROOT_IT, "Full-stack Developer",
        ("React", "TypeScript", ".NET", "SQL Server"),
        "phát triển trọn vẹn tính năng từ mô hình dữ liệu, API đến trải nghiệm người dùng",
        (
            "Làm rõ yêu cầu, thiết kế schema và API trước khi triển khai giao diện React.",
            "Kiểm soát validation ở cả client và server, phân quyền và thông báo lỗi nhất quán.",
            "Viết test theo lớp, review mã nguồn và theo dõi lỗi sau khi phát hành.",
        ),
        "tính năng end-to-end mô tả vai trò cá nhân, quyết định kỹ thuật và kết quả kiểm thử",
    ),
    _RoleSpec(
        "flutter", _ROOT_IT, "Mobile Flutter Developer",
        ("Flutter", "Dart", "REST API", "Firebase"),
        "phát triển ứng dụng di động đa nền tảng có trải nghiệm nhất quán và theo dõi lỗi hiệu quả",
        (
            "Xây dựng màn hình Flutter, quản lý state và điều hướng cho các luồng nhiều bước.",
            "Tích hợp REST API, Firebase notification và lưu trữ cục bộ có bảo vệ dữ liệu.",
            "Kiểm thử trên nhiều kích thước thiết bị, đo hiệu năng render và chuẩn hóa quy trình phát hành.",
        ),
        "ứng dụng đã phát hành hoặc bản demo có video luồng chính, mã nguồn và mô tả xử lý lỗi mạng",
    ),
    _RoleSpec(
        "devops", _ROOT_IT, "Kỹ sư DevOps (DevOps Engineer)",
        ("Docker", "Kubernetes", "CI/CD", "Linux"),
        "tự động hóa build, kiểm thử và triển khai để các đội sản phẩm phát hành an toàn hơn",
        (
            "Chuẩn hóa Docker image, pipeline CI/CD và quản lý cấu hình theo từng môi trường.",
            "Vận hành workload Kubernetes, thiết lập health check, resource limit và chiến lược rollback.",
            "Xây dựng dashboard, cảnh báo và runbook để phát hiện hoặc xử lý sự cố có thể truy vết.",
        ),
        "pipeline hoặc hạ tầng mẫu có repository, sơ đồ triển khai, metric và kịch bản rollback",
    ),
    _RoleSpec(
        "cloud", _ROOT_IT, "Cloud Engineer",
        ("AWS", "Azure", "Terraform", "Networking"),
        "thiết kế hạ tầng cloud an toàn, có khả năng mở rộng và kiểm soát chi phí",
        (
            "Thiết kế network, compute, storage và quyền truy cập phù hợp với từng workload.",
            "Tự động hóa provisioning bằng Terraform, review plan và quản lý state an toàn.",
            "Theo dõi chi phí, cấu hình backup và diễn tập phục hồi theo mục tiêu dịch vụ.",
        ),
        "mô hình hạ tầng cloud có mã IaC, sơ đồ network, chính sách quyền và ước lượng chi phí",
    ),
    _RoleSpec(
        "sre", _ROOT_IT, "Site Reliability Engineer",
        ("Kubernetes", "SLO", "Observability", "Python"),
        "nâng cao độ tin cậy dịch vụ thông qua SLO, tự động hóa và học hỏi từ sự cố",
        (
            "Xây dựng SLI, SLO và error budget dựa trên hành trình người dùng quan trọng.",
            "Điều tra sự cố bằng log, metric, trace và thực hiện postmortem không đổ lỗi.",
            "Tự động hóa runbook, kiểm thử khả năng phục hồi và giảm toil bằng Python.",
        ),
        "dashboard SLO, postmortem hoặc công cụ tự động hóa thể hiện tác động tới độ tin cậy",
    ),
    _RoleSpec(
        "qa-automation", _ROOT_IT, "QA Automation Engineer",
        ("Selenium", "Cypress", "API Testing", "CI/CD"),
        "xây dựng chiến lược kiểm thử tự động theo rủi ro và hỗ trợ phát hành liên tục",
        (
            "Phân tích yêu cầu, thiết kế test case và xác định phạm vi phù hợp cho UI hoặc API automation.",
            "Xây dựng framework Selenium/Cypress có dữ liệu test, retry có kiểm soát và báo cáo rõ ràng.",
            "Tích hợp test vào CI/CD, phân tích flaky test và theo dõi defect leakage qua từng phiên bản.",
        ),
        "repository automation có hướng dẫn chạy, báo cáo test và ví dụ lỗi từng phát hiện",
    ),
    _RoleSpec(
        "data-analyst", _ROOT_IT, "Data Analyst",
        ("SQL", "Python", "Power BI", "Statistics"),
        "chuyển dữ liệu vận hành thành insight có thể kiểm chứng và hỗ trợ quyết định",
        (
            "Làm rõ câu hỏi kinh doanh, định nghĩa KPI và kiểm tra nguồn dữ liệu trước khi phân tích.",
            "Làm sạch dữ liệu, viết truy vấn SQL/Python và ghi nhận giả định hoặc giới hạn.",
            "Xây dựng dashboard Power BI, kiểm thử số liệu và diễn giải kết quả cho bên liên quan.",
        ),
        "dashboard hoặc notebook có data dictionary, truy vấn, bước kiểm tra và khuyến nghị hành động",
    ),
    _RoleSpec(
        "data-engineer", _ROOT_IT, "Data Engineer",
        ("Python", "Spark", "Airflow", "Data Warehouse"),
        "xây dựng pipeline dữ liệu đáng tin cậy cho báo cáo và các sản phẩm AI",
        (
            "Thiết kế batch pipeline, mô hình kho dữ liệu và quy tắc kiểm tra chất lượng đầu vào.",
            "Điều phối workflow Airflow có retry, backfill, idempotency và cảnh báo thất bại.",
            "Tối ưu Spark, theo dõi lineage và đo độ trễ hoặc chi phí xử lý.",
        ),
        "pipeline mẫu có sơ đồ dữ liệu, test chất lượng, cơ chế chạy lại và metric vận hành",
    ),
    _RoleSpec(
        "machine-learning", _ROOT_IT, "Machine Learning Engineer",
        ("Python", "TensorFlow", "MLOps", "SQL"),
        "đưa mô hình machine learning từ thử nghiệm tới dịch vụ có thể giám sát",
        (
            "Chuẩn bị feature, thiết lập baseline và đánh giá mô hình trên tập dữ liệu tách biệt.",
            "Đóng gói inference, quản lý phiên bản model/dataset và tự động hóa pipeline MLOps.",
            "Theo dõi chất lượng, độ trễ, drift và xây dựng điều kiện rollback khi metric suy giảm.",
        ),
        "repository mô hình có baseline, metric, phiên bản dữ liệu và mô tả quy trình triển khai",
    ),
    _RoleSpec(
        "cybersecurity", _ROOT_IT, "Cybersecurity Engineer",
        ("SIEM", "IAM", "Network Security", "Incident Response"),
        "giảm rủi ro an toàn thông tin thông qua giám sát, kiểm soát truy cập và ứng phó sự cố",
        (
            "Xây dựng use case SIEM, phân loại cảnh báo và điều tra chuỗi sự kiện đáng ngờ.",
            "Rà soát IAM, phân quyền tối thiểu và cấu hình bảo mật mạng theo baseline.",
            "Cập nhật playbook ứng phó, lưu bằng chứng và theo dõi hành động khắc phục sau sự cố.",
        ),
        "lab hoặc case study bảo mật nêu phạm vi, bằng chứng, mức độ rủi ro và biện pháp khắc phục",
    ),
    _RoleSpec(
        "business-analyst", _ROOT_IT, "Business Analyst",
        ("BPMN", "SQL", "Agile", "Requirements"),
        "chuyển nhu cầu nghiệp vụ thành yêu cầu rõ ràng, kiểm thử được cho đội phát triển",
        (
            "Khảo sát stakeholder, mô hình hóa quy trình hiện tại và xác định điểm nghẽn.",
            "Viết user story, acceptance criteria, quy tắc dữ liệu và quản lý thay đổi phạm vi.",
            "Hỗ trợ refinement, UAT và đối chiếu kết quả bàn giao với mục tiêu nghiệp vụ.",
        ),
        "BPMN, đặc tả hoặc bộ user story có acceptance criteria và ví dụ truy vấn kiểm chứng",
    ),
    _RoleSpec(
        "product-manager", _ROOT_IT, "Product Manager",
        ("Roadmap", "Product Analytics", "Agile", "A/B Testing"),
        "định hướng sản phẩm dựa trên vấn đề người dùng, dữ liệu và mục tiêu kinh doanh",
        (
            "Thực hiện discovery, xác định giả thuyết và ưu tiên roadmap theo tác động hoặc chi phí.",
            "Phối hợp thiết kế, kỹ thuật và kinh doanh để làm rõ phạm vi cùng tiêu chí thành công.",
            "Theo dõi funnel, thiết kế A/B test và quyết định vòng lặp tiếp theo từ dữ liệu.",
        ),
        "case study sản phẩm có vấn đề, giả thuyết, quyết định ưu tiên và chỉ số sau phát hành",
    ),
    _RoleSpec(
        "uiux", _ROOT_IT, "UI/UX Designer",
        ("Figma", "Design System", "User Research", "Prototyping"),
        "thiết kế trải nghiệm số nhất quán dựa trên nghiên cứu và kiểm thử người dùng",
        (
            "Lập kế hoạch research, tổng hợp insight và xác định hành trình hoặc pain point chính.",
            "Thiết kế user flow, wireframe, prototype và trạng thái responsive/accessibility.",
            "Kiểm thử khả dụng, cập nhật design system và bàn giao spec rõ cho đội phát triển.",
        ),
        "portfolio trình bày đầy đủ vấn đề, nghiên cứu, vòng lặp thiết kế và kết quả usability test",
    ),
    _RoleSpec(
        "technical-pm", _ROOT_IT, "Technical Project Manager",
        ("Agile", "Jira", "Risk Management", "Stakeholder Management"),
        "điều phối dự án công nghệ với phạm vi, phụ thuộc và rủi ro được kiểm soát",
        (
            "Lập kế hoạch milestone, nguồn lực, phụ thuộc và tiêu chí nghiệm thu cho từng giai đoạn.",
            "Theo dõi tiến độ trên Jira, quản lý risk register và thúc đẩy quyết định khi có trở ngại.",
            "Điều phối giao tiếp stakeholder, thay đổi phạm vi và retrospective sau bàn giao.",
        ),
        "kế hoạch dự án, risk register hoặc báo cáo tiến độ cho thấy cách xử lý thay đổi thực tế",
    ),
    _RoleSpec(
        "nlp", ("Công Nghệ Thông Tin", "Trí tuệ nhân tạo (AI) & Học máy (Machine Learning)"),
        "Chuyên viên Xử lý ngôn ngữ tự nhiên (NLP Engineer)",
        ("Python", "Transformers", "spaCy", "Text Classification"),
        "xây dựng pipeline xử lý tiếng Việt có dữ liệu, metric và giới hạn được mô tả rõ",
        (
            "Chuẩn hóa dữ liệu, thiết kế guideline gán nhãn và kiểm tra độ nhất quán của tập huấn luyện.",
            "Huấn luyện hoặc tinh chỉnh mô hình Transformers và so sánh với baseline phù hợp.",
            "Đóng gói inference, theo dõi lỗi theo nhóm dữ liệu và cập nhật vòng lặp đánh giá.",
        ),
        "notebook hoặc dịch vụ NLP có dataset card, baseline, confusion matrix và phân tích lỗi",
    ),
    _RoleSpec(
        "computer-vision", ("Công Nghệ Thông Tin", "Trí tuệ nhân tạo (AI) & Học máy (Machine Learning)"),
        "Kỹ sư Thị giác máy tính (Computer Vision Engineer)",
        ("Python", "OpenCV", "PyTorch", "Object Detection"),
        "phát triển mô hình thị giác máy tính có khả năng hoạt động trên dữ liệu thực tế đa dạng",
        (
            "Xây dựng quy trình thu thập, gán nhãn và kiểm tra chất lượng ảnh theo từng điều kiện.",
            "Huấn luyện mô hình detection, đánh giá precision/recall và phân tích lỗi theo lớp.",
            "Tối ưu inference, đóng gói dịch vụ và theo dõi thay đổi phân phối dữ liệu.",
        ),
        "dự án vision có mẫu dữ liệu, metric theo lớp, phân tích lỗi và đo thời gian inference",
    ),
    _RoleSpec(
        "pentester", ("Công Nghệ Thông Tin", "An toàn thông tin / An ninh mạng (Cybersecurity)"),
        "Kỹ sư Kiểm thử xâm nhập (Penetration Tester / Pentester)",
        ("OWASP", "Burp Suite", "Web Security", "Vulnerability Assessment"),
        "đánh giá điểm yếu ứng dụng trong phạm vi được cấp quyền và hỗ trợ đội ngũ khắc phục",
        (
            "Lập kế hoạch kiểm thử, xác nhận phạm vi và thu thập bằng chứng không làm gián đoạn dịch vụ.",
            "Kiểm tra lỗ hổng web/API theo OWASP, xác định khả năng khai thác và mức độ ảnh hưởng.",
            "Viết báo cáo tái hiện được, đề xuất khắc phục và retest sau khi cập nhật.",
        ),
        "báo cáo lab đã ẩn dữ liệu nhạy cảm, thể hiện bằng chứng, đánh giá rủi ro và kết quả retest",
    ),
    _RoleSpec(
        "cloud-security", ("Công Nghệ Thông Tin", "Điện toán đám mây & DevOps (Cloud Computing & DevOps)"),
        "Kỹ sư Bảo mật Đám mây (Cloud Security Engineer)",
        ("Cloud Security", "IAM", "CSPM", "Terraform"),
        "thiết lập guardrail bảo mật cloud có thể kiểm tra và tự động hóa",
        (
            "Rà soát kiến trúc, quyền IAM và luồng dữ liệu theo nguyên tắc đặc quyền tối thiểu.",
            "Xây dựng policy-as-code, kiểm tra Terraform và cảnh báo sai cấu hình bằng CSPM.",
            "Phối hợp xử lý phát hiện, theo dõi remediation và cập nhật baseline bảo mật.",
        ),
        "mã policy hoặc case study cloud nêu sai cấu hình, bằng chứng và cách xác nhận đã khắc phục",
    ),
    _RoleSpec(
        "embedded", ("Công Nghệ Thông Tin", "Internet vạn vật (IoT)"),
        "Kỹ sư Lập trình Nhúng / Firmware (Embedded Software/Firmware Engineer)",
        ("C", "C++", "RTOS", "Microcontroller"),
        "phát triển firmware ổn định trong điều kiện hạn chế bộ nhớ, năng lượng và thời gian thực",
        (
            "Thiết kế driver, task RTOS và giao tiếp ngoại vi theo tài liệu phần cứng.",
            "Phân tích timing, memory footprint và lỗi cạnh tranh tài nguyên bằng công cụ đo phù hợp.",
            "Xây dựng test trên thiết bị, logging chẩn đoán và quy trình cập nhật firmware an toàn.",
        ),
        "dự án phần cứng/firmware có sơ đồ, mã nguồn, log kiểm thử và số liệu tài nguyên",
    ),
)


_LEVELS: tuple[tuple[tuple[str, ...], int, str], ...] = (
    (("Nhóm Khởi đầu nghề nghiệp", "Mới tốt nghiệp (Fresher / Entry-level)"), 0, "9 - 14 triệu"),
    (("Nhóm Chuyên môn cá nhân", "Junior"), 12, "14 - 22 triệu"),
    (("Nhóm Chuyên môn cá nhân", "Middle"), 36, "22 - 35 triệu"),
    (("Nhóm Chuyên môn cá nhân", "Senior"), 60, "35 - 55 triệu"),
)

_BRANCHES = (
    "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Cần Thơ",
    "Thành phố Đà Lạt", "Ninh Bình", "Phan thiết",
)


def _build_description(spec: _RoleSpec, branch: str) -> str:
    responsibilities = "\n".join(f"- {item}" for item in spec.responsibilities)
    return f"""MỤC TIÊU VỊ TRÍ
Vai trò {spec.position} chịu trách nhiệm {spec.mission}. Vị trí làm việc tại {branch}, phối hợp trực tiếp với Product, QA, Design, vận hành và các bên nghiệp vụ liên quan.

TRÁCH NHIỆM CHUYÊN MÔN
{responsibilities}
- Chủ động cập nhật tiến độ, tài liệu hóa quyết định và nêu sớm rủi ro ảnh hưởng tới chất lượng hoặc thời hạn.
- Tham gia review, retrospective và chia sẻ kiến thức để cải thiện tiêu chuẩn kỹ thuật của đội ngũ.

KẾT QUẢ KỲ VỌNG
- Bàn giao đầu việc có tiêu chí nghiệm thu, test hoặc bằng chứng kiểm tra phù hợp với phạm vi.
- Vấn đề phát sinh được ghi nhận, phân tích nguyên nhân và theo dõi đến khi có kết quả xác nhận.
- Tài liệu và mã nguồn có thể được thành viên khác tiếp nhận, vận hành hoặc tiếp tục phát triển.

QUYỀN LỢI VÀ MÔI TRƯỜNG
- Được cấp thiết bị, môi trường thử nghiệm và thời gian trao đổi chuyên môn với đội ngũ.
- Đánh giá dựa trên chất lượng bàn giao, khả năng phối hợp và tác động thực tế; không dựa trên số giờ làm thêm.
- Chế độ thử việc, bảo hiểm, ngày nghỉ và đào tạo áp dụng theo chính sách hiện hành của doanh nghiệp."""


def _build_requirements(spec: _RoleSpec, minimum_months: int) -> str:
    experience = (
        "Không bắt buộc kinh nghiệm toàn thời gian; chấp nhận đồ án, thực tập hoặc sản phẩm cá nhân có thể trình bày rõ vai trò."
        if minimum_months == 0
        else f"Có tối thiểu {minimum_months} tháng kinh nghiệm liên quan. Các khoảng thời gian làm việc song song không được cộng trùng."
    )
    skill_lines = "\n".join(f"- Có kiến thức và bằng chứng sử dụng {skill}." for skill in spec.skills)
    return f"""NĂNG LỰC CHUYÊN MÔN
{skill_lines}

KINH NGHIỆM VÀ BẰNG CHỨNG
- {experience}
- Ưu tiên ứng viên có {spec.proof}.
- CV cần nêu đúng phạm vi cá nhân thực hiện, công cụ sử dụng và kết quả; không yêu cầu bịa số liệu khi không có phép đo.

CÁCH LÀM VIỆC
- Có tư duy phân tích, biết chia nhỏ vấn đề, kiểm tra giả định và chủ động đề xuất phương án.
- Giao tiếp rõ ràng, tôn trọng review, có khả năng phối hợp liên chức năng và bàn giao công việc.
- Đọc được tài liệu kỹ thuật tiếng Anh, quản lý thời gian và tuân thủ quy định bảo mật dữ liệu.
- Sẵn sàng trao đổi sâu trong phỏng vấn về một dự án đã làm, bao gồm quyết định, khó khăn và bài học."""


def _build_criteria(spec: _RoleSpec, minimum_months: int) -> tuple[JobCriterionFixture, ...]:
    skill_weights = (12, 9, 8, 6)
    criteria = [
        JobCriterionFixture(
            name=skill,
            weight=skill_weights[index],
            group="Kỹ năng",
            priority="Bắt buộc" if index < 2 else "Ưu tiên",
            guidance="Chỉ ghi nhận khi CV có đoạn trích trực tiếp trong kỹ năng, dự án hoặc kinh nghiệm.",
        )
        for index, skill in enumerate(spec.skills)
    ]
    criteria.extend(
        (
            JobCriterionFixture(
                name="Tổng kinh nghiệm liên quan",
                weight=20,
                group="Tổng kinh nghiệm liên quan",
                priority="Bắt buộc" if minimum_months else "Ưu tiên",
                min_duration_months=minimum_months or None,
                guidance="Tính theo hợp các khoảng thời gian, không cộng trùng công việc song song.",
            ),
            JobCriterionFixture(
                name="Dự án hoặc sản phẩm đã triển khai",
                weight=20,
                group="Tiêu chí riêng",
                priority="Ưu tiên",
                guidance=f"Tìm bằng chứng về {spec.proof}; không tự suy diễn nếu CV không nêu.",
            ),
            JobCriterionFixture(
                name="Tư duy phân tích và giải quyết vấn đề",
                weight=15,
                group="Tiêu chí riêng",
                priority="Ưu tiên",
                guidance="Đối chiếu tình huống, hành động xử lý và kết quả được mô tả trực tiếp trong CV.",
            ),
            JobCriterionFixture(
                name="Giao tiếp và phối hợp nhóm",
                weight=10,
                group="Tiêu chí riêng",
                priority="Ưu tiên",
                guidance="Tìm bằng chứng review, tài liệu hóa, bàn giao hoặc phối hợp với bên liên quan.",
            ),
        )
    )
    return tuple(criteria)


def build_job_fixtures(count: int = 24, today: date | None = None) -> list[JobFixture]:
    if count < 1:
        raise ValueError("Số lượng job phải lớn hơn 0.")
    if count > len(_ROLE_SPECS):
        raise ValueError(f"Bộ dữ liệu hiện hỗ trợ tối đa {len(_ROLE_SPECS)} vị trí không trùng lặp.")

    current_date = today or date.today()
    fixtures: list[JobFixture] = []
    for index, spec in enumerate(_ROLE_SPECS[:count]):
        level_path, minimum_months, salary_range = _LEVELS[index % len(_LEVELS)]
        branch = _BRANCHES[index % len(_BRANCHES)]
        fixtures.append(
            JobFixture(
                key=spec.key,
                category_path=spec.category_path,
                position=spec.position,
                level_path=level_path,
                branch=branch,
                salary_range=salary_range,
                max_candidates=2 + (index % 5),
                start_date=current_date,
                deadline=current_date + timedelta(days=30 + (index % 15)),
                description=_build_description(spec, branch),
                requirements=_build_requirements(spec, minimum_months),
                criteria=_build_criteria(spec, minimum_months),
            )
        )
    return fixtures
