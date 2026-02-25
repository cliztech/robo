import re

file_path = 'backend/tests/test_autonomy_policy_service.py'

with open(file_path, 'r') as f:
    content = f.read()

# Locate the test function
start_marker = 'def test_precedence_resolution_timeslot_then_show_then_station(tmp_path):'
init_end_marker = 'audit_log_path=tmp_path / "audit.jsonl",'

# We want to insert the line after the init block.
# The init block ends with '    )'

insertion_point_str = '        audit_log_path=tmp_path / "audit.jsonl",\n    )'
insertion_idx = content.find(insertion_point_str)

if insertion_idx != -1:
    # Find the end of the line '    )'
    end_of_init = insertion_idx + len(insertion_point_str)

    # Check if the line is already there
    check_str = 'service.event_log_path = tmp_path / "scheduler_events.jsonl"'
    if check_str in content:
        print("Line already exists.")
    else:
        new_content = content[:end_of_init] + '\n    service.event_log_path = tmp_path / "scheduler_events.jsonl"' + content[end_of_init:]
        with open(file_path, 'w') as f:
            f.write(new_content)
        print("Updated test to prevent pollution.")
else:
    print("Could not find insertion point.")
