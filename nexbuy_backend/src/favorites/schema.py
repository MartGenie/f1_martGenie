import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class FavoriteProductCreateIn(BaseModel):
    sku_id_default: str = Field(min_length=1)
    title: str = Field(min_length=1, max_length=500)
    category_label: str | None = Field(default=None, max_length=255)
    sale_price: float | None = Field(default=None, ge=0)
    image_url: str | None = None
    product_url: str | None = None
    description_text: str | None = None
    recommendation_reason: str | None = None
    specs: dict[str, str] = Field(default_factory=dict)
    source_page: str | None = Field(default=None, max_length=64)


class FavoriteProductItem(BaseModel):
    id: uuid.UUID
    sku_id_default: str
    title: str
    category_label: str | None = None
    sale_price: float | None = None
    image_url: str | None = None
    product_url: str | None = None
    description_text: str | None = None
    recommendation_reason: str | None = None
    specs: dict[str, str] = Field(default_factory=dict)
    source_page: str | None = None
    created_at: datetime


class FavoriteProductListOut(BaseModel):
    items: list[FavoriteProductItem] = Field(default_factory=list)


class FavoriteBundleProductIn(BaseModel):
    sku: str = Field(min_length=1)
    title: str = Field(min_length=1, max_length=500)
    price: float = Field(ge=0)
    quantity: int = Field(default=1, ge=1, le=20)
    imageUrl: str | None = None
    categoryLabel: str | None = None


class FavoriteBundleCreateIn(BaseModel):
    bundle_id: str = Field(min_length=1)
    title: str = Field(min_length=1, max_length=500)
    summary: str | None = None
    total_price: float | None = Field(default=None, ge=0)
    source_session_id: str | None = None
    source_page: str | None = Field(default=None, max_length=64)
    items: list[FavoriteBundleProductIn] = Field(default_factory=list)


class FavoriteBundleProductOut(BaseModel):
    sku: str
    title: str
    price: float
    quantity: int
    imageUrl: str | None = None
    categoryLabel: str | None = None


class FavoriteBundleItem(BaseModel):
    id: uuid.UUID
    bundle_id: str
    title: str
    summary: str | None = None
    total_price: float | None = None
    source_session_id: str | None = None
    source_page: str | None = None
    items: list[FavoriteBundleProductOut] = Field(default_factory=list)
    created_at: datetime


class FavoriteBundleListOut(BaseModel):
    items: list[FavoriteBundleItem] = Field(default_factory=list)
