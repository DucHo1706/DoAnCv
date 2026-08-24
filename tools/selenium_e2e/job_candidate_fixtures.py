from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from .fixtures import _write_candidate_document
from .job_fixtures import JobFixture


@dataclass(frozen=True)
class CoverageProfile:
    key: str
    label: str
    criterion_indexes: tuple[int, ...]
    background: str
    education: str
    auxiliary_skills: tuple[str, ...]


@dataclass(frozen=True)
class JobCandidateFixture:
    job_key: str
    job_title: str
    index: int
    profile_key: str
    profile_label: str
    full_name: str
    email: str
    expected_criterion_coverage: int
    covered_criteria: tuple[str, ...]
    expected_red_flag_rules: tuple[str, ...]
    document_path: Path
    layout: str
    word_count: int


# Hai mươi tổ hợp có tổng trọng số khác nhau. Đây là ground truth kiểm thử ở
# manifest, không được chèn vào CV và không được dùng để ghi đè điểm AI thật.
_COVERAGE_PROFILES: tuple[CoverageProfile, ...] = (
    CoverageProfile("transition", "Chuyển ngành, chưa có bằng chứng liên quan", (), "điều phối cửa hàng bán lẻ và chăm sóc khách hàng", "Cử nhân Quản trị kinh doanh", ("Microsoft Office", "quản lý lịch", "dịch vụ khách hàng")),
    CoverageProfile("foundation-d", "Một kỹ năng ưu tiên ở mức nền tảng", (3,), "hỗ trợ kỹ thuật nội bộ cho doanh nghiệp nhỏ", "Cao đẳng Công nghệ thông tin", ("viết tài liệu", "hỗ trợ người dùng", "quản lý yêu cầu")),
    CoverageProfile("foundation-c", "Một kỹ năng chuyên môn qua đồ án", (2,), "thực hiện đồ án tốt nghiệp có phạm vi hẹp", "Kỹ sư Hệ thống thông tin", ("nghiên cứu tài liệu", "kiểm thử thủ công", "thuyết trình")),
    CoverageProfile("foundation-b", "Một kỹ năng bắt buộc qua thực tập", (1,), "thực tập trong nhóm sản phẩm quy mô nhỏ", "Cử nhân Khoa học máy tính", ("Git", "viết báo cáo", "đọc tài liệu tiếng Anh")),
    CoverageProfile("foundation-a", "Một kỹ năng bắt buộc có minh chứng", (0,), "tự học có định hướng và hoàn thành sản phẩm cá nhân", "Cử nhân Công nghệ thông tin", ("quản lý công việc", "tư duy logic", "tự học")),
    CoverageProfile("two-preferred", "Hai kỹ năng ưu tiên nhưng thiếu kinh nghiệm", (2, 3), "tham gia câu lạc bộ học thuật và hai đồ án môn học", "Sinh viên năm cuối ngành Kỹ thuật phần mềm", ("Git", "trình bày", "làm việc từ xa")),
    CoverageProfile("problem-only", "Có tình huống giải quyết vấn đề chuyển đổi", (6,), "kiểm soát vận hành kho và xử lý sai lệch dữ liệu", "Cử nhân Logistics", ("Excel", "sơ đồ quy trình", "phân tích nguyên nhân")),
    CoverageProfile("two-skills", "Hai kỹ năng chuyên môn, chưa có dự án hoàn chỉnh", (1, 2), "học việc trong nhóm kỹ thuật và thực hiện các tác vụ độc lập", "Cử nhân Hệ thống thông tin", ("Git", "Linux cơ bản", "viết tài liệu")),
    CoverageProfile("experience-only", "Có kinh nghiệm đúng vai trò nhưng bằng chứng kỹ thuật mỏng", (4,), "làm việc đúng chức danh nhưng CV cũ mô tả công việc ở mức khái quát", "Cao đẳng Kỹ thuật máy tính", ("quản lý tiến độ", "báo cáo", "tuân thủ quy trình")),
    CoverageProfile("two-required", "Hai kỹ năng bắt buộc qua thực hành", (0, 1), "thực hành chuyên môn liên tục qua bài tập và sản phẩm nhỏ", "Cử nhân Công nghệ phần mềm", ("Git", "debug cơ bản", "đọc tài liệu")),
    CoverageProfile("skill-problem", "Một kỹ năng và một minh chứng xử lý vấn đề", (2, 6), "phụ trách hỗ trợ vận hành một hệ thống nội bộ", "Cử nhân Toán tin", ("theo dõi lỗi", "phân tích dữ liệu", "báo cáo")),
    CoverageProfile("experience-skill", "Kinh nghiệm liên quan cùng một kỹ năng ưu tiên", (3, 4), "đảm nhiệm một phần nhỏ của vai trò trong đội ngũ nhiều chức năng", "Cử nhân Mạng máy tính", ("quản lý ticket", "documentation", "kiểm thử")),
    CoverageProfile("three-skills", "Ba kỹ năng chuyên môn, thiếu kinh nghiệm và kết quả", (0, 1, 2), "hoàn thành chương trình đào tạo chuyên sâu và nhiều phòng lab", "Kỹ sư Công nghệ thông tin", ("Git", "Linux", "technical writing")),
    CoverageProfile("all-skills", "Đủ bốn kỹ năng nhưng chưa chứng minh vận dụng", (0, 1, 2, 3), "có nền tảng công cụ rộng qua khóa học và bài tập có hướng dẫn", "Cử nhân Khoa học máy tính", ("Git", "Linux", "kiểm thử")),
    CoverageProfile("experience-problem", "Kinh nghiệm, kỹ năng ưu tiên và xử lý vấn đề", (3, 4, 6), "phụ trách vận hành và cải tiến một cấu phần của sản phẩm", "Cử nhân Hệ thống thông tin quản lý", ("monitoring", "viết runbook", "quản lý sự cố")),
    CoverageProfile("delivery-team", "Kinh nghiệm dự án và phối hợp, thiếu kỹ năng trực tiếp", (4, 5, 7), "tham gia bàn giao sản phẩm trong vai trò điều phối kỹ thuật", "Cử nhân Quản lý công nghiệp", ("Agile", "tài liệu hóa", "quản trị rủi ro")),
    CoverageProfile("skills-experience", "Đủ kỹ năng và kinh nghiệm, thiếu bằng chứng tác động", (0, 1, 2, 3, 4), "làm việc ổn định trong nhóm chuyên môn nhưng ít ghi nhận kết quả định lượng", "Kỹ sư Phần mềm", ("Git", "code review", "quản lý cấu hình")),
    CoverageProfile("delivery-strong", "Kinh nghiệm, dự án và xử lý vấn đề khá mạnh", (1, 3, 4, 5, 6), "chịu trách nhiệm triển khai một luồng nghiệp vụ quan trọng", "Cử nhân Kỹ thuật máy tính", ("theo dõi chỉ số", "quản lý phát hành", "viết postmortem")),
    CoverageProfile("senior-gap", "Hồ sơ mạnh nhưng còn thiếu hai kỹ năng trực tiếp", (0, 2, 4, 5, 6, 7), "dẫn dắt kỹ thuật cho một sản phẩm có người dùng thực tế", "Thạc sĩ Hệ thống thông tin", ("mentoring", "thiết kế hệ thống", "quản trị rủi ro")),
    CoverageProfile("complete", "Đầy đủ tám nhóm bằng chứng", (0, 1, 2, 3, 4, 5, 6, 7), "phụ trách trọn vòng đời sản phẩm từ làm rõ yêu cầu đến vận hành", "Kỹ sư Khoa học máy tính", ("kiến trúc", "đo lường", "mentoring")),
)


