def test_ask_investigator_success(client, mock_gemini):
    payload = {
        "question": "Who was the prime suspect?",
        "case_id": "mh370",
        "mode": "detective"
    }
    response = client.post("/api/investigator/ask", json=payload)
    if response.status_code == 404:
        import pytest
        pytest.skip("mh370 case missing")
    
    assert response.status_code == 200
    data = response.json()
    assert data["case_id"] == "mh370"
    assert data["answer"] == "This is a mocked AI response."
    assert data["cached"] is False
    mock_gemini.assert_called_once()

def test_ask_investigator_caching(client, mock_gemini):
    payload = {
        "question": "What is the cache test?",
        "case_id": "mh370",
        "mode": "scientist"
    }
    # First request - cache miss
    response1 = client.post("/api/investigator/ask", json=payload)
    if response1.status_code == 404:
        import pytest
        pytest.skip("mh370 case missing")
    
    assert response1.status_code == 200
    assert response1.json()["cached"] is False
    assert mock_gemini.call_count == 1

    # Second request - cache hit
    response2 = client.post("/api/investigator/ask", json=payload)
    assert response2.status_code == 200
    assert response2.json()["cached"] is True
    assert response2.json()["answer"] == "This is a mocked AI response."
    # API should NOT have been called again
    assert mock_gemini.call_count == 1

def test_ask_investigator_invalid_mode(client):
    payload = {
        "question": "Test",
        "case_id": "mh370",
        "mode": "invalid_mode"
    }
    response = client.post("/api/investigator/ask", json=payload)
    assert response.status_code == 400
    assert "Unknown mode" in response.json()["detail"]
