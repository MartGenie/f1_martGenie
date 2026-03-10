from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.model.memory import (
    OnboardingQuestion,
    UserProfileMemoryPayload,
    UserProfileMemoryResponse,
    get_profile,
    normalize_payload,
    upsert_profile,
)
from src.web.auth.db import get_async_session
from src.web.auth.dependencies import CurrentActiveUser
from src.web.auth.models import User


router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("/onboarding/questions", response_model=list[OnboardingQuestion])
async def onboarding_questions() -> list[OnboardingQuestion]:
    return [
        OnboardingQuestion(
            key="housing_type",
            question="Are you furnishing an owned home or a rental?",
            type="choice",
            options=["owned_home", "rented_home"],
            multi_select=False,
        ),
        OnboardingQuestion(
            key="household_members",
            question="Who lives with you? (e.g., cats, dogs, toddlers, seniors)",
            type="choice",
            options=["cat", "dog", "toddler", "senior", "solo"],
            multi_select=True,
        ),
        OnboardingQuestion(
            key="style_preferences",
            question="Which interior styles best match your taste?",
            type="choice",
            options=["Japandi", "Modern Minimalist", "Industrial", "Creamy/Soft"],
            multi_select=True,
        ),
        OnboardingQuestion(
            key="price_philosophy",
            question="For large furniture, which shopping philosophy fits you best?",
            type="choice",
            options=["value", "balanced", "premium"],
            multi_select=False,
        ),
        OnboardingQuestion(
            key="negative_constraints",
            question="Any materials or designs you absolutely want to avoid?",
            type="text",
            options=[],
            multi_select=True,
        ),
    ]


@router.get("/profile", response_model=UserProfileMemoryResponse)
async def get_memory_profile(
    user: User = Depends(CurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> UserProfileMemoryResponse:
    return await get_profile(session, user.id)


@router.put("/profile", response_model=UserProfileMemoryResponse)
async def put_memory_profile(
    payload: UserProfileMemoryPayload,
    user: User = Depends(CurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> UserProfileMemoryResponse:
    return await upsert_profile(session, user.id, payload)


@router.patch("/profile", response_model=UserProfileMemoryResponse)
async def patch_memory_profile(
    payload: UserProfileMemoryPayload,
    user: User = Depends(CurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> UserProfileMemoryResponse:
    existing = await get_profile(session, user.id)
    if existing.profile is None:
        return await upsert_profile(session, user.id, normalize_payload(payload))

    merged = existing.profile.model_copy(deep=True)
    incoming = normalize_payload(payload)
    data = incoming.model_dump()
    for key, value in data.items():
        if isinstance(value, list):
            if value:
                setattr(merged, key, value)
        elif isinstance(value, dict):
            if value:
                current = getattr(merged, key) or {}
                current.update(value)
                setattr(merged, key, current)
        else:
            if value is not None:
                setattr(merged, key, value)
    return await upsert_profile(session, user.id, merged)
