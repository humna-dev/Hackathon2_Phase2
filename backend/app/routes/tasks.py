from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List
from jose import JWTError, jwt
import os
from dotenv import load_dotenv

load_dotenv()

from ..models import Task
from ..schemas import TaskCreate, TaskUpdate, TaskResponse
from ..database import get_session

router = APIRouter()

SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")

def verify_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        token_type, token = authorization.split()
        if token_type.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id)
    except (ValueError, JWTError):
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    statement = select(Task).where(Task.user_id == user_id)
    result = await session.execute(statement)
    return result.scalars().all()

@router.post("/tasks", response_model=TaskResponse)
async def create_task(
    task: TaskCreate,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    db_task = Task(
        title=task.title,
        description=task.description,
        completed=task.completed,
        user_id=user_id
    )
    
    session.add(db_task)
    await session.commit()
    await session.refresh(db_task)
    return db_task

@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await session.execute(statement)
    db_task = result.scalar_one_or_none()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for field, value in task_update.dict(exclude_unset=True).items():
        setattr(db_task, field, value)
    
    await session.commit()
    await session.refresh(db_task)
    return db_task

@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await session.execute(statement)
    db_task = result.scalar_one_or_none()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await session.delete(db_task)
    await session.commit()
    return {"message": "Task deleted successfully"}