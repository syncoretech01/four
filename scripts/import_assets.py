#!/usr/bin/env python3
"""
One-shot brand-asset importer, run inside GitHub Actions (full internet).

Downloads the public FOUR brand folder from Google Drive, then:
  - photos     -> resized to <=2000px JPEG q82   -> brand-assets/photos/
  - menu PDFs  -> every page rendered @200dpi    -> brand-assets/menu/
  - highlights -> resized to <=1600px            -> brand-assets/highlights/
  - logo/brand book -> copied as-is (small)      -> brand-assets/logo|brand-book/
Writes brand-assets/manifest.json with what it did.

The Drive folder must be link-shared ("anyone with the link - viewer")
while this runs; sharing can be revoked right after.
"""

import io
import json
import re
import sys
from pathlib import Path

import requests
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "brand-assets"

FOLDERS = {
    # name -> (drive folder id, handler)
    "picture": ("1I9hexy9d3ZdTsmj7-wEsNLpOu8cmsWXv", "photo"),
    "Menu": ("1HnDdwYovoEOG4tRGMs5-kJCvQ2S0Bieq", "menu_pdf"),
    "highlights": ("1JLZb0Y5t3lNZcHonGoXJuGA9yFmwe-tL", "highlight"),
    "LOGO": ("1cEwALfcSd9kqi5fv4Ifp1XQ7wrGb4nAB", "copy"),
    "Branding": ("14WBFqYYMGXYuRSOOvdFdJtlMaooDxaBv", "brand_book"),
}

SESSION = requests.Session()
SESSION.headers["User-Agent"] = "Mozilla/5.0 (asset importer)"


def list_folder(folder_id: str) -> list[tuple[str, str]]:
    """Return [(file_id, title)] for a public folder via the embedded view."""
    url = f"https://drive.google.com/embeddedfolderview?id={folder_id}#list"
    html = SESSION.get(url, timeout=60).text
    entries = re.findall(
        r'href="https://drive\.google\.com/file/d/([\w-]+)/view[^"]*"[^>]*>.*?'
        r'class="flip-entry-title">([^<]+)<',
        html,
        re.S,
    )
    # de-dup, keep order
    seen, out = set(), []
    for fid, title in entries:
        if fid not in seen:
            seen.add(fid)
            out.append((fid, title.strip()))
    return out


def download(file_id: str) -> bytes:
    """Download a public Drive file, riding through the big-file confirm page."""
    url = "https://drive.usercontent.google.com/download"
    r = SESSION.get(url, params={"id": file_id, "export": "download", "confirm": "t"}, timeout=600)
    ctype = r.headers.get("content-type", "")
    if "text/html" in ctype:
        # confirm form: re-submit with the hidden fields it asks for
        fields = dict(re.findall(r'name="([^"]+)"\s+value="([^"]*)"', r.text))
        fields.setdefault("id", file_id)
        fields.setdefault("confirm", "t")
        r = SESSION.get(url, params=fields, timeout=600)
        if "text/html" in r.headers.get("content-type", ""):
            raise RuntimeError(f"{file_id}: still HTML after confirm (not public?)")
    r.raise_for_status()
    return r.content


def save_resized(data: bytes, dest: Path, max_side: int, quality: int) -> None:
    im = Image.open(io.BytesIO(data))
    im = ImageOps.exif_transpose(im)
    if im.mode not in ("RGB", "L"):
        im = im.convert("RGB")
    im.thumbnail((max_side, max_side), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "JPEG", quality=quality, optimize=True, progressive=True)


def render_pdf(data: bytes, stem: str, dest_dir: Path, dpi: int = 200) -> list[str]:
    import pymupdf

    out_files = []
    dest_dir.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(stream=data, filetype="pdf")
    for i, page in enumerate(doc, 1):
        pix = page.get_pixmap(dpi=dpi)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        name = f"{stem}-p{i}.jpg" if len(doc) > 1 else f"{stem}.jpg"
        img.save(dest_dir / name, "JPEG", quality=90, optimize=True)
        out_files.append(name)
    return out_files


def slug(title: str) -> str:
    stem = re.sub(r"\.[A-Za-z]+$", "", title)
    return re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-") or "file"


def main() -> int:
    manifest: dict[str, list] = {}
    failures: list[str] = []

    for name, (folder_id, kind) in FOLDERS.items():
        files = list_folder(folder_id)
        print(f"[{name}] {len(files)} files listed", flush=True)
        manifest[name] = []
        for fid, title in files:
            try:
                data = download(fid)
            except Exception as e:  # noqa: BLE001 - log-and-continue importer
                print(f"  FAIL {title}: {e}", flush=True)
                failures.append(f"{name}/{title}")
                continue
            size_mb = len(data) / 1e6
            s = slug(title)
            if kind == "photo":
                dest = OUT / "photos" / f"{s}.jpg"
                save_resized(data, dest, 2000, 82)
                manifest[name].append({"src": title, "out": dest.name, "srcMB": round(size_mb, 1)})
            elif kind == "highlight":
                dest = OUT / "highlights" / f"{s}.jpg"
                save_resized(data, dest, 1600, 85)
                manifest[name].append({"src": title, "out": dest.name})
            elif kind == "menu_pdf":
                pages = render_pdf(data, s, OUT / "menu")
                manifest[name].append({"src": title, "out": pages, "srcMB": round(size_mb, 1)})
            elif kind == "brand_book":
                dest = OUT / "brand-book" / title.replace(" ", "-")
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
                pages = render_pdf(data, s, OUT / "brand-book" / "pages", dpi=120)
                manifest[name].append({"src": title, "out": [dest.name, *pages]})
            else:  # copy
                dest = OUT / "logo" / title.replace(" ", "-")
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
                manifest[name].append({"src": title, "out": dest.name})
            print(f"  ok   {title} ({size_mb:.1f} MB)", flush=True)

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "manifest.json").write_text(json.dumps({"folders": manifest, "failures": failures}, indent=2))
    print(f"done; {len(failures)} failures", flush=True)
    # fail the job only if nothing at all was imported
    return 0 if any(manifest.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
