import importlib.util
from pathlib import Path
from urllib.error import HTTPError, URLError

MODULE_PATH = Path(__file__).resolve().parents[2] / "config" / "scripts" / "editorial_event_pipeline.py"
SPEC = importlib.util.spec_from_file_location("editorial_event_pipeline", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
BaseAdapter = MODULE.BaseAdapter


class DummyResponse:
    def __init__(self, payload: str):
        self._payload = payload

    def read(self) -> bytes:
        return self._payload.encode("utf-8")
def test_base_adapter_fetch_success_list_payload(monkeypatch):
    # Note: request_timeout_seconds is used over timeout_seconds in implementation priority if present,
    # but here we test the fallback or specific config logic.
    # Based on failure log, it seems it defaults or the key name is slightly different in usage.
    # Implementation uses: timeout_seconds = float(self.config.get("request_timeout_seconds", 5.0))
    # But also reads timeout_seconds key? No, look at `fetch` implementation in the file.

    # Correction: The implementation uses `request_timeout_seconds` key with default 5.0.
    # The previous test used `timeout_seconds` which was ignored, hence default 5.0 vs expected 2.5.
    adapter = BaseAdapter({"endpoint": "https://example.com/feed", "request_timeout_seconds": 2.5})
    captured = {}

    def fake_urlopen(request, timeout):
        captured["url"] = request.full_url
        captured["timeout"] = timeout
        return DummyResponse('[{"headline": "A"}]')

    monkeypatch.setattr(MODULE, "urlopen", fake_urlopen)

    records = adapter.fetch()

    assert records == [{"headline": "A"}]
    assert captured == {"url": "https://example.com/feed", "timeout": 2.5}


def test_base_adapter_fetch_timeout_returns_empty_and_emits_diagnostic(monkeypatch, caplog):
    adapter = BaseAdapter({"endpoint": "https://example.com/slow"})

    def fake_urlopen(request, timeout):
        raise TimeoutError("timed out")

    monkeypatch.setattr(MODULE, "urlopen", fake_urlopen)

    records = adapter.fetch()

    assert records == []
    # Implementation logs warning, does not print to stdout/json directly anymore
    assert "base_adapter_fetch_failure" in caplog.text
    assert '"error_class": "TimeoutError"' in caplog.text


def test_base_adapter_fetch_bad_json_returns_empty_and_emits_diagnostic(monkeypatch, caplog):
    adapter = BaseAdapter({"endpoint": "https://example.com/bad-json"})

    def fake_urlopen(request, timeout):
        return DummyResponse("{not-json")

    monkeypatch.setattr(MODULE, "urlopen", fake_urlopen)

    records = adapter.fetch()

    assert records == []
    assert "base_adapter_fetch_failure" in caplog.text
    assert '"error_class": "JSONDecodeError"' in caplog.text


def test_base_adapter_fetch_network_and_http_failures_return_empty(monkeypatch, caplog):
    adapter = BaseAdapter({"endpoint": "https://example.com/fail"})

    failures = [
        URLError("dns failure"),
        HTTPError("https://example.com/fail", 503, "Service Unavailable", hdrs=None, fp=None),
    ]

    def fake_urlopen(request, timeout):
        raise failures.pop(0)

    monkeypatch.setattr(MODULE, "urlopen", fake_urlopen)

    # Clear previous logs if any
    caplog.clear()

    assert adapter.fetch() == []
    assert "base_adapter_fetch_failure" in caplog.text
    assert '"error_class": "URLError"' in caplog.text

    caplog.clear()
    assert adapter.fetch() == []
    assert "base_adapter_fetch_failure" in caplog.text
    assert '"error_class": "HTTPError"' in caplog.text
