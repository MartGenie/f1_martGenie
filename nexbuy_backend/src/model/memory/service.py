import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.web.memory.models import UserProfileMemory

from .schema import UserProfileMemoryPayload, UserProfileMemoryResponse


def _clean_scalar(value: str | None) -> str | None:
    if value is None:
        return None
    v = value.strip()
    return v or None


def _clean_list(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for raw in values:
        value = raw.strip()
        if not value:
            continue
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(value)
    return out


def normalize_payload(payload: UserProfileMemoryPayload) -> UserProfileMemoryPayload:
    return UserProfileMemoryPayload(
        housing_type=_clean_scalar(payload.housing_type),
        space_tier=_clean_scalar(payload.space_tier),
        household_members=_clean_list(payload.household_members),
        style_preferences=_clean_list(payload.style_preferences),
        price_philosophy=_clean_scalar(payload.price_philosophy),
        negative_constraints=_clean_list(payload.negative_constraints),
        room_priorities=_clean_list(payload.room_priorities),
        function_preferences=_clean_list(payload.function_preferences),
        notes=_clean_scalar(payload.notes),
        decision_priority=_clean_scalar(payload.decision_priority),
        raw_answers=payload.raw_answers or {},
    )


def _to_payload(model: UserProfileMemory) -> UserProfileMemoryPayload:
    return UserProfileMemoryPayload(
        housing_type=model.housing_type,
        space_tier=model.space_tier,
        household_members=list(model.household_members or []),
        style_preferences=list(model.style_preferences or []),
        price_philosophy=model.price_philosophy,
        negative_constraints=list(model.negative_constraints or []),
        room_priorities=list(model.room_priorities or []),
        function_preferences=list(model.function_preferences or []),
        notes=model.notes,
        decision_priority=model.decision_priority,
        raw_answers=dict(model.raw_answers or {}),
    )


async def get_profile(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> UserProfileMemoryResponse:
    row = await session.scalar(select(UserProfileMemory).where(UserProfileMemory.user_id == user_id))
    if row is None:
        return UserProfileMemoryResponse(onboarding_required=True, profile=None)
    return UserProfileMemoryResponse(onboarding_required=False, profile=_to_payload(row))


async def upsert_profile(
    session: AsyncSession,
    user_id: uuid.UUID,
    payload: UserProfileMemoryPayload,
) -> UserProfileMemoryResponse:
    normalized = normalize_payload(payload)
    row = await session.scalar(select(UserProfileMemory).where(UserProfileMemory.user_id == user_id))

    if row is None:
        row = UserProfileMemory(
            user_id=user_id,
            housing_type=normalized.housing_type,
            space_tier=normalized.space_tier,
            household_members=normalized.household_members,
            style_preferences=normalized.style_preferences,
            price_philosophy=normalized.price_philosophy,
            negative_constraints=normalized.negative_constraints,
            room_priorities=normalized.room_priorities,
            function_preferences=normalized.function_preferences,
            notes=normalized.notes,
            decision_priority=normalized.decision_priority,
            raw_answers=normalized.raw_answers,
            version=1,
        )
        session.add(row)
    else:
        row.housing_type = normalized.housing_type
        row.space_tier = normalized.space_tier
        row.household_members = normalized.household_members
        row.style_preferences = normalized.style_preferences
        row.price_philosophy = normalized.price_philosophy
        row.negative_constraints = normalized.negative_constraints
        row.room_priorities = normalized.room_priorities
        row.function_preferences = normalized.function_preferences
        row.notes = normalized.notes
        row.decision_priority = normalized.decision_priority
        row.raw_answers = normalized.raw_answers
        row.version = int(row.version) + 1

    await session.commit()
    await session.refresh(row)
    return UserProfileMemoryResponse(onboarding_required=False, profile=_to_payload(row))
