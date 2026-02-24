import os
from fastapi.testclient import TestClient
from backend.app import app

def test_autonomy_policy_security():
    client = TestClient(app)

    # 1. Verify access without API Key is DENIED (401)
    response = client.get("/api/v1/autonomy-policy")
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    assert response.json()["detail"] == "Missing API Key"
    print("\n[SUCCESS] /api/v1/autonomy-policy correctly denied access without API Key")

    # 2. Verify access with INVALID API Key is DENIED (401)
    # We need to set the expected key in env first
    os.environ["ROBODJ_SECRET_KEY"] = "test-secret-key"
    # Clear lru_cache for _get_secret_key
    from backend.security.auth import _get_secret_key
    _get_secret_key.cache_clear()

    response = client.get(
        "/api/v1/autonomy-policy",
        headers={"X-API-Key": "wrong-key"}
    )
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    assert response.json()["detail"] == "Invalid API Key"
    print("[SUCCESS] /api/v1/autonomy-policy correctly denied access with INVALID API Key")

    # 3. Verify access with VALID API Key is ALLOWED (200)
    response = client.get(
        "/api/v1/autonomy-policy",
        headers={"X-API-Key": "test-secret-key"}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    print("[SUCCESS] /api/v1/autonomy-policy allowed access with VALID API Key")

    # 4. Verify control-center HTML is PUBLIC (200)
    response = client.get("/api/v1/autonomy-policy/control-center")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert "text/html" in response.headers["content-type"]
    print("[SUCCESS] /api/v1/autonomy-policy/control-center is accessible without API Key")

if __name__ == "__main__":
    try:
        test_autonomy_policy_security()
        print("\nAll security tests passed!")
    except AssertionError as e:
        print(f"\n[FAILURE] Assertion failed: {e}")
        exit(1)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        exit(1)
