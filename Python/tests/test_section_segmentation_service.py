import unittest

from services.section_segmentation_service import segment_cv_sections


class SectionSegmentationServiceTests(unittest.TestCase):
    def test_understands_heading_in_docx_table_row(self):
        result = segment_cv_sections("KỸ NĂNG | Docker, Linux\nKINH NGHIỆM | Backend | 01/2024 - 06/2025")
        section_types = [item["type"] for item in result["sections"]]
        self.assertIn("skills", section_types)
        self.assertIn("experience", section_types)
        self.assertGreaterEqual(result["recognized_section_count"], 2)

    def test_understands_vietnamese_english_and_custom_career_heading(self):
        result = segment_cv_sections("""NGUYỄN MINH ANH
Backend Developer
HÀNH TRÌNH NGHỀ NGHIỆP
Công ty A - 01/2024 đến nay
Triển khai Docker.
TECH STACK
Docker, Linux, Python
EDUCATION
Đại học Công nghệ Thông tin
""")
        types = [section["type"] for section in result["sections"]]
        self.assertIn("experience", types)
        self.assertIn("skills", types)
        self.assertIn("education", types)
        self.assertFalse(result["insufficient_structure"])

    def test_preserves_unknown_custom_section(self):
        result = segment_cv_sections("""THÀNH TỰU NỔI BẬT
Giảm 30% thời gian triển khai.
KỸ NĂNG
Docker
""")
        custom = next(item for item in result["sections"] if item["type"] == "other")
        self.assertEqual(custom["heading"], "THÀNH TỰU NỔI BẬT")
        self.assertIn("30%", custom["content"])


if __name__ == "__main__":
    unittest.main()
