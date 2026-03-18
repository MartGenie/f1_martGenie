from pydantic import BaseModel, Field, field_validator


class ProductEmailShareIn(BaseModel):
    sku_id_default: str = Field(min_length=1)
    recipient_email: str = Field(min_length=3, max_length=320)

    @field_validator("recipient_email")
    @classmethod
    def validate_recipient_email(cls, value: str) -> str:
        normalized = value.strip()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Enter a valid recipient email address.")
        return normalized


class ProductEmailShareOut(BaseModel):
    email_id: str
    recipient_email: str
    product_title: str


class BundleEmailShareItemIn(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    price: float = Field(ge=0)


class BundleEmailShareIn(BaseModel):
    bundle_title: str = Field(min_length=1, max_length=500)
    summary: str | None = None
    total_price: float | None = Field(default=None, ge=0)
    recipient_email: str = Field(min_length=3, max_length=320)
    items: list[BundleEmailShareItemIn] = Field(default_factory=list, max_length=12)

    @field_validator("recipient_email")
    @classmethod
    def validate_bundle_recipient_email(cls, value: str) -> str:
        normalized = value.strip()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Enter a valid recipient email address.")
        return normalized


class BundleEmailShareOut(BaseModel):
    email_id: str
    recipient_email: str
    bundle_title: str
