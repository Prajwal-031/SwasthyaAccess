from datetime import date
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

Language = Literal["en", "kn", "hi"]

class FacilityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    area: str
    departments: list[str]
    hours: str
    is_demo: bool = True

class AppointmentCreate(BaseModel):
    participant_name: str = Field(min_length=1, max_length=120)
    facility_id: str
    department: str = Field(min_length=1, max_length=100)
    preferred_date: date
    language: Language = "en"

class AppointmentOut(BaseModel):
    reference: str
    facility_name: str
    department: str
    preferred_date: date
    status: str
    is_demo: bool
    notice: str

class IntentRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    language: Language = "en"

class IntentOut(BaseModel):
    intent: Literal["find_facility", "request_appointment", "service_information", "unknown"]
    confidence: float
    requires_confirmation: bool = True
    message: str
