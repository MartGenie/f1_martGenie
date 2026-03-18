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
            question="What kind of living situation are you furnishing right now?",
            type="choice",
            options=["owned_home", "rented_home", "temporary_place", "shared_living"],
            multi_select=False,
            helper_text="This helps us decide whether to lean toward long-term investment pieces or more flexible, easy-to-move options.",
        ),
        OnboardingQuestion(
            key="room_priorities",
            question="Which space are you most likely to shop for first?",
            type="choice",
            options=["living_room", "bedroom", "dining_room", "home_office", "entryway", "outdoor_area", "kids_room"],
            multi_select=False,
            allow_custom_input=True,
            custom_input_key="room_priorities_custom",
            custom_input_label="Other space",
            custom_input_placeholder="Add another room or area...",
            helper_text="This gives us a clear starting point when you come back later with a short request.",
        ),
        OnboardingQuestion(
            key="space_tier",
            question="For the space you shop for most often, how much room do you usually have to work with?",
            type="choice",
            options=["compact", "medium", "spacious", "not_sure"],
            multi_select=False,
            helper_text="This helps us avoid recommending pieces that feel too large or too small in real life.",
        ),
        OnboardingQuestion(
            key="household_members",
            question="Who or what should we keep in mind at home?",
            type="choice",
            options=["solo", "partner_or_family", "children", "cat", "dog", "senior", "frequent_guests"],
            multi_select=True,
            helper_text="This helps us pay attention to safety, durability, comfort, and ease of cleaning.",
        ),
        OnboardingQuestion(
            key="style_preferences",
            question="Which styles feel most like your taste?",
            type="choice",
            options=["japandi", "modern_minimalist", "industrial", "creamy_soft", "scandinavian", "mid_century", "contemporary", "not_sure_yet"],
            multi_select=True,
            helper_text="This helps us keep recommendations visually consistent, especially when we build full sets.",
        ),
        OnboardingQuestion(
            key="function_preferences",
            question="What matters most to you in daily use?",
            type="choice",
            options=["more_storage", "easy_to_clean", "modular_flexible", "space_saving", "hidden_cable_management", "rounded_edges", "pet_friendly_surfaces", "low_maintenance"],
            multi_select=True,
            helper_text="This helps us recommend pieces that fit your real daily life, not just your aesthetic taste.",
        ),
        OnboardingQuestion(
            key="price_philosophy",
            question="When shopping for larger home pieces, which approach sounds most like you?",
            type="choice",
            options=["value", "balanced", "premium_investment"],
            multi_select=False,
            helper_text="This helps us understand whether to lean toward budget efficiency, a balanced mix, or stronger long-term quality.",
        ),
        OnboardingQuestion(
            key="negative_constraints",
            question="Is there anything you already know you want to avoid?",
            type="choice",
            options=["hard_to_clean_fabrics", "sharp_edges", "glass_heavy_pieces", "bulky_silhouettes", "delicate_finishes", "very_bright_colors"],
            multi_select=True,
            allow_custom_input=True,
            custom_input_key="negative_constraints_custom",
            custom_input_label="Other things to avoid",
            custom_input_placeholder="Add anything else you want us to avoid...",
            helper_text="This helps us rule out bad matches earlier, so you spend less time filtering them out later.",
        ),
        OnboardingQuestion(
            key="notes",
            question="Are there any real-life details we should quietly keep in mind?",
            type="choice",
            options=["narrow_elevator", "stairs_only", "frequent_moving", "humid_environment", "heavy_daily_use", "limited_assembly_time"],
            multi_select=True,
            allow_custom_input=True,
            custom_input_key="notes_custom",
            custom_input_label="Anything else we should keep in mind",
            custom_input_placeholder="Add any practical detail you want us to remember...",
            helper_text="These details often decide whether a product truly works in your daily life.",
        ),
        OnboardingQuestion(
            key="decision_priority",
            question="When two options both look good, what usually helps you make the final call?",
            type="choice",
            options=["comfort", "durability", "easier_upkeep", "lower_total_cost", "better_overall_look", "best_overall_value"],
            multi_select=False,
            helper_text="This helps us understand what should matter most when we rank similar options for you.",
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
