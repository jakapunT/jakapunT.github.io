"""Crops the empty space below each lesson 14 app screenshot (keeps a small margin)."""
import sys
from PIL import Image, ImageChops

for path in sys.argv[1:]:
    im = Image.open(path).convert("RGB")
    # an app with a sidebar has a grey strip down the left: measure only to its right
    has_sidebar = sum(im.getpixel((8, im.height - 8))) < 3 * 248
    main = im.crop((im.width * 2 // 5 if has_sidebar else 0, 0, im.width, im.height))
    bg = Image.new("RGB", main.size, main.getpixel((main.width - 1, main.height - 1)))
    box = ImageChops.difference(main, bg).getbbox()
    if box and box[3] + 60 < im.height:
        im.crop((0, 0, im.width, box[3] + 60)).save(path, optimize=True)
        print("trimmed", path, im.size, "->", (im.width, box[3] + 60))
