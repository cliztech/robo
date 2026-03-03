from dgn_airwaves import build_segment

def test_build_segment_basic():
    """Test that build_segment returns the expected structure for a valid ID."""
    segment_id = "seg-123"
    result = build_segment(segment_id)
    assert result["segment_id"] == segment_id
    assert result["event_type"] == "airwaves.segment.created"
    assert result["module"] == "dgn-airwaves"

def test_build_segment_empty_string():
    """Test that build_segment handles an empty string correctly."""
    result = build_segment("")
    assert result["segment_id"] == ""
    assert result["event_type"] == "airwaves.segment.created"
    assert result["module"] == "dgn-airwaves"

def test_build_segment_special_chars():
    """Test that build_segment handles special characters in segment_id."""
    segment_id = "seg@#$%"
    result = build_segment(segment_id)
    assert result["segment_id"] == segment_id

def test_build_segment_return_type():
    """Test that build_segment returns a dictionary."""
    result = build_segment("test")
    assert isinstance(result, dict)
