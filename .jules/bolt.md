## 2026-02-24 - Playlist Generation Performance
**Learning:** Python's `sorted(..., reverse=True)[0]` and `max(..., key=...)` have similar performance for complex keys because the key function evaluation dominates. The real win comes from hoisting invariant calculations (string lowercasing, dict lookups) out of the inner loop.
**Action:** When optimizing "sort vs max" in Python, check the key function cost first. If the key function is expensive, optimize it or cache its results before worrying about the sort algorithm itself.
