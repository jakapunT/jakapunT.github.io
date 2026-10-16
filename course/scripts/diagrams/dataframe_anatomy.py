"""Draws the L10-S01 diagram: the same 4 reviews as an Excel sheet and as a pandas DataFrame,
with numbered markers 1-6; the lesson explains them in a table under the figure.

    python3 scripts/diagrams/dataframe_anatomy.py courses/nlp-basic/images/l10-dataframe-anatomy.svg

The SVG is inlined into the page (```figure), so it uses the page fonts and tokens.css colours.
"""

import sys
from html import escape

W, H = 480, 500
# the first four columns of airline_reviews.csv, so Excel's letters match the real file
NAMES = ["Airline Name", "Rating", "Seat Type", "Verified"]
ROWS = [  # data/reviews_small.csv, index 0-3 (AR0005, AR0006, AR0007, AR0009)
    ["Thai Airways", "9.0", "Economy", "False"],
    ["Japan Airlines", "2.5", None, "True"],
    ["Japan Airlines", "8.0", "Economy", "True"],
    ["Japan Airlines", None, "Economy", "False"],
]
WIDTHS = [134, 64, 96, 74]
SERIES = 1  # the highlighted column: Rating
NAN_CELL = (1, 2)  # row 1, Seat Type
ROW_H = 30
X0 = 24

out = []


def text(x, y, s, cls, anchor="start", extra=""):
    out.append(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}"{extra}>{escape(s)}</text>')


def rect(x, y, w, h, cls):
    out.append(f'<rect x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}" class="{cls}"/>')


def line(x1, y1, x2, y2, cls="dg-rule"):
    out.append(f'<line x1="{x1:g}" y1="{y1:g}" x2="{x2:g}" y2="{y2:g}" class="{cls}"/>')


def badge(x, y, n):
    out.append(f'<g class="dg-badge"><circle cx="{x:g}" cy="{y:g}" r="12"/><text x="{x:g}" y="{y + 5:g}" text-anchor="middle">{n}</text></g>')


def columns(first_w):
    xs = [X0 + first_w]
    for w in WIDTHS:
        xs.append(xs[-1] + w)
    return xs  # xs[j] = left edge of column j, xs[-1] = right edge


def cell(xs, j, y, value, cls):
    numeric = j == SERIES
    text(xs[j + 1] - 8 if numeric else xs[j] + 8, y, value, cls, "end" if numeric else "start")


def excel(top):
    """Letters row, then row 1 = column names, rows 2-5 = data. Returns geometry."""
    xs = columns(34)
    right = xs[-1]
    letters_h = 26
    body_top = top + letters_h
    rows = [NAMES] + ROWS
    bottom = body_top + ROW_H * len(rows)
    rect(X0, top, right - X0, letters_h, "dg-xl-head")
    rect(X0, top, 34, bottom - top, "dg-xl-head")
    rect(xs[SERIES], body_top, WIDTHS[SERIES], bottom - body_top, "dg-hl-col")
    rect(xs[SERIES], top, WIDTHS[SERIES], letters_h, "dg-hl-col-strong")
    for k in range(len(rows) + 1):
        line(X0, body_top + ROW_H * k, right, body_top + ROW_H * k)
    line(X0, top, right, top)
    for x in [X0] + xs:
        line(x, top, x, bottom)
    for j, letter in enumerate("ABCD"):
        text(xs[j] + WIDTHS[j] / 2, top + 18, letter, "dg-xl-letter", "middle")
    for k, row in enumerate(rows):
        y = body_top + ROW_H * k + 20
        text(X0 + 17, y, str(k + 1), "dg-xl-num", "middle")
        for j, v in enumerate(row):
            if v is None:
                continue
            if k == 0:
                text(xs[j] + 8, y, v, "dg-xl-name")
            else:
                shown = v.rstrip("0").rstrip(".") if j == SERIES else v.upper() if v in ("True", "False") else v
                cell(xs, j, y, shown, "dg-cell")
    rect(X0 + 1, body_top + ROW_H + 1, right - X0 - 2, ROW_H - 2, "dg-row")  # row 2 = first review
    return xs, body_top, bottom, right


