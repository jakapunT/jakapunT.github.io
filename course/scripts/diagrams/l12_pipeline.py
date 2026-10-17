"""Draws the L12-S11 infographic: review R01 going down the text processing pipeline, from
raw text to counts. Removed parts are struck through in rust; tokens are chips.

    python3 scripts/diagrams/l12_pipeline.py courses/nlp-basic/images/l12-pipeline.svg

Every value is the real output of the lesson's code (clean, word_tokenize, thai_stopwords).
The SVG is inlined into the page, so it uses the page fonts and tokens.css colours, and its
ไทย/EN labels follow the language switch (data-only).
"""

import sys
import unicodedata
from html import escape

W = 900
ROW = 76
LABEL_X, CONTENT_X = 64, 250
FS = 19  # content font size (viewBox units)


def width(s, fs=FS):
    """A rough text width: Thai marks above/below take no space, emoji are wide."""
    w = 0.0
    for ch in s:
        if unicodedata.category(ch) == "Mn":
            continue
        if ord(ch) > 0x1F000:
            w += fs * 1.15
        elif "฀" <= ch <= "๿":
            w += fs * 0.56
        elif ch == " ":
            w += fs * 0.3
        else:
            w += fs * 0.55
    return w


out = []


def both(x, y, th, en, cls, anchor="start"):
    out.append(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}" data-only="th">{escape(th)}</text>')
    out.append(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}" data-only="en" lang="en">{escape(en)}</text>')


def strip(y, parts):
    """One line of text; parts are (text, removed?) pairs."""
    spans = "".join(f'<tspan class="{"pl-del" if gone else "pl-keep"}">{escape(t)}</tspan>' for t, gone in parts)
    out.append(f'<text x="{CONTENT_X}" y="{y + 6:g}" class="pl-text" xml:space="preserve">{spans}</text>')


def chips(y, items):
    """Token chips; items are (text, removed?) pairs."""
    x = CONTENT_X
    for t, gone in items:
        w = width(t) + 22
        out.append(f'<rect x="{x:g}" y="{y - 17:g}" width="{w:g}" height="34" rx="9" class="{"pl-chip-del" if gone else "pl-chip"}"/>')
        out.append(f'<text x="{x + w / 2:g}" y="{y + 6:g}" text-anchor="middle" class="{"pl-del" if gone else "pl-chip-text"}">{escape(t)}</text>')
        x += w + 8


STEPS = [
    ("ข้อความดิบ", "Raw text", None, None),
    ("ทำความสะอาด", "Cleaning", "ลบ RT ชื่อผู้ใช้ ลิงก์ · กกกก → ก", "remove RT, user name, link · กกกก → ก"),
    ("ตัดคำ", "Tokenization", "word_tokenize ได้ 8 tokens", "word_tokenize gives 8 tokens"),
    ("ตัด stop words", "Stop-word removal", "มาก เป็น stop word · 😍 ไม่มีตัวอักษร", "มาก is a stop word · 😍 has no letters"),
    ("ปรับรูปคำ", "Normalization", "ภาษาไทยไม่ผันคำ (อังกฤษ: studies → study)", "Thai doesn't inflect (English: studies → study)"),
    ("นับคำ", "Counting", "ทุกคำพบ 1 ครั้งในรีวิวนี้", "each word occurs once in this review"),
    ("วิเคราะห์ / โมเดล", "Analysis / model", "รวมทุกรีวิวแล้วหาคำเด่น หรือทายความรู้สึก", "combine all reviews, or predict sentiment"),
]

y0 = 40
for k, (th, en, note_th, note_en) in enumerate(STEPS):
    cy = y0 + k * ROW
    if k < len(STEPS) - 1:
        out.append(f'<path d="M30 {cy + 18} V{cy + ROW - 18}" class="pl-line"/>')
        out.append(f'<path d="M24 {cy + ROW - 26} L30 {cy + ROW - 18} L36 {cy + ROW - 26}" class="pl-line"/>')
    out.append(f'<circle cx="30" cy="{cy}" r="16" class="pl-dot"/>')
    out.append(f'<text x="30" y="{cy + 5}" text-anchor="middle" class="pl-num">{k}</text>')
    both(LABEL_X, cy + 7, th, en, "pl-label")
    content_y = cy - (8 if note_th else 0)
    if k == 0:
        strip(content_y, [("RT @cafe_lover: ", True), ("กาแฟอร่อยมาก", False), ("กกก", True), (" ร้านสวย บรรยากาศดี 😍 ", False), ("https://t.co/…", True)])
    elif k == 1:
        strip(content_y, [("กาแฟอร่อยมาก ร้านสวย บรรยากาศดี 😍", False)])
    elif k == 2:
        chips(content_y, [(t, False) for t in ["กาแฟ", "อร่อย", "มาก", "ร้าน", "สวย", "บรรยากาศ", "ดี", "😍"]])
    elif k == 3:
        chips(content_y, [("กาแฟ", False), ("อร่อย", False), ("มาก", True), ("ร้าน", False), ("สวย", False), ("บรรยากาศ", False), ("ดี", False), ("😍", True)])
    elif k == 4:
        chips(content_y, [(t, False) for t in ["กาแฟ", "อร่อย", "ร้าน", "สวย", "บรรยากาศ", "ดี"]])
    elif k == 5:
        chips(content_y, [(f"{t} 1", False) for t in ["กาแฟ", "อร่อย", "ร้าน", "สวย", "บรรยากาศ", "ดี"]])
    else:
        chips(content_y, [("positive 😀", False)])
    if note_th:
        both(CONTENT_X, cy + 34, note_th, note_en, "pl-note")

H = y0 + (len(STEPS) - 1) * ROW + 52
svg = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" class="diagram diagram-wide" role="img" aria-labelledby="pl-title">',
    '<title id="pl-title">Review R01 going through the text processing pipeline: raw text, cleaning, tokenization, '
    "stop-word removal, normalization, counting, and analysis.</title>",
    *out,
    "</svg>",
]
open(sys.argv[1], "w", encoding="utf-8").write("\n".join(svg) + "\n")
print("wrote", sys.argv[1], f"{W}x{H}")
