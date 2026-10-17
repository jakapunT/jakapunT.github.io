"""Writes the lesson 13 practice table `reviews_cls`: 100 mock Thai restaurant reviews (20 of them mixed: one good point and one bad), each
labelled positive or negative, for training and testing a text classifier. Every review is
made up for teaching (fixed seed).

    course/.venv/bin/python scripts/diagrams/l13_data.py courses/nlp-basic
"""

import os
import random
import sys

import pandas as pd

course = sys.argv[1] if len(sys.argv) > 1 else "courses/nlp-basic"
rng = random.Random(13)

dishes = ["ต้มยำ", "ผัดไทย", "ส้มตำ", "ข้าวมันไก่", "แกงเขียวหวาน", "ก๋วยเตี๋ยว", "กาแฟ", "ขนม"]
pos_food = ["อร่อยมาก", "รสชาติดี", "สดใหม่", "หอมมาก", "อร่อยถูกปาก", "รสจัดจ้านดี"]
neg_food = ["ไม่อร่อย", "จืดมาก", "เค็มเกินไป", "เย็นชืด", "รสชาติแย่", "ไม่สด"]
pos_other = ["พนักงานบริการดี", "ร้านสะอาด", "บรรยากาศดี", "ราคาคุ้มค่า", "ได้อาหารเร็ว", "พนักงานยิ้มแย้ม"]
neg_other = ["พนักงานไม่สุภาพ", "ร้านสกปรก", "รอนานมาก", "ราคาแพงเกินไป", "บริการช้า", "ที่นั่งแคบ"]
pos_end = ["จะกลับมาอีก", "แนะนำเลย", "ประทับใจ", ""]
neg_end = ["ไม่มาอีกแล้ว", "ผิดหวัง", "ไม่แนะนำ", ""]

rows = []
for label, food, other, end in (("positive", pos_food, pos_other, pos_end), ("negative", neg_food, neg_other, neg_end)):
    seen = set()
    while len([r for r in rows if r[1] == label]) < 40:
        parts = [rng.choice(dishes) + rng.choice(food), rng.choice(other)]
        rng.shuffle(parts)
        e = rng.choice(end)
        text = " ".join(parts + ([e] if e else []))
        if text in seen:
            continue
        seen.add(text)
        rows.append((text, label))
# mixed reviews: one good point and one bad point; the ending says which way the writer leans
for label, food, other, end in (("positive", neg_food, pos_other, pos_end[:3]), ("negative", pos_food, neg_other, neg_end[:3])):
    n = 0
    while n < 10:
        parts = [rng.choice(dishes) + rng.choice(food), rng.choice(other)]
        rng.shuffle(parts)
        e = rng.choice(end + ["", ""])  # some mixed reviews give no clear ending: hard cases
        text = " ".join(parts + ([e] if e else []))
        if any(text == r[0] for r in rows):
            continue
        rows.append((text, label))
        n += 1
rng.shuffle(rows)
df = pd.DataFrame(rows, columns=["text", "label"])
df.insert(0, "review_id", [f"C{i:02d}" for i in range(1, len(df) + 1)])
df.to_csv(os.path.join(course, "data", "l13_reviews_cls.csv"), index=False)
print(df.head(10).to_string())
print(df["label"].value_counts())
