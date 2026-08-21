"""Sinh bộ dữ liệu kiểm thử đa ngành mà không cần backend hay database.

Đầu ra là dữ liệu hư cấu, có thể tái tạo hoàn toàn từ ``catalog.json``. Mục tiêu
là tạo đủ nội dung để đi qua các bước tách section, trích xuất kỹ năng, timeline,
đối sánh tiêu chí và khai phá Apriori/HUIM. Script này không đọc cấu hình ứng
dụng, không mở kết nối mạng và không ghi vào SQL Server.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path
from typing import Any


PYTHON_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = PYTHON_ROOT / "test_data" / "offline_benchmark" / "catalog.json"
DEFAULT_OUTPUT = PYTHON_ROOT / "test_data" / "offline_benchmark" / "generated"
LOCATIONS = [
    "Thành phố Hồ Chí Minh",
    "Hà Nội",
    "Đà Nẵng",
    "Cần Thơ",
    "Hải Phòng",
    "Làm việc kết hợp tại Thành phố Hồ Chí Minh",
]

CV_CASE_TYPES = (
    "strong_documented",
    "preferred_skill_gap",
    "experience_below_requirement",
    "transferable_education",
    "language_needs_verification",
)


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")


def _month_point(index: int) -> tuple[int, int]:
    return index // 12, index % 12 + 1


def _periods(total_months: int) -> tuple[str, str]:
    """Tạo hai giai đoạn liền nhau, tổng số tháng không cộng trùng."""
    end_index = 2026 * 12 + 7  # tháng 08/2026, chỉ số bắt đầu từ 0
    second_months = max(8, round(total_months * 0.58))
    first_months = total_months - second_months
    first_start = end_index - total_months + 1
    first_end = first_start + first_months - 1
    second_start = first_end + 1
    first_start_year, first_start_month = _month_point(first_start)
    first_end_year, first_end_month = _month_point(first_end)
    second_start_year, second_start_month = _month_point(second_start)
    return (
        f"{first_start_month:02d}/{first_start_year} - {first_end_month:02d}/{first_end_year}",
        f"{second_start_month:02d}/{second_start_year} - 08/2026",
    )


def _candidate_case(
    variant_index: int,
    domain: dict[str, Any],
    role: dict[str, Any],
    level: dict[str, Any],
) -> dict[str, Any]:
    case_type = CV_CASE_TYPES[(variant_index - 1) % len(CV_CASE_TYPES)]
    cycle = (variant_index - 1) // len(CV_CASE_TYPES)
    skills = list(dict.fromkeys(
        domain["common_skills"] + role["required_skills"] + role["preferred_skills"]
    ))
    experience_months = level["experience_months"] + cycle * 2
    degree = domain["degrees"][cycle % len(domain["degrees"])]
    language_level = "Tiếng Anh B2"
    expected_findings = [
        "Có bằng chứng kỹ năng trong kinh nghiệm và dự án",
        "Đủ thời lượng kinh nghiệm theo mốc thời gian",
    ]
    omitted_skills: list[str] = []

    if case_type == "preferred_skill_gap":
        omitted = set(role["preferred_skills"][1:])
        omitted_skills = sorted(omitted)
        skills = [skill for skill in skills if skill not in omitted]
        expected_findings = [
            "Đáp ứng kỹ năng bắt buộc",
            "Thiếu một phần kỹ năng ưu tiên và cần lộ trình bổ sung",
        ]
    elif case_type == "experience_below_requirement":
        experience_months = max(9, level["minimum_months"] - 3)
        expected_findings = [
            "Có kỹ năng đúng vị trí",
            "Thời lượng kinh nghiệm thấp hơn yêu cầu và không được tự cộng thêm",
        ]
    elif case_type == "transferable_education":
        degree = "Quản trị kinh doanh ứng dụng"
        expected_findings = [
            "Kinh nghiệm và dự án liên quan",
            "Học vấn khác ngành cần HR xem xét theo bằng chứng thay thế",
        ]
    elif case_type == "language_needs_verification":
        language_level = "Tiếng Anh A2 đang học lên B1"
        expected_findings = [
            "Năng lực chuyên môn có bằng chứng",
            "Ngoại ngữ chưa đạt B2 và cần kiểm tra độc lập",
        ]
    else:
        expected_findings.append("Có kết quả định lượng nhưng vẫn cần xác minh khi phỏng vấn")

    return {
        "case_type": case_type,
        "skills": skills,
        "experience_months": experience_months,
        "degree": degree,
        "language_level": language_level,
        "expected_findings": expected_findings,
        "omitted_skills": omitted_skills,
        "case_cycle": cycle + 1,
    }


def _criteria_for(job: dict[str, Any]) -> list[dict[str, Any]]:
    required = job["required_skills"]
    preferred = job["preferred_skills"]
    common = job["common_skills"]
    definitions: list[tuple[str, int, str]] = [
        (required[0], 10, "REQUIRED"),
        (required[1], 10, "REQUIRED"),
        (required[2], 10, "REQUIRED"),
        (common[0], 8, "REQUIRED"),
        (common[1], 8, "PREFERRED"),
        (preferred[0], 7, "PREFERRED"),
        (preferred[1], 7, "PREFERRED"),
    ]
    criteria = [
        {
            "name": f"Năng lực {skill}",
            "weight": weight,
            "criterionType": "SKILL",
            "priorityLevel": priority,
            "operator": "EXISTS",
            "targetValue": skill,
            "evidenceSources": "SKILLS,EXPERIENCE,PROJECTS",
            "minDurationMonths": None,
        }
        for skill, weight, priority in definitions
    ]
    criteria.extend(
        [
            {
                "name": "Kinh nghiệm làm việc liên quan",
                "weight": 18,
                "criterionType": "TOTAL_EXPERIENCE",
                "priorityLevel": "REQUIRED",
                "operator": "MINIMUM",
                "targetValue": f"{job['minimum_months']} tháng",
                "evidenceSources": "EXPERIENCE",
                "minDurationMonths": job["minimum_months"],
            },
            {
                "name": f"Nền tảng học vấn {job['degree']}",
                "weight": 8,
                "criterionType": "EDUCATION",
                "priorityLevel": "PREFERRED",
                "operator": "IN",
                "targetValue": job["degree"],
                "evidenceSources": "EDUCATION",
                "minDurationMonths": None,
            },
            {
                "name": "Tiếng Anh B2",
                "weight": 7,
                "criterionType": "LANGUAGE",
                "priorityLevel": "PREFERRED",
                "operator": "MINIMUM",
                "targetValue": "Tiếng Anh B2",
                "evidenceSources": "LANGUAGES",
                "minDurationMonths": None,
            },
            {
                "name": f"Địa điểm {job['location']}",
                "weight": 7,
                "criterionType": "LOCATION_WORK_MODE",
                "priorityLevel": "PREFERRED",
                "operator": "IN",
                "targetValue": job["location"],
                "evidenceSources": "CONTACT",
                "minDurationMonths": None,
            },
        ]
    )
    return criteria


def _job_text(job: dict[str, Any], domain: dict[str, Any], role: dict[str, Any]) -> str:
    responsibility_lines = "\n".join(
        f"- {item.capitalize()}; chủ động làm rõ đầu vào, ghi nhận quyết định và báo cáo kết quả theo tuần."
        for item in role["responsibilities"]
    )
    required_lines = "\n".join(
        f"- {skill}: có thể trình bày cách đã áp dụng, phạm vi trách nhiệm, vấn đề gặp phải và kết quả đạt được."
        for skill in role["required_skills"]
    )
    preferred_lines = "\n".join(
        f"- {skill}: được xem là lợi thế khi có dự án hoặc sản phẩm minh chứng, không tự động loại ứng viên nếu chưa có."
        for skill in role["preferred_skills"]
    )
    criteria_lines = "\n".join(
        f"- {item['name']}: {item['weight']}%, mức {item['priorityLevel']}, nguồn {item['evidenceSources']}."
        for item in job["criteria"]
    )
    return f"""TIN TUYỂN DỤNG HƯ CẤU DÙNG CHO BENCHMARK OFFLINE
