from sqlalchemy import Select, delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.favorites.schema import FavoriteProductCreateIn, FavoriteProductItem, FavoriteProductListOut
from src.web.auth.models import User
from src.web.favorites.models import FavoriteProductRecord


def _to_item(record: FavoriteProductRecord) -> FavoriteProductItem:
    return FavoriteProductItem(
        id=record.id,
        sku_id_default=record.sku_id_default,
        title=record.title,
        category_label=record.category_label,
        sale_price=float(record.sale_price) if record.sale_price is not None else None,
        image_url=record.image_url,
        product_url=record.product_url,
        description_text=record.description_text,
        recommendation_reason=record.recommendation_reason,
        specs={str(key): str(value) for key, value in (record.specs or {}).items()},
        source_page=record.source_page,
        created_at=record.created_at,
    )


def _base_stmt(user: User) -> Select[tuple[FavoriteProductRecord]]:
    return select(FavoriteProductRecord).where(FavoriteProductRecord.user_id == user.id)


async def list_favorite_products(session: AsyncSession, user: User) -> FavoriteProductListOut:
    rows = (await session.execute(_base_stmt(user).order_by(FavoriteProductRecord.created_at.desc()))).scalars().all()
    return FavoriteProductListOut(items=[_to_item(row) for row in rows])


async def create_favorite_product(
    session: AsyncSession,
    user: User,
    payload: FavoriteProductCreateIn,
) -> FavoriteProductItem:
    existing = (
        await session.execute(
            _base_stmt(user).where(FavoriteProductRecord.sku_id_default == payload.sku_id_default)
        )
    ).scalars().first()

    if existing is None:
        existing = FavoriteProductRecord(user_id=user.id, sku_id_default=payload.sku_id_default, title=payload.title)
        session.add(existing)

    existing.title = payload.title
    existing.category_label = payload.category_label
    existing.sale_price = payload.sale_price
    existing.image_url = payload.image_url
    existing.product_url = payload.product_url
    existing.description_text = payload.description_text
    existing.recommendation_reason = payload.recommendation_reason
    existing.specs = payload.specs
    existing.source_page = payload.source_page

    await session.commit()
    await session.refresh(existing)
    return _to_item(existing)


async def delete_favorite_product(session: AsyncSession, user: User, sku_id_default: str) -> None:
    result = await session.execute(
        delete(FavoriteProductRecord).where(
            FavoriteProductRecord.user_id == user.id,
            FavoriteProductRecord.sku_id_default == sku_id_default,
        )
    )
    await session.commit()

    if result.rowcount == 0:
        raise ValueError("Favorite item not found.")
