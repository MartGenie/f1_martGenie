from types import SimpleNamespace

from src.plaza.service import _headline, _mask_user_display, _money


def test_mask_user_display_uses_email_when_available():
    user = SimpleNamespace(id="abc123", email="alice@example.com")
    assert _mask_user_display(user) == "al***@example.com"


def test_mask_user_display_falls_back_to_user_id_prefix():
    user = SimpleNamespace(id="12345678-1234-1234-1234-123456789abc", email=None)
    assert _mask_user_display(user) == "User-123456"


def test_headline_formats_saved_amount():
    assert _headline("al***@example.com", 28.5, "$") == "Agent 帮 al***@example.com 节省了 $28.50"


def test_money_normalizes_none_and_rounds():
    assert _money(None) == 0.0
    assert _money(12.345) == 12.35