Vị trí: {job['title']}
Lĩnh vực: {domain['name']}
Cấp bậc: {job['level_name']}
Địa điểm: {job['location']}
Mã kiểm thử: {job['id']}

BỐI CẢNH VÀ MỤC TIÊU VAI TRÒ
Doanh nghiệp mô phỏng đang mở rộng hoạt động {domain['description'].lower()} Vị trí {job['title']} chịu trách nhiệm tạo ra {role['primary_output']}. Người đảm nhiệm làm việc cùng quản lý trực tiếp, các đơn vị nghiệp vụ và nhóm hỗ trợ để chuyển yêu cầu thành kế hoạch có mốc kiểm tra. Đây là dữ liệu kiểm thử nên mọi tên tổ chức, số liệu và tình huống đều hư cấu; nội dung được viết dài để thuật toán phải xử lý đủ section thay vì chỉ đối chiếu một danh sách từ khóa ngắn.

TRÁCH NHIỆM CÔNG VIỆC
{responsibility_lines}
- Quản lý danh sách rủi ro, phụ thuộc và thay đổi phạm vi; thông báo sớm khi kết quả có nguy cơ trễ hoặc không đạt tiêu chuẩn.
- Lưu tài liệu bàn giao, hướng dẫn vận hành và bằng chứng nghiệm thu để thành viên khác có thể tiếp tục công việc.
- Tham gia họp cải tiến định kỳ, phân tích nguyên nhân gốc và lựa chọn hành động có người phụ trách cùng thời hạn cụ thể.

