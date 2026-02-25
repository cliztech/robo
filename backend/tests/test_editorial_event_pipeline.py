import json
import importlib.util
from pathlib import Path
from urllib.error import HTTPError, URLError


MODULE_PATH = Path(__file__).resolve().parents[2] / "config" / "scripts" / "editorial_event_pipeline.py"
SPEC = importlib.util.spec_from_file_location("editorial_event_pipeline", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)
BaseAdapter = MODULE.BaseAdapter


class DummyResponse:
    def __init__(self, payload: str):
        self._payload = payload

    def read(self) -> bytes:
        return self._payload.encode("utf-8")


def test_base_adapter_fetch_success_list_payload(monkeypatch):
    adapter = BaseAdapter({"endpoint": "https://example.com/feed", "timeout_seconds": 2.5})
    captured = {}

    def fake_urlopen(request, timeout):
        captured["url"] = request.full_url
        captured["timeout"] = timeout
        return DummyResponse('[{"headline": "A"}]')

    monkeypatch.setattr(MODULE, "urlopen", fake_urlopen)

    records = adapter.fetch()

    assert records == [{"headline": "A"}]
    assert captured == {"url": "https://example.com/feed", "timeout": 2.5}


def test_base_adapter_fetch_timeout_returns_empty_and_emits_diagnostic(monkeypatch, capsys):
    adapter = BaseAdapter({"endpoint": "https://example.com/slow"})

    def fake_urlopen(request, timeout):
        raise TimeoutError("timed out")

    monkeypatch.setattr(MODULE, "urlopen", fake_urlopen)

    records = adapter.fetch()

    assert records == []
    diagnostic = json.loads(capsys.readouterr().out.strip())
    assert diagnostic["event"] == "adapter_fetch_failed"
    assert diagnostic["source"] == "external"
    assert diagnostic["endpoint"] == "https://example.com/slow"
    assert diagnostic["error_class"] == "TimeoutError"


def test_base_adapter_fetch_bad_json_returns_empty_and_emits_diagnostic(monkeypatch, capsys):
    adapter = BaseAdapter({"endpoint": "https://example.com/bad-json"})

    def fake_urlopen(request, timeout):
        return DummyResponse("{not-json")

    monkeypatch.setattr(MODULE, "urlopen", fake_urlopen)

    records = adapter.fetch()

    assert records == []
    diagnostic = json.loads(capsys.readouterr().out.strip())
    assert diagnostic["endpoint"] == "https://example.com/bad-json"
    assert diagnostic["error_class"] == "JSONDecodeError"


def test_base_adapter_fetch_network_and_http_failures_return_empty(monkeypatch, capsys):
    adapter = BaseAdapter({"endpoint": "https://example.com/fail"})

    failures = [
        URLError("dns failure"),
        HTTPError("https://example.com/fail", 503, "Service Unavailable", hdrs=None, fp=None),
    ]

    def fake_urlopen(request, timeout):
        raise failures.pop(0)

    monkeypatch.setattr(MODULE, "urlopen", fake_urlopen)

    assert adapter.fetch() == []
    first = json.loads(capsys.readouterr().out.strip())
    assert first["error_class"] == "URLError"

    assert adapter.fetch() == []
    second = json.loads(capsys.readouterr().out.strip())
    assert second["error_class"] == "HTTPError"
