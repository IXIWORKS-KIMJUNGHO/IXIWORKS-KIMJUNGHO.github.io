"""Compare Week 9 PNG dimensions and decoded pixels, ignoring compression bytes."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def compare_png(expected_path: Path, actual_path: Path) -> None:
    with Image.open(expected_path) as expected_image, Image.open(actual_path) as actual_image:
        expected_rgba = expected_image.convert("RGBA")
        actual_rgba = actual_image.convert("RGBA")
        if expected_rgba.size != actual_rgba.size:
            raise AssertionError(
                f"{actual_path.name}: {actual_rgba.size} != {expected_rgba.size}"
            )
        if actual_rgba.tobytes() != expected_rgba.tobytes():
            raise AssertionError(f"{actual_path.name}: decoded pixels differ")


def main() -> None:
    paths = [Path(argument) for argument in sys.argv[1:]]
    if not paths or len(paths) % 2:
        raise SystemExit("pass expected/actual PNG path pairs")
    for index in range(0, len(paths), 2):
        compare_png(paths[index], paths[index + 1])
    print(f"week09 PNG pixels PASS: {len(paths) // 2} files")


if __name__ == "__main__":
    main()
