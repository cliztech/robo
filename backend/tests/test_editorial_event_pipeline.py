import importlib.util
import json
from pathlib import Path
from urllib.error import HTTPError, URLError


MODULE_PATH = Path(__file__).resolve().parents[2] / "config" / "scripts" / "editorial_event_pipeline.py"
SPEC = importlib.util.spec_from_file_location("editorial_event_pipeline", MODULE_PATH)
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


def test_base_adapter_fetch_success_list_payload(monkeypatch: pytest.MonkeyPatch) -> None:
    adapter = editorial_event_pipeline.BaseAdapter(
        {
            "endpoint": "https://example.test/feed",
            "request_timeout_seconds": 1.5,
        }
    )

    captured = {}

    def _fake_urlopen(request, timeout):
        captured["url"] = request.full_url
        captured["timeout"] = timeout
        return DummyResponse('[{"headline":"a"},{"headline":"b"}]')

    monkeypatch.setattr(editorial_event_pipeline, "urlopen", _fake_urlopen)

    records = adapter.fetch()

    assert records == [{"headline": "a"}, {"headline": "b"}]
    assert captured == {"url": "https://example.test/feed", "timeout": 1.5}


def test_base_adapter_fetch_timeout_returns_empty_and_logs(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    adapter = editorial_event_pipeline.BaseAdapter({"endpoint": "https://example.test/timeout"})

    def _fake_urlopen(request, timeout):
        raise TimeoutError("timed out")

    monkeypatch.setattr(editorial_event_pipeline, "urlopen", _fake_urlopen)

    with caplog.at_level("WARNING"):
        records = adapter.fetch()

    assert records == []
    assert "base_adapter_fetch_failure" in caplog.text
    assert '"source": "external"' in caplog.text
    assert '"endpoint": "https://example.test/timeout"' in caplog.text
    assert '"error_class": "TimeoutError"' in caplog.text


def test_base_adapter_fetch_bad_json_returns_empty_and_logs(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    adapter = editorial_event_pipeline.BaseAdapter({"endpoint": "https://example.test/bad-json"})

    def _fake_urlopen(request, timeout):
        return DummyResponse("not-json")

    monkeypatch.setattr(editorial_event_pipeline, "urlopen", _fake_urlopen)

    with caplog.at_level("WARNING"):
        records = adapter.fetch()

    assert records == []
    assert '"error_class": "JSONDecodeError"' in caplog.text


@pytest.mark.parametrize(
    "error",
    [
        HTTPError("https://example.test/http-error", 500, "Server Error", hdrs=None, fp=None),
        URLError("name resolution failed"),
    ],
)
def test_base_adapter_fetch_network_failures_return_empty_and_log(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
    error: Exception,
) -> None:
    adapter = editorial_event_pipeline.BaseAdapter({"endpoint": "https://example.test/failure"})

    def _fake_urlopen(request, timeout):
        raise error

    monkeypatch.setattr(editorial_event_pipeline, "urlopen", _fake_urlopen)

    with caplog.at_level("WARNING"):
        records = adapter.fetch()

    assert records == []
    assert "base_adapter_fetch_failure" in caplog.text
    assert f'"error_class": "{error.__class__.__name__}"' in caplog.text
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
