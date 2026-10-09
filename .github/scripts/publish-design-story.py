"""Expand the reviewed student archive into its MM12 course route.

Only the fixed student archive is accepted. Existing course files are preserved.
Run from the repository root; no third-party Python dependency is needed.
"""
from pathlib import Path, PurePosixPath
import hashlib
import shutil
import zipfile

ARCHIVE_NAME = "MM12_Sprint04_Design_Story_Student_Package_2026-10-09_v1.zip"
ARCHIVE = Path("reviews/design-story-2026-10-09/downloads") / ARCHIVE_NAME
EXPECTED_SHA256 = "92202ef4b0f74b9b42d7e2c596b883a78dde9aba4e4f788f934725c7990f4b6d"
DESTINATION = Path("graphic-design/design-a-story")


def publish():
    if hashlib.sha256(ARCHIVE.read_bytes()).hexdigest() != EXPECTED_SHA256:
        raise ValueError("Archive differs from the reviewed student package")
    with zipfile.ZipFile(ARCHIVE) as archive:
        if archive.testzip() is not None:
            raise ValueError("Archive CRC failed")
        entries = archive.infolist()
        if len(entries) != 126 or len({item.filename for item in entries}) != 126:
            raise ValueError("Unexpected archive inventory")
        prepared = []
        for entry in entries:
            path = PurePosixPath(entry.filename)
            if path.is_absolute() or ".." in path.parts or "\\" in entry.filename:
                raise ValueError("Unsafe archive path")
            if entry.is_dir() or any(part.lower() in {"teacher", "private-teacher", "build", ".git"} for part in path.parts):
                raise ValueError("Unexpected private or build entry")
            target = DESTINATION.joinpath(*path.parts)
            content = archive.read(entry)
            if target.exists() and target.read_bytes() != content:
                raise ValueError(f"Existing course file differs: {target}")
            prepared.append((target, content))
        names = {entry.filename for entry in entries}
        if not {"index.html", "proposal.html", "project.html", "planning.html"}.issubset(names):
            raise ValueError("Missing student entry points")
        for target, content in prepared:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)
    download = DESTINATION / "downloads" / ARCHIVE_NAME
    if download.exists() and download.read_bytes() != ARCHIVE.read_bytes():
        raise ValueError("Existing archive download differs")
    shutil.copyfile(ARCHIVE, download)
    print("Published 127 matched student files to", DESTINATION)


if __name__ == "__main__":
    publish()
