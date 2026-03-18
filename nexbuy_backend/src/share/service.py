from __future__ import annotations

from html import escape
from typing import Any

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.share.schema import ProductEmailShareOut
from src.web.auth.config import settings
from src.web.auth.models import User


async def _fetch_product_for_share(
    session: AsyncSession,
    *,
    sku_id_default: str,
) -> dict[str, Any] | None:
    stmt = text(
        """
        SELECT
            sku_id_default,
            title,
            category_name_1,
            category_name_2,
            category_name_3,
            main_image_url,
            product_url,
            sale_price,
            original_price,
            currency_symbol
        FROM homary_products
        WHERE sku_id_default = :sku_id_default
        LIMIT 1
        """
    )
    row = (await session.execute(stmt, {"sku_id_default": sku_id_default})).mappings().first()
    return dict(row) if row else None


def _format_money(value: float | None, currency_symbol: str) -> str:
    if value is None:
        return "Price unavailable"
    formatted = f"{value:,.2f}".rstrip("0").rstrip(".")
    return f"{currency_symbol}{formatted}"


def _build_product_share_html(
    *,
    sharer_email: str,
    product: dict[str, Any],
) -> str:
    title = escape(str(product.get("title") or "Shared product"))
    product_url = str(product.get("product_url") or "").strip()
    category = " / ".join(
        escape(str(value))
        for value in [
            product.get("category_name_1"),
            product.get("category_name_2"),
            product.get("category_name_3"),
        ]
        if value
    )
    currency_symbol = str(product.get("currency_symbol") or "$")
    price_text = _format_money(product.get("sale_price"), currency_symbol)
    original_price_text = _format_money(product.get("original_price"), currency_symbol)
    image_url = str(product.get("main_image_url") or "").strip()
    sharer_label = escape(sharer_email)
    product_link = (
        f'<a href="{escape(product_url)}" '
        'style="display:inline-flex;padding:12px 18px;border-radius:999px;'
        'background:linear-gradient(180deg,#111827 0%,#1f2937 100%);color:#ffffff;'
        'text-decoration:none;font-weight:600;">View product</a>'
        if product_url
        else ""
    )
    image_html = (
        f'<div style="margin:0 0 20px 0;"><img src="{escape(image_url)}" alt="{title}" '
        'style="width:100%;max-width:520px;border-radius:24px;display:block;object-fit:cover;" /></div>'
        if image_url
        else ""
    )
    original_price_html = (
        f'<p style="margin:8px 0 0 0;font-size:14px;color:#98a2b3;">Original: {escape(original_price_text)}</p>'
        if product.get("original_price") and product.get("original_price") != product.get("sale_price")
        else ""
    )
    category_html = (
        f'<p style="margin:0 0 8px 0;font-size:12px;font-weight:700;letter-spacing:0.18em;'
        f'text-transform:uppercase;color:#7c8da5;">{category}</p>'
        if category
        else ""
    )

    return (
        '<div style="background:#f4f8fb;padding:32px 16px;font-family:Inter,Segoe UI,system-ui,sans-serif;color:#101828;">'
        '<div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dde5ef;'
        'border-radius:32px;padding:28px;box-shadow:0 22px 60px rgba(15,23,42,0.08);">'
        '<p style="margin:0 0 10px 0;font-size:12px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#7c8da5;">'
        'Shared from MartGennie</p>'
        f'<h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.15;">{title}</h1>'
        f'<p style="margin:0 0 24px 0;font-size:15px;line-height:1.8;color:#475467;">'
        f'{sharer_label} thought you might want to take a look at this product.</p>'
        f'{image_html}'
        '<div style="padding:22px;border:1px solid #e5edf5;border-radius:24px;'
        'background:linear-gradient(180deg,#ffffff 0%,#f8fbff 100%);">'
        f'{category_html}'
        f'<p style="margin:0;font-size:16px;line-height:1.8;color:#344054;">Current price</p>'
        f'<p style="margin:8px 0 0 0;font-size:30px;font-weight:800;color:#101828;">{escape(price_text)}</p>'
        f'{original_price_html}'
        f'<div style="margin-top:22px;">{product_link}</div>'
        '</div>'
        '<p style="margin:22px 0 0 0;font-size:13px;line-height:1.8;color:#667085;">'
        'This email was sent through MartGennie product sharing.</p>'
        '</div>'
        '</div>'
    )


def _build_product_share_text(
    *,
    sharer_email: str,
    product: dict[str, Any],
) -> str:
    currency_symbol = str(product.get("currency_symbol") or "$")
    price_text = _format_money(product.get("sale_price"), currency_symbol)
    product_url = str(product.get("product_url") or "").strip()
    title = str(product.get("title") or "Shared product")
    category = " / ".join(
        str(value)
        for value in [
            product.get("category_name_1"),
            product.get("category_name_2"),
            product.get("category_name_3"),
        ]
        if value
    )
    parts = [
        f"{sharer_email} shared a product with you from MartGennie.",
        "",
        title,
    ]
    if category:
        parts.append(category)
    parts.append(f"Current price: {price_text}")
    if product_url:
        parts.extend(["", product_url])
    return "\n".join(parts)


async def share_product_via_email(
    session: AsyncSession,
    *,
    user: User,
    sku_id_default: str,
    recipient_email: str,
) -> ProductEmailShareOut:
    if not settings.resend_api_key:
        raise RuntimeError("RESEND_API_KEY is not configured.")

    product = await _fetch_product_for_share(session, sku_id_default=sku_id_default)
    if product is None:
        raise ValueError("Product not found for email sharing.")

    subject = f"{user.email.split('@', 1)[0]} shared a MartGennie product with you"
    payload: dict[str, Any] = {
        "from": settings.resend_from_email,
        "to": [recipient_email],
        "subject": subject,
        "html": _build_product_share_html(sharer_email=user.email, product=product),
        "text": _build_product_share_text(sharer_email=user.email, product=product),
    }
    if settings.resend_reply_to:
        payload["reply_to"] = settings.resend_reply_to

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"{settings.resend_api_base_url.rstrip('/')}/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if response.is_error:
        detail = response.text.strip() or "Unknown Resend error."
        raise RuntimeError(f"Resend email send failed: {detail}")

    data = response.json()
    email_id = str(data.get("id") or "")
    if not email_id:
        raise RuntimeError("Resend did not return an email id.")

    return ProductEmailShareOut(
        email_id=email_id,
        recipient_email=recipient_email,
        product_title=str(product.get("title") or sku_id_default),
    )
