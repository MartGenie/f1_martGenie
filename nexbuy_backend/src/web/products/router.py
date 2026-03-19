import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.products.schema import (
    ProductDetailOut,
    ProductReviewCreateIn,
    ProductReviewItem,
    ProductReviewLikeOut,
    ProductReviewListOut,
)
from src.products.service import (
    create_product_review,
    delete_product_review,
    get_product_detail,
    list_product_reviews,
    toggle_product_review_like,
)
from src.web.auth.dependencies import CurrentActiveUser, OptionalCurrentActiveUser
from src.web.auth.db import get_async_session
from src.web.auth.models import User


router = APIRouter(prefix="/products", tags=["products"])


@router.get("/{sku_id_default}", response_model=ProductDetailOut)
async def fetch_product_detail(
    sku_id_default: str,
    session: AsyncSession = Depends(get_async_session),
) -> ProductDetailOut:
    return await get_product_detail(session, sku_id_default=sku_id_default)


@router.get("/{sku_id_default}/reviews", response_model=ProductReviewListOut)
async def fetch_product_reviews(
    sku_id_default: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=5, ge=1, le=20),
    user: User | None = Depends(OptionalCurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> ProductReviewListOut:
    return await list_product_reviews(
        session,
        sku_id_default=sku_id_default,
        page=page,
        page_size=page_size,
        current_user=user,
    )


@router.post("/{sku_id_default}/reviews", response_model=ProductReviewItem, status_code=201)
async def create_product_review_record(
    sku_id_default: str,
    payload: ProductReviewCreateIn,
    user: User = Depends(CurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> ProductReviewItem:
    return await create_product_review(session, sku_id_default=sku_id_default, user=user, payload=payload)


@router.delete("/reviews/{review_id}", status_code=204)
async def delete_product_review_record(
    review_id: uuid.UUID,
    user: User = Depends(CurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> None:
    try:
        await delete_product_review(session, review_id=review_id, user=user)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/reviews/{review_id}/like", response_model=ProductReviewLikeOut)
async def toggle_product_review_like_record(
    review_id: uuid.UUID,
    user: User = Depends(CurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> ProductReviewLikeOut:
    try:
        return await toggle_product_review_like(session, review_id=review_id, user=user)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
