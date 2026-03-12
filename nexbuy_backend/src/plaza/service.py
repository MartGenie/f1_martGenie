import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import Select, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.web.auth.models import User
from src.web.plaza.models import AgentShowcaseItemRecord, AgentShowcaseRecord

from .schema import (
    AgentShowcaseCreateIn,
    AgentShowcaseDetail,
    AgentShowcaseItem,
    AgentShowcaseSummary,
)


MOCK_AGENT_PROFILES = [
    {"shopper_name": "Bob", "agent_name": "Bob's Agent", "badge": "Package Done"},
    {"shopper_name": "David", "agent_name": "David's Agent", "badge": "Savings"},
    {"shopper_name": "Alice", "agent_name": "Alice's Agent", "badge": "Savings"},
    {"shopper_name": "Emma", "agent_name": "Emma's Agent", "badge": "Package Done"},
    {"shopper_name": "Carol", "agent_name": "Carol's Agent", "badge": "Deal Found"},
    {"shopper_name": "Mia", "agent_name": "Mia's Agent", "badge": "Savings"},
]


def _money(value: float | Decimal | None) -> float:
    if value is None:
        return 0.0
    return round(float(value), 2)


def _mask_user_display(user: User) -> str:
    email = getattr(user, "email", None)
    if isinstance(email, str) and "@" in email:
        local, domain = email.split("@", 1)
        visible = local[:2] if len(local) >= 2 else local[:1]
        return f"{visible}***@{domain}"
    return f"User-{str(user.id)[:6]}"


def _headline(display_name: str, saved_amount: float, currency_symbol: str) -> str:
    return f"Agent 帮 {display_name} 节省了 {currency_symbol}{saved_amount:.2f}"


def _shopper_headline(shopper_name: str, saved_amount: float, currency_symbol: str) -> str:
    return f"Agent saved {currency_symbol}{saved_amount:.2f} for {shopper_name}"


def _sentence_case(value: str | None) -> str:
    if not value:
        return "bundle"
    text_value = value.strip()
    return text_value[:1].upper() + text_value[1:]


async def _fetch_products_by_sku(
    session: AsyncSession,
    sku_ids: list[str],
) -> dict[str, dict[str, Any]]:
    if not sku_ids:
        return {}

    stmt = text(
        """
        SELECT
            sku_id_default,
            spu_id,
            title,
            category_name_1,
            category_name_2,
            category_name_3,
            category_name_4,
            main_image_url,
            product_url,
            currency_symbol,
            sale_price,
            original_price
        FROM homary_products
        WHERE sku_id_default = ANY(:sku_ids)
        """
    )
    rows = (await session.execute(stmt, {"sku_ids": sku_ids})).mappings().all()
    return {str(row["sku_id_default"]): dict(row) for row in rows}


async def _fetch_seed_products(
    session: AsyncSession,
    *,
    limit: int = 12,
) -> list[dict[str, Any]]:
    stmt = text(
        """
        SELECT
            sku_id_default,
            spu_id,
            title,
            category_name_1,
            category_name_2,
            category_name_3,
            category_name_4,
            main_image_url,
            product_url,
            currency_symbol,
            sale_price,
            original_price,
            review_count
        FROM homary_products
        WHERE sku_id_default IS NOT NULL
          AND title IS NOT NULL
          AND sale_price IS NOT NULL
        ORDER BY
            review_count DESC NULLS LAST,
            original_price DESC NULLS LAST,
            sale_price DESC NULLS LAST
        LIMIT :limit
        """
    )
    rows = (await session.execute(stmt, {"limit": limit})).mappings().all()
    return [dict(row) for row in rows]


def _summary_query() -> Select[tuple[AgentShowcaseRecord]]:
    return select(AgentShowcaseRecord).where(AgentShowcaseRecord.is_public.is_(True)).order_by(
        AgentShowcaseRecord.approved_at.desc(),
        AgentShowcaseRecord.created_at.desc(),
    )


