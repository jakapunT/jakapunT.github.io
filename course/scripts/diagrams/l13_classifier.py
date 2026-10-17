"""Draws the lesson 13 text-classification infographics (L13-S02, S04, S05, S06, S22).

The lesson teaches the idea without code, so the classifier is shown as "word votes": in how
many positive and in how many negative training reviews each word appears. Every number here
is computed from data/l13_reviews_cls.csv with the lesson's split (75 train / 25 test,
random_state=1, stratified) and the pythainlp tokenizer. On the 25 test reviews this simple
tally gives the same answer as Naive Bayes for every review (the script checks it), so the
pictures tell the truth about the real model.

    course/.venv/bin/python scripts/diagrams/l13_classifier.py courses/nlp-basic

Uses the nt-*, pl-*, ml-*, fc-*, wv-*, bw-* and kc-* classes in templates/page.css.
"""

import os
import sys
import unicodedata
from collections import Counter
from html import escape

import pandas as pd
from pythainlp import word_tokenize
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB

course = sys.argv[1] if len(sys.argv) > 1 else "courses/nlp-basic"
OUT = os.path.join(course, "images")
FS = 19


def width(s, fs=FS):
    return sum(0 if unicodedata.category(c) == "Mn" else fs * (1.1 if ord(c) > 0x1F000 else 0.58) for c in s)


class Svg:
    def __init__(self, w, title):
        self.w, self.title, self.out = w, title, []

    def add(self, s):
        self.out.append(s)

    def both(self, x, y, th, en, cls, anchor="start"):
        self.add(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}" data-only="th">{escape(th)}</text>')
        self.add(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}" data-only="en" lang="en">{escape(en)}</text>')

    def text(self, x, y, s, cls, anchor="start"):
        self.add(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}">{escape(s)}</text>')

    def box(self, x, y, w, h, cls, rx=12):
        self.add(f'<rect x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}" rx="{rx}" class="{cls}"/>')

    def chip(self, x, y, t, cls="pl-chip", tcls="pl-chip-text", fs=FS):
        w = width(t, fs) + 24
        self.box(x, y - 17, w, 34, cls, 9)
        self.text(x + w / 2, y + 6, t, tcls, "middle")
        return x + w

    def arrow(self, x1, y1, x2, y2):
        self.add(f'<path d="M{x1:g} {y1:g} L{x2:g} {y2:g}" class="pl-line"/>')
        if y1 == y2:
            d = 8 if x2 > x1 else -8
            self.add(f'<path d="M{x2 - d:g} {y2 - 6:g} L{x2:g} {y2:g} L{x2 - d:g} {y2 + 6:g}" class="pl-line"/>')
        else:
            self.add(f'<path d="M{x2 - 6:g} {y2 - 8:g} L{x2:g} {y2:g} L{x2 + 6:g} {y2 - 8:g}" class="pl-line"/>')

    def save(self, name, h):
        svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {h}" class="diagram diagram-wide" role="img"><title>{escape(self.title)}</title>', *self.out, "</svg>"]
        open(os.path.join(OUT, name), "w", encoding="utf-8").write("\n".join(svg) + "\n")
        print("wrote", name, f"{self.w}x{h}")


# ---------------------------------------------------------------- the data and the real model
df = pd.read_csv(os.path.join(course, "data", "l13_reviews_cls.csv"))


def tok(text):
    return word_tokenize(text, keep_whitespace=False)


X_train, X_test, y_train, y_test = train_test_split(
    df["text"], df["label"], test_size=0.25, random_state=1, stratify=df["label"])
vec = CountVectorizer(tokenizer=tok, token_pattern=None)
nb = MultinomialNB().fit(vec.fit_transform(X_train), y_train)

count = {"positive": Counter(), "negative": Counter()}
for text, label in zip(X_train, y_train):
    for w in set(tok(text)):
        count[label][w] += 1


def votes(text):
    words = tok(text)
    p = sum(count["positive"][w] for w in words)
    n = sum(count["negative"][w] for w in words)
    return words, p, n, "positive" if p > n else "negative"


nb_pred = nb.predict(vec.transform(X_test))
vote_pred = [votes(t)[3] for t in X_test]
assert list(nb_pred) == vote_pred, "the word-vote picture no longer matches Naive Bayes"
right = [p == y for p, y in zip(vote_pred, y_test)]
print("test accuracy", sum(right), "/", len(right))


