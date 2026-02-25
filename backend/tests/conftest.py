import sys
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

@pytest.fixture(autouse=True)
def clear_auth_cache():
    try:
        from backend.security.auth import _get_secret_key
        _get_secret_key.cache_clear()
    except ImportError:
        pass
    yield
