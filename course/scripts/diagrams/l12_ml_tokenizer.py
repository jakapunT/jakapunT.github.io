"""Draws the L12-S16 infographic: how a machine-learning tokenizer learns to cut Thai.
1) people cut sentences by hand, 2) the model sees one label per character
(B = a word begins here, I = inside a word), 3) on a new sentence it guesses a label for
every character and cuts before each B. Step 3 is an illustration, not a model run.

    python3 scripts/diagrams/l12_ml_tokenizer.py courses/nlp-basic/images/l12-ml-tokenizer.svg

Uses the pl-*, sw-* and nt-* classes in templates/page.css.
"""

import sys
import unicodedata
from html import escape

W = 900
FS = 19
out = []
LEADING = set("เแโใไ")


def clusters(word):
    """Characters grouped for display: a consonant with the marks above/below it."""
    cs = []
    for ch in word:
        if cs and unicodedata.category(ch) == "Mn":
            cs[-1] += ch
        else:
            cs.append(ch)
    return cs


def both(x, y, th, en, cls, anchor="start"):
    out.append(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}" data-only="th">{escape(th)}</text>')
    out.append(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}" data-only="en" lang="en">{escape(en)}</text>')


def chip(x, y, t, cls="pl-chip", tcls="pl-chip-text"):
    w = sum(0 if unicodedata.category(c) == "Mn" else FS * 0.58 for c in t) + 24
    out.append(f'<rect x="{x:g}" y="{y - 17:g}" width="{w:g}" height="34" rx="9" class="{cls}"/>')
    out.append(f'<text x="{x + w / 2:g}" y="{y + 6:g}" text-anchor="middle" class="{tcls}">{escape(t)}</text>')
    return x + w


def label_row(x, y, words, guess=False):
    """Character cells with a B/I label under each; a gap marks each cut."""
    for wi, word in enumerate(words):
        for ci, ch in enumerate(clusters(word)):
            b = ci == 0
            out.append(f'<rect x="{x}" y="{y - 20}" width="34" height="38" rx="6" class="{"ml-cell-b" if b else "ml-cell"}"/>')
            out.append(f'<text x="{x + 17}" y="{y + 7}" text-anchor="middle" class="pl-text">{escape(ch)}</text>')
            out.append(f'<text x="{x + 17}" y="{y + 40}" text-anchor="middle" class="{"ml-b" if b else "ml-i"}">{"B" if b else "I"}</text>')
            x += 36
        if wi < len(words) - 1:
            out.append(f'<path d="M{x + 3} {y - 26} V{y + 22}" class="{"ml-cut-guess" if guess else "ml-cut"}"/>')
            x += 8
    return x


y = 30
both(20, y, "1. คนตัดคำข้อความจำนวนมากด้วยมือ (ข้อมูลฝึก เช่น LST20 ของ NECTEC)", "1. People cut a lot of text by hand (training data, such as NECTEC's LST20)", "pl-label")
y += 40
for src, words in (("วันนี้อากาศดีมาก", ["วันนี้", "อากาศ", "ดี", "มาก"]), ("นักเรียนกำลังอ่านหนังสือ", ["นักเรียน", "กำลัง", "อ่าน", "หนังสือ"])):
    out.append(f'<text x="40" y="{y + 6}" class="pl-text">{escape(src)}</text>')
    out.append(f'<path d="M290 {y} H326" class="pl-line"/><path d="M319 {y - 6} L326 {y} L319 {y + 6}" class="pl-line"/>')
    x = 340
    for w in words:
        x = chip(x, y, w) + 6
    y += 44

y += 20
both(20, y, "2. โมเดลเห็นเป็นป้ายของตัวอักษรทุกตัว: B = คำใหม่เริ่มตรงนี้, I = อยู่ในคำเดิม", "2. The model sees one label per character: B = a word begins here, I = inside a word", "pl-label")
y += 44
label_row(40, y, ["วันนี้", "อากาศ", "ดี", "มาก"])
both(560, y + 6, "โมเดลจำแพตเทิร์นของตัวอักษร", "it learns the patterns", "pl-note")
both(560, y + 30, "ไม่ได้จำรายการคำ", "of letters, not a word list", "pl-note")

y += 86
both(20, y, "3. ประโยคใหม่: ทายป้ายทีละตัว แล้วตัดก่อนทุก B (ตัวอย่าง)", "3. A new sentence: guess a label per character, then cut before every B (illustration)", "pl-label")
y += 44
x = label_row(40, y, ["ไลฟ์", "สด", "วันนี้"], guess=True)
x = 560
out.append(f'<path d="M{x - 20} {y} H{x + 6}" class="pl-line"/><path d="M{x - 1} {y - 6} L{x + 6} {y} L{x - 1} {y + 6}" class="pl-line"/>')
x += 16
for w in ["ไลฟ์", "สด", "วันนี้"]:
    x = chip(x, y, w) + 6
both(560, y + 40, "ตัดคำใหม่ที่ไม่อยู่ในพจนานุกรมได้", "can cut words missing from any dictionary", "ml-ok-small")

H = y + 60
svg = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" class="diagram diagram-wide" role="img" aria-labelledby="mlt-title">',
    '<title id="mlt-title">A machine-learning tokenizer learns from text people cut by hand. It sees one label per character, '
    "B where a word begins and I inside a word, then on a new sentence guesses a label for each character and cuts before every B.</title>",
    *out,
    "</svg>",
]
open(sys.argv[1], "w", encoding="utf-8").write("\n".join(svg) + "\n")
print("wrote", sys.argv[1], f"{W}x{H}")
