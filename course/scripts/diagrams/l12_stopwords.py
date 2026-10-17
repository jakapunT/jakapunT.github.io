"""Draws the L12-S19 infographic: stop words struck out of token rows, and the trap when a
stop-word list removes ไม่ (not). The Thai row is the real output of the lesson's code
(word_tokenize + thai_stopwords on review R02); the English row uses common stop words.

    python3 scripts/diagrams/l12_stopwords.py courses/nlp-basic/images/l12-stopwords.svg

Uses the pl-* classes of the pipeline infographic (templates/page.css).
"""

import sys
import unicodedata
from html import escape

W = 900
FS = 19
LABEL_X, CHIP_X = 24, 200


def width(s):
    w = 0.0
    for ch in s:
        if unicodedata.category(ch) == "Mn":
            continue
        w += FS * (0.56 if "฀" <= ch <= "๿" else 0.55)
    return w


out = []


def both(x, y, th, en, cls, anchor="start"):
    out.append(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}" data-only="th">{escape(th)}</text>')
    out.append(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}" data-only="en" lang="en">{escape(en)}</text>')


def chips(y, items, warn=()):
    x = CHIP_X
    for t, gone in items:
        w = width(t) + 22
        cls = "pl-chip-del" if gone else ("sw-chip-warn" if t in warn else "pl-chip")
        out.append(f'<rect x="{x:g}" y="{y - 17:g}" width="{w:g}" height="34" rx="9" class="{cls}"/>')
        out.append(f'<text x="{x + w / 2:g}" y="{y + 6:g}" text-anchor="middle" class="{"pl-del" if gone else "pl-chip-text"}">{escape(t)}</text>')
        x += w + 8
    return x


y = 40
both(LABEL_X, y + 6, "อังกฤษ", "English", "pl-label")
chips(y, [("the", True), ("coffee", False), ("is", True), ("good", False), ("for", True), ("a", True), ("cold", False), ("day", False)])
both(CHIP_X, y + 40, "คำอย่าง the, is, for, a ถูกตัด เพราะพบในเกือบทุกประโยค", "the, is, for, a are removed: they appear in almost every sentence", "pl-note")

y += 104
both(LABEL_X, y + 6, "ไทย (R02)", "Thai (R02)", "pl-label")
thai = [("รอ", False), ("กาแฟ", False), ("นาน", True), ("มาก", True), ("พนักงาน", False), ("ไม่", True), ("สนใจ", False), ("ลูกค้า", False), ("เลย", True)]
chips(y, thai)
both(CHIP_X, y + 40, "thai_stopwords() ตัด นาน มาก ไม่ เลย", "thai_stopwords() removes นาน, มาก, ไม่, เลย", "pl-note")

y += 104
both(LABEL_X, y + 6, "เหลือ", "Left", "pl-label")
chips(y, [("รอ", False), ("กาแฟ", False), ("พนักงาน", False), ("สนใจ", False), ("ลูกค้า", False)], warn=("สนใจ",))
out.append(f'<rect x="{CHIP_X - 6}" y="{y + 26}" width="{W - CHIP_X - 14}" height="40" rx="10" class="sw-warn-box"/>')
both(CHIP_X + 10, y + 52, "⚠ ไม่ หายไป: \"ไม่สนใจ\" กลายเป็น \"สนใจ\" รีวิวแย่ ๆ ฟังดูดีขึ้น",
     "⚠ ไม่ (not) is gone: \"didn't care\" became \"cared\", so a bad review sounds good", "sw-warn-text")

H = y + 86
svg = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" class="diagram diagram-wide" role="img" aria-labelledby="sw-title">',
    '<title id="sw-title">Stop words struck out of an English and a Thai sentence. Removing ไม่ (not) from the Thai review '
    "turns didn't care into cared.</title>",
    *out,
    "</svg>",
]
open(sys.argv[1], "w", encoding="utf-8").write("\n".join(svg) + "\n")
print("wrote", sys.argv[1], f"{W}x{H}")
