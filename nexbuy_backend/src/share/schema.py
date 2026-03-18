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
