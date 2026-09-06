from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator

# Fixed vocabularies on purpose — every option here is designed to be
# directly matchable against real CatalogItem fields (level, tags_json,
# category, title) by ConsumerCatalogService's recommendation scorer, with
# no free text / NLP involved. See app/models/user_preferences_profile.py.


class PreferenceRole(str, Enum):
    qa_manual = "qa_manual"
    qa_automation = "qa_automation"
    qa_lead_manager = "qa_lead_manager"
    developer = "developer"
    devops = "devops"
    product_manager = "product_manager"
    other = "other"


class ImprovementGoal(str, Enum):
    test_automation = "test_automation"
    qa_strategy_process = "qa_strategy_process"
    cicd_devops = "cicd_devops"
    programming_skills = "programming_skills"
    team_management = "team_management"
    certifications = "certifications"
    other = "other"


class WorkMode(str, Enum):
    individual = "individual"
    small_team = "small_team"
    large_team = "large_team"


class PreferenceTechnology(str, Enum):
    selenium = "selenium"
    cypress = "cypress"
    playwright = "playwright"
    appium = "appium"
    postman_api = "postman_api"
    jmeter_performance = "jmeter_performance"
    python = "python"
    java = "java"
    javascript_typescript = "javascript_typescript"
    jira = "jira"
    other = "other"


# Matches app.models.enums.CatalogItemLevel.value exactly (beginner /
# intermediate / advanced) so the scorer can compare the two directly.
class PreferenceLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class PreferencesProfileSubmitRequest(BaseModel):
    role: PreferenceRole
    improvement_goals: list[ImprovementGoal] = Field(min_length=1, max_length=len(ImprovementGoal))
    work_mode: WorkMode
    technologies: list[PreferenceTechnology] = Field(min_length=1, max_length=len(PreferenceTechnology))
    level: PreferenceLevel

    @field_validator("improvement_goals", "technologies")
    @classmethod
    def dedupe(cls, value: list) -> list:
        seen: list = []
        for v in value:
            if v not in seen:
                seen.append(v)
        return seen


class PreferencesProfileRead(BaseModel):
    role: str | None = None
    improvement_goals: list[str] | None = None
    work_mode: str | None = None
    technologies: list[str] | None = None
    level: str | None = None
    completed_at: datetime | None = None
    skipped_at: datetime | None = None
    # True once the user has answered or explicitly skipped — the frontend
    # gate uses this (via /auth/me's needs_preferences_survey) to decide
    # whether to show the survey again; exposed here too for the survey
    # page itself to know its own state on load.
    is_resolved: bool = False

    model_config = {"from_attributes": True}
