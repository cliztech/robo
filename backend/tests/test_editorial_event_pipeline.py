import importlib.util
from pathlib import Path
from urllib.error import HTTPError, URLError

import pytest

MODULE_PATH = Path(__file__).resolve().parents[2] / "config" / "scripts" / "editorial_event_pipeline.py"
SPEC = importlib.util.spec_from_file_location("editorial_event_pipeline", MODULE_PATH)
editorial_event_pipeline = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(editorial_event_pipeline)


class _Response:
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
        return _Response('[{"headline":"a"},{"headline":"b"}]')

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
        return _Response("not-json")

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
