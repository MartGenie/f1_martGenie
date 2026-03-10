import argparse
import asyncio
import hashlib
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

BACKEND_ROOT = Path(__file__).resolve().parents[3]
import sys

if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

from src.web.auth.config import settings


DEFAULT_TABLE = "homary_products"
DEFAULT_BATCH_SIZE = 500
TABLE_NAME_RE = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")

STATUS_HOT = "HOT"
STATUS_NORMAL = "NORMAL"
STATUS_URGENT = "URGENT"
VALID_STATUS = {STATUS_HOT, STATUS_NORMAL, STATUS_URGENT}

ALTER_SQL = """
ALTER TABLE homary_products
ADD COLUMN IF NOT EXISTS mock_urgency_status TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS mock_inventory INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS mock_min_floor_price NUMERIC(10, 2);
"""

ADD_CHECK_SQL = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_homary_products_mock_urgency_status'
    ) THEN
        ALTER TABLE homary_products
        ADD CONSTRAINT ck_homary_products_mock_urgency_status
        CHECK (mock_urgency_status IN ('HOT', 'NORMAL', 'URGENT'));
    END IF;
END $$;
"""


@dataclass
class MockResult:
    mock_urgency_status: str
    mock_inventory: int
    mock_min_floor_price: float | None


def _hash_int(seed: str) -> int:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return int(digest[:16], 16)


def _rand01(seed: str) -> float:
    return (_hash_int(seed) % 10_000_000) / 10_000_000.0


def _pick_status(sku: str) -> str:
    bucket = _hash_int(f"{sku}:status") % 100
    if bucket < 34:
        return STATUS_HOT
    if bucket < 67:
        return STATUS_NORMAL
    return STATUS_URGENT


def _pick_inventory(sku: str, status: str) -> int:
    base = _hash_int(f"{sku}:inventory")
    if status == STATUS_HOT:
        inventory = 120 + (base % 681)  # 120-800
    elif status == STATUS_NORMAL:
        inventory = 30 + (base % 271)  # 30-300
    else:
        inventory = 5 + (base % 196)  # 5-200

    # Inject some edge cases to cover more scenarios.
    edge_bucket = _hash_int(f"{sku}:inventory_edge") % 100
    if edge_bucket < 8:
        inventory = max(0, inventory // 10)  # very low stock
    elif edge_bucket > 95:
        inventory = inventory + 400  # oversized stock pressure
    return int(inventory)


def _ratio_range(status: str, inventory: int) -> tuple[float, float]:
    if status == STATUS_HOT:
        return 0.93, 0.99
    if status == STATUS_URGENT:
        if inventory >= 180:
            return 0.45, 0.65
        if inventory >= 60:
            return 0.60, 0.78
        return 0.75, 0.85
    # NORMAL
    if inventory >= 180:
        return 0.72, 0.85
    if inventory >= 60:
        return 0.80, 0.90
    return 0.88, 0.95


def _pick_floor_price(sku: str, sale_price: float | None, status: str, inventory: int) -> float | None:
    if sale_price is None or sale_price <= 0:
        return None
    low, high = _ratio_range(status, inventory)
    r = _rand01(f"{sku}:floor_ratio")
    ratio = low + (high - low) * r
    floor = round(float(sale_price) * ratio, 2)
    floor = min(floor, round(float(sale_price), 2))
    if floor < 0:
        floor = 0.0
    return floor


def build_mock_values(sku: str, sale_price: float | None) -> MockResult:
    status = _pick_status(sku)
    if status not in VALID_STATUS:
        status = STATUS_NORMAL
    inventory = _pick_inventory(sku, status)
    floor = _pick_floor_price(sku, sale_price, status, inventory)
    return MockResult(
        mock_urgency_status=status,
        mock_inventory=inventory,
        mock_min_floor_price=floor,
    )


async def apply_mock_fields(table_name: str, batch_size: int, limit: int | None) -> None:
    if not TABLE_NAME_RE.fullmatch(table_name):
        raise ValueError(f"Invalid table name: {table_name}")

    alter_sql = text(ALTER_SQL.replace("homary_products", table_name))
    add_check_sql = text(ADD_CHECK_SQL.replace("homary_products", table_name))
    select_sql = text(
        f"""
        SELECT sku_id_default, sale_price
        FROM {table_name}
        WHERE sku_id_default IS NOT NULL
        ORDER BY sku_id_default ASC
        LIMIT :limit OFFSET :offset
        """
    )
    update_sql = text(
        f"""
        UPDATE {table_name}
        SET
            mock_urgency_status = :mock_urgency_status,
            mock_inventory = :mock_inventory,
            mock_min_floor_price = :mock_min_floor_price
        WHERE sku_id_default = :sku_id_default
        """
    )

    engine = create_async_engine(settings.database_url, echo=False)
    try:
        offset = 0
        processed = 0
        status_stats = {STATUS_HOT: 0, STATUS_NORMAL: 0, STATUS_URGENT: 0}
        null_floor_count = 0

        async with engine.begin() as conn:
            await conn.execute(alter_sql)
            await conn.execute(add_check_sql)

            while True:
                fetch_limit = batch_size
                if limit is not None:
                    remain = limit - processed
                    if remain <= 0:
                        break
                    fetch_limit = min(fetch_limit, remain)

                rows = (
                    await conn.execute(
                        select_sql,
                        {"limit": fetch_limit, "offset": offset},
                    )
                ).mappings().all()
                if not rows:
                    break

                offset += len(rows)
                payload: list[dict[str, Any]] = []
                for row in rows:
                    sku = str(row["sku_id_default"])
                    sale_price = float(row["sale_price"]) if row["sale_price"] is not None else None
                    mocked = build_mock_values(sku, sale_price)
                    status_stats[mocked.mock_urgency_status] += 1
                    if mocked.mock_min_floor_price is None:
                        null_floor_count += 1
                    payload.append(
                        {
                            "sku_id_default": sku,
                            "mock_urgency_status": mocked.mock_urgency_status,
                            "mock_inventory": mocked.mock_inventory,
                            "mock_min_floor_price": mocked.mock_min_floor_price,
                        }
                    )

                await conn.execute(update_sql, payload)
                processed += len(payload)
                print(f"[INFO] processed={processed}")

        print("===== Mock Field Generation Finished =====")
        print(f"Target table                    : {table_name}")
        print(f"Processed rows                  : {processed}")
        print(f"{STATUS_HOT} count                 : {status_stats[STATUS_HOT]}")
        print(f"{STATUS_NORMAL} count              : {status_stats[STATUS_NORMAL]}")
        print(f"{STATUS_URGENT} count              : {status_stats[STATUS_URGENT]}")
        print(f"Rows with NULL mock_min_floor_price: {null_floor_count}")
        print("Rule check: mock_min_floor_price <= sale_price is guaranteed in generator.")
    finally:
        await engine.dispose()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate seller mock fields for homary products.")
    parser.add_argument("--table", type=str, default=DEFAULT_TABLE, help="Target table name.")
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE, help="Batch size.")
    parser.add_argument("--limit", type=int, default=0, help="Max rows to process. 0 means no limit.")
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    limit = args.limit if args.limit and args.limit > 0 else None
    await apply_mock_fields(
        table_name=args.table,
        batch_size=max(1, args.batch_size),
        limit=limit,
    )


if __name__ == "__main__":
    asyncio.run(main())

