"""Generate all web/PWA icon sizes from the ENT Companion vector master."""
from pathlib import Path
import cairosvg

root = Path(__file__).resolve().parents[1]
source = root / "web/icons/ent-companion.svg"
icons = root / "web/icons"
for name, size in [
    ("favicon-64.png", 64),
    ("apple-touch-icon.png", 180),
    ("icon-192.png", 192),
    ("icon-512.png", 512),
    ("icon-maskable-512.png", 512),
]:
    cairosvg.svg2png(url=str(source), write_to=str(icons / name),
                     output_width=size, output_height=size)
    print(f"Updated {name}")
