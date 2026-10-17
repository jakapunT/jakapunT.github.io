"""Draws the L12-S15 infographic: longest matching scanning เดินหามเหสี step by step, and
maximal matching comparing every possible cut. Dictionary: เดิน หา หาม เห สี มเหสี.
The two results are the real outputs of word_tokenize(engine="longest") and engine="newmm".

    python3 scripts/diagrams/l12_matching.py courses/nlp-basic/images/l12-matching.svg

Uses the pl-* and sw-* classes in templates/page.css.
"""

import sys
import unicodedata
from html import escape

W = 900
FS = 19
out = []


def width(s):
    return sum(0 if unicodedata.category(c) == "Mn" else FS * 0.58 for c in s)


def both(x, y, th, en, cls, anchor="start"):
    out.append(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}" data-only="th">{escape(th)}</text>')
    out.append(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}" data-only="en" lang="en">{escape(en)}</text>')


def chip(x, y, t, cls="pl-chip", tcls="pl-chip-text"):
    w = width(t) + 24
    out.append(f'<rect x="{x:g}" y="{y - 17:g}" width="{w:g}" height="34" rx="9" class="{cls}"/>')
    out.append(f'<text x="{x + w / 2:g}" y="{y + 6:g}" text-anchor="middle" class="{tcls}">{escape(t)}</text>')
    return x + w


def arrow(x1, x2, y):
    out.append(f'<path d="M{x1} {y} H{x2}" class="pl-line"/><path d="M{x2 - 7} {y - 6} L{x2} {y} L{x2 - 7} {y + 6}" class="pl-line"/>')


# ---------- part 1: longest matching
y = 30
both(20, y, "1. Longest matching: เลือกคำที่ยาวที่สุดทีละจุด และไม่ย้อนกลับ", "1. Longest matching: take the longest word at each point, never go back", "pl-label")
y += 34
COLS = (60, 250, 520, 720)
both(COLS[0], y, "ข้อความที่เหลือ", "Text left", "nt-head")
both(COLS[1], y, "คำในพจนานุกรมที่ขึ้นต้นตรงนี้", "Dictionary words that start here", "nt-head")
both(COLS[3], y, "เลือก", "Take", "nt-head")
steps = [
    ("เดินหามเหสี", ["เดิน"], "เดิน"),
    ("หามเหสี", ["หา", "หาม"], "หาม"),
    ("เหสี", ["เห"], "เห"),
    ("สี", ["สี"], "สี"),
]
y += 36
for k, (left, cands, take) in enumerate(steps, 1):
    out.append(f'<circle cx="30" cy="{y}" r="14" class="pl-dot"/><text x="30" y="{y + 5}" text-anchor="middle" class="pl-num">{k}</text>')
    out.append(f'<text x="{COLS[0]}" y="{y + 6}" class="pl-text">{escape(left)}</text>')
    x = COLS[1]
    for c in cands:
        x = chip(x, y, c, "pl-chip" if c != take else "sw-chip-warn") + 8
    if len(cands) > 1:
        both(x + 4, y + 6, "← หาม ยาวกว่า", "← หาม is longer", "pl-note")
    chip(COLS[3], y, take)
    y += 46
# result
out.append(f'<rect x="12" y="{y - 20}" width="{W - 24}" height="44" rx="10" class="sw-warn-box"/>')
x = 60
for t in ["เดิน", "หาม", "เห", "สี"]:
    x = chip(x, y + 2, t) + 6
both(x + 12, y + 8, "4 คำ ✗ หาม แปลว่า แบก ประโยคจึงไม่มีความหมาย", "4 words ✗ หาม means 'carry', so the sentence makes no sense", "sw-warn-text")

# ---------- part 2: maximal matching
y += 70
both(20, y, "2. Maximal matching: ลองทุกทางที่ตัดได้ แล้วเลือกทางที่มีจำนวนคำน้อยที่สุด", "2. Maximal matching: try every possible cut, then pick the one with the fewest words", "pl-label")
y += 44
paths = [(["เดิน", "หา", "มเหสี"], True), (["เดิน", "หาม", "เห", "สี"], False)]
for words, best in paths:
    x = 60
    for i, t in enumerate(words):
        x = chip(x, y, t, "pl-chip" if best else "pl-chip-del", "pl-chip-text" if best else "pl-del")
        if i < len(words) - 1:
            arrow(x + 4, x + 26, y)
            x += 30
    if best:
        both(x + 18, y + 6, f"{len(words)} คำ ✓ น้อยที่สุด: เดินหาพระมเหสี", f"{len(words)} words ✓ fewest: walking to look for the queen", "ml-ok")
    else:
        both(x + 18, y + 6, f"{len(words)} คำ", f"{len(words)} words", "pl-note")
    y += 48

H = y - 10
svg = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" class="diagram diagram-wide" role="img" aria-labelledby="ml-title">',
    '<title id="ml-title">Longest matching cuts เดินหามเหสี step by step and takes หาม because it is longer than หา, giving 4 words '
    "that make no sense. Maximal matching compares every possible cut and picks เดิน หา มเหสี, the one with the fewest words.</title>",
    *out,
    "</svg>",
]
open(sys.argv[1], "w", encoding="utf-8").write("\n".join(svg) + "\n")
print("wrote", sys.argv[1], f"{W}x{H}")