YÊU CẦU BẮT BUỘC
{required_lines}
- Có ít nhất {job['minimum_months']} tháng kinh nghiệm được mô tả bằng mốc thời gian rõ ràng; các giai đoạn chồng lắp không được cộng hai lần.
- Có năng lực {job['common_skills'][0]} và {job['common_skills'][1]} trong bối cảnh công việc thực tế của ngành {domain['name']}.
- Có khả năng đọc hiểu tài liệu và trao đổi công việc bằng Tiếng Anh B2 hoặc mức tương đương.

YÊU CẦU ƯU TIÊN
{preferred_lines}
- Tốt nghiệp ngành {job['degree']} hoặc ngành gần; kinh nghiệm và dự án tương đương vẫn được HR xem xét theo bằng chứng.
- Có thói quen ghi nhận giả định, chỉ số đầu vào, kết quả đầu ra và bài học sau mỗi giai đoạn triển khai.

KẾT QUẢ KỲ VỌNG TRONG 90 NGÀY
- Hoàn tất tiếp nhận quy trình, tài liệu và các bên liên quan trong 30 ngày đầu.
- Tự chịu trách nhiệm một đầu việc có tiêu chí nghiệm thu rõ trong 60 ngày, cập nhật tiến độ và rủi ro minh bạch.
- Đề xuất ít nhất một cải tiến có số đo trước và sau trong 90 ngày; không dùng số liệu không có nguồn để tuyên bố thành tích.

TIÊU CHÍ ĐỐI SÁNH CÓ CẤU TRÚC
{criteria_lines}
Tổng trọng số: 100%. Điểm chỉ phản ánh mức khớp với tin này; không chứng minh thông tin ứng viên là đúng và không thay quyết định phỏng vấn của HR.

