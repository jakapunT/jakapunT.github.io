"""Writes the lesson 12 practice table `reviews_th`: 10 mock Thai cafe reviews written in the
style of social-media posts (mentions, links, hashtags, stretched letters, emoji), so students
can clean and tokenize them. Every review is made up for teaching.

    course/.venv/bin/python scripts/diagrams/l12_data.py courses/nlp-basic
"""

import os
import sys

import pandas as pd

course = sys.argv[1] if len(sys.argv) > 1 else "courses/nlp-basic"
rows = [
    ("R01", "RT @cafe_lover: กาแฟอร่อยมากกกก ร้านสวย บรรยากาศดี 😍 https://t.co/a1B2c3", 5),
    ("R02", "รอกาแฟนานมาก พนักงานไม่สนใจลูกค้าเลย #ไม่ไปซ้ำ", 1),
    ("R03", "ขนมอร่อย แต่กาแฟแพงไปหน่อย", 3),
    ("R04", "ร้านนี้บรรยากาศดีมากกก นั่งทำงานได้ทั้งวัน wifi แรง", 5),
    ("R05", "กาแฟ ok ขนมเฉยๆ ราคาแพง", 2),
    ("R06", "พนักงานบริการดี ยิ้มแย้ม กาแฟอร่อย ☕️ via @foodie_th", 5),
    ("R07", "ที่จอดรถหายาก รอนาน กาแฟก็ธรรมดา", 2),
    ("R08", "อร่อยทุกเมนู!!! บริการดีมาก จะมาอีกแน่นอน https://t.co/xY9", 5),
    ("R09", "ราคาแพง แต่บรรยากาศดี กาแฟหอม", 4),
    ("R10", "รอนานมากกกกก แต่ขนมอร่อยจริง", 3),
]
df = pd.DataFrame(rows, columns=["review_id", "text", "rating"])
df.to_csv(os.path.join(course, "data", "l12_reviews_th.csv"), index=False)
print(df.to_string())