def card(s, x, y, text, label, w=260, tilt=0):
    """A flashcard: the review on the card, its label on a tab."""
    g = f'<g transform="rotate({tilt} {x + w / 2:g} {y + 34})">'
    g += f'<rect x="{x}" y="{y}" width="{w}" height="68" rx="10" class="fc-card"/>'
    g += f'<text x="{x + 16}" y="{y + 30}" class="fc-text">{escape(text)}</text>'
    if label:
        g += f'<rect x="{x + w - 108}" y="{y + 40}" width="96" height="22" rx="11" class="{"fc-pos" if label == "positive" else "fc-neg"}"/>'
        g += f'<text x="{x + w - 60}" y="{y + 56}" text-anchor="middle" class="fc-label">{escape(label)}</text>'
    s.add(g + "</g>")


def robot(s, x, y, w, h, th="โมเดล", en="Model"):
    s.box(x, y, w, h, "ml-model", 16)
    s.text(x + 34, y + h / 2 + 10, "🤖", "fc-robot", "middle")
    s.both(x + 60, y + h / 2 + 7, th, en, "ml-model-text")


def vote_chip(s, x, y, w_, fs=17):
    p, n = count["positive"][w_], count["negative"][w_]
    lab = f"{w_}  +{p} / −{n}"
    end = s.chip(x, y, lab, "pl-chip" if p >= n else "wv-chip-neg", "wv-chip", fs)
    return end, p, n


# ---------------------------------------------------------------- S02 flashcards
s = Svg(900, "Training is like studying flashcards: each card has a review and its label. Then the model answers a card it has never seen.")
s.box(10, 10, 880, 290, "nt-band-a", 16)
s.both(30, 44, "📚 1. เรียน (training): ทบทวนบัตรคำนับร้อยใบ", "📚 1. Training: study hundreds of flashcards", "pl-label")
card(s, 46, 64, "ต้มยำอร่อยมาก ร้านสะอาด", "positive", tilt=-2)
card(s, 70, 142, "รอนานมาก ผัดไทยจืดมาก", "negative", tilt=2)
card(s, 40, 220, "ส้มตำหอมมาก แนะนำเลย", "positive", w=260, tilt=-1)
s.both(360, 120, "หน้าบัตร: รีวิว", "Card: the review", "pl-note")
s.both(360, 146, "ป้าย: คำตอบ (label)", "Tab: the answer (label)", "pl-note")
s.both(360, 196, "โมเดลจับว่าคำไหน", "The model notices which", "pl-note")
s.both(360, 220, "มักมากับคำตอบไหน", "words go with which answer", "pl-note")
s.arrow(586, 165, 636, 165)
robot(s, 644, 125, 236, 80, "โมเดลที่เรียนแล้ว", "trained model")
s.box(10, 316, 880, 124, "nt-band-b", 16)
s.both(30, 350, "📝 2. สอบ (prediction): บัตรใบใหม่ ไม่มีคำตอบ", "📝 2. Prediction: a new card with no answer", "pl-label")
card(s, 46, 358, "อาหารอร่อย บรรยากาศดี", "", w=280)
s.text(296, 400, "?", "fc-q", "middle")
s.arrow(340, 392, 510, 392)
s.box(518, 366, 90, 52, "ml-model", 12)
s.text(563, 402, "🤖", "fc-robot", "middle")
s.arrow(616, 392, 690, 392)
s.box(698, 372, 130, 40, "fc-pos", 20)
s.text(763, 399, "positive", "fc-label-lg", "middle")
s.save("l13-flashcards.svg", 450)

# ---------------------------------------------------------------- S04 bag of words
s = Svg(900, "Bag of words: cut the text into words, pour them into a bag (the order is lost), then count each word of the vocabulary.")
cols = [(20, "✂️ 1. ตัดคำ", "✂️ 1. Tokenize"), (320, "🛍️ 2. เทลงถุง", "🛍️ 2. Into the bag"), (620, "🔢 3. นับ", "🔢 3. Count")]
for x, th, en in cols:
    s.both(x, 32, th, en, "pl-label")
s.box(20, 56, 250, 46, "nt-bubble", 23)
s.text(145, 86, "อาหารไม่อร่อย", "pl-text", "middle")
s.arrow(145, 108, 145, 136)
yy = 162
for w_ in ["อาหาร", "ไม่", "อร่อย"]:
    s.chip(145 - (width(w_) + 24) / 2, yy, w_)
    yy += 44
