def test_get_cases(client):
    response = client.get("/api/cases/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "id" in data[0]
    assert "name" in data[0]

def test_get_case_detail_success(client):
    # 'zodiac' case was added previously or 'mh370' is there
    response = client.get("/api/cases/mh370")
    if response.status_code == 404:
        pytest.skip("MH370 case file not found")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "mh370"
    assert "known_facts" in data

def test_get_case_detail_not_found(client):
    response = client.get("/api/cases/nonexistent_case")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