ĐIỀU KIỆN LÀM VIỆC VÀ QUYỀN LỢI
Làm việc toàn thời gian tại {job['location']}, có quy trình hội nhập, người hướng dẫn và đánh giá mục tiêu định kỳ. Thu nhập được trao đổi theo phạm vi công việc và bằng chứng năng lực. Nhân sự được cấp công cụ làm việc, tham gia chương trình học tập nội bộ và có ngày nghỉ theo quy định. Các quyền lợi này chỉ phục vụ độ dài và tính đầy đủ của JD, không được đưa vào tín hiệu chấm kỹ năng.
"""


def _cv_text(
    candidate: dict[str, Any],
    domain: dict[str, Any],
    role: dict[str, Any],
    adjacent_role: dict[str, Any],
) -> str:
    first_period, second_period = _periods(candidate["experience_months"])
    all_skills = candidate["skills"]
    skill_line = ", ".join(all_skills)
    responsibilities = role["responsibilities"]
    required_examples = [skill for skill in role["required_skills"] if skill in all_skills]
    supporting_examples = [skill for skill in role["preferred_skills"] if skill in all_skills]
    safe_examples = required_examples + supporting_examples + list(domain["common_skills"])
    while len(safe_examples) < 6:
        safe_examples.append(domain["common_skills"][len(safe_examples) % len(domain["common_skills"])])
    metric_seed = candidate["sequence"]
    handled_volume = 24 + metric_seed % 47
    turnaround_gain = 8 + metric_seed % 19
    quality_gain = 5 + metric_seed % 14
    incident_count = 2 + metric_seed % 6
    stakeholder_count = 3 + metric_seed % 5
    artifact_count = 4 + metric_seed % 7
    evidence_artifacts = (
        "biên bản phân tích và tiêu chí nghiệm thu",
        "bộ dữ liệu kiểm tra cùng nhật ký sai lệch",
        "dashboard theo dõi khối lượng và chất lượng",
        "tài liệu thiết kế, quyết định và phương án quay lui",
        "checklist bàn giao cùng hướng dẫn vận hành",
    )
    skill_evidence_lines = []
    for skill_index, skill in enumerate(all_skills):
        responsibility = responsibilities[skill_index % len(responsibilities)]
        artifact = evidence_artifacts[skill_index % len(evidence_artifacts)]
        sample_size = 12 + ((metric_seed + skill_index * 7) % 39)
        skill_evidence_lines.append(
            f"- {skill}: áp dụng khi {responsibility}; đầu ra gồm {artifact}; "
            f"phạm vi thử nghiệm {sample_size} trường hợp và có người phụ trách rà soát chéo."
        )
    skill_evidence = "\n".join(skill_evidence_lines)
    omitted_note = ""
    if candidate.get("omitted_skills"):
        omitted_note = (
            "Các kỹ năng " + ", ".join(candidate["omitted_skills"])
            + " mới dừng ở mức tìm hiểu tài liệu, chưa có sản phẩm hoặc kinh nghiệm đủ để đưa vào danh sách kỹ năng."
        )
    evidence_note = {
        "strong_documented": "Hồ sơ có mô tả hành động và kết quả tương đối đầy đủ; số liệu vẫn là lời tự khai cần xác minh.",
        "preferred_skill_gap": "Hồ sơ tập trung vào yêu cầu bắt buộc; nhóm kỹ năng mở rộng chưa có đủ bằng chứng sử dụng thực tế.",
        "experience_below_requirement": "Các mốc thời gian được khai rõ nhưng tổng thời lượng thấp hơn yêu cầu của tin tuyển dụng.",
        "transferable_education": "Chuyên ngành đào tạo không trùng yêu cầu; kinh nghiệm và dự án được cung cấp làm bằng chứng chuyển đổi.",
        "language_needs_verification": "Khả năng ngoại ngữ đang ở mức cơ bản và không được mô tả như đã đạt B2.",
    }[candidate["case_type"]]
    return f"""HỒ SƠ ỨNG VIÊN HƯ CẤU DÙNG CHO BENCHMARK OFFLINE
