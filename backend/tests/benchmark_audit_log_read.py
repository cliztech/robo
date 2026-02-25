import time
import json
import random
from pathlib import Path
from backend.scheduling.autonomy_service import AutonomyPolicyService

def generate_large_log(file_path: Path, num_lines: int):
    print(f"Generating log file with {num_lines} lines...")
    with file_path.open("w", encoding="utf-8") as f:
        for i in range(num_lines):
            event = {
                "event_id": f"evt-{i}",
                "decision_type": "track_selection",
                "origin": "ai",
                "mode": "auto_with_human_override",
                "source": "station_default",
                "notes": f"This is a sample log entry number {i} with some random data {random.random()}"
            }
            f.write(json.dumps(event) + "\n")
    size_mb = file_path.stat().st_size / (1024 * 1024)
    print(f"Log file generated: {size_mb:.2f} MB")

def benchmark_naive(file_path: Path, limit: int):
    start_time = time.perf_counter()
    lines = file_path.read_text(encoding="utf-8").splitlines()
    last_lines = lines[-limit:]
    duration = time.perf_counter() - start_time
    return duration

def benchmark_optimized(file_path: Path, limit: int):
    start_time = time.perf_counter()
    # Using the static method directly
    last_lines = AutonomyPolicyService._read_last_lines(file_path, limit)
    duration = time.perf_counter() - start_time
    return duration

def main():
    log_file = Path("temp_benchmark_audit.jsonl")
    try:
        # Generate a large log file (~50MB usually takes around 500k lines depending on content)
        # Let's try 200,000 lines first to be safe and fast enough
        generate_large_log(log_file, 200000)

        limit = 100
        print(f"\nBenchmarking read of last {limit} lines:")

        naive_time = benchmark_naive(log_file, limit)
        print(f"Naive approach (read_text): {naive_time:.6f} seconds")

        optimized_time = benchmark_optimized(log_file, limit)
        print(f"Optimized approach (_read_last_lines): {optimized_time:.6f} seconds")

        if optimized_time < naive_time:
            speedup = naive_time / optimized_time
            print(f"\nResult: Optimized approach is {speedup:.2f}x faster!")
        else:
            print("\nResult: No improvement observed (file might be too small).")

    finally:
        if log_file.exists():
            log_file.unlink()

if __name__ == "__main__":
    main()
