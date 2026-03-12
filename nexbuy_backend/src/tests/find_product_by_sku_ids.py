import asyncio
import json
import sys
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

from src.web.auth.config import settings


TARGET_SKU_IDS = ["54710", "54708"]


async def main() -> None:
    engine = create_async_engine(settings.database_url, echo=False)

    try:
        async with engine.connect() as connection:
            result = await connection.execute(
                text(
                    """
                    SELECT
                        sku_id_default,
                        title,
                        sub_title,
                        description_text,
                        main_image_url,
                        gallery_image_urls,
                        product_url,
                        canonical_url
                    FROM homary_products
                    WHERE sku_id_default = ANY(:sku_ids)
                    ORDER BY CASE sku_id_default
                        WHEN :sku_id_1 THEN 1
                        WHEN :sku_id_2 THEN 2
                        ELSE 999
                    END
                    """
                ),
                {
                    "sku_ids": TARGET_SKU_IDS,
                    "sku_id_1": TARGET_SKU_IDS[0],
                    "sku_id_2": TARGET_SKU_IDS[1],
                },
            )
            rows = result.mappings().all()

            payload = {
                "requested_sku_ids": TARGET_SKU_IDS,
                "matches": len(rows),
                "products": [],
            }

            for row in rows:
                gallery_images = row.get("gallery_image_urls") or []
                payload["products"].append(
                    {
                        "sku_id_default": row.get("sku_id_default"),
                        "title": row.get("title"),
                        "sub_title": row.get("sub_title"),
                        "description_text": row.get("description_text"),
                        "main_image_url": row.get("main_image_url"),
                        "gallery_image_urls": gallery_images,
                        "product_url": row.get("product_url"),
                        "canonical_url": row.get("canonical_url"),
                    }
                )

            print(json.dumps(payload, ensure_ascii=False, indent=2, default=str))
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
