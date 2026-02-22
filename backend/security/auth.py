import os
import secrets
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def get_scheduler_api_key(api_key: str = Security(api_key_header)):
    expected_key = os.environ.get("ROBODJ_SCHEDULER_API_KEY")
    if not expected_key:
        # If the key is not set in the environment, we might want to fail securely
        # or log a critical error. For now, we'll raise 500.
        raise HTTPException(
            status_code=500,
            detail="Server configuration error: Scheduler API key not configured"
        )

    if not api_key or not secrets.compare_digest(api_key, expected_key):
        raise HTTPException(
            status_code=403,
            detail="Could not validate credentials"
        )
    return api_key
