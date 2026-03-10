from typing import Any

from pydantic import BaseModel, Field


class UserProfileMemoryPayload(BaseModel):
    housing_type: str | None = None
    space_tier: str | None = None
    household_members: list[str] = Field(default_factory=list)
    style_preferences: list[str] = Field(default_factory=list)
    price_philosophy: str | None = None
    negative_constraints: list[str] = Field(default_factory=list)
    room_priorities: list[str] = Field(default_factory=list)
    function_preferences: list[str] = Field(default_factory=list)
    notes: str | None = None
    raw_answers: dict[str, Any] = Field(default_factory=dict)


class UserProfileMemoryResponse(BaseModel):
    onboarding_required: bool
    profile: UserProfileMemoryPayload | None = None


class OnboardingQuestion(BaseModel):
    key: str
    question: str
    type: str
    options: list[str] = Field(default_factory=list)
    multi_select: bool = False
