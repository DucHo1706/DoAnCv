import json
import unittest
from unittest.mock import patch

from services import cv_analysis_service
from services.document_layout_service import DocumentExtractionResult


class CvAnalysisExtractionGateTests(unittest.TestCase):
    def setUp(self):
        cv_analysis_service.TEXT_CACHE.clear()
        cv_analysis_service.SCORE_CACHE.clear()

    def tearDown(self):
        cv_analysis_service.TEXT_CACHE.clear()
        cv_analysis_service.SCORE_CACHE.clear()

    @staticmethod
    def _unsafe_extraction() -> DocumentExtractionResult:
        return DocumentExtractionResult(
            text="KINH NGHIỆM " * 30,
            method="tesseract_psm_6",
            quality_score=88.0,
            quality_level="insufficient",
            blocks=[],
            alternatives=[],
            warnings=["Các phương pháp đọc tài liệu cho nội dung khác nhau."],
            agreement_score=0.31,
            agreement_kind="independent_sources",
            analysis_safe=False,
        )

    def test_score_stops_before_resume_validation_and_nlp_when_extraction_is_unsafe(self):
        with patch(
            "services.cv_analysis_service.doc_parser_service.extract_document_from_file",
            return_value=self._unsafe_extraction(),
        ), patch("services.cv_analysis_service.scoring_service.is_document_a_resume") as validate_resume:
            result = cv_analysis_service.score_resume_sync(
                file_bytes=b"unsafe-scan",
                filename="cv.png",
                content_type="image/png",
                job_description="Backend Developer",
                criteria_list=[{"name": "C#", "weight": 100}],
                criteria_raw_str='[{"name":"C#","weight":100}]',
            )

        validate_resume.assert_not_called()
        self.assertEqual(result["matching_result"]["classification"], "Không đủ dữ liệu")
        summary = json.loads(result["matching_result"]["summary"])
        self.assertEqual(summary["analysis_status"], "insufficient")
        self.assertFalse(summary["extraction_quality"]["analysis_safe"])

    def test_validation_cache_reuses_unsafe_extraction_metadata(self):
        extraction = self._unsafe_extraction()
        cv_hash = cv_analysis_service.cache_document_extraction(b"same-file", extraction)

        self.assertEqual(cv_analysis_service.TEXT_CACHE[cv_hash]["cv_text"], extraction.text)
        self.assertFalse(cv_analysis_service.TEXT_CACHE[cv_hash]["extraction_quality"]["analysis_safe"])

    def test_language_review_runs_when_safe_text_has_ocr_warning(self):
        generated_review = {
            "overall_language_score": 72,
            "language_comment": "Nội dung có động từ hành động và một số kết quả định lượng.",
            "good_action_verbs": ["Phát triển"],
            "weak_phrases": [],
            "insufficient_data": False,
            "is_fallback": False,
        }
        quality = {
            "quality_level": "partial",
            "analysis_safe": True,
            "warnings": ["Văn bản tiếng Việt có dấu hiệu mất dấu hoặc OCR nhận dạng sai."],
        }

        with patch(
            "services.cv_analysis_service.scoring_service.generate_cv_language_review",
            return_value=generated_review,
        ) as generate_review:
            result = cv_analysis_service.build_language_review_for_extraction(
                cv_text="Kinh nghiệm phát triển và tối ưu API cho hệ thống tuyển dụng.",
                job_description="Tuyển Backend Developer.",
                extraction_quality=quality,
            )

        generate_review.assert_called_once()
        self.assertFalse(result["insufficient_data"])
        self.assertEqual(result["analysis_scope"], "extracted_text_with_quality_limitations")
        self.assertIn("không được tính là lỗi diễn đạt", result["source_quality_notice"])

    def test_language_review_still_stops_for_unsafe_extraction(self):
        quality = {
            "quality_level": "insufficient",
            "analysis_safe": False,
            "warnings": ["Các phương pháp đọc tài liệu cho nội dung khác nhau."],
        }

        with patch(
            "services.cv_analysis_service.scoring_service.generate_cv_language_review",
        ) as generate_review:
            result = cv_analysis_service.build_language_review_for_extraction(
                cv_text="KINH NGHIỆM " * 30,
                job_description="Tuyển Backend Developer.",
                extraction_quality=quality,
            )

        generate_review.assert_not_called()
        self.assertTrue(result["insufficient_data"])
        self.assertEqual(result["insufficient_reason"], "extraction_unreliable")


if __name__ == "__main__":
    unittest.main()
