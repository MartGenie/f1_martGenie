import uuid
from typing import Any

from sqlalchemy import DateTime, ForeignKey, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.asyncio import AsyncConnection
from sqlalchemy.orm import Mapped, mapped_column

from src.web.auth.models import Base


class UserProfileMemory(Base):
    __tablename__ = "user_profile_memory"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        primary_key=True,
    )
    housing_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    space_tier: Mapped[str | None] = mapped_column(String(64), nullable=True)
    household_members: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    style_preferences: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    price_philosophy: Mapped[str | None] = mapped_column(String(64), nullable=True)
    negative_constraints: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    room_priorities: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    function_preferences: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    decision_priority: Mapped[str | None] = mapped_column(String(64), nullable=True)
    raw_answers: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    version: Mapped[int] = mapped_column(default=1, nullable=False)
    updated_at: Mapped[Any] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


async def ensure_user_profile_memory_schema(connection: AsyncConnection) -> None:
    await connection.execute(
        text(
            "ALTER TABLE user_profile_memory "
            "ADD COLUMN IF NOT EXISTS decision_priority VARCHAR(64)"
        )
    )
