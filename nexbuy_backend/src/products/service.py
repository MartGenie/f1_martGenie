import uuid
from collections.abc import Sequence

from fastapi import HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.web.auth.models import User
from src.web.products.models import ProductReviewLikeRecord, ProductReviewRecord

from .schema import (
    ProductDetailOut,
    ProductReviewCreateIn,
    ProductReviewItem,
    ProductReviewLikeOut,
    ProductReviewListOut,
)


def _to_float(value: object | None) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value: object | None) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


async def get_product_detail(session: AsyncSession, sku_id_default: str) -> ProductDetailOut:
    stmt = text(
        """
        SELECT
            sku_id_default,
            spu_id,
            spu_code,
            title,
            sub_title,
            sku_code_default,
            category_name_1,
            category_name_2,
            category_name_3,
            category_name_4,
            rating_value,
            review_count,
            main_image_url,
            gallery_image_urls,
            description_text,
            specs,
            currency_symbol,
            sale_price,
            original_price,
            tag_price,
            compare_price,
            final_price,
            discount_text,
            discount_percent,
            stock_status_text,
            activity_price,
            activity_tip_text,
            product_url,
            canonical_url
        FROM homary_products
        WHERE sku_id_default = :sku_id_default
        LIMIT 1
        """
    )
    row = (await session.execute(stmt, {"sku_id_default": sku_id_default})).mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Product not found.")

    category_path = [
        str(part).strip()
        for part in [
            row.get("category_name_1"),
            row.get("category_name_2"),
            row.get("category_name_3"),
            row.get("category_name_4"),
        ]
        if isinstance(part, str) and part.strip()
    ]

    gallery_images = row.get("gallery_image_urls")
    gallery_image_urls = [
        str(url).strip()
        for url in (gallery_images if isinstance(gallery_images, Sequence) and not isinstance(gallery_images, str) else [])
        if isinstance(url, str) and url.strip()
    ]
    main_image_url = str(row.get("main_image_url") or "").strip() or None
    if main_image_url and main_image_url not in gallery_image_urls:
        gallery_image_urls.insert(0, main_image_url)

    raw_specs = row.get("specs")
    specs = {
        str(key).strip(): str(value).strip()
        for key, value in raw_specs.items()
        if isinstance(raw_specs, dict)
        and str(key).strip()
        and value is not None
        and str(value).strip()
    }

    return ProductDetailOut(
        sku_id_default=str(row["sku_id_default"]),
        spu_id=str(row.get("spu_id")).strip() if row.get("spu_id") else None,
        spu_code=str(row.get("spu_code")).strip() if row.get("spu_code") else None,
        title=str(row["title"]),
        sub_title=str(row.get("sub_title")).strip() if row.get("sub_title") else None,
        sku_code_default=str(row.get("sku_code_default")).strip() if row.get("sku_code_default") else None,
        category_path=category_path,
        rating_value=_to_float(row.get("rating_value")),
        review_count=_to_int(row.get("review_count")),
        main_image_url=main_image_url,
        gallery_image_urls=gallery_image_urls,
        description_text=str(row.get("description_text")).strip() if row.get("description_text") else None,
        specs=specs,
        currency_symbol=str(row.get("currency_symbol")).strip() if row.get("currency_symbol") else None,
        sale_price=_to_float(row.get("sale_price")),
        original_price=_to_float(row.get("original_price")),
        tag_price=_to_float(row.get("tag_price")),
        compare_price=_to_float(row.get("compare_price")),
        final_price=_to_float(row.get("final_price")),
        discount_text=str(row.get("discount_text")).strip() if row.get("discount_text") else None,
        discount_percent=_to_float(row.get("discount_percent")),
        stock_status_text=str(row.get("stock_status_text")).strip() if row.get("stock_status_text") else None,
        activity_price=_to_float(row.get("activity_price")),
        activity_tip_text=str(row.get("activity_tip_text")).strip() if row.get("activity_tip_text") else None,
        product_url=str(row.get("product_url")).strip() if row.get("product_url") else None,
        canonical_url=str(row.get("canonical_url")).strip() if row.get("canonical_url") else None,
    )


def _mask_user_display(user: User) -> str:
    display = (user.email or "User").strip()
    if "@" in display:
        local = display.split("@", 1)[0].strip()
        if len(local) >= 2:
            return f"{local[0].upper()}. {local[1:].capitalize()}"
        return f"{local[:1].upper()}."
    if len(display) >= 2:
        return f"{display[0].upper()}. {display[1:]}"
    return display or "User"