Mã hồ sơ: {candidate['id']}
Họ tên: Ứng viên mô phỏng {candidate['sequence']:03d}
Email: ungvien{candidate['sequence']:03d}@example.test
Điện thoại: 090000{candidate['sequence']:04d}
Địa điểm mong muốn: {candidate['location']}
Vị trí mục tiêu: {candidate['target_title']} - cấp bậc {candidate['level_name']}

MỤC TIÊU NGHỀ NGHIỆP
Tôi mong muốn tiếp tục phát triển trong lĩnh vực {domain['name']}, tập trung vào vai trò {candidate['target_title']}. Mục tiêu trong hai năm tới là chịu trách nhiệm trọn vẹn cho {role['primary_output']}, đồng thời cải thiện khả năng phối hợp, đo lường kết quả và chuyển giao tri thức. Tôi ưu tiên môi trường có yêu cầu rõ, phản hồi định kỳ và đánh giá dựa trên bằng chứng công việc thay vì chỉ dựa trên tên chức danh.

TÓM TẮT NĂNG LỰC
Tôi có tổng cộng khoảng {candidate['experience_months']} tháng kinh nghiệm không cộng trùng qua hai giai đoạn liên tục. Các năng lực có thể đối chiếu trong hồ sơ gồm {', '.join(all_skills)}. Trong công việc, tôi thường bắt đầu bằng việc làm rõ mục tiêu, dữ liệu đầu vào, người ra quyết định và tiêu chí nghiệm thu. Sau mỗi đợt triển khai, tôi lưu lại kết quả, sai lệch và hành động cải tiến để nhóm có thể tái sử dụng. {evidence_note} {omitted_note}

KINH NGHIỆM LÀM VIỆC
{adjacent_role['title']} | Công ty Mô phỏng Khởi Điểm | {first_period}
- Tham gia {adjacent_role['responsibilities'][0]}, tổng hợp yêu cầu từ ba nhóm liên quan và chuyển thành danh sách công việc có mức ưu tiên.
- Sử dụng {domain['common_skills'][0]}, {domain['common_skills'][1]} và {safe_examples[0]} để hoàn thành đầu việc; ghi nhận phạm vi, giả định và kết quả trong biên bản bàn giao.
- Phối hợp với {stakeholder_count} nhóm rà soát dữ liệu đầu vào mỗi tuần, xử lý trung bình {handled_volume} yêu cầu mỗi tháng và ghi riêng các trường hợp thiếu thông tin trước khi chuyển sang bước thực hiện.
- Hỗ trợ xây dựng hướng dẫn thao tác, checklist kiểm tra và bảng theo dõi để người mới có thể tiếp nhận công việc mà không phụ thuộc vào trao đổi miệng.
- Đối chiếu kết quả trên mẫu {handled_volume + 11} trường hợp; sau hai vòng cải tiến, thời gian phản hồi trong bộ dữ liệu mô phỏng giảm {turnaround_gain}% so với mốc ban đầu.

{candidate['target_title']} | Công ty Mô phỏng Phát Triển | {second_period}
- Chịu trách nhiệm {responsibilities[0]}, xác định tiêu chí hoàn thành và cập nhật tiến độ cho quản lý cùng các bên sử dụng kết quả.
- Trực tiếp {responsibilities[1]}, vận dụng {safe_examples[1]}, {safe_examples[2]} và {safe_examples[3]} trong một quy trình có bước kiểm tra chéo.
- Chủ trì {responsibilities[2]}, bổ sung {safe_examples[4]} và {safe_examples[5]} khi phạm vi phù hợp; mọi kết quả đều được lưu cùng nguồn dữ liệu kiểm chứng.
- Phối hợp {responsibilities[3]}, phân tích nguyên nhân gốc cho {incident_count} nhóm lỗi lặp lại và thống nhất hành động phòng ngừa với người phụ trách cụ thể.
- Xây dựng báo cáo tháng gồm khối lượng, chất lượng, thời gian xử lý và rủi ro. Trong kịch bản hư cấu, cải tiến giúp giảm {turnaround_gain}% thời gian chờ và tăng {quality_gain}% tỷ lệ hoàn thành đúng hạn; số liệu được đối chiếu từ bảng theo dõi trước và sau thay đổi.
- Hướng dẫn hai thành viên tiếp nhận quy trình, tổ chức phiên rà soát sau triển khai và cập nhật {artifact_count} tài liệu để giảm phụ thuộc vào kiến thức truyền miệng.