s.arrow(276, 206, 316, 206)
# the bag
s.add('<path d="M372 104 Q360 84 384 80 L520 80 Q544 84 532 104 L556 130 Q590 230 548 286 Q452 318 356 286 Q314 230 348 130 Z" class="bw-bag"/>')
s.add('<path d="M384 104 Q452 118 520 104" class="bw-tie"/>')
for (x, y, w_, r) in [(380, 170, "อร่อย", -12), (452, 214, "อาหาร", 9), (392, 258, "ไม่", -4)]:
    s.add(f'<g transform="rotate({r} {x + 40} {y})">')
    s.chip(x, y, w_)
    s.add("</g>")
s.both(452, 334, "ลำดับคำหายไป", "word order is gone", "wv-note", "middle")
s.arrow(586, 206, 616, 206)
# the counts: one row per vocabulary word
vocab = [("ดี", 0), ("บริการ", 0), ("อร่อย", 1), ("อาหาร", 1), ("ไม่", 1)]
s.box(630, 56, 250, 252, "bw-table", 12)
s.both(700, 84, "คำ", "word", "nt-head", "middle")
s.both(820, 84, "จำนวน", "count", "nt-head", "middle")
yy = 120
for w_, c in vocab:
    s.add(f'<path d="M640 {yy - 24} H870" class="bw-rule"/>')
    s.text(700, yy + 6, w_, "pl-text", "middle")
    s.text(820, yy + 6, str(c), "bw-one" if c else "bw-zero", "middle")
    yy += 40
s.save("l13-bag.svg", 346)

