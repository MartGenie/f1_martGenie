import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ProductDetailOut(BaseModel):
    sku_id_default: str
    spu_id: str | None = None
    spu_code: str | None = None
    title: str
    sub_title: str | None = None
    sku_code_default: str | None = None
    category_path: list[str] = Field(default_factory=list)
    rating_value: float | None = None
    review_count: int | None = None
    main_image_url: str | None = None
    gallery_image_urls: list[str] = Field(default_factory=list)
    description_text: str | None = None
    specs: dict[str, str] = Field(default_factory=dict)
    currency_symbol: str | None = None
    sale_price: float | None = None
    original_price: float | None = None
    tag_price: float | None = None
    compare_price: float | None = None
    final_price: float | None = None
    discount_text: str | None = None
    discount_percent: float | None = None
    stock_status_text: str | None = None
    activity_price: float | None = None
    activity_tip_text: str | None = None
    product_url: str | None = None
    canonical_url: str | None = None


class ProductReviewItem(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None = None
    user_display_masked: str
    review_text: str
    rating: int = Field(ge=1, le=5)
    image_urls: list[str] = Field(default_factory=list)
    likes_count: int = 0
    can_delete: bool = False
    current_user_liked: bool = False
    created_at: datetime


class ProductReviewCreateIn(BaseModel):
    review_text: str = Field(min_length=1, max_length=600)
    rating: int = Field(default=5, ge=1, le=5)
    image_urls: list[str] = Field(default_factory=list, max_length=4)


class ProductReviewListOut(BaseModel):
    page: int = 1
    page_size: int = 5
    total_count: int = 0
    total_pages: int = 0
    items: list[ProductReviewItem] = Field(default_factory=list)


class ProductReviewLikeOut(BaseModel):
    likes_count: int
    current_user_liked: bool
