from __future__ import annotations

from typing import Any


VALID_URGENCY = {"HOT", "NORMAL", "URGENT"}


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_int(value: Any, default: int = 0) -> int:
    try:
        if value is None:
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def _first_non_null(product: dict[str, Any], keys: list[str], default: Any = None) -> Any:
    for key in keys:
        if key in product and product[key] is not None:
            return product[key]
    return default


def round_to_human_price(price: float) -> float:
    """
    Psychological rounding:
    - round to nearest 10 first
    - x00 -> x99
    - keep x10/x20/.../x90 as-is
    """
    rounded = round(price / 10.0) * 10.0
    if int(rounded) % 100 == 0:
        return rounded - 1.0
    return rounded


def _resolve_product_inputs(product: dict[str, Any]) -> tuple[float, float, int, str]:
    # Primary keys for your current table/mocks.
    list_price = _to_float(
        _first_non_null(product, ["sale_price", "list_price"], default=0.0),
        default=0.0,
    )
    bottom_price = _to_float(
        _first_non_null(product, ["mock_min_floor_price", "bottom_price"], default=0.0),
        default=0.0,
    )
    stock = _to_int(
        _first_non_null(product, ["mock_inventory", "stock_quantity"], default=0),
        default=0,
    )
    urgency = str(
        product.get("mock_urgency_status", product.get("urgency_status", "NORMAL"))
    ).strip().upper()
    if urgency not in VALID_URGENCY:
        urgency = "NORMAL"

    if bottom_price < 0:
        bottom_price = 0.0
    if list_price < 0:
        list_price = 0.0
    if bottom_price > list_price:
        # Keep hard floor valid.
        bottom_price = list_price

    return list_price, bottom_price, stock, urgency


def _yield_profile(urgency: str, stock: int) -> tuple[float, float]:
    """
    Returns:
    - target_yield: expected concession ratio of margin
    - floor_yield: hard-limit concession ratio of margin
    """
    if urgency == "HOT":
        return 0.00, 0.10
    if urgency == "URGENT":
        return 0.50, 1.00

    # NORMAL
    if stock > 500:
        return 0.16, 0.32
    if stock > 300:
        return 0.13, 0.26
    if stock > 200:
        return 0.11, 0.22
    if stock > 120:
        return 0.09, 0.18
    if stock > 60:
        return 0.07, 0.14
    return 0.05, 0.10


def calculate_negotiation_params(product: dict[str, Any]) -> dict[str, float | int | str]:
    """
    Compute seller negotiation rails:
    - max_expected_price: seller's preferred closing price (target)
    - min_expected_price: seller's absolute acceptable minimum (hard floor)

    Input supports both:
    - your current table fields: sale_price/mock_min_floor_price/mock_inventory/mock_urgency_status
    - generic fields: list_price/bottom_price/stock_quantity/urgency_status
    """
    list_price, bottom_price, stock, urgency = _resolve_product_inputs(product)
    margin = max(list_price - bottom_price, 0.0)
    target_yield, floor_yield = _yield_profile(urgency, stock)

    raw_target_price = list_price - (margin * target_yield)
    raw_hard_floor = list_price - (margin * floor_yield)

    target_price = max(round_to_human_price(raw_target_price), bottom_price)
    hard_floor = max(round_to_human_price(raw_hard_floor), bottom_price)

    # Ensure target is never below hard floor.
    target_price = max(target_price, hard_floor)

    return {
        "urgency_status": urgency,
        "stock_quantity": stock,
        "list_price": round(list_price, 2),
        "bottom_price": round(bottom_price, 2),
        "margin_space": round(margin, 2),
        "target_yield": round(target_yield, 4),
        "floor_yield": round(floor_yield, 4),
        "max_expected_price": round(target_price, 2),  # seller preferred close
        "min_expected_price": round(hard_floor, 2),   # seller hard floor
        # Backward-compatible aliases:
        "target_price": round(target_price, 2),
        "hard_floor": round(hard_floor, 2),
    }
