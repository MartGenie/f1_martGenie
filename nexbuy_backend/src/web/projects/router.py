from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.projects.schema import ChatProjectCreateIn, ChatProjectItemOut, ChatProjectListOut
from src.projects.service import create_project, delete_project, list_projects
from src.web.auth.db import get_async_session
from src.web.auth.dependencies import CurrentActiveUser
from src.web.auth.models import User


router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=ChatProjectListOut)
async def fetch_projects(
    user: User = Depends(CurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> ChatProjectListOut:
    return await list_projects(session, user.id)


@router.post("", response_model=ChatProjectItemOut, status_code=201)
async def create_project_record(
    payload: ChatProjectCreateIn,
    user: User = Depends(CurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> ChatProjectItemOut:
    try:
        return await create_project(session, user_id=user.id, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{project_id}", status_code=204)
async def remove_project(
    project_id: str,
    user: User = Depends(CurrentActiveUser),
    session: AsyncSession = Depends(get_async_session),
) -> None:
    try:
        await delete_project(session, user_id=user.id, project_id=project_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