def dataframe(top):
    """Column names as the header, index 0-3, NaN for missing values."""
    xs = columns(38)
    right = xs[-1]
    head_h = 32
    body_top = top + head_h
    bottom = body_top + ROW_H * len(ROWS)
    rect(X0, top, 38, bottom - top, "dg-hl-index")
    rect(xs[SERIES], top, WIDTHS[SERIES], bottom - top, "dg-hl-col")
    line(X0, body_top, right, body_top, "dg-rule dg-rule-strong")
    for k in range(1, len(ROWS) + 1):
        line(X0, body_top + ROW_H * k, right, body_top + ROW_H * k)
    for j, name in enumerate(NAMES):
        text(xs[j + 1] - 8 if j == SERIES else xs[j] + 8, top + 21, name, "dg-col", "end" if j == SERIES else "start")
    for k, row in enumerate(ROWS):
        y = body_top + ROW_H * k + 20
        text(X0 + 19, y, str(k), "dg-index", "middle")
        for j, v in enumerate(row):
            if v is None:
                cell(xs, j, y, "NaN", "dg-nan")
            else:
                cell(xs, j, y, v, "dg-cell")
    rect(X0 + 1, body_top + 1, right - X0 - 2, ROW_H - 2, "dg-row")  # row 0 = first review
    return xs, body_top, bottom, right


out.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" class="diagram" role="img" aria-labelledby="dg-anatomy-title">')
out.append('<title id="dg-anatomy-title">The same four airline reviews as an Excel sheet and as a pandas DataFrame. Markers 1 to 6 show matching parts: the whole table, one column, row labels, a missing value, one row, and the column names.</title>')

# Excel, top
XL_TOP = 44
text(X0, 24, "Excel", "dg-title")
xs, xl_body, xl_bottom, xl_right = excel(XL_TOP)

# arrow: read_csv turns the file into a DataFrame
DF_TOP = 318
ax = X0 + 56
line(ax, xl_bottom + 34, ax, DF_TOP - 44, "dg-arrow")
out.append(f'<path d="M{ax - 7} {DF_TOP - 53} L{ax} {DF_TOP - 43} L{ax + 7} {DF_TOP - 53}" class="dg-arrow"/>')
text(ax + 14, (xl_bottom + 34 + DF_TOP - 44) / 2 + 5, 'pd.read_csv("airline_reviews.csv")', "dg-code")

# pandas, bottom
text(X0, DF_TOP - 16, "pandas DataFrame", "dg-title")
pxs, df_body, df_bottom, df_right = dataframe(DF_TOP)

# markers: same number = same idea in both tables
for right, top, body, bottom, cols, first_row in [
    (xl_right, XL_TOP, xl_body, xl_bottom, xs, 1),
    (df_right, DF_TOP, df_body, df_bottom, pxs, 0),
]:
    badge(right + 20, top + 12, "1")  # the whole table
    badge(cols[SERIES] + WIDTHS[SERIES] / 2, top - 14, "2")  # one column
    badge(X0 + 18, bottom + 18, "3")  # row labels
    r, c = NAN_CELL
    badge(cols[c + 1] - 20, body + ROW_H * (r + first_row) + 15, "4")  # missing value
    badge(right + 20, body + ROW_H * first_row + 15, "5")  # one row
# column names: Excel row 1, pandas header
badge(xl_right + 20, xl_body + 15, "6")
badge(df_right + 20, df_body - 16, "6")

# the key (what 1-6 mean) is a table in the lesson, so it stays readable and translatable
out.append("</svg>")

with open(sys.argv[1], "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")
print("wrote", sys.argv[1])
