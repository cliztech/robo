import pytest
import os
from pathlib import Path
from backend.scheduling.autonomy_service import AutonomyPolicyService

def test_read_empty_file(tmp_path):
    p = tmp_path / "empty.txt"
    p.touch()
    assert AutonomyPolicyService._read_last_lines(p, 10) == []

def test_read_single_line_no_newline(tmp_path):
    p = tmp_path / "single.txt"
    p.write_text("hello", encoding="utf-8")
    assert AutonomyPolicyService._read_last_lines(p, 10) == ["hello"]

def test_read_single_line_with_newline(tmp_path):
    p = tmp_path / "single_newline.txt"
    p.write_text("hello\n", encoding="utf-8")
    assert AutonomyPolicyService._read_last_lines(p, 10) == ["hello"]

def test_read_multiple_lines_small(tmp_path):
    p = tmp_path / "multi.txt"
    content = "line1\nline2\nline3"
    p.write_text(content, encoding="utf-8")

    assert AutonomyPolicyService._read_last_lines(p, 2) == ["line2", "line3"]
    assert AutonomyPolicyService._read_last_lines(p, 3) == ["line1", "line2", "line3"]
    assert AutonomyPolicyService._read_last_lines(p, 10) == ["line1", "line2", "line3"]

def test_read_large_file(tmp_path):
    # Create a file significantly larger than 8192 bytes
    p = tmp_path / "large.txt"
    # 2000 lines of ~7 bytes each => ~14KB
    lines = [f"line{i}" for i in range(2000)]
    content = "\n".join(lines) + "\n"
    p.write_text(content, encoding="utf-8")

    assert p.stat().st_size > 8192

    # Read last 10
    result = AutonomyPolicyService._read_last_lines(p, 10)
    expected = lines[-10:]
    assert result == expected

    # Test explicitly larger chunks scenario
    # 300 lines of 100 chars = 30KB
    lines_long = [f"line_long_{i}_" + "x"*100 for i in range(300)]
    content_long = "\n".join(lines_long) + "\n"
    p.write_text(content_long, encoding="utf-8")
    assert p.stat().st_size > 8192

    result = AutonomyPolicyService._read_last_lines(p, 50)
    expected = lines_long[-50:]
    assert result == expected

def test_read_exact_limit(tmp_path):
    p = tmp_path / "limit.txt"
    content = "1\n2\n3\n4\n5\n"
    p.write_text(content, encoding="utf-8")
    assert AutonomyPolicyService._read_last_lines(p, 5) == ["1", "2", "3", "4", "5"]

def test_file_not_exists(tmp_path):
    p = tmp_path / "nonexistent.txt"
    assert AutonomyPolicyService._read_last_lines(p, 10) == []

