"""Draws the L12-S08 infographic: NLP tasks as text in → NLP → output, grouped into
text analytics and NLP systems (automation).

    python3 scripts/diagrams/nlp_tasks.py courses/nlp-basic/images/l12-nlp-tasks.svg

The SVG is inlined into the page (```figure), so it uses the page fonts and tokens.css colours,
and its ไทย/EN labels follow the page's language switch (data-only).
"""

import sys
from html import escape

W = 960
ROW = 64
NAME_X, IN_X, IN_W = 24, 250, 300
HUB_X = IN_X + IN_W + 52
OUT_X = HUB_X + 52
OUT_W = W - OUT_X - 20

GROUPS = [
    {
        "cls": "nt-band-a",
        "th": "Text analytics · หาข้อมูลเชิงลึกจากข้อความจำนวนมาก",
        "en": "Text analytics · insights from large amounts of text",
        "rows": [
            ("😊", "วิเคราะห์ความรู้สึก", "Sentiment analysis", "กาแฟอร่อยมาก", "positive 😀"),
            ("📊", "หาคำที่พูดถึงบ่อย", "Frequent topics", "รีวิว 10,000 รายการ", "กาแฟ · รอนาน · แพง"),
        ],
    },
    {
        "cls": "nt-band-b",
        "th": "NLP systems (automation) · ทำงานด้านภาษาแทนคน",
        "en": "NLP systems (automation) · language work done for people",
        "rows": [
            ("🚫", "คัดกรอง spam", "Spam detection", "รับรางวัล 1,000,000 บาท คลิกเลย", "spam"),
            ("🌐", "แปลภาษา", "Machine translation", "หูฟัง", "headphones"),
            ("🔍", "ค้นหา", "Search", "ร้านกาแฟใกล้จุฬา", "a list of cafés"),
            ("💬", "แชตบอต", "Chatbot", "ร้านเปิดกี่โมง", "เปิด 8 โมงค่ะ"),
            ("🎤", "แปลงเสียงเป็นข้อความ", "Speech to text", "(เสียงพูด) ♪♪♪", "สวัสดีครับ"),
        ],
    },
]

out = []


def text(x, y, s, cls, anchor="start", only=None):
    attr = f' data-only="{only}"' + (' lang="en"' if only == "en" else "") if only else ""
    out.append(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}"{attr}>{escape(s)}</text>')


def both(x, y, th, en, cls, anchor="start"):
    text(x, y, th, cls, anchor, "th")
    text(x, y, en, cls, anchor, "en")


y = 34
both(NAME_X, y, "งาน", "Task", "nt-head")
both(IN_X + 14, y, "ข้อความเข้า", "Text in", "nt-head")
both(OUT_X + 14, y, "ผลลัพธ์", "Output", "nt-head")
y += 18

for g in GROUPS:
    band_h = 46 + ROW * len(g["rows"]) + 8
    out.append(f'<rect x="4" y="{y}" width="{W - 8}" height="{band_h}" rx="14" class="{g["cls"]}"/>')
    both(NAME_X, y + 30, g["th"], g["en"], "nt-band-title")
    ry = y + 46
    for icon, th, en, src, res in g["rows"]:
        cy = ry + ROW / 2 - 4
        text(NAME_X, cy + 7, icon, "nt-icon")
        both(NAME_X + 34, cy + 7, th, en, "nt-task")
        out.append(f'<rect x="{IN_X}" y="{cy - 22}" width="{IN_W}" height="44" rx="22" class="nt-bubble"/>')
        text(IN_X + 18, cy + 7, src, "nt-text")
        out.append(f'<path d="M{IN_X + IN_W + 6} {cy} H{HUB_X - 26}" class="nt-arrow"/>')
        out.append(f'<path d="M{HUB_X - 33} {cy - 6} L{HUB_X - 26} {cy} L{HUB_X - 33} {cy + 6}" class="nt-arrow"/>')
        out.append(f'<circle cx="{HUB_X}" cy="{cy}" r="22" class="nt-hub"/>')
        text(HUB_X, cy + 5, "NLP", "nt-hub-text", "middle")
        out.append(f'<path d="M{HUB_X + 24} {cy} H{OUT_X - 6}" class="nt-arrow"/>')
        out.append(f'<path d="M{OUT_X - 13} {cy - 6} L{OUT_X - 6} {cy} L{OUT_X - 13} {cy + 6}" class="nt-arrow"/>')
        out.append(f'<rect x="{OUT_X}" y="{cy - 22}" width="{OUT_W}" height="44" rx="10" class="nt-out"/>')
        text(OUT_X + 16, cy + 7, res, "nt-text nt-text-strong")
        ry += ROW
    y += band_h + 14

H = y
svg = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" class="diagram diagram-wide" role="img" aria-labelledby="nt-title">',
    '<title id="nt-title">Seven NLP tasks, each shown as text going into NLP and an output coming out. '
    "Text analytics: sentiment analysis and frequent topics. NLP systems (automation): spam detection, "
    "machine translation, search, chatbot, speech to text.</title>",
    *out,
    "</svg>",
]
open(sys.argv[1], "w", encoding="utf-8").write("\n".join(svg) + "\n")
print("wrote", sys.argv[1], f"{W}x{H}")
