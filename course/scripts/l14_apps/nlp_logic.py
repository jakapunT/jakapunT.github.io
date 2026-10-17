"""The NLP part of the lesson 14 demo app: plain Python, no Streamlit.
Every stage of the app imports this file unchanged; only the interface changes."""

from collections import Counter

from pythainlp import word_tokenize
from pythainlp.corpus import thai_stopwords

STOPWORDS = thai_stopwords()

SAMPLE = """กาแฟอร่อยมาก ร้านสวย บรรยากาศดี
รอกาแฟนานมาก พนักงานไม่สนใจลูกค้าเลย
ขนมอร่อย แต่กาแฟแพงไปหน่อย
ร้านนี้บรรยากาศดีมาก นั่งทำงานได้ทั้งวัน
กาแฟธรรมดา แต่ขนมอร่อยมาก"""


def analyze_text(text, remove_stopwords=True, top_n=5):
    words = [w for w in word_tokenize(text, keep_whitespace=False)
             if any(ch.isalnum() for ch in w)]  # drop spaces and punctuation
    if remove_stopwords:
        words = [w for w in words if w not in STOPWORDS]
    return {
        "word_count": len(words),
        "unique_words": len(set(words)),
        "lines": len([l for l in text.splitlines() if l.strip()]),
        "top_words": Counter(words).most_common(top_n),
    }