_FAMILY_NAMES = (
    "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ",
    "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý",
    "Trương", "Đinh", "Mai", "Cao", "Tạ", "Tô", "Quách", "Châu",
)

_GIVEN_NAMES = (
    "Minh An", "Gia Bảo", "Hoàng Duy", "Khánh Linh", "Quốc Huy",
    "Thu Hà", "Đức Long", "Ngọc Mai", "Anh Khoa", "Thanh Trúc",
    "Nhật Nam", "Quỳnh Anh", "Tuấn Kiệt", "Mỹ Duyên", "Hải Đăng",
    "Thảo Vy", "Minh Quân", "Bảo Ngọc", "Hữu Phước", "Kim Chi",
)

_SKILL_ALIASES = {
    "ASP.NET Core": ("ASP.NET Core", ".NET Core Web API", "asp net core"),
    "C#": ("C#", "C Sharp", "c-sharp"),
    "SQL Server": ("SQL Server", "Microsoft SQL Server", "MS SQL"),
    "REST API": ("REST API", "RESTful API", "API theo kiến trúc REST"),
    "Node.js": ("Node.js", "NodeJS", "node js"),
    "TypeScript": ("TypeScript", "Typescript", "TS"),
    "PostgreSQL": ("PostgreSQL", "Postgres", "pgSQL"),
    "JavaScript": ("JavaScript", "Javascript", "JS"),
    "Kubernetes": ("Kubernetes", "K8s", "kubernetes orchestration"),
    "Docker": ("Docker", "Docker container", "container hóa với Docker"),
    "Amazon Web Services (AWS)": ("Amazon Web Services (AWS)", "AWS", "Amazon cloud"),
    "Google Cloud Platform (GCP)": ("Google Cloud Platform (GCP)", "GCP", "Google Cloud"),
    "Machine Learning": ("Machine Learning", "máy học", "ML"),
    "Natural Language Processing": ("Natural Language Processing", "xử lý ngôn ngữ tự nhiên", "NLP"),
}


