import unittest

from services.criterion_validation_service import parse_and_validate_criteria, validate_criteria


class CriterionValidationServiceTests(unittest.TestCase):
    def test_accepts_legacy_criteria_and_normalizes_values(self):
        result = parse_and_validate_criteria(
            '[{"name":" ASP.NET Core ","weight":"60"},{"name":"SQL Server","weight":40}]'
        )
        self.assertEqual(result[0]["name"], "ASP.NET Core")
        self.assertEqual(result[0]["weight"], 60)
        self.assertEqual(result[0]["criterionType"], "CUSTOM")
        self.assertEqual(result[0]["priorityLevel"], "PREFERRED")
        self.assertEqual(result[0]["operator"], "EXISTS")

    def test_preserves_optional_structured_fields(self):
        result = validate_criteria([{
            "name": "ASP.NET Core",
            "weight": 100,
            "criterionType": "SKILL_EXPERIENCE",
            "minDurationMonths": 24,
        }])
        self.assertEqual(result[0]["criterionType"], "SKILL_EXPERIENCE")
        self.assertEqual(result[0]["minDurationMonths"], 24)

    def test_normalizes_observed_legacy_contract_aliases(self):
        result = validate_criteria([
            {
                "name": "Nghiên cứu người dùng",
                "weight": 35,
                "criterionType": "SKILL",
                "operator": "CONTAINS_ANY",
                "targetValue": "user flow; wireframe; Figma",
            },
            {
                "name": "Kinh nghiệm theo cấp bậc",
                "weight": 20,
                "criterionType": "EXPERIENCE",
                "operator": "MIN_DURATION",
                "minDurationMonths": 36,
            },
            {
                "name": "Dự án đã triển khai",
                "weight": 45,
                "criterionType": "PROJECT",
                "operator": "EXISTS",
            },
        ])
        self.assertEqual(result[0]["operator"], "IN")
        self.assertEqual(result[1]["criterionType"], "TOTAL_EXPERIENCE")
        self.assertEqual(result[1]["operator"], "MINIMUM")
        self.assertEqual(result[2]["criterionType"], "CUSTOM")

    def test_accepts_zero_month_minimum_for_legacy_fresher_job(self):
        result = validate_criteria([{
            "name": "Kinh nghiệm theo cấp bậc",
            "weight": 100,
            "criterionType": "EXPERIENCE",
            "operator": "MIN_DURATION",
            "minDurationMonths": 0,
        }])
        self.assertEqual(result[0]["criterionType"], "TOTAL_EXPERIENCE")
        self.assertEqual(result[0]["operator"], "MINIMUM")
        self.assertEqual(result[0]["minDurationMonths"], 0)

    def test_rejects_invalid_json(self):
        with self.assertRaisesRegex(ValueError, "không đúng định dạng JSON"):
            parse_and_validate_criteria("not-json")

    def test_rejects_non_list_payload(self):
        with self.assertRaisesRegex(ValueError, "mảng JSON"):
            validate_criteria({"name": "Python", "weight": 100})

    def test_rejects_empty_list(self):
        with self.assertRaisesRegex(ValueError, "ít nhất 1"):
            validate_criteria([])

    def test_rejects_missing_required_fields(self):
        with self.assertRaisesRegex(ValueError, "name và weight"):
            validate_criteria([{"name": "Python"}])

    def test_rejects_invalid_weight(self):
        with self.assertRaisesRegex(ValueError, "số nguyên"):
            validate_criteria([{"name": "Python", "weight": "high"}])

    def test_rejects_total_weight_not_equal_to_100(self):
        with self.assertRaisesRegex(ValueError, "Hiện tại đang là 80%"):
            validate_criteria([{"name": "Python", "weight": 80}])

    def test_rejects_unknown_structured_option(self):
        with self.assertRaisesRegex(ValueError, "Loại của tiêu chí"):
            validate_criteria([{
                "name": "Python",
                "weight": 100,
                "criterionType": "UNKNOWN",
            }])


if __name__ == "__main__":
    unittest.main()
