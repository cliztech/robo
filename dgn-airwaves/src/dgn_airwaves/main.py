"""CLI stub for dgn-airwaves."""

from dgn_airwaves import build_segment


def main() -> None:
    payload = build_segment("stub-segment-001")
    print(payload)


if __name__ == "__main__":
    main()
