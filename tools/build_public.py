#!/usr/bin/env python3
"""Stage the assets approved for distribution and generate the web offline manifest."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "app/src/main/assets/www"
WEB = ROOT / "web"

EXCLUDED = ("fig2/", "im/", "clinic/fig/")
CREDITS = ROOT / "content/basics/credits.json"
MEDIA_CREDITS = ROOT / "content/basics"
BOARD_WITH_RASTER = "pdf/bd_thyroid.pdf"
PUBLIC_DIRECTORIES = {"clinic", "fonts", "hub", "pdf", "search", "theatre"}
PUBLIC_FILES = {"index.html", "xsearch.js", "progress.js", "offline.js", "media-unavailable.svg"}
PACKS = {
    "clinical": "Clinical articles and boards",
    "surgical": "Surgical guides and figures",
    "search": "Full search and Quick Answers",
    "pdfs": "Printable clinical boards",
}


def copy(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)


def allowed(path, photos, is_web):
    parent = path.split("/", 1)[0]
    if path in PUBLIC_FILES:
        return True
    if parent not in PUBLIC_DIRECTORIES or path.startswith(EXCLUDED):
        return False
    suffix = Path(path).suffix.lower()
    if suffix == ".pdf":
        return is_web and path.startswith("pdf/bd_") and path != BOARD_WITH_RASTER
    if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        return path in photos
    return suffix in {".js", ".css", ".html", ".svg", ".ttf", ".woff2", ".bin", ".txt"}


def pack_for(path):
    if path.startswith("pdf/"):
        return "pdfs"
    if path.startswith(("clinic/art/", "clinic/board/")):
        return "clinical"
    if path.startswith(("theatre/art/", "theatre/basics/", "theatre/c/")):
        return "surgical"
    if path.startswith("search/"):
        return "search"
    return None


def build(out, *, is_web):
    # Only remove output from a previous build by this script.
    marker = out.parent / (out.name + ".ent-public-build")
    if out.exists() and (not out.is_dir() or any(out.iterdir())):
        if not (marker.is_file() and out.is_dir()):
            raise SystemExit(f"Build output already exists: {out}")
        shutil.rmtree(out)
    out.mkdir(parents=True, exist_ok=True)
    marker.touch()
    target = out if is_web else out / "www"
    photos = {f"theatre/basics/img/{name}.jpg" for name in json.loads(CREDITS.read_text())}
    for source in sorted(SOURCE.rglob("*")):
        if source.is_file():
            relative = source.relative_to(SOURCE).as_posix()
            if allowed(relative, photos, is_web):
                copy(source, target / relative)
    copy(CREDITS, target / "credits/surgical-figures.json")
    copy(MEDIA_CREDITS / "distribution.md", target / "credits/distribution.md")
    pdfs = sorted(p.stem for p in (target / "pdf").glob("*.pdf"))
    metadata = {"restrictedMedia": True, "pdfs": pdfs, "web": is_web}
    (target / "release-assets.js").write_text("window.ENT_RELEASE_ASSETS=" + json.dumps(metadata) + ";\n")
    if not is_web:
        return

    for source in sorted(WEB.rglob("*")):
        if source.is_file():
            copy(source, target / source.relative_to(WEB))
    version = hashlib.sha256()
    core = []
    packs = {key: {"label": label, "bytes": 0, "files": []} for key, label in PACKS.items()}
    pack_hashes = {key: hashlib.sha256() for key in packs}
    for file in sorted(target.rglob("*")):
        if not file.is_file():
            continue
        path = file.relative_to(target).as_posix()
        data = file.read_bytes()
        key = path.encode() + b"\0" + hashlib.sha256(data).digest()
        version.update(key)
        if path in {"sw.js", "_headers"}:
            continue
        group = pack_for(path)
        if group:
            packs[group]["files"].append(path)
            packs[group]["bytes"] += len(data)
            pack_hashes[group].update(key)
        else:
            core.append(path)
    for key, pack in packs.items():
        pack["version"] = pack_hashes[key].hexdigest()[:16]
    manifest = {"version": version.hexdigest()[:16], "core": core,
                "packs": {key: value for key, value in packs.items() if value["files"]}}
    (target / "sw-manifest.js").write_text("self.ENT_OFFLINE=" + json.dumps(manifest, separators=(",", ":")) + ";\n")
    print(f"Offline shell: {len(core)} assets")
    for key, pack in manifest["packs"].items():
        print(f"{key}: {len(pack['files'])} assets, {pack['bytes'] / 1e6:.1f} MB")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("platform", choices=["android", "web"])
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    build(args.output.resolve(), is_web=args.platform == "web")
