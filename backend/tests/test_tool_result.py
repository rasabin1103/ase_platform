from app.modules.test_execution.schemas import ToolResultRead
from app.modules.test_execution.service import TestExecutionService


def test_tool_result_absent():
    assert TestExecutionService._tool_result_from_raw({"request": {}}) is None
    assert TestExecutionService._tool_result_from_raw(None) is None


def test_tool_result_normalised():
    raw = {
        "ase_result": {
            "tool": "API Contract Guard",
            "mode": "compare",
            "verdict": "FAIL",
            "headline": "Cambios incompatibles",
            "metrics": [{"label": "breaking", "value": 2, "tone": "error"}, "junk"],
            "findings": [{"severity": "breaking", "title": "x", "hint": "h"}],
        }
    }
    out = TestExecutionService._tool_result_from_raw(raw)
    assert out["verdict"] == "fail"
    assert out["metrics"][0]["value"] == "2" and len(out["metrics"]) == 1
    ToolResultRead(**out)


def test_tool_result_bad_verdict_defaults_to_warn():
    out = TestExecutionService._tool_result_from_raw({"ase_result": {"verdict": "??"}})
    assert out["verdict"] == "warn"
