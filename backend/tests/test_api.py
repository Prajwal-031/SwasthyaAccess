from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db import Base, get_db
from app.models import Facility

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)

def override_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_db
client = TestClient(app)

def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestingSession() as db:
        db.add(Facility(
            id="test-centre", name="Test Community Centre", area="Test area",
            departments_json=["General Medicine", "Dental"],
            hours="Demo hours", is_demo=True
        ))
        db.commit()

def test_health():
    assert client.get("/health").json()["status"] == "ok"

def test_facility_search():
    response = client.get("/api/v1/facilities?query=Test")
    assert response.status_code == 200
    assert response.json()[0]["id"] == "test-centre"

def test_create_and_retrieve_demo_appointment():
    response = client.post("/api/v1/appointments", json={
        "participant_name": "Test Participant",
        "facility_id": "test-centre",
        "department": "Dental",
        "preferred_date": (date.today() + timedelta(days=2)).isoformat(),
        "language": "en"
    })
    assert response.status_code == 201
    payload = response.json()
    assert payload["is_demo"] is True
    saved = client.get(f"/api/v1/appointments/{payload['reference']}")
    assert saved.status_code == 200
    assert saved.json()["reference"] == payload["reference"]

def test_invalid_department_is_rejected():
    response = client.post("/api/v1/appointments", json={
        "participant_name": "Test Participant",
        "facility_id": "test-centre",
        "department": "Cardiac Surgery",
        "preferred_date": (date.today() + timedelta(days=2)).isoformat(),
        "language": "en"
    })
    assert response.status_code == 422

def test_intent_is_only_a_suggestion():
    response = client.post("/api/v1/intent", json={"text": "I need an appointment", "language": "en"})
    assert response.status_code == 200
    assert response.json()["intent"] == "request_appointment"
    assert response.json()["requires_confirmation"] is True