def _slug(value: str, maximum: int = 20) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "", value).lower()
    return normalized[:maximum] or "batch"


def _month_label(months_before_july_2026: int) -> str:
    absolute = 2026 * 12 + 6 - months_before_july_2026
    year, zero_based_month = divmod(absolute, 12)
    return f"{zero_based_month + 1:02d}/{year}"


def _month_after(reference: date, months: int) -> str:
    absolute = reference.year * 12 + reference.month - 1 + months
    year, zero_based_month = divmod(absolute, 12)
    return f"{zero_based_month + 1:02d}/{year}"


def _skill_display(skill: str, profile_index: int, skill_index: int) -> str:
    aliases = _SKILL_ALIASES.get(skill, (skill,))
    return aliases[(profile_index + skill_index) % len(aliases)]


def _build_cv_text(
    job: JobFixture,
    profile: CoverageProfile,
    profile_index: int,
    full_name: str,
    email: str,
    phone_suffix: int,
) -> str:
    covered = set(profile.criterion_indexes)
    skills = [criterion.name for criterion in job.criteria[:4]]
    displayed_skills = [
        _skill_display(skill, profile_index, index)
        for index, skill in enumerate(skills)
        if index in covered
    ]
    skill_text = (
        "; ".join(displayed_skills)
        if displayed_skills
        else "; ".join(profile.auxiliary_skills)
    )

    experience_criterion = job.criteria[4]
    required_months = experience_criterion.min_duration_months or 12
    actual_months = max(12, required_months) + (profile_index % 4) * 6
    start_label = _month_label(actual_months)
    timeline_note = (
        "Trong giai đoạn 03/2024 - 09/2024 tôi đồng thời hỗ trợ một nhóm khác hai buổi mỗi tuần; "
        "khoảng song song này được ghi rõ để hệ thống không cộng trùng tổng kinh nghiệm."
        if profile_index in {17, 18, 19}
        else "Các mốc thời gian trên CV được ghi theo tháng/năm và không có hai công việc toàn thời gian chồng lặp."
    )
    experience_end = _month_after(date.today(), 2) if profile.key == "experience-skill" else "07/2026"
    reversed_period_note = (
        "\n- Hồ sơ đồng thời ghi một mốc cần xác nhận: 08/2025 - 03/2025 | Hỗ trợ dự án nội bộ."
        if profile.key == "skills-experience"
        else ""
    )
    if 4 in covered:
        experience = f"""{start_label} - {experience_end} | {job.position} | Nhóm sản phẩm tại {job.branch}
- Tiếp nhận yêu cầu, làm rõ phạm vi và chịu trách nhiệm cho một phần công việc liên quan trực tiếp tới {job.position}.
- Duy trì nhật ký quyết định, tiêu chí nghiệm thu và bằng chứng kiểm tra sau mỗi lần bàn giao; chủ động nêu các giả định chưa thể xác minh.
- Theo dõi lỗi theo mức ảnh hưởng, tái hiện điều kiện phát sinh và cập nhật trạng thái cho người phụ trách thay vì chỉ báo cáo kết quả cuối.
- Hoàn thành các đầu việc theo chu kỳ hai tuần, có review và biên bản bàn giao. Phạm vi cá nhân được tách khỏi kết quả chung của đội.
{timeline_note}{reversed_period_note}"""
    else:
        experience = f"""HOẠT ĐỘNG CHUẨN BỊ NGHỀ NGHIỆP
Nền tảng hiện tại của tôi là {profile.background}. Tôi đang hệ thống lại kiến thức bằng tài liệu chính thức, bài tập có phạm vi nhỏ và nhật ký tự đánh giá. Hồ sơ này chưa ghi nhận một giai đoạn làm việc có ngày bắt đầu, ngày kết thúc và chức danh đủ rõ để quy đổi thành số tháng kinh nghiệm.
Tôi có thể trình bày cách tiếp nhận yêu cầu, lập danh sách đầu việc, kiểm tra thông tin đầu vào và ghi lại phần chưa hiểu. Những hoạt động đó phản ánh thái độ học tập, không được dùng thay cho timeline kinh nghiệm. Khi có cơ hội thực tập hoặc làm việc chính thức, tôi sẽ bổ sung tên đơn vị, phạm vi cá nhân, mốc tháng/năm và người có thể xác nhận."""

    if 5 in covered:
        project = f"""DỰ ÁN TRIỂN KHAI LIÊN QUAN ĐẾN {job.position.upper()}
Bối cảnh: Đội ngũ cần cải thiện một quy trình có nhiều bước thủ công, khó truy vết nguyên nhân khi kết quả không nhất quán. Tôi phụ trách khảo sát luồng hiện tại, xác định ranh giới phần việc và lập tiêu chí nghiệm thu trước khi triển khai.
Hành động: Tôi xây dựng phiên bản thử nghiệm theo từng lát cắt nhỏ, lưu tài liệu kiến trúc, kịch bản lỗi và kết quả kiểm tra. Các công cụ trực tiếp dùng trong phạm vi cá nhân gồm {skill_text}. Mỗi thay đổi đều có mã công việc, người review và cách quay lại phiên bản trước.
Kết quả: Thời gian xử lý trung vị giảm từ 18 xuống 11 phút trên tập 120 trường hợp nội bộ; tỷ lệ phải nhập lại giảm từ 14% xuống 5%. Các con số lấy từ log của cùng bốn tuần trước và sau thay đổi, không phải ước lượng. Repository, sơ đồ dữ liệu, checklist phát hành và báo cáo kiểm thử có thể được trình bày khi phỏng vấn."""
    else:
        project = """THÓI QUEN HỌC TẬP
Tôi đọc từng chủ đề theo câu hỏi cụ thể, ghi lại thuật ngữ mới và tự kiểm tra bằng các ví dụ ngắn. Mỗi tuần tôi tổng kết nội dung đã hiểu, nội dung cần hỏi thêm và nguồn sẽ đọc tiếp. Tôi ưu tiên tài liệu chính thức, ghi rõ phiên bản và ngày truy cập để tránh áp dụng hướng dẫn đã lỗi thời.
Phần này chỉ mô tả cách học. Hồ sơ không gắn cho nó số liệu người dùng, hiệu năng, doanh thu hoặc tác động vận hành. Tôi sẵn sàng thực hiện bài kiểm tra đầu vào để nhà tuyển dụng quan sát trực tiếp mức độ hiện tại."""

    if 6 in covered:
        problem = f"""TÌNH HUỐNG GIẢI QUYẾT VẤN ĐỀ
Khi một luồng xử lý bắt đầu có tỷ lệ thất bại tăng sau thay đổi, tôi không sửa theo phỏng đoán mà chia dữ liệu theo thời điểm, loại yêu cầu và phiên bản. Tôi tái hiện được lỗi trong 7 trên 7 kịch bản có cùng điều kiện biên, sau đó khoanh vùng nguyên nhân ở bước kiểm tra dữ liệu đầu vào.
Tôi đề xuất hai phương án, ghi rõ rủi ro của từng phương án và chọn cách có thể kiểm thử độc lập. Sau khi bổ sung validation, test hồi quy và cảnh báo, tỷ lệ lỗi giảm từ 9,4% xuống 1,1% trên 860 lượt xử lý trong hai tuần. Tôi tiếp tục theo dõi một chu kỳ nữa và viết postmortem nêu nguyên nhân gốc, yếu tố góp phần và hành động phòng ngừa."""
    else:
        problem = """TỔ CHỨC CÔNG VIỆC CÁ NHÂN
Tôi dùng danh sách việc theo ngày, đánh dấu nội dung đã đọc và dành một khoảng cố định để ôn lại ghi chú. Công việc được chia thành bước ngắn để dễ theo dõi tiến độ. Cuối tuần tôi dọn tài liệu trùng, cập nhật mục lục và chọn chủ đề tiếp theo dựa trên phần kiến thức còn thiếu.
Tôi chưa đưa ra thành tích định lượng cho mục này. Các mô tả chỉ nhằm giúp nhà tuyển dụng hiểu nếp làm việc cá nhân và không thay thế cho một tình huống nghề nghiệp có dữ liệu đối chứng."""

    if 7 in covered:
        collaboration = f"""GIAO TIẾP VÀ PHỐI HỢP
Trong nhóm từ 6 đến 9 thành viên, tôi duy trì cập nhật ngắn ba lần mỗi tuần, ghi quyết định sau cuộc họp và xác nhận lại tiêu chí bàn giao với Product, QA cùng bên vận hành. Khi có bất đồng, tôi đưa cuộc trao đổi về dữ liệu, tác động và lựa chọn có thể kiểm chứng thay vì bảo vệ giải pháp cá nhân.
Tôi đã hướng dẫn hai thành viên mới qua checklist môi trường, tài liệu luồng chính và phiên review có ghi nhận. Nhờ thống nhất definition of done, số đầu việc bị trả lại vì thiếu thông tin giảm từ 11 xuống 4 trong hai sprint. Phần đóng góp của tôi là xây checklist, điều phối review và theo dõi phản hồi; kết quả sản phẩm vẫn là công sức chung của đội."""
    else:
        collaboration = """ĐIỀU KIỆN LÀM VIỆC MONG MUỐN
Tôi có thể làm việc tại địa điểm đã nêu trong hồ sơ và tuân thủ thời gian của doanh nghiệp. Tôi ưu tiên môi trường có hướng dẫn hội nhập rõ, tiêu chuẩn đầu ra được viết thành văn bản và thời điểm phản hồi định kỳ. Trong giai đoạn đầu, tôi mong được giao phạm vi vừa sức để có thể kiểm tra kỹ chất lượng trước khi nhận thêm trách nhiệm.
Tôi tôn trọng quy định bảo mật, không đưa dữ liệu nội bộ vào công cụ cá nhân và chủ động hỏi khi chưa rõ quyền truy cập. Thời điểm bắt đầu có thể trao đổi theo kế hoạch tuyển dụng."""

    learning_topics = ", ".join(profile.auxiliary_skills)
    return f"""HỒ SƠ ỨNG VIÊN
Họ tên: {full_name}
Email: {email}
Điện thoại: 09{phone_suffix:08d}
Địa điểm: {job.branch}

MỤC TIÊU NGHỀ NGHIỆP
Tôi ứng tuyển vị trí {job.position} sau quá trình {profile.background}. Mục tiêu trong mười hai tháng đầu là hiểu rõ tiêu chuẩn chất lượng, hoàn thành đầu việc có bằng chứng và nhận phản hồi định kỳ. Tôi chỉ trình bày những nội dung đã trực tiếp thực hiện; phần đang học được tách riêng để nhà tuyển dụng có thể đánh giá đúng mức độ sẵn sàng.
Tôi quan tâm tới môi trường có quy trình review, dữ liệu để kiểm chứng quyết định và cơ hội phối hợp với nhiều vai trò. Thế mạnh hiện tại là duy trì kỷ luật công việc, ghi lại giả định và chủ động thông báo rủi ro. Hạn chế là một số năng lực cho {job.position} mới được thực hành trong phạm vi nhỏ và cần được xác minh sâu qua câu hỏi tình huống.

NĂNG LỰC CHUYÊN MÔN
Năng lực có thể trao đổi bằng ví dụ trực tiếp: {skill_text}.
Tôi phân biệt rõ ba mức: đã dùng trong công việc, đã dùng trong đồ án và mới tìm hiểu. Với công cụ đã sử dụng, tôi có thể giải thích đầu vào, thao tác, cách kiểm tra đầu ra và lỗi từng gặp. Tôi không liệt kê công nghệ chỉ vì xuất hiện trong mô tả tuyển dụng và không tự nhận mức chuyên gia khi chưa từng chịu trách nhiệm vận hành.
Kiến thức bổ trợ gồm {learning_topics}. Tôi thường học bằng tài liệu chính thức, tạo bài thực hành nhỏ, ghi câu hỏi còn mở và nhờ review. Sau mỗi chủ đề, tôi viết một trang tóm tắt về khi nào nên dùng, giới hạn và cách phát hiện sai sót thay vì chỉ lưu chứng chỉ hoàn thành.

KINH NGHIỆM LÀM VIỆC
{experience}

{project}

{problem}

{collaboration}

CHẤT LƯỢNG VÀ KIỂM CHỨNG
Tôi ưu tiên tiêu chí có thể quan sát được: dữ liệu đầu vào, điều kiện thử, log, checklist và xác nhận của người review. Khi một kết quả không có baseline, tôi mô tả theo phạm vi hoàn thành thay vì dùng các từ như tối ưu mạnh hoặc cải thiện đáng kể. Khi số liệu thuộc toàn đội, tôi ghi rõ phần mình phụ trách để tránh nhận toàn bộ thành tích.
Một lần bàn giao thường gồm mô tả thay đổi, trường hợp chính, trường hợp biên, giới hạn đã biết và hướng theo dõi sau phát hành. Nếu xảy ra lỗi, tôi lưu thời điểm, ảnh hưởng, cách tái hiện và hành động tiếp theo. Cách làm này giúp cuộc trao đổi tập trung vào bằng chứng và tạo dữ liệu cho lần cải tiến sau.

HỌC VẤN
{profile.education} | 2019 - 2023
Các học phần hoặc hoạt động có liên quan được mô tả theo sản phẩm đầu ra, không quy đổi điểm môn học thành số năm kinh nghiệm. Tôi từng trình bày đồ án trước hội đồng, tiếp nhận câu hỏi phản biện và cập nhật tài liệu sau góp ý. Nội dung khóa học trực tuyến được để ở phần bổ sung và không trộn với kinh nghiệm doanh nghiệp.

HOẠT ĐỘNG VÀ HỌC TẬP LIÊN TỤC
Mỗi quý tôi chọn một chủ đề, xác định đầu ra nhỏ và dành thời gian cố định để thực hành. Nhật ký học tập ghi nguồn tài liệu, giả định, lỗi gặp phải và điều chỉnh sau phản hồi. Tôi đã hỗ trợ một buổi chia sẻ nội bộ về cách viết checklist, trong đó người tham gia tự thực hiện ví dụ thay vì chỉ nghe trình bày.
Tôi cũng tham gia hoạt động cộng đồng với nhiệm vụ sắp xếp lịch, theo dõi đăng ký và tổng kết sau chương trình. Kinh nghiệm này không được xem là năng lực chuyên môn thay thế cho vị trí ứng tuyển, nhưng giúp tôi luyện cách giao tiếp rõ ràng, giữ cam kết và xử lý thông tin cá nhân có trách nhiệm.

NGOẠI NGỮ VÀ THÔNG TIN BỔ SUNG
Tiếng Anh: đọc tài liệu kỹ thuật ở mức có thể tra cứu thuật ngữ; giao tiếp cần thêm thời gian chuẩn bị. Tôi sẵn sàng thực hiện bài kiểm tra thực tế thay vì dùng mô tả chủ quan. Có thể bắt đầu sau khi hoàn tất thời gian bàn giao theo thỏa thuận.
Người tham chiếu và tài liệu dự án chỉ được cung cấp khi có sự đồng ý của bên liên quan. Mọi số liệu trong CV là thông tin tự khai và có thể được nhà tuyển dụng yêu cầu làm rõ trong phỏng vấn."""


