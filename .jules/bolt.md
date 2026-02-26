## 2026-02-24 - Playlist Generation Performance
**Learning:** Python's `sorted(..., reverse=True)[0]` and `max(..., key=...)` have similar performance for complex keys because the key function evaluation dominates. The real win comes from hoisting invariant calculations (string lowercasing, dict lookups) out of the inner loop.
**Action:** When optimizing "sort vs max" in Python, check the key function cost first. If the key function is expensive, optimize it or cache its results before worrying about the sort algorithm itself.

## 2026-02-25 - Schedule Conflict Detection
**Learning:** Accessing properties via Pydantic methods or `datetime.fromisoformat` inside an O(N^2) loop is extremely expensive. By grouping items by their invariant properties (timezone, priority) and pre-calculating values, we reduced function calls by 10x and execution time by ~50% in high-load scenarios.
**Action:** Always look for O(N^2) loops where items can be grouped or filtered first. Cache expensive property access before entering nested loops.
