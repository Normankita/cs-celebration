"""Prepare the cinematic background images from the originals in src/images.

Run:  python scripts/make-scenes.py     (needs Pillow)
Output: src/assets/scenes/*.jpg
"""
from pathlib import Path
from PIL import Image

SRC = Path(__file__).resolve().parent.parent / "src" / "images"
OUT = Path(__file__).resolve().parent.parent / "src" / "assets" / "scenes"
OUT.mkdir(parents=True, exist_ok=True)


def flat(path):
    im = Image.open(path)
    if im.mode == "RGBA":  # flatten transparency onto white
        bg = Image.new("RGB", im.size, "white")
        bg.paste(im, mask=im.split()[3])
        return bg
    return im.convert("RGB")


def save(im, name):
    im.save(OUT / name, "JPEG", quality=90, optimize=True, progressive=True)
    print(name, im.size)


# 1 + 5: the two banners are already wide - keep as they are.
save(flat(SRC / "PSSSF_kiganjani_banner.png"), "banner-app.jpg")
save(flat(SRC / "PSSSF_kiganjani_banner_phone_looking_front.png"), "banner-phone.jpg")

# 2: bottom half of the tent card (team + 'Extra Mile'), cropped to 16:9.
tent = flat(SRC / "Tent Cards A4_261002_091228.jpg")
w, _ = tent.size
save(tent.crop((0, 1030, w, 1030 + round(w * 9 / 16))), "tent-team.jpg")

# 3: top half of the tent card is printed upside-down (it is the back of a folded card).
#    Crop around the "YOU'RE EPIC" box to 16:9, then turn it the right way up.
epic = tent.crop((0, 106, w, 106 + round(w * 9 / 16))).rotate(180)
save(epic, "tent-epic.jpg")

# 4: certificate, cropped to 16:9 (drops the footer / signature area).
cert = flat(SRC / "A4 Certificates - CSW PSSSF 2026_261002_091323.jpg")
cw, _ = cert.size
save(cert.crop((0, 10, cw, 10 + round(cw * 9 / 16))), "certificate.jpg")