def build_job_candidate_fixtures(
    jobs: list[JobFixture],
    output_dir: Path,
    run_id: str,
    email_domain: str,
    applications_per_job: int = 20,
    job_index_offset: int = 0,
    reuse_candidate_accounts: bool = False,
) -> list[JobCandidateFixture]:
    if applications_per_job != 20:
        raise ValueError("Ma trận chuẩn yêu cầu đúng 20 CV khác nhau cho mỗi job.")
    domain = email_domain.strip().lower()
    if not domain or "@" in domain:
        raise ValueError("E2E_CANDIDATE_EMAIL_DOMAIN phải là tên miền, không chứa @.")

    safe_run = _slug(run_id, 16)
    results: list[JobCandidateFixture] = []
    seen_job_emails: set[tuple[str, str]] = set()
    seen_contents: set[str] = set()
    for local_job_index, job in enumerate(jobs):
        job_index = job_index_offset + local_job_index
        identity_job_index = 0 if reuse_candidate_accounts else job_index
        family_name = _FAMILY_NAMES[identity_job_index % len(_FAMILY_NAMES)]
        job_dir = output_dir / job.key
        for profile_index, profile in enumerate(_COVERAGE_PROFILES):
            full_name = f"{family_name} {_GIVEN_NAMES[profile_index]}"
            email_scope = "shared" if reuse_candidate_accounts else _slug(job.key, 18)
            email = f"e2e.{safe_run}.{email_scope}.{profile_index + 1:02d}@{domain}"
            email_key = (job.key, email)
            if email_key in seen_job_emails:
                raise AssertionError(f"Email fixture bị trùng: {email}")
            seen_job_emails.add(email_key)
            global_index = identity_job_index * applications_per_job + profile_index + 1
            text = _build_cv_text(
                job,
                profile,
                profile_index,
                full_name,
                email,
                global_index,
            )
            normalized = re.sub(r"\s+", " ", text).strip()
            if normalized in seen_contents:
                raise AssertionError(f"Nội dung CV bị trùng tại {job.key}/{profile.key}.")
            seen_contents.add(normalized)
            word_count = len(normalized.split())
            if word_count < 900:
                raise ValueError(
                    f"CV {job.key}/{profile.key} chỉ có {word_count} từ, yêu cầu tối thiểu 900."
                )
            target, layout = _write_candidate_document(
                job_dir,
                f"cv_{profile_index + 1:02d}_{_slug(job.key)}_{safe_run}",
                full_name,
                text,
                profile_index,
                # Hai mẫu scan khó (variant 14/18) được giữ trong corpus parser để
                # chứng minh nhánh từ chối OCR. Batch ứng tuyển cần đủ 20 hồ sơ hợp lệ,
                # nên CV 11/14 dùng hai PDF text riêng, vẫn khác 18 bố cục còn lại.
                variant_override={10: 20, 13: 21}.get(profile_index),
            )
            covered_criteria = tuple(job.criteria[index].name for index in profile.criterion_indexes)
            expected_coverage = sum(job.criteria[index].weight for index in profile.criterion_indexes)
            expected_red_flag_rules = {
                "experience-skill": ("timeline_future_end",),
                "skills-experience": ("timeline_reversed",),
            }.get(profile.key, ())
            results.append(
                JobCandidateFixture(
                    job_key=job.key,
                    job_title=job.position,
                    index=profile_index + 1,
                    profile_key=profile.key,
                    profile_label=profile.label,
                    full_name=full_name,
                    email=email,
                    expected_criterion_coverage=expected_coverage,
                    covered_criteria=covered_criteria,
                    expected_red_flag_rules=expected_red_flag_rules,
                    document_path=target.resolve(),
                    layout=layout,
                    word_count=word_count,
                )
            )
    return results


def expected_coverage_scale() -> tuple[int, ...]:
    sample_weights = (12, 9, 8, 6, 20, 20, 15, 10)
    return tuple(
        sum(sample_weights[index] for index in profile.criterion_indexes)
        for profile in _COVERAGE_PROFILES
    )
