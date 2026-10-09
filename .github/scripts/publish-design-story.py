"""Publish the reviewed MM12 v2 student files; preserve unrelated course work."""
from pathlib import Path, PurePosixPath
import hashlib
import shutil
import zipfile

ARCHIVE_NAME = "MM12_Sprint04_Design_Story_Student_Package_2026-10-09_v2.zip"
REVIEW = Path("reviews/design-story-2026-10-09")
ARCHIVE = REVIEW / "downloads" / ARCHIVE_NAME
EXPECTED_SHA256 = "ee8579c41148778db21e6a8f6959c2e69dda54dd466e9d143f67fa9225834b93"
LEGACY = Path("graphic-design/design-a-story")
DESTINATION = LEGACY / "classroom-v2"
LEGACY_PATHS = ['graphic-design/design-a-story/PROJECT.md', 'graphic-design/design-a-story/README.md', 'graphic-design/design-a-story/assets/Community_Film_Night.css', 'graphic-design/design-a-story/assets/Community_Film_Night.json', 'graphic-design/design-a-story/assets/Community_Film_Night.png', 'graphic-design/design-a-story/assets/Community_Film_Night.svg', 'graphic-design/design-a-story/assets/Planning_Model_Quiet_Moment.excalidraw', 'graphic-design/design-a-story/assets/bass-1955.jpg', 'graphic-design/design-a-story/assets/follow-the-arches.jpg', 'graphic-design/design-a-story/assets/moonlight.jpg', 'graphic-design/design-a-story/assets/native-artboards.jpg', 'graphic-design/design-a-story/assets/native-wrong-height.jpg', 'graphic-design/design-a-story/assets/planning-04-brief.jpg', 'graphic-design/design-a-story/assets/planning-05-insert-image-menu.jpg', 'graphic-design/design-a-story/assets/planning-11-fill-picker.jpg', 'graphic-design/design-a-story/assets/planning-24-board-complete.jpg', 'graphic-design/design-a-story/assets/planning-26-save-to-disk.jpg', 'graphic-design/design-a-story/assets/planning-28-export-preview.jpg', 'graphic-design/design-a-story/assets/planning-33-restored-text-editable.jpg', 'graphic-design/design-a-story/assets/ps-character-detail.png', 'graphic-design/design-a-story/assets/ps-swatches-panel-crop.png', 'graphic-design/design-a-story/assets/ps-swatches-panel.png', 'graphic-design/design-a-story/assets/ps-type-controls-crop.png', 'graphic-design/design-a-story/assets/ps-type-controls.png', 'graphic-design/design-a-story/assets/ps-type-layer-detail.png', 'graphic-design/design-a-story/assets/stage-colour-light.jpg', 'graphic-design/design-a-story/assets/stage-cutout.jpg', 'graphic-design/design-a-story/assets/stage-grade.jpg', 'graphic-design/design-a-story/assets/stage-mood.jpg', 'graphic-design/design-a-story/assets/stage-paint-light.jpg', 'graphic-design/design-a-story/assets/stage-rim-shadow.jpg', 'graphic-design/design-a-story/assets/web-colour-roles.jpg', 'graphic-design/design-a-story/assets/web-export-preview.jpg', 'graphic-design/design-a-story/assets/web-swatch.jpg', 'graphic-design/design-a-story/downloads/MM12_Sprint04_Believable_Composite_2026-10-09_v1.pdf', 'graphic-design/design-a-story/downloads/MM12_Sprint04_Believable_Composite_2026-10-09_v1.pptx', 'graphic-design/design-a-story/downloads/MM12_Sprint04_Design_Story_Project_2026-10-09_v1.pdf', 'graphic-design/design-a-story/planning.html', 'graphic-design/design-a-story/presentations/01-poster-promise/app.js', 'graphic-design/design-a-story/presentations/01-poster-promise/deck-data.js', 'graphic-design/design-a-story/presentations/01-poster-promise/index.html', 'graphic-design/design-a-story/presentations/01-poster-promise/reading.html', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/02.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/03.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/04.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/05.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/06.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/07.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/08.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/09.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/10.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/11.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/12.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/13.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/14.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/15.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/17.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/19.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/20.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/21.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/22.png', 'graphic-design/design-a-story/presentations/01-poster-promise/slides/24.png', 'graphic-design/design-a-story/presentations/01-poster-promise/style.css', 'graphic-design/design-a-story/presentations/02-believable-composite/app.js', 'graphic-design/design-a-story/presentations/02-believable-composite/deck-data.js', 'graphic-design/design-a-story/presentations/02-believable-composite/index.html', 'graphic-design/design-a-story/presentations/02-believable-composite/reading.html', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/01.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/02.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/03.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/04.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/05.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/06.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/07.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/08.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/09.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/10.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/11.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/12.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/13.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/14.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/15.png', 'graphic-design/design-a-story/presentations/02-believable-composite/slides/16.png', 'graphic-design/design-a-story/presentations/02-believable-composite/style.css', 'graphic-design/design-a-story/presentations/03-art-director/app.js', 'graphic-design/design-a-story/presentations/03-art-director/deck-data.js', 'graphic-design/design-a-story/presentations/03-art-director/index.html', 'graphic-design/design-a-story/presentations/03-art-director/reading.html', 'graphic-design/design-a-story/presentations/03-art-director/slides/02.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/03.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/04.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/05.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/06.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/07.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/08.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/09.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/10.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/11.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/12.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/13.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/14.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/15.png', 'graphic-design/design-a-story/presentations/03-art-director/slides/16.png', 'graphic-design/design-a-story/presentations/03-art-director/style.css', 'graphic-design/design-a-story/project.html', 'graphic-design/design-a-story/prompts/01-design-decisions-prompt.md', 'graphic-design/design-a-story/prompts/02-colour-choices-prompt.md', 'graphic-design/design-a-story/prompts/03-type-that-communicates-prompt.md', 'graphic-design/design-a-story/prompts/index.html', 'graphic-design/design-a-story/proposal.html', 'graphic-design/design-a-story/sources.html', 'graphic-design/design-a-story/style.css', 'graphic-design/design-a-story/vocabulary.html']


