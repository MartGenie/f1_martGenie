from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.favorites.schema import FavoriteProductCreateIn, FavoriteProductItem, FavoriteProductListOut
from src.favorites.service import create_favorite_product, delete_favorite_product, list_favorite_products
from src.web.auth.db import get_async_session
from src.web.auth.dependencies import CurrentActiveUser
from src.web.auth.models import User


router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("/products", response_model=FavoriteProductListOut)
async def fetch_favorite_products(
    user: User = Depends(CurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> FavoriteProductListOut:
    return await list_favorite_products(session, user)


@router.post("/products", response_model=FavoriteProductItem, status_code=201)
async def create_favorite_product_record(
    payload: FavoriteProductCreateIn,
    user: User = Depends(CurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> FavoriteProductItem:
    return await create_favorite_product(session, user=user, payload=payload)


@router.delete("/products/{sku_id_default}", status_code=204)
async def delete_favorite_product_record(
    sku_id_default: str,
    user: User = Depends(CurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> None:
    try:
        await delete_favorite_product(session, user=user, sku_id_default=sku_id_default)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
