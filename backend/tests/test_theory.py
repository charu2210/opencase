def test_get_investigation_modes(client):
    response = client.get("/api/theory/modes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 4
    ids = [m["id"] for m in data]
    assert "detective" in ids
    assert "scientist" in ids
    assert "journalist" in ids
    assert "historian" in ids

def test_build_theory_success(client, mock_gemini):
    payload = {
        "case_id": "mh370",
        "user_theory": "It was aliens."
    }
    response = client.post("/api/investigator/build-theory", json=payload)
    if response.status_code == 404:
        import pytest
        pytest.skip("mh370 case missing")
    
    assert response.status_code == 200
    data = response.json()
    assert data["evaluation"] == "This is a mocked AI response."

def test_compare_theories_success(client, mock_gemini):
    response = client.post("/api/investigator/compare-theories?case_id=mh370&theory_a=Aliens&theory_b=Simulation")
    if response.status_code == 404:
        import pytest
        pytest.skip("mh370 case missing")
        
    assert response.status_code == 200
    data = response.json()
    assert data["comparison"] == "This is a mocked AI response."
