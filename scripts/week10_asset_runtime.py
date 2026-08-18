"""Load the single Week 10 asset-runtime contract from its requirements file."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REQUIREMENTS_PATH = ROOT / "requirements-week10-assets.txt"
REQUIRED_PACKAGES = {"folium", "pandas", "Pillow", "freetype"}


def load_pinned_versions(
    requirements_path: Path = REQUIREMENTS_PATH,
) -> dict[str, str]:
    """Parse package and runtime pins without duplicating their values in code."""

    versions: dict[str, str] = {}
    for raw_line in requirements_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if line.startswith("# runtime:"):
            line = line.removeprefix("# runtime:")
        elif not line or line.startswith("#"):
            continue

        package_name, separator, version = line.partition("==")
        if separator != "==" or not package_name or not version:
            raise ValueError(f"invalid Week 10 requirement: {raw_line}")
        versions[package_name] = version

    missing_packages = REQUIRED_PACKAGES - set(versions)
    if missing_packages:
        raise ValueError(
            "missing Week 10 runtime pins: " + ", ".join(sorted(missing_packages))
        )
    return versions


PINNED_VERSIONS = load_pinned_versions()
