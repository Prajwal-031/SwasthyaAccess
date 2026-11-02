import uuid
from datetime import date, datetime, timezone
from sqlalchemy import String, Boolean, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

def new_id() -> str:
    return str(uuid.uuid4())

class Facility(Base):
    __tablename__ = "facilities"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    area: Mapped[str] = mapped_column(String(180), nullable=False)
    departments_json: Mapped[list] = mapped_column(JSON, nullable=False)
    hours: Mapped[str] = mapped_column(String(180), nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    appointments: Mapped[list["AppointmentRequest"]] = relationship(back_populates="facility")

class AppointmentRequest(Base):
    __tablename__ = "appointment_requests"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    reference: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    participant_name: Mapped[str] = mapped_column(String(120), nullable=False)
    facility_id: Mapped[str] = mapped_column(ForeignKey("facilities.id"), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    preferred_date: Mapped[date] = mapped_column(Date, nullable=False)
    language: Mapped[str] = mapped_column(String(2), nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="demo_created", nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    facility: Mapped[Facility] = relationship(back_populates="appointments")
