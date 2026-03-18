import uuid
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.web.auth.models import Base


class FavoriteProductRecord(Base):
    __tablename__ = "favorite_product"
    __table_args__ = (UniqueConstraint("user_id", "sku_id_default", name="uq_favorite_product_user_sku"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sku_id_default: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    category_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sale_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    product_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommendation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    specs: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False, default=dict)
    source_page: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[Any] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
