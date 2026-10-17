import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import pandas as pd
import streamlit as st
from nlp_logic import SAMPLE, analyze_text

st.set_page_config(page_title="Thai review analyzer", layout="wide")
st.title("Thai review analyzer")
st.caption("Paste reviews, one per line, to see the most common words.")

with st.sidebar:
    st.header("Settings")
    top_n = st.slider("Top words", 3, 10, 5)
    remove = st.checkbox("Remove stop words", value=True)

text = st.text_area("Reviews", SAMPLE, height=150)
result = analyze_text(text, remove_stopwords=remove, top_n=top_n)

c1, c2, c3 = st.columns(3)
c1.metric("Reviews", result["lines"])
c2.metric("Words", result["word_count"])
c3.metric("Unique words", result["unique_words"])

left, right = st.columns(2)
top = pd.DataFrame(result["top_words"], columns=["word", "count"])
with left:
    st.subheader("Top words")
    st.dataframe(top, hide_index=True)
with right:
    st.subheader("Word frequency")
    st.bar_chart(top, x="word", y="count", horizontal=True, sort="-count")