def _product_review_item_from_record(
    record: ProductReviewRecord,
    *,
    current_user_id: uuid.UUID | None,
    liked_review_ids: set[uuid.UUID],
) -> ProductReviewItem:
    return ProductReviewItem(
        id=record.id,
        user_id=record.user_id,
        user_display_masked=record.user_display_masked,
        review_text=record.review_text,
        rating=int(record.rating or 5),
        image_urls=list(record.image_urls or []),
        likes_count=int(record.likes_count or 0),
        can_delete=bool(current_user_id and record.user_id == current_user_id),
        current_user_liked=record.id in liked_review_ids,
        created_at=record.created_at,
    )


async def list_product_reviews(
    session: AsyncSession,
    *,
    sku_id_default: str,
    page: int = 1,
    page_size: int = 5,
    current_user: User | None = None,
) -> ProductReviewListOut:
    current_user_id = current_user.id if current_user is not None else None
    liked_review_ids: set[uuid.UUID] = set()
    if current_user_id is not None:
        liked_stmt = select(ProductReviewLikeRecord.review_id).where(ProductReviewLikeRecord.user_id == current_user_id)
        liked_review_ids = set((await session.execute(liked_stmt)).scalars().all())

    total_stmt = select(func.count()).select_from(ProductReviewRecord).where(
        ProductReviewRecord.sku_id_default == sku_id_default,
        ProductReviewRecord.is_public.is_(True),
    )
    total_count = int((await session.execute(total_stmt)).scalar_one() or 0)
    offset = max(page - 1, 0) * page_size
    stmt = (
        select(ProductReviewRecord)
        .where(
            ProductReviewRecord.sku_id_default == sku_id_default,
            ProductReviewRecord.is_public.is_(True),
        )
        .order_by(ProductReviewRecord.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    records = (await session.execute(stmt)).scalars().all()
    return ProductReviewListOut(
        page=page,
        page_size=page_size,
        total_count=total_count,
        total_pages=max((total_count + page_size - 1) // page_size, 1),
        items=[
            _product_review_item_from_record(
                record,
                current_user_id=current_user_id,
                liked_review_ids=liked_review_ids,
            )
            for record in records
        ],
    )


async def create_product_review(
    session: AsyncSession,
    *,
    sku_id_default: str,
    user: User,
    payload: ProductReviewCreateIn,
) -> ProductReviewItem:
    record = ProductReviewRecord(
        sku_id_default=sku_id_default,
        user_id=user.id,
        user_display_masked=_mask_user_display(user),
        review_text=payload.review_text.strip(),
        rating=payload.rating,
        image_urls=payload.image_urls[:4],
        likes_count=0,
        is_public=True,
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return ProductReviewItem(
        id=record.id,
        user_id=record.user_id,
        user_display_masked=record.user_display_masked,
        review_text=record.review_text,
        rating=record.rating,
        image_urls=list(record.image_urls or []),
        likes_count=int(record.likes_count or 0),
        can_delete=True,
        current_user_liked=False,
        created_at=record.created_at,
    )


async def delete_product_review(
    session: AsyncSession,
    *,
    review_id: uuid.UUID,
    user: User,
) -> None:
    record = await session.get(ProductReviewRecord, review_id)
    if record is None:
        raise ValueError("Review record not found.")
    if record.user_id != user.id:
        raise PermissionError("You can only delete your own review.")
    await session.delete(record)
    await session.commit()


async def toggle_product_review_like(
    session: AsyncSession,
    *,
    review_id: uuid.UUID,
    user: User,
) -> ProductReviewLikeOut:
    record = await session.get(ProductReviewRecord, review_id)
    if record is None or not record.is_public:
        raise ValueError("Review record not found.")

    existing_stmt = select(ProductReviewLikeRecord).where(
        ProductReviewLikeRecord.review_id == review_id,
        ProductReviewLikeRecord.user_id == user.id,
    )
    existing = (await session.execute(existing_stmt)).scalars().first()
    if existing is None:
        session.add(ProductReviewLikeRecord(review_id=review_id, user_id=user.id))
        record.likes_count = int(record.likes_count or 0) + 1
        liked = True
    else:
        await session.delete(existing)
        record.likes_count = max(int(record.likes_count or 0) - 1, 0)
        liked = False

    await session.commit()
    return ProductReviewLikeOut(likes_count=int(record.likes_count or 0), current_user_liked=liked)