# ---------------------------------------------------------------- S05 split
s = Svg(900, "Split the 100 labelled reviews: 75 to train with their answers, 25 kept aside as the exam with the answers hidden.")
S, G = 22, 4
lab_of = dict(zip(df["text"], df["label"]))
s.both(20, 30, "รีวิว 100 รายการ", "100 reviews", "pl-label")
for i, (t, l) in enumerate(zip(df["text"], df["label"])):
    s.box(20 + (i % 10) * (S + G), 50 + (i // 10) * (S + G), S, S, "fc-pos" if l == "positive" else "fc-neg", 4)
s.box(20, 324, 14, 14, "fc-pos", 3)
s.text(40, 336, "positive", "pl-note")
s.box(130, 324, 14, 14, "fc-neg", 3)
s.text(150, 336, "negative", "pl-note")
s.add('<path d="M290 182 H312 M312 117 V286" class="pl-line"/>')
s.arrow(312, 117, 364, 117)
s.arrow(312, 286, 364, 286)
s.both(340, 178, "สุ่ม", "shuffle", "pl-note", "middle")
s.both(340, 202, "แบ่ง", "& split", "pl-note", "middle")
s.box(372, 22, 518, 190, "nt-band-a", 14)
s.both(390, 52, f"เทรน {len(X_train)} รีวิว: โมเดลเห็นทั้งรีวิวและคำตอบ", f"Train, {len(X_train)} reviews: review + answer shown", "pl-label")
for i, l in enumerate(y_train):
    s.box(390 + (i % 15) * (S + G), 70 + (i // 15) * (S + G), S, S, "fc-pos" if l == "positive" else "fc-neg", 4)
s.box(372, 226, 518, 120, "nt-band-b", 14)
s.both(390, 256, f"ทดสอบ {len(X_test)} รีวิว: ซ่อนคำตอบไว้ตรวจทีหลัง", f"Test, {len(X_test)} reviews: answers hidden until marking", "pl-label")
for i in range(len(X_test)):
    x, y = 390 + (i % 13) * (S + G), 274 + (i // 13) * (S + G)
    s.box(x, y, S, S, "fc-hidden", 4)
    s.text(x + S / 2, y + 16, "?", "fc-hidden-q", "middle")
s.save("l13-split.svg", 352)

# ---------------------------------------------------------------- S05 word votes
s = Svg(900, "What the model learns: in how many positive and negative training reviews each word appears. A new review's words vote.")
s.both(20, 30, f"สิ่งที่โมเดลเรียน: คำนี้อยู่ในรีวิว positive กี่รีวิว และ negative กี่รีวิว (จาก {len(X_train)} รีวิวชุดเทรน)",
       "What the model learns: in how many reviews of each label a word appears", "pl-label")
MID, SCALE, y = 450, 12, 66
s.text(MID - 70, y, "← negative", "wv-neg-h", "end")
s.text(MID + 70, y, "positive →", "wv-pos-h")
y += 32
for w_ in ["ดี", "ประทับใจ", "คุ้มค่า", "อร่อย", "ราคาแพง", "ผิดหวัง", "ไม่"]:
    p, n = count["positive"][w_], count["negative"][w_]
    s.text(MID, y + 6, w_, "pl-label", "middle")
    s.box(MID - 60 - n * SCALE, y - 11, n * SCALE, 22, "wv-neg", 4) if n else None
    s.text(MID - 66 - n * SCALE, y + 6, str(n), "pl-note", "end")
    s.box(MID + 60, y - 11, p * SCALE, 22, "wv-pos", 4) if p else None
    s.text(MID + 66 + p * SCALE, y + 6, str(p), "pl-note")
    if w_ == "อร่อย":
        s.both(890, y + 6, "← ไม่อร่อย = ไม่ + อร่อย", "← ไม่อร่อย = ไม่ + อร่อย", "wv-note", "end")
    y += 36
y += 16
s.box(10, y - 24, 880, 140, "nt-band-b", 14)
s.both(30, y + 2, "รีวิวใหม่ “อาหารอร่อย บรรยากาศดี”: แต่ละคำโหวต", "New review “อาหารอร่อย บรรยากาศดี”: each word votes", "pl-label")
x, ytok = 30, y + 48
words, P, N, verdict = votes("อาหารอร่อย บรรยากาศดี")
for w_ in words:
    x, _, _ = vote_chip(s, x, ytok, w_)
    x += 10
s.both(30, ytok + 52, f"รวม +{P} / −{N} → {verdict}", f"total +{P} / −{N} → {verdict}", "tr-big")
s.save("l13-word-votes.svg", y + 126)

# ---------------------------------------------------------------- S05 test result
s = Svg(900, f"The exam: the model answers the {len(X_test)} test reviews and gets {sum(right)} right.")
s.both(20, 30, "ตรวจข้อสอบ: เปิดคำตอบจริงแล้วเทียบกับที่โมเดลทาย", "Marking: reveal the real answers and compare with the model's", "pl-label")
S2 = 30
for i, (ok, l) in enumerate(zip(right, y_test)):
    x = 20 + i * (S2 + 4)
    s.box(x, 52, S2, S2, "fc-pos" if l == "positive" else "fc-neg", 5)
    s.text(x + S2 / 2, 74, "✓" if ok else "✗", "tr-mark", "middle")
    if not ok:
        s.add(f'<rect x="{x - 4}" y="48" width="{S2 + 8}" height="{S2 + 8}" rx="7" class="tr-miss"/>')
        miss_x = x + S2 / 2
s.add(f'<path d="M{miss_x:g} 92 V112" class="pl-line"/>')
s.both(miss_x, 134, "ผิด 1 ข้อ: ต้มยำไม่อร่อย ร้านสะอาด (ดู S06)", "1 wrong: ต้มยำไม่อร่อย ร้านสะอาด (see S06)", "wv-note", "middle")
s.both(20, 184, f"accuracy = ถูก {sum(right)} ÷ ทั้งหมด {len(right)} = {sum(right) / len(right):.0%}",
       f"accuracy = {sum(right)} right ÷ {len(right)} total = {sum(right) / len(right):.0%}", "tr-big")
s.save("l13-test-result.svg", 200)

# ---------------------------------------------------------------- S06 the mistake
s = Svg(900, "Why the model got it wrong: ไม่ carries the heaviest negative vote, so the mixed review tips to negative.")
miss = [t for t, ok in zip(X_test, right) if not ok][0]
words, P, N, verdict = votes(miss)
s.box(10, 10, 880, 70, "nt-band-a", 14)
s.both(30, 42, "รีวิว:", "Review:", "pl-note")
s.text(110, 42, miss, "pl-label")
s.both(30, 68, f"คนเขียนให้ {lab_of[miss]}  (ไม่ชอบต้มยำ แต่ชอบร้าน)", f"the writer said {lab_of[miss]}  (the soup was bad, the place was good)", "pl-note")
x, yv = 30, 120
for w_ in words:
    x, p, n = vote_chip(s, x, yv, w_)
    if w_ == "ไม่":
        s.add(f'<path d="M{x - 60:g} {yv + 20} V{yv + 40}" class="pl-line"/>')
        s.both(x - 60, yv + 62, "โหวตหนักที่สุด", "heaviest vote", "wv-note", "middle")
    x += 10
s.both(30, 222, f"รวม +{P} / −{N} → โมเดลตอบ {verdict} ✗", f"total +{P} / −{N} → the model says {verdict} ✗", "tr-big-neg")
s.save("l13-mistake.svg", 240)

# ---------------------------------------------------------------- S22 kinds of classification
s = Svg(900, "Three kinds of classification: binary (one of two), multi-class (one of many), multi-label (any number of labels).")
panels = [
    ("ไบนารี (binary)", "Binary", "เลือก 1 จาก 2", "pick 1 of 2", "รับรางวัลฟรี คลิกเลย", ["spam", "not spam"], {"spam"}),
    ("หลายคลาส (multi-class)", "Multi-class", "เลือก 1 จากหลายคลาส", "pick 1 of many", "ทีมชาติไทยชนะ 2-0", ["กีฬา", "เศรษฐกิจ", "การเมือง", "บันเทิง"], {"กีฬา"}),
    ("หลายป้าย (multi-label)", "Multi-label", "ได้กี่ป้ายก็ได้", "any number of labels", "หนังตลกเรื่องผีในโรงเรียน", ["ตลก", "สยองขวัญ", "โรแมนติก", "แอ็กชัน"], {"ตลก", "สยองขวัญ"}),
]
for i, (th, en, subth, suben, text, classes, chosen) in enumerate(panels):
    x0 = 10 + i * 297
    s.box(x0, 10, 285, 262, "nt-band-a" if i != 1 else "nt-band-b", 14)
    s.both(x0 + 18, 42, th, en, "pl-label")
    s.both(x0 + 18, 70, subth, suben, "pl-note")
    s.box(x0 + 18, 88, 249, 42, "nt-bubble", 21)
    s.text(x0 + 142, 116, text, "kc-text", "middle")
    s.arrow(x0 + 142, 136, x0 + 142, 162)
    x, y = x0 + 18, 194
    for c in classes:
        w = width(c, 17) + 40
        if x + w > x0 + 270:
            x, y = x0 + 18, y + 46
        on = c in chosen
        s.box(x, y - 17, w, 34, "kc-on" if on else "kc-off", 17)
        s.text(x + w / 2, y + 6, ("✓ " if on else "") + c, "kc-on-text" if on else "kc-off-text", "middle")
        x += w + 8
s.save("l13-kinds.svg", 282)

# ---------------------------------------------------------------- S23 rules vs machine learning
s = Svg(900, "Rule-based: a person writes the rules and the computer gives answers. Machine learning: we give data and answers, and the computer finds the rules.")


def two_line(x, y, w, th, en, ex_th, ex_en, cls="nt-bubble"):
    s.box(x, y, w, 64, cls, 12)
    s.both(x + w / 2, y + 27, th, en, "ml-box-h", "middle")
    s.both(x + w / 2, y + 50, ex_th, ex_en, "ml-box-ex", "middle")


rows = [
    (10, "nt-band-a", "🧑‍💻 เขียนกฎเอง (rule-based)", "🧑‍💻 Rule-based: write the rules yourself",
     ("กฎ (คนเขียน)", "Rules (by a person)", "มี “อร่อย” → positive", "has “อร่อย” → positive"),
     ("โปรแกรมตอบ", "program answers", "", ""),
     ("คำตอบ", "Answers", "positive / negative", "positive / negative")),
    (160, "nt-band-b", "🤖 machine learning: ให้เครื่องเรียนเอง", "🤖 Machine learning: the computer learns",
     ("คำตอบ (label)", "Answers (labels)", "positive / negative", "positive / negative"),
     ("เครื่องเรียน", "computer learns", "", ""),
     ("กฎ (โมเดล)", "Rules (the model)", "คำไหนมากับป้ายไหน", "word → label patterns")),
]
for y0, band, th, en, second, mid, out in rows:
    s.box(10, y0, 880, 140, band, 16)
    s.both(30, y0 + 32, th, en, "pl-label")
    yb = y0 + 54
    two_line(30, yb, 150, "ข้อมูล", "Data", "รีวิว", "reviews")
    s.text(197, yb + 40, "+", "ml-plus", "middle")
    two_line(214, yb, 230, *second, cls="ml-swap")
    s.arrow(452, yb + 32, 492, yb + 32)
    s.box(500, yb, 150, 64, "ml-model", 12)
    s.text(530, yb + 42, "🖥️", "fc-robot", "middle")
    s.both(558, yb + 39, mid[0], mid[1], "ml-model-sub")
    s.arrow(658, yb + 32, 698, yb + 32)
    two_line(706, yb, 174, *out, cls="ml-swap" if y0 > 10 else "nt-bubble")
s.save("l13-rules-vs-ml.svg", 310)
