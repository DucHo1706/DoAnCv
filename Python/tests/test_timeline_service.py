import unittest
from datetime import date

from services.timeline_service import extract_experience_timeline
from services.scoring_service import reconcile_timeline_criteria


class TimelineServiceTests(unittest.TestCase):
    def test_accepts_strict_numeric_period_when_ocr_drops_separator(self):
        result = extract_experience_timeline("Backend Developer | 01/2024 06/2025\nASP.NET Core", ["ASP.NET Core"])
        self.assertEqual(result["total_experience_months"], 18)
        self.assertEqual(len(result["experiences"]), 1)

    def test_removes_overlapping_months_and_counts_skill_time(self):
        text = """KINH NGHIỆM
DevOps Engineer - Công ty A
01/2023 - 12/2024
Triển khai Docker, Linux và CI/CD.
DỰ ÁN NỘI BỘ
06/2023 - 06/2024
Vận hành Docker cho hệ thống thử nghiệm.
"""
        result = extract_experience_timeline(text, ["Docker", "Linux"], date(2026, 8, 20))
        self.assertEqual(result["total_experience_months"], 24)
        self.assertEqual(result["skill_experience_months"]["Docker"], 24)
        self.assertFalse(result["overlap_detected"])
        self.assertEqual(result["source_scope"], "experience_sections")

    def test_one_job_and_one_hundred_overlapping_jobs_are_both_twelve_months(self):
        single_job = """KINH NGHIỆM LÀM VIỆC
Backend Developer - Công ty A
01/2025 - 12/2025
Phát triển REST API bằng ASP.NET Core và SQL Server.
"""
        many_jobs = "KINH NGHIỆM LÀM VIỆC\n" + "\n".join(
            f"Backend Developer {index:03d} - Đơn vị {index:03d}\n"
            "01/2025 - 12/2025\n"
            "Phát triển REST API bằng ASP.NET Core và SQL Server."
            for index in range(1, 101)
        )

        single_result = extract_experience_timeline(
            single_job,
            ["ASP.NET Core", "SQL Server"],
            date(2026, 8, 20),
        )
        many_result = extract_experience_timeline(
            many_jobs,
            ["ASP.NET Core", "SQL Server"],
            date(2026, 8, 20),
        )

        self.assertEqual(single_result["total_experience_months"], 12)
        self.assertEqual(many_result["total_experience_months"], 12)
        self.assertEqual(single_result["skill_experience_months"]["ASP.NET Core"], 12)
        self.assertEqual(many_result["skill_experience_months"]["ASP.NET Core"], 12)
        self.assertFalse(single_result["overlap_detected"])
        self.assertTrue(many_result["overlap_detected"])

    def test_does_not_count_project_or_education_period_as_work_experience(self):
        text = """KINH NGHIỆM LÀM VIỆC
Backend Developer
01/2024 - 12/2025
Phát triển REST API bằng ASP.NET Core.

DỰ ÁN
01/2022 - 06/2022
Xây dựng đồ án học tập.

HỌC VẤN
09/2018 - 06/2022
Cử nhân Công nghệ thông tin.
"""
        result = extract_experience_timeline(text, ["ASP.NET Core"], date(2026, 8, 20))
        self.assertEqual(result["total_experience_months"], 24)
        self.assertEqual(len(result["experiences"]), 1)
        self.assertEqual(result["source_scope"], "experience_sections")

    def test_supports_present_and_english_month(self):
        text = """Professional Experience
Platform Engineer
Jan 2025 - Present
Built Kubernetes deployment pipelines.
"""
        result = extract_experience_timeline(text, ["Kubernetes"], date(2026, 8, 20))
        self.assertEqual(result["experiences"][0]["start_date"], "2025-01")
        self.assertEqual(result["experiences"][0]["end_date"], "2026-08")
        self.assertTrue(result["experiences"][0]["is_current"])
        self.assertEqual(result["skill_experience_months"]["Kubernetes"], 20)

    def test_year_only_is_marked_for_verification_and_gap_is_not_fraud(self):
        text = """Backend Developer
2020 - 2021
Phát triển API.
DevOps Engineer
2023 - 2024
Triển khai Linux.
"""
        result = extract_experience_timeline(text, ["Linux"], date(2026, 8, 20))
        self.assertTrue(result["experiences"][0]["needs_verification"])
        self.assertEqual(result["gaps"][0]["duration_months"], 12)
        self.assertIn("chưa được mô tả", result["gaps"][0]["message"])

    def test_current_year_without_month_does_not_extend_into_future(self):
        result = extract_experience_timeline(
            "Kỹ sư phần mềm\n2022 - 2026\nPhát triển hệ thống nội bộ.",
            [],
            date(2026, 8, 20),
        )
        experience = result["experiences"][0]
        self.assertEqual(experience["end_date"], "2026-08")
        self.assertTrue(experience["needs_verification"])

    def test_future_end_is_flagged_but_not_counted_after_analysis_month(self):
        result = extract_experience_timeline(
            "KINH NGHIỆM\n01/2024 - 10/2026 | Backend Developer\nPhát triển REST API.",
            ["REST API"],
            date(2026, 8, 24),
        )

        self.assertEqual(result["total_experience_months"], 32)
        self.assertTrue(result["future_date_detected"])
        self.assertEqual(result["experiences"][0]["end_date"], "2026-08")
        self.assertEqual(result["experiences"][0]["declared_end_date"], "2026-10")
        self.assertTrue(result["experiences"][0]["needs_verification"])

    def test_period_entirely_in_future_is_not_counted_as_experience(self):
        result = extract_experience_timeline(
            "KINH NGHIỆM\n10/2026 - 12/2026 | Backend Developer\nPhát triển REST API.",
            ["REST API"],
            date(2026, 8, 24),
        )

        self.assertEqual(result["total_experience_months"], 0)
        self.assertEqual(result["experiences"], [])
        self.assertEqual(len(result["future_periods"]), 1)
        self.assertTrue(result["future_date_detected"])

    def test_returns_insufficient_instead_of_inventing_timeline(self):
        result = extract_experience_timeline("Kỹ năng: Docker, Linux", ["Docker", "Linux"])
        self.assertTrue(result["insufficient_data"])
        self.assertEqual(result["total_experience_months"], 0)

    def test_timeline_overrides_llm_duration_for_skill_criterion(self):
        timeline = extract_experience_timeline(
            "01/2025 - 12/2025\nTriển khai Docker trong dự án.",
            ["Docker"],
            date(2026, 8, 20),
        )
        scoring = {
            "criteria_results": [{
                "criterion_name": "Kinh nghiệm Docker",
                "weight": 100,
                "score": 100,
                "match_level": "FULL",
            }]
        }
        criteria = [{
            "name": "Kinh nghiệm Docker",
            "weight": 100,
            "criterionType": "SKILL_EXPERIENCE",
            "targetValue": "Docker",
            "minDurationMonths": 24,
        }]
        result = reconcile_timeline_criteria(scoring, criteria, timeline)
        self.assertEqual(result["criteria_results"][0]["extracted_value"], "12 tháng")
        self.assertEqual(result["criteria_results"][0]["match_level"], "PARTIAL")
        self.assertLessEqual(result["total_score"], 70)

    def test_zero_month_requirement_does_not_invent_experience(self):
        scoring = {
            "criteria_results": [{
                "criterion_name": "Kinh nghiệm Fresher",
                "weight": 100,
                "score": 0,
            }]
        }
        criteria = [{
            "name": "Kinh nghiệm Fresher",
            "weight": 100,
            "criterionType": "TOTAL_EXPERIENCE",
            "minDurationMonths": 0,
        }]
        timeline = {
            "insufficient_data": True,
            "total_experience_months": 0,
            "skill_experience_months": {},
            "experiences": [],
            "confidence": 0,
        }
        result = reconcile_timeline_criteria(scoring, criteria, timeline)
        item = result["criteria_results"][0]
        self.assertEqual(item["match_level"], "INSUFFICIENT_DATA")
        self.assertEqual(item["score"], 0)
        self.assertEqual(item["extracted_value"], "0 tháng")

    def test_zero_month_requirement_accepts_an_observed_timeline(self):
        scoring = {
            "criteria_results": [{
                "criterion_name": "Kinh nghiệm Fresher",
                "weight": 100,
                "score": 0,
            }]
        }
        criteria = [{
            "name": "Kinh nghiệm Fresher",
            "weight": 100,
            "criterionType": "TOTAL_EXPERIENCE",
            "minDurationMonths": 0,
        }]
        timeline = {
            "insufficient_data": False,
            "total_experience_months": 3,
            "skill_experience_months": {},
            "experiences": [{"evidence_text": "04/2026 - 06/2026 | Thực tập"}],
            "confidence": 0.9,
        }
        result = reconcile_timeline_criteria(scoring, criteria, timeline)
        item = result["criteria_results"][0]
        self.assertEqual(item["match_level"], "FULL")
        self.assertEqual(item["score"], 100)
        self.assertEqual(item["extracted_value"], "3 tháng")


if __name__ == "__main__":
    unittest.main()
