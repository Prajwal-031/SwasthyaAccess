import secrets
from datetime import date
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from app.config import settings
from app.db import get_db
from app.models import Facility, AppointmentRequest
from app.schemas import AppointmentCreate, AppointmentOut, FacilityOut, IntentRequest, IntentOut
from app.i18n import MESSAGES

app = FastAPI(
    title="SwasthyaAccess API",
    version="0.1.0",
    description="Non-diagnostic multilingual healthcare navigation demo API."
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

@app.get("/health")
def health():
    return {"status": "ok", "environment": settings.app_env}

@app.get("/api/v1/facilities", response_model=list[FacilityOut])
def list_facilities(query: str | None = None, language: str = "en", db: Session = Depends(get_db)):
    if language not in MESSAGES:
        raise HTTPException(422, "Unsupported language")
    stmt = select(Facility).order_by(Facility.name).limit(100)
    if query and query.strip():
        term = f"%{query.strip()}%"
        stmt = stmt.where(or_(Facility.name.ilike(term), Facility.area.ilike(term)))
    rows = db.scalars(stmt).all()
    return [
        FacilityOut(
            id=row.id, name=row.name, area=row.area,
            departments=row.departments_json, hours=row.hours, is_demo=row.is_demo
        ) for row in rows
    ]

@app.get("/api/v1/facilities/{facility_id}", response_model=FacilityOut)
def get_facility(facility_id: str, db: Session = Depends(get_db)):
    row = db.get(Facility, facility_id)
    if not row:
        raise HTTPException(404, "Facility not found")
    return FacilityOut(
        id=row.id, name=row.name, area=row.area,
        departments=row.departments_json, hours=row.hours, is_demo=row.is_demo
    )

@app.post("/api/v1/appointments", response_model=AppointmentOut, status_code=201)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db)):
    name = payload.participant_name.strip()
    if not name:
        raise HTTPException(422, "Please enter a name.")
    if payload.preferred_date < date.today():
        raise HTTPException(422, "Please choose today or a future date.")
    facility = db.get(Facility, payload.facility_id)
    if not facility or payload.department not in facility.departments_json:
        raise HTTPException(422, "Choose a valid sample facility and department.")
    reference = "SWA-" + secrets.token_hex(4).upper()
    record = AppointmentRequest(
        reference=reference,
        participant_name=name,
        facility_id=facility.id,
        department=payload.department,
        preferred_date=payload.preferred_date,
        language=payload.language,
        status="demo_created",
        is_demo=True,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return AppointmentOut(
        reference=record.reference,
        facility_name=facility.name,
        department=record.department,
        preferred_date=record.preferred_date,
        status=record.status,
        is_demo=True,
        notice=MESSAGES[payload.language]["demo_notice"],
    )

@app.get("/api/v1/appointments/{reference}", response_model=AppointmentOut)
def get_appointment(reference: str, db: Session = Depends(get_db)):
    stmt = select(AppointmentRequest).where(AppointmentRequest.reference == reference)
    record = db.scalar(stmt)
    if not record:
        raise HTTPException(404, "Demo request not found")
    facility = db.get(Facility, record.facility_id)
    return AppointmentOut(
        reference=record.reference,
        facility_name=facility.name if facility else "Sample facility",
        department=record.department,
        preferred_date=record.preferred_date,
        status=record.status,
        is_demo=record.is_demo,
        notice=MESSAGES[record.language]["demo_notice"],
    )

@app.post("/api/v1/intent", response_model=IntentOut)
def classify_intent(payload: IntentRequest):
    text = payload.text.casefold()
    groups = {
        "find_facility": ["hospital", "clinic", "health centre", "ಆಸ್ಪತ್ರೆ", "ಆರೋಗ್ಯ ಕೇಂದ್ರ", "अस्पताल", "स्वास्थ्य केंद्र"],
        "request_appointment": ["appointment", "book", "ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್", "ಬುಕ್", "अपॉइंटमेंट", "बुक"],
        "service_information": ["opd", "department", "laboratory", "ವಿಭಾಗ", "ಪ್ರಯೋಗಾಲಯ", "विभाग", "प्रयोगशाला"],
    }
    matches = [intent for intent, terms in groups.items() if any(term in text for term in terms)]
    if len(matches) == 1:
        return IntentOut(intent=matches[0], confidence=0.8, message="A suggested navigation intent was identified. Confirm before continuing.")
    return IntentOut(intent="unknown", confidence=0.0, message="I could not confidently identify that request. Please choose a service.")

@app.post("/api/v1/voice/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    if not settings.whisper_enabled:
        raise HTTPException(503, "Speech transcription is not enabled. Use browser voice input or text.")
    allowed = {"audio/webm", "audio/wav", "audio/mpeg", "audio/mp4", "audio/ogg", "application/octet-stream"}
    if audio.content_type not in allowed:
        raise HTTPException(415, "Unsupported audio type.")
    raw = await audio.read()
    if len(raw) > settings.max_audio_mb * 1024 * 1024:
        raise HTTPException(413, "Audio file is too large.")
    temp_path = Path("/tmp") / f"swasthya-{secrets.token_hex(8)}"
    temp_path.write_bytes(raw)
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel(settings.whisper_model, device="cpu", compute_type="int8")
        segments, info = model.transcribe(str(temp_path), beam_size=3)
        transcript = " ".join(segment.text.strip() for segment in segments).strip()
        return {"text": transcript, "language": info.language, "language_probability": info.language_probability}
    except ImportError:
        raise HTTPException(503, "Install requirements-whisper.txt to enable transcription.")
    finally:
        temp_path.unlink(missing_ok=True)