async def list_showcases(
    session: AsyncSession,
    *,
    limit: int = 20,
) -> list[AgentShowcaseSummary]:
    stmt = _summary_query().limit(limit)
    rows = (await session.scalars(stmt)).all()
    if not rows:
        return []

    cover_skus = [row.cover_sku_id_default for row in rows if row.cover_sku_id_default]
    products = await _fetch_products_by_sku(session, cover_skus)

    return [
        AgentShowcaseSummary(
            id=row.id,
            user_display_masked=row.user_display_masked,
            headline=row.headline,
            summary=row.summary,
            bundle_name=row.bundle_name,
            item_count=row.item_count,
            currency_symbol=row.currency_symbol,
            total_original_price=_money(row.total_original_price),
            total_final_price=_money(row.total_final_price),
            total_saved_amount=_money(row.total_saved_amount),
            cover_sku_id_default=row.cover_sku_id_default,
            cover_image_url=products.get(str(row.cover_sku_id_default), {}).get("main_image_url"),
            approved_at=row.approved_at,
            created_at=row.created_at,
        )
        for row in rows
    ]


async def get_showcase_detail(
    session: AsyncSession,
    showcase_id: uuid.UUID,
) -> AgentShowcaseDetail | None:
    record = await session.get(AgentShowcaseRecord, showcase_id)
    if record is None or not record.is_public:
        return None

    item_stmt = (
        select(AgentShowcaseItemRecord)
        .where(AgentShowcaseItemRecord.showcase_id == showcase_id)
        .order_by(AgentShowcaseItemRecord.sort_order.asc(), AgentShowcaseItemRecord.created_at.asc())
    )
    item_rows = (await session.scalars(item_stmt)).all()
    sku_ids = [row.sku_id_default for row in item_rows]
    product_map = await _fetch_products_by_sku(session, sku_ids)

    items: list[AgentShowcaseItem] = []
    for row in item_rows:
        product = product_map.get(row.sku_id_default)
        if product is None:
            continue
        original_price = _money(row.original_price)
        sale_price = _money(row.sale_price)
        final_price_used = _money(row.final_price_used)
        items.append(
            AgentShowcaseItem(
                sku_id_default=row.sku_id_default,
                spu_id=product.get("spu_id"),
                title=str(product.get("title") or ""),
                category_name_1=product.get("category_name_1"),
                category_name_2=product.get("category_name_2"),
                category_name_3=product.get("category_name_3"),
                category_name_4=product.get("category_name_4"),
                main_image_url=product.get("main_image_url"),
                product_url=product.get("product_url"),
                quantity=row.quantity,
                original_price=original_price,
                sale_price=sale_price,
                final_price_used=final_price_used,
                saved_amount=_money(row.saved_amount),
                sort_order=row.sort_order,
            )
        )

    cover_image_url = product_map.get(str(record.cover_sku_id_default or ""), {}).get("main_image_url")
    return AgentShowcaseDetail(
        id=record.id,
        user_display_masked=record.user_display_masked,
        headline=record.headline,
        summary=record.summary,
        bundle_name=record.bundle_name,
        item_count=record.item_count,
        currency_symbol=record.currency_symbol,
        total_original_price=_money(record.total_original_price),
        total_final_price=_money(record.total_final_price),
        total_saved_amount=_money(record.total_saved_amount),
        cover_sku_id_default=record.cover_sku_id_default,
        cover_image_url=cover_image_url,
        approved_at=record.approved_at,
        created_at=record.created_at,
        items=items,
    )


async def create_showcase(
    session: AsyncSession,
    *,
    user: User,
    payload: AgentShowcaseCreateIn,
) -> AgentShowcaseDetail:
    sku_ids = [item.sku_id_default for item in payload.items]
    product_map = await _fetch_products_by_sku(session, sku_ids)

    missing_skus = [sku for sku in sku_ids if sku not in product_map]
    if missing_skus:
        raise ValueError(f"Unknown sku_id_default: {', '.join(missing_skus)}")

    total_original_price = 0.0
    total_final_price = 0.0
    item_records: list[AgentShowcaseItemRecord] = []

    for item in payload.items:
        product = product_map[item.sku_id_default]
        quantity = int(item.quantity)
        sale_price = _money(product.get("sale_price"))
        original_unit_price = _money(product.get("original_price")) or sale_price
        final_unit_price = _money(item.final_price_used)
        if final_unit_price <= 0:
            final_unit_price = sale_price

        original_total = round(original_unit_price * quantity, 2)
        sale_total = round(sale_price * quantity, 2)
        final_total = round(final_unit_price * quantity, 2)
        saved_amount = round(max(original_total - final_total, 0.0), 2)

        total_original_price += original_total
        total_final_price += final_total

        item_records.append(
            AgentShowcaseItemRecord(
                sku_id_default=item.sku_id_default,
                quantity=quantity,
                sort_order=item.sort_order,
                original_price=original_total,
                sale_price=sale_total,
                final_price_used=final_total,
                saved_amount=saved_amount,
            )
        )

    total_original_price = round(total_original_price, 2)
    total_final_price = round(total_final_price, 2)
    total_saved_amount = round(max(total_original_price - total_final_price, 0.0), 2)
    approved_at = payload.approved_at or datetime.now(timezone.utc)
    cover_sku_id_default = payload.items[0].sku_id_default if payload.items else None
    currency_symbol = str(product_map[cover_sku_id_default].get("currency_symbol") or "$") if cover_sku_id_default else "$"
    display_name = _mask_user_display(user)

    record = AgentShowcaseRecord(
        user_id=user.id,
        user_display_masked=display_name,
        headline=_headline(display_name, total_saved_amount, currency_symbol),
        summary=payload.summary,
        bundle_name=payload.bundle_name,
        item_count=sum(item.quantity for item in payload.items),
        currency_symbol=currency_symbol,
        total_original_price=total_original_price,
        total_final_price=total_final_price,
        total_saved_amount=total_saved_amount,
        cover_sku_id_default=cover_sku_id_default,
        source_chat_session_id=payload.source_chat_session_id,
        source_negotiation_session_id=payload.source_negotiation_session_id,
        approved_at=approved_at,
    )
    session.add(record)
    await session.flush()

    for item_record in item_records:
        item_record.showcase_id = record.id
        session.add(item_record)

    await session.commit()
    return await get_showcase_detail(session, record.id)  # type: ignore[return-value]