def gateway(relative):
    return ("<!doctype html><html lang=\"en\"><meta charset=\"utf-8\">"
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
            f"<meta http-equiv=\"refresh\" content=\"0;url={relative}\">"
            "<title>MM12 Community Arts Showcase — revised classroom materials</title>"
            f"<p><a href=\"{relative}\">Open the revised MM12 classroom materials</a>.</p></html>\n").encode()


def publish():
    archive_bytes = ARCHIVE.read_bytes()
    if hashlib.sha256(archive_bytes).hexdigest() != EXPECTED_SHA256:
        raise ValueError("Archive differs from the reviewed v2 student package")
    with zipfile.ZipFile(ARCHIVE) as archive:
        if archive.testzip() is not None:
            raise ValueError("Archive CRC failed")
        entries = archive.infolist()
        if len(entries) != 125 or len({item.filename for item in entries}) != 125:
            raise ValueError("Unexpected archive inventory")
        prepared = []
        for entry in entries:
            path = PurePosixPath(entry.filename)
            if path.is_absolute() or ".." in path.parts or "\\" in entry.filename:
                raise ValueError("Unsafe archive path")
            if entry.is_dir() or any(part.lower() in {"teacher", "private-teacher", "build", ".git"} for part in path.parts):
                raise ValueError("Unexpected private or build entry")
            if (entry.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError("Archive contains a symlink")
            target = DESTINATION.joinpath(*path.parts)
            content = archive.read(entry)
            if target.exists() and target.read_bytes() != content:
                raise ValueError(f"Existing v2 course file differs: {target}")
            prepared.append((target, content))
        names = {entry.filename for entry in entries}
        if not {"index.html", "plan-b.html", "proposal.html", "project.html", "planning.html"}.issubset(names):
            raise ValueError("Missing student entry points")
        for target, content in prepared:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)
    download = DESTINATION / "downloads" / ARCHIVE_NAME
    if download.exists() and download.read_bytes() != archive_bytes:
        raise ValueError("Existing archive download differs")
    shutil.copyfile(ARCHIVE, download)

    # Remove only inventoried superseded files, never another sprint's work.
    for relative in LEGACY_PATHS:
        target = Path(relative)
        if not target.is_relative_to(LEGACY) or target.is_relative_to(DESTINATION):
            raise ValueError("Cleanup path outside the superseded unit")
        if target.is_file():
            target.unlink()
    for name in ("index", "plan-b", "project", "proposal", "planning", "sources", "vocabulary"):
        (LEGACY / f"{name}.html").write_bytes(gateway(f"classroom-v2/{name}.html"))
    for deck in ("01-poster-promise", "02-believable-composite", "03-art-director"):
        folder = LEGACY / "presentations" / deck
        folder.mkdir(parents=True, exist_ok=True)
        for name in ("index", "reading"):
            (folder / f"{name}.html").write_bytes(gateway(f"../../classroom-v2/presentations/{deck}/{name}.html"))
    (LEGACY / "prompts").mkdir(exist_ok=True)
    (LEGACY / "prompts/index.html").write_bytes(gateway("../classroom-v2/prompts/index.html"))

    # Review copies use the same v2 bytes as the student site.
    for old in (REVIEW / "downloads").glob("MM12_Sprint04_*_2026-10-09_v1.*"):
        old.unlink()
    for current in (DESTINATION / "downloads").iterdir():
        shutil.copyfile(current, REVIEW / "downloads" / current.name)
    shutil.copyfile(DESTINATION / "PROJECT.md", REVIEW / "PROJECT.md")
    for prompt in (DESTINATION / "prompts").glob("*.md"):
        shutil.copyfile(prompt, REVIEW / "prompts" / prompt.name)
    (REVIEW / "README.md").write_text(
        "# MM12 Community Arts Showcase — classroom v2\n\n"
        "Supersedes the first Design a Story release. The classroom examples are IKEA, "
        "London Design Festival and original ceramic-cup diagrams.\n\n"
        "[Classroom materials](../../graphic-design/design-a-story/classroom-v2/index.html) · "
        "[Plan B](../../graphic-design/design-a-story/classroom-v2/plan-b.html)\n\n"
        "The downloads contain three revised PPTX/PDF decks, the project, a printable Plan B "
        "and the student ZIP. Teacher guidance and assessment keys remain private.\n",
        encoding="utf-8")
    print("Published 126 matched v2 student files and nine review downloads to", DESTINATION)


if __name__ == "__main__":
    publish()