DỰ ÁN TIÊU BIỂU
Dự án chuẩn hóa {role['primary_output']} | 01/2026 - 06/2026
- Bối cảnh: quy trình mô phỏng có nhiều nguồn đầu vào, định nghĩa hoàn thành không thống nhất và khó truy vết khi phát sinh sai lệch.
- Nhiệm vụ: xây dựng cách làm chung, thử nghiệm trên một phạm vi nhỏ và trình bày kết quả cho các bên liên quan trước khi mở rộng.
- Hành động: sử dụng {safe_examples[0]}, {safe_examples[1]}, {safe_examples[2]}, kết hợp {safe_examples[4]} để thiết kế luồng, checklist và báo cáo kiểm soát.
- Kết quả: hoàn thành đúng mốc thử nghiệm trên {handled_volume + 18} trường hợp, xác định {incident_count} nhóm lỗi thường gặp và tạo tài liệu bàn giao gồm quy trình, điều kiện đầu vào, tiêu chí nghiệm thu và phương án quay lui.
- Cách đo: so sánh cùng loại đầu việc trong bốn tuần trước và bốn tuần sau; loại các yêu cầu bị chờ do bên ngoài để không thổi phồng kết quả.

Dự án cải thiện khả năng truy vết và bàn giao | 09/2025 - 12/2025
- Vấn đề: nhóm mất nhiều thời gian tìm lại quyết định cũ và không xác định được phiên bản tài liệu nào đang được sử dụng.
- Vai trò: chịu trách nhiệm khảo sát luồng hiện tại, thống nhất cấu trúc lưu trữ và thử nghiệm với một nhóm nhỏ trước khi áp dụng rộng hơn.
- Thực hiện: kết hợp {safe_examples[1]}, {safe_examples[3]} và {domain['common_skills'][2]} để liên kết yêu cầu, người phê duyệt, đầu ra và lịch sử thay đổi.
- Kết quả: chuẩn hóa {artifact_count} loại tài liệu, hoàn tất bàn giao cho {stakeholder_count} nhóm và giảm {quality_gain}% trường hợp phải hỏi lại thông tin đã thống nhất trong dữ liệu mô phỏng.

BẰNG CHỨNG SỬ DỤNG KỸ NĂNG
{skill_evidence}
Mức độ nêu trên phản ánh phạm vi tự khai trong CV synthetic. Tên kỹ năng xuất hiện trong danh sách nhưng không có hành động, đầu ra hoặc phạm vi đi kèm chỉ nên được xem là thông tin cần làm rõ.

KỸ NĂNG
{skill_line}
Mức sử dụng: nhóm kỹ năng bắt buộc đã được áp dụng trong kinh nghiệm hoặc dự án nêu trên; nhóm ưu tiên có mức độ từ cơ bản đến khá và cần được xác minh thêm bằng phỏng vấn hoặc bài thực hành.

HỌC VẤN
Cử nhân {candidate['degree']} | Trường Đại học Mô phỏng Việt Nam | 09/2017 - 06/2021
Đồ án tốt nghiệp nghiên cứu một quy trình thuộc {domain['name']}, có bước khảo sát yêu cầu, thiết kế giải pháp, thử nghiệm, đánh giá giới hạn và trình bày kết quả. Thông tin trường và đề tài hoàn toàn hư cấu, không liên quan cá nhân thật.

