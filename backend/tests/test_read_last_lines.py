import pytest
from pathlib import Path
from backend.scheduling.autonomy_service import AutonomyPolicyService

# Helper to access the private method for testing
def read_last_lines(path: Path, limit: int):
    # We use the static method directly if possible, or instance
    return AutonomyPolicyService._read_last_lines(path, limit)

@pytest.fixture
def temp_file(tmp_path):
    f = tmp_path / "test_file.txt"
    return f

def test_read_last_lines_empty_file(temp_file):
    temp_file.touch()
    assert read_last_lines(temp_file, 10) == []

def test_read_last_lines_single_line_no_newline(temp_file):
    temp_file.write_text("hello", encoding="utf-8")
    assert read_last_lines(temp_file, 10) == ["hello"]

def test_read_last_lines_single_line_with_newline(temp_file):
    temp_file.write_text("hello\n", encoding="utf-8")
    assert read_last_lines(temp_file, 10) == ["hello"]

def test_read_last_lines_fewer_lines_than_requested(temp_file):
    content = "line1\nline2\nline3"
    temp_file.write_text(content, encoding="utf-8")
    assert read_last_lines(temp_file, 10) == ["line1", "line2", "line3"]

def test_read_last_lines_exact_lines_requested(temp_file):
    content = "line1\nline2\nline3"
    temp_file.write_text(content, encoding="utf-8")
    assert read_last_lines(temp_file, 3) == ["line1", "line2", "line3"]

def test_read_last_lines_more_lines_than_requested(temp_file):
    content = "line1\nline2\nline3\nline4\nline5"
    temp_file.write_text(content, encoding="utf-8")
    result = read_last_lines(temp_file, 3)
    assert result == ["line3", "line4", "line5"]

def test_read_last_lines_utf8_multibyte(temp_file):
    # '🌟' is 4 bytes: \xf0\x9f\x8c\x9f
    content = "line1\n🌟 line2\nline3 🌟"
    temp_file.write_text(content, encoding="utf-8")
    result = read_last_lines(temp_file, 2)
    assert result == ["🌟 line2", "line3 🌟"]

def test_read_last_lines_large_file(temp_file):
    # Create a file larger than the chunk size (8KB)
    line = "a" * 100
    num_lines = 1000
    content = "\n".join([f"{i} {line}" for i in range(num_lines)])
    temp_file.write_text(content, encoding="utf-8")

    result = read_last_lines(temp_file, 5)
    expected = [f"{i} {line}" for i in range(num_lines-5, num_lines)]
    assert result == expected
