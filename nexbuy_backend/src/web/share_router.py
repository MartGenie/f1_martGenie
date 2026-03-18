from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.share.schema import BundleEmailShareIn, BundleEmailShareOut, ProductEmailShareIn, ProductEmailShareOut
from src.share.service import share_bundle_via_email, share_product_via_email
from src.web.auth.db import get_async_session
from src.web.auth.dependencies import CurrentActiveUser
from src.web.auth.models import User


router = APIRouter(prefix="/share", tags=["share"])


@router.post("/product/email", response_model=ProductEmailShareOut, status_code=201)
async def share_product_email(
    payload: ProductEmailShareIn,
    user: User = Depends(CurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> ProductEmailShareOut:
    try:
        return await share_product_via_email(
            session,
            user=user,
            sku_id_default=payload.sku_id_default,
            recipient_email=payload.recipient_email,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        message = str(exc)
        status_code = 503 if "RESEND_API_KEY" in message else 502
        raise HTTPException(status_code=status_code, detail=message) from exc


@router.post("/bundle/email", response_model=BundleEmailShareOut, status_code=201)
async def share_bundle_email(
    payload: BundleEmailShareIn,
    user: User = Depends(CurrentActiveUser),
) -> BundleEmailShareOut:
    try:
        return await share_bundle_via_email(
            user=user,
            payload=payload,
        )
    except RuntimeError as exc:
        message = str(exc)
        status_code = 503 if "RESEND_API_KEY" in message else 502
        raise HTTPException(status_code=status_code, detail=message) from exc