CHỨNG CHỈ VÀ HỌC TẬP BỔ SUNG
- Chứng nhận Nền tảng {candidate['target_title']} do Trung tâm Mô phỏng cấp năm 2025; dùng để kiểm thử mục chứng chỉ, không phải chứng chỉ thật.
- Khóa học về {role['preferred_skills'][2]} gồm bài tập tình huống, bài kiểm tra cuối khóa và nhật ký tự đánh giá.
- Tự học theo kế hoạch quý, ưu tiên khoảng trống được xác nhận từ phản hồi công việc thay vì thêm kỹ năng chỉ để làm dài hồ sơ.

NGOẠI NGỮ
{candidate['language_level']}: khả năng đọc tài liệu, viết email và trao đổi công việc được mô tả đúng theo mức tự khai này. Mức độ là dữ liệu mô phỏng và cần được kiểm tra riêng nếu dùng trong một quy trình tuyển dụng thực tế.

HOẠT ĐỘNG VÀ NGUYÊN TẮC LÀM VIỆC
Tham gia nhóm chia sẻ kiến thức nội bộ mỗi tháng, chuẩn bị ví dụ thực hành và ghi lại câu hỏi chưa giải đáp. Khi báo cáo, tôi phân biệt rõ dữ kiện đã kiểm chứng, giả định đang sử dụng và ý kiến cá nhân. Tôi không xem điểm đối sánh tự động là kết luận tuyển dụng; các thông tin về thời lượng, vai trò và thành tích cần được HR xác minh bằng phỏng vấn hoặc tài liệu phù hợp.
"""


def build_dataset(catalog: dict[str, Any]) -> dict[str, Any]:
    jobs: list[dict[str, Any]] = []
    cvs: list[dict[str, Any]] = []
    pairs: list[dict[str, Any]] = []
    sequence = 1

    for domain_index, domain in enumerate(catalog["domains"]):
        roles = domain["roles"]
        for role_index, role in enumerate(roles):
            for level_index, level in enumerate(catalog["levels"]):
                location = LOCATIONS[(domain_index + role_index + level_index) % len(LOCATIONS)]
                base_id = f"{domain['code']}--{role['code']}--{level['code']}"
                job = {
                    "id": f"job--{base_id}",
                    "domain_code": domain["code"],
                    "domain_name": domain["name"],
                    "position_code": role["code"],
                    "title": f"{role['title']} ({level['name']})",
                    "level_code": level["code"],
                    "level_name": level["name"],
                    "location": location,
                    "minimum_months": level["minimum_months"],
                    "degree": domain["degrees"][0],
                    "common_skills": list(domain["common_skills"]),
                    "required_skills": list(role["required_skills"]),
                    "preferred_skills": list(role["preferred_skills"]),
                }
                job["criteria"] = _criteria_for(job)
                job["description"] = _job_text(job, domain, role)
                jobs.append(job)

                adjacent = roles[(role_index + 1) % len(roles)]
                variant_count = max(1, int(domain.get("cv_variants_per_job", 1)))
                for variant_index in range(1, variant_count + 1):
                    case = _candidate_case(variant_index, domain, role, level)
                    candidate = {
                        "id": f"cv--{base_id}--v{variant_index}",
                        "sequence": sequence,
                        "variant": variant_index,
                        "domain_code": domain["code"],
                        "domain_name": domain["name"],
                        "target_position_code": role["code"],
                        "target_title": role["title"],
                        "level_code": level["code"],
                        "level_name": level["name"],
                        "location": location,
                        "degree": case["degree"],
                        "experience_months": case["experience_months"],
                        "skills": case["skills"],
                        "case_type": case["case_type"],
                        "case_cycle": case["case_cycle"],
                        "language_level": case["language_level"],
                        "expected_findings": case["expected_findings"],
                        "omitted_skills": case["omitted_skills"],
                    }
                    candidate["text"] = _cv_text(candidate, domain, role, adjacent)
                    cvs.append(candidate)
                    sequence += 1

    job_by_key = {
        (item["domain_code"], item["position_code"], item["level_code"]): item
        for item in jobs
    }
    for domain_index, domain in enumerate(catalog["domains"]):
        roles = domain["roles"]
        # Phép quay một ngành giữ số CV negative phân bổ đều cho mọi JD.
        # Không ép chọn ngành có điểm thấp nhất vì cách đó sẽ làm benchmark
        # đẹp nhân tạo và che mất các trường hợp kỹ năng chuyển đổi.
        negative_domain = catalog["domains"][(domain_index + 1) % len(catalog["domains"])]
        for role_index, role in enumerate(roles):
            for level in catalog["levels"]:
                strong = job_by_key[(domain["code"], role["code"], level["code"])]
                partial_role = roles[(role_index + 1) % len(roles)]
                partial = job_by_key[(domain["code"], partial_role["code"], level["code"])]
                negative_role = negative_domain["roles"][role_index % len(negative_domain["roles"])]
                negative = job_by_key[(negative_domain["code"], negative_role["code"], level["code"])]
                variant_count = max(1, int(domain.get("cv_variants_per_job", 1)))
                for variant_index in range(1, variant_count + 1):
                    cv_id = f"cv--{domain['code']}--{role['code']}--{level['code']}--v{variant_index}"
                    pairs.extend(
                        [
                            {"cv_id": cv_id, "job_id": strong["id"], "scenario": "strong_same_role"},
                            {"cv_id": cv_id, "job_id": partial["id"], "scenario": "partial_same_domain"},
                            {"cv_id": cv_id, "job_id": negative["id"], "scenario": "negative_cross_domain"},
                        ]
                    )

    taxonomy = sorted({skill for item in jobs for skill in item["common_skills"] + item["required_skills"] + item["preferred_skills"]})
    candidates_per_job: dict[str, set[str]] = {item["id"]: set() for item in jobs}
    for pair in pairs:
        candidates_per_job[pair["job_id"]].add(pair["cv_id"])
    case_counts = {
        case_type: sum(1 for item in cvs if item["case_type"] == case_type)
        for case_type in CV_CASE_TYPES
    }
    job_candidate_counts = [len(items) for items in candidates_per_job.values()]
    return {
        "metadata": {
            "schema_version": catalog["schema_version"],
            "dataset_kind": catalog["dataset_kind"],
            "notice": catalog["notice"],
            "reference_date": catalog["reference_date"],
            "generated_on": date.today().isoformat(),
            "domain_count": len(catalog["domains"]),
            "position_count": sum(len(item["roles"]) for item in catalog["domains"]),
            "level_count": len(catalog["levels"]),
            "job_count": len(jobs),
            "cv_count": len(cvs),
            "pair_count": len(pairs),
            "scenario_count": 3,
            "case_type_count": len(CV_CASE_TYPES),
            "case_counts": case_counts,
            "min_distinct_candidates_per_job": min(job_candidate_counts),
            "max_distinct_candidates_per_job": max(job_candidate_counts),
        },
        "taxonomy": taxonomy,
        "jobs": jobs,
        "cvs": cvs,
        "pairs": pairs,
    }


def write_dataset(dataset: dict[str, Any], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    files = {
        "metadata.json": dataset["metadata"],
        "taxonomy.json": dataset["taxonomy"],
        "jobs.json": dataset["jobs"],
        "cvs.json": dataset["cvs"],
        "pairs.json": dataset["pairs"],
    }
    for name, payload in files.items():
        (output_dir / name).write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    dataset = build_dataset(catalog)
    write_dataset(dataset, args.output)
    metadata = dataset["metadata"]
    print(
        "Đã sinh benchmark offline: "
        f"{metadata['domain_count']} ngành, {metadata['position_count']} vị trí, "
        f"{metadata['job_count']} JD, {metadata['cv_count']} CV, {metadata['pair_count']} cặp đối sánh."
    )
    print(f"Thư mục đầu ra: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
