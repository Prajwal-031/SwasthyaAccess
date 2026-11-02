from sqlalchemy import select
from app.db import Base, engine, SessionLocal
from app.models import Facility

SAMPLE_FACILITIES = [
    {
        "id": "sample-community-centre",
        "name": "Community Health Centre — Sample",
        "area": "Central area (demo location)",
        "departments_json": ["General Medicine", "Paediatrics", "Dental"],
        "hours": "Sample hours: 9:00 AM – 5:00 PM",
    },
    {
        "id": "sample-primary-centre",
        "name": "Primary Health Centre — Sample",
        "area": "North area (demo location)",
        "departments_json": ["General Medicine", "Maternal Health", "Immunisation"],
        "hours": "Sample hours: 10:00 AM – 4:00 PM",
    },
    {
        "id": "sample-urban-clinic",
        "name": "Urban Health Clinic — Sample",
        "area": "South area (demo location)",
        "departments_json": ["General Medicine", "Dental", "Laboratory"],
        "hours": "Sample hours: 8:30 AM – 2:30 PM",
    },
]

def seed():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        for item in SAMPLE_FACILITIES:
            if not db.get(Facility, item["id"]):
                db.add(Facility(**item, is_demo=True))
        db.commit()

if __name__ == "__main__":
    seed()
