#!/usr/bin/env python3
"""Validate curated image/video assets in the images directory."""

from __future__ import annotations

import argparse
import hashlib
import re
import sys
from pathlib import Path


NAME_PATTERN = re.compile(r"^vdj_[a-z0-9]+(?:_[a-z0-9]+)*_v\d+_(?:\d+x\d+|source)\.[a-z0-9]+$")
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".mp4"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file_obj:
        for chunk in iter(lambda: file_obj.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def iter_assets(images_dir: Path) -> list[Path]:
    return sorted(path for path in images_dir.iterdir() if path.is_file() and path.name != "README.md")


def validate(images_dir: Path) -> int:
    files = iter_assets(images_dir)
    duplicates: dict[str, list[Path]] = {}
    invalid_names: list[Path] = []
    invalid_formats: list[Path] = []
    hashes: dict[str, list[Path]] = {}

    for path in files:
        extension = path.suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            invalid_formats.append(path)
            continue

        if not NAME_PATTERN.match(path.name):
            invalid_names.append(path)

        file_hash = sha256(path)
        hashes.setdefault(file_hash, []).append(path)

    duplicates = {file_hash: paths for file_hash, paths in hashes.items() if len(paths) > 1}

    if invalid_formats:
        print("Unsupported formats:")
        for path in invalid_formats:
            print(f"  - {path}")

    if invalid_names:
        print("Nonconforming filenames:")
        for path in invalid_names:
            print(f"  - {path.name}")

    if duplicates:
        print("Duplicate SHA-256 hashes:")
        for file_hash, paths in duplicates.items():
            print(f"  - {file_hash}")
            for path in paths:
                print(f"      * {path.name}")

    if invalid_formats or invalid_names or duplicates:
        return 1

    print(f"OK: validated {len(files)} top-level files in {images_dir}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate image asset naming and dedupe policy.")
    parser.add_argument("--images-dir", default="images", help="Path to images directory (default: images)")
    args = parser.parse_args()

    images_dir = Path(args.images_dir)
    if not images_dir.exists() or not images_dir.is_dir():
        print(f"images directory not found: {images_dir}")
        return 2

    return validate(images_dir)


if __name__ == "__main__":
    sys.exit(main())
