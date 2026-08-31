def test_404_not_found(client):
    response = client.get("/api/invalid-endpoint-that-does-not-exist")
    assert response.status_code == 404

def test_missing_case_investigator(client):
    payload = {
        "question": "What is the meaning of life?",
        "case_id": "this_case_does_not_exist",
        "mode": "detective"
    }
    response = client.post("/api/investigator/ask", json=payload)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