async def create_mock_showcases(
    session: AsyncSession,
) -> int:
    existing_count = await session.scalar(
        select(func.count()).select_from(AgentShowcaseRecord).where(AgentShowcaseRecord.is_public.is_(True))
    )
    if int(existing_count or 0) > 0:
        return 0

    products = await _fetch_seed_products(session, limit=18)
    if len(products) < 3:
        raise ValueError("Not enough products in homary_products to seed showcase records.")

    created_count = 0
    group_size = 3
    base_time = datetime.now(timezone.utc)
    for index in range(0, min(len(products), 15), group_size):
        group = products[index : index + group_size]
        if len(group) < group_size:
            break

        profile = MOCK_AGENT_PROFILES[created_count % len(MOCK_AGENT_PROFILES)]
        category = _sentence_case(group[0].get("category_name_2") or group[0].get("category_name_1"))
        item_records: list[AgentShowcaseItemRecord] = []
        total_original_price = 0.0
        total_final_price = 0.0

        for item_index, product in enumerate(group):
            sale_price = _money(product.get("sale_price"))
            original_unit_price = _money(product.get("original_price")) or sale_price
            final_unit_price = round(sale_price * (0.8 + (item_index * 0.05)), 2)
            original_total = round(original_unit_price, 2)
            sale_total = round(sale_price, 2)
            final_total = round(final_unit_price, 2)
            saved_amount = round(max(original_total - final_total, 0.0), 2)

            total_original_price += original_total
            total_final_price += final_total
            item_records.append(
                AgentShowcaseItemRecord(
                    sku_id_default=str(product["sku_id_default"]),
                    quantity=1,
                    sort_order=item_index,
                    original_price=original_total,
                    sale_price=sale_total,
                    final_price_used=final_total,
                    saved_amount=saved_amount,
                )
            )

        total_original_price = round(total_original_price, 2)
        total_final_price = round(total_final_price, 2)
        total_saved_amount = round(max(total_original_price - total_final_price, 0.0), 2)

        record = AgentShowcaseRecord(
            user_id=None,
            user_display_masked=profile["shopper_name"],
            headline=_shopper_headline(profile["shopper_name"], total_saved_amount, "$"),
            summary=(
                f"{profile['agent_name']} put together a {category.lower()} package and closed the bundle "
                f"below the visible list price."
            ),
            bundle_name=f"{category} Collection",
            item_count=len(item_records),
            currency_symbol="$",
            total_original_price=total_original_price,
            total_final_price=total_final_price,
            total_saved_amount=total_saved_amount,
            cover_sku_id_default=str(group[0]["sku_id_default"]),
            source_chat_session_id=f"mock-chat-{created_count + 1}",
            source_negotiation_session_id=f"mock-neg-{created_count + 1}",
            approved_at=base_time.replace(microsecond=0),
        )
        session.add(record)
        await session.flush()

        for item_record in item_records:
            item_record.showcase_id = record.id
            session.add(item_record)

        await session.commit()
        created_count += 1
        base_time = base_time - timedelta(days=3)

    return created_count
