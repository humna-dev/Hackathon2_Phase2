from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
import enum


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship to tasks
    tasks: list["Task"] = Relationship(back_populates="owner")


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    user_id: int = Field(foreign_key="user.id", index=True)
    
    # Relationship to user
    owner: User = Relationship(back_populates="tasks")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)