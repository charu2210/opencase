from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_question_too_short_returns_422():
    resp = client.post("/api/investigator/ask", json={
        "case_id": "mh370", "mode": "detective", "question": "short"
    })
    assert resp.status_code == 422

def test_empty_body_rejected():
    resp = client.post("/api/investigator/ask", json={})
    assert resp.status_code == 422

def test_invalid_case_id_returns_404():
    resp = client.post("/api/investigator/ask", json={
        "case_id": "not-a-real-case", "mode": "detective",
        "question": "Why is this case still unsolved today?"
    })
    assert resp.status_code == 404

def test_invalid_mode_returns_422():
    resp = client.post("/api/investigator/ask", json={
        "case_id": "mh370", "mode": "wizard",
        "question": "Why is this case still unsolved today?"
    })
    assert resp.status_code == 422

def test_theory_too_short_returns_422():
    resp = client.post("/api/investigator/build-theory", json={
        "case_id": "mh370", "user_theory": "too short"
    })
    assert resp.status_code == 422

def test_rate_limit_returns_429():
    for _ in range(11):
        resp = client.post("/api/investigator/ask", json={
            "case_id": "mh370", "mode": "detective",
            "question": "Why is this case still unsolved today?"
        })
    assert resp.status_code == 429
