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


if __name__ == "__main__":
    unittest.main()
