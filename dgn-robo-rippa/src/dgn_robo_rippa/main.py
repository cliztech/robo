"""CLI stub for dgn-robo-rippa."""

from dgn_robo_rippa import normalize_asset


def main() -> None:
    payload = normalize_asset("stub-asset-001")
    print(payload)


if __name__ == "__main__":
    main()
