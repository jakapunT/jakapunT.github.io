"""Draws the teaching figures of lesson 11 (visualization) as PNGs in images/.

    course/.venv/bin/python scripts/diagrams/l11_charts.py courses/nlp-basic

Charts that students make themselves come from the lesson's own code cells (npm run outputs);
this script only draws what a code cell can't show plainly: annotated anatomy pictures, the
chart gallery thumbnails and the bad-vs-good pairs. All data is the course's airline_reviews.csv,
except Anscombe's quartet (L11-S01), which is a classic public example.
"""

import os
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

course = sys.argv[1] if len(sys.argv) > 1 else "courses/nlp-basic"
IMG = os.path.join(course, "images")
reviews = pd.read_csv(os.path.join(course, "data", "airline_reviews.csv"))
SEATS = ["Economy", "Premium Economy", "Business", "First"]

INK = "#2a2722"
MUTED = "#6b655c"
RUST = "#a44f2b"
BLUE = sns.color_palette()[0]


def save(fig, name, dpi=144):
    fig.savefig(os.path.join(IMG, name), dpi=dpi, bbox_inches="tight", facecolor="white", metadata={"Software": None})
    plt.close(fig)
    print("wrote", name)


def marker(ax, x, y, n, coords="data"):
    """A numbered rust circle, like the numbers in the L10 anatomy figure."""
    ax.annotate(
        str(n), (x, y), xycoords=coords, ha="center", va="center", fontsize=11, fontweight="bold", color="white",
        bbox=dict(boxstyle="circle,pad=0.25", fc=RUST, ec="none"), annotation_clip=False, zorder=10,
    )


# ---------------------------------------------------------------- L11-S01 Anscombe's quartet
x = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5]
anscombe = {
    "I": (x, [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68]),
    "II": (x, [9.14, 8.14, 8.74, 8.77, 9.26, 8.10, 6.13, 3.10, 9.13, 7.26, 4.74]),
    "III": (x, [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73]),
    "IV": ([8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8], [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.50, 5.56, 7.91, 6.89]),
}
fig, axes = plt.subplots(2, 2, figsize=(7.2, 5.2), sharex=True, sharey=True)
for ax, (name, (xs, ys)) in zip(axes.flat, anscombe.items()):
    xs, ys = np.array(xs), np.array(ys)
    ax.scatter(xs, ys, color=BLUE, s=36, zorder=3)
    b, a = np.polyfit(xs, ys, 1)
    grid = np.array([3, 20])
    ax.plot(grid, a + b * grid, color=RUST, lw=1.6, zorder=2)
    ax.set_title(f"Dataset {name}", fontsize=12, color=INK)
    ax.grid(alpha=0.3)
    print(name, round(xs.mean(), 2), round(ys.mean(), 2), round(ys.std(ddof=1), 2), round(np.corrcoef(xs, ys)[0, 1], 3))
for ax in axes[1]:
    ax.set_xlabel("x")
for ax in axes[:, 0]:
    ax.set_ylabel("y")
fig.tight_layout()
save(fig, "l11-anscombe.png")

# ---------------------------------------------------------------- L11-S05 anatomy of a chart
fig, ax = plt.subplots(figsize=(7.2, 4.4))
sns.countplot(data=reviews, x="Seat Type", hue="Recommended", order=SEATS, ax=ax)
ax.set_title("Reviews per seat type")
ax.set_xlabel("Seat type")
ax.set_ylabel("Number of reviews")
fig.tight_layout()
fig.canvas.draw()
AF = "axes fraction"
marker(ax, 0.33, 1.045, 1, AF)  # title
marker(ax, 0.42, -0.165, 2, AF)  # x-axis label
marker(ax, 3.32, -0.042, 3, ("data", AF))  # x tick labels
marker(ax, -0.078, 0.76, 4, AF)  # y-axis label
marker(ax, -0.04, 1.045, 5, AF)  # y tick labels
marker(ax, 0.77, 0.9, 6, AF)  # legend
marker(ax, -0.2, 62, 7)  # a bar = the data
save(fig, "l11-anatomy.png")

# ---------------------------------------------------------------- L11-S06 gallery thumbnails
def thumb(name, draw):
    fig, ax = plt.subplots(figsize=(3.4, 2.3))
    draw(ax)
    ax.set_title("")
    ax.tick_params(labelsize=8)
    ax.xaxis.label.set_size(9)
    ax.yaxis.label.set_size(9)
    leg = ax.get_legend()
    if leg:
        leg.remove()
    fig.tight_layout()
    save(fig, name, dpi=120)


short = {"Premium Economy": "Prem."}
seat_short = reviews.assign(**{"Seat Type": reviews["Seat Type"].replace(short)})
SEATS_SHORT = ["Economy", "Prem.", "Business", "First"]
thumb("l11-g-count.png", lambda ax: sns.countplot(data=seat_short, x="Seat Type", order=SEATS_SHORT, ax=ax))
thumb(
    "l11-g-bar.png",
    lambda ax: sns.barplot(data=seat_short, x="Seat Type", y="Rating", order=SEATS_SHORT, errorbar=None, ax=ax),
)
thumb("l11-g-hist.png", lambda ax: sns.histplot(data=reviews, x="Ticket Price (USD)", bins=20, ax=ax))
thumb("l11-g-kde.png", lambda ax: sns.kdeplot(data=reviews, x="Rating", hue="Recommended", fill=True, ax=ax))
thumb(
    "l11-g-box.png",
    lambda ax: sns.boxplot(data=seat_short, x="Seat Type", y="Ticket Price (USD)", order=SEATS_SHORT, ax=ax),
)
thumb(
    "l11-g-scatter.png",
    lambda ax: sns.scatterplot(data=reviews, x="Flight Duration (hours)", y="Ticket Price (USD)", s=14, ax=ax),
)
years = pd.to_datetime(reviews["Date Flown"]).dt.year.value_counts().sort_index()
per_year = pd.DataFrame({"Year": years.index.astype(int), "Reviews": years.values})
thumb("l11-g-line.png", lambda ax: sns.lineplot(data=per_year, x="Year", y="Reviews", marker="o", ax=ax))

# ---------------------------------------------------------------- L11-S09 histogram by hand
small = pd.read_csv(os.path.join(course, "data", "reviews_small.csv"))
ratings = small["Rating"].dropna().tolist()  # 9.0 2.5 8.0 6.5 7.0 4.0 4.5 (one NaN)
edges = [0, 2, 4, 6, 8, 10]
fig, ax = plt.subplots(figsize=(6.4, 3.6))
for lo, hi in zip(edges[:-1], edges[1:]):
    inside = [r for r in ratings if lo <= r < hi or (hi == 10 and r == 10)]
    for k, r in enumerate(sorted(inside)):
        ax.add_patch(plt.Rectangle((lo + 0.06, k), 1.88, 0.94, fc=BLUE, ec="white", lw=1.5, alpha=0.9))
        ax.text(lo + 1, k + 0.47, f"{r:.1f}", ha="center", va="center", color="white", fontsize=12, fontweight="bold")
    ax.text(lo + 1, len(inside) + 0.15, f"{len(inside)}", ha="center", va="bottom", color=RUST, fontsize=12, fontweight="bold")
ax.set_xlim(0, 10)
ax.set_ylim(0, 3.2)
ax.set_xticks(edges)
ax.set_yticks([0, 1, 2, 3])
ax.set_xlabel("Rating (bins of width 2)")
ax.set_ylabel("Count")
ax.set_title("7 ratings → 5 bins")
ax.grid(axis="y", alpha=0.3)
fig.tight_layout()
save(fig, "l11-hist-by-hand.png")

# bin width changes the picture
for bins in (5, 60):
    fig, ax = plt.subplots(figsize=(3.6, 2.4))
    sns.histplot(data=reviews, x="Ticket Price (USD)", bins=bins, ax=ax)
    ax.set_title(f"bins={bins}", fontsize=10)
    ax.tick_params(labelsize=8)
    ax.xaxis.label.set_size(9)
    ax.yaxis.label.set_size(9)
    fig.tight_layout()
    save(fig, f"l11-bins-{bins}.png", dpi=120)

# ---------------------------------------------------------------- L11-S11 box plot anatomy
thai = reviews.loc[reviews["Airline Name"] == "Thai Airways", "Rating"].dropna()
q1, med, q3 = thai.quantile([0.25, 0.5, 0.75])
iqr = q3 - q1
inner = thai[(thai >= q1 - 1.5 * iqr) & (thai <= q3 + 1.5 * iqr)]
print("Thai Airways ratings:", len(thai), "Q1", q1, "median", med, "Q3", q3, "whiskers", inner.min(), inner.max(),
      "outliers", sorted(thai[~thai.index.isin(inner.index)]))
fig, ax = plt.subplots(figsize=(7.2, 3.0))
sns.boxplot(x=thai, ax=ax, width=0.45, color=sns.color_palette()[0], flierprops=dict(markerfacecolor=RUST, markeredgecolor=RUST))
rng = np.random.default_rng(3)
ax.scatter(thai, 0.42 + rng.uniform(-0.04, 0.04, len(thai)), s=14, color=MUTED, alpha=0.7, zorder=3)
ax.text(2.0, 0.42, "every rating", va="center", fontsize=9, color=MUTED)
labels = [
    (thai.min(), "outlier\n" + f"{thai.min():g}", RUST),
    (inner.min(), f"lowest\n(not outlier)\n{inner.min():g}", INK),
    (q1, f"Q1\n{q1:g}", INK),
    (med, f"median\n{med:g}", RUST),
    (q3, f"Q3\n{q3:g}", INK),
    (inner.max(), f"highest\n(not outlier)\n{inner.max():g}", INK),
    (thai.max(), "outlier\n" + f"{thai.max():g}", RUST),
]
shift = {inner.max(): -0.45, thai.max(): 0.3}  # the two right labels sit close together
for xv, text, color in labels:
    ax.annotate(text, (xv, -0.24), xytext=(xv + shift.get(xv, 0), -0.62), ha="center", va="top", fontsize=9, color=color,
                arrowprops=dict(arrowstyle="-", color=color, lw=0.8))
ax.annotate("", (q1, 0.3), xytext=(q3, 0.3), arrowprops=dict(arrowstyle="<->", color=INK, lw=1))
ax.text((q1 + q3) / 2, 0.33, "middle 50%", ha="center", va="top", fontsize=9, color=INK)
ax.set_ylim(0.62, -0.62)
ax.set_yticks([])
ax.set_xlim(0.5, 10.8)
ax.set_xlabel("Rating (Thai Airways, 24 reviews)")
for side in ("left", "right", "top"):
    ax.spines[side].set_visible(False)
fig.tight_layout()
save(fig, "l11-box-anatomy.png")

# ---------------------------------------------------------------- L11-S15/S16 bad vs good
airline_n = reviews["Airline Name"].value_counts()


def pair_ax(figsize=(4.2, 2.9)):
    fig, ax = plt.subplots(figsize=figsize)
    return fig, ax


# 1. pie with 10 slices and no values  vs  sorted bars with values
fig, ax = pair_ax()
ax.pie(airline_n.values, startangle=90, counterclock=False)
ax.set_title("Reviews per airline", fontsize=10)
save(fig, "l11-bad-pie.png", dpi=120)

fig, ax = pair_ax()
order = airline_n.index
sns.barplot(x=airline_n.values, y=order, color=BLUE, ax=ax)
ax.bar_label(ax.containers[0], fontsize=7, padding=2)
ax.set_title("Reviews per airline", fontsize=10)
ax.set_xlabel("Number of reviews", fontsize=8)
ax.tick_params(labelsize=7)
fig.tight_layout()
save(fig, "l11-good-bar.png", dpi=120)

# 2. a different colour for every bar  vs  one colour, highlight only what matters
means = reviews.groupby("Airline Name")["Rating"].mean().sort_values(ascending=False)
fig, ax = pair_ax()
sns.barplot(x=means.values, y=means.index, hue=means.index, palette="hls", legend=False, ax=ax)
ax.set_title("Mean rating per airline", fontsize=10)
ax.set_xlabel("Mean rating", fontsize=8)
ax.set_ylabel("")
ax.tick_params(labelsize=7)
fig.tight_layout()
save(fig, "l11-bad-colors.png", dpi=120)

fig, ax = pair_ax()
colors = [RUST if a == "Thai Airways" else "#c9c3b8" for a in means.index]
sns.barplot(x=means.values, y=means.index, hue=means.index, palette=colors, legend=False, ax=ax)
ax.set_title("Thai Airways: 3rd of 10 airlines", fontsize=10)
ax.set_xlabel("Mean rating", fontsize=8)
ax.set_ylabel("")
ax.tick_params(labelsize=7)
fig.tight_layout()
save(fig, "l11-good-colors.png", dpi=120)

# 3. axis that does not start at zero  vs  axis from zero
two = means.loc[["Cathay Pacific", "Japan Airlines"]]
print("axis pair:", two.round(2).to_dict())
for name, bottom in (("l11-bad-axis.png", 6.0), ("l11-good-axis.png", 0)):
    fig, ax = pair_ax((3.6, 2.9))
    ax.bar(["Cathay Pacific", "Japan Airlines"], two.values, color=BLUE, width=0.55)
    ax.set_ylim(bottom, 10 if bottom == 0 else 7.4)
    ax.bar_label(ax.containers[0], fmt="%.2f", fontsize=8, padding=2)
    ax.set_ylabel("Mean rating", fontsize=8)
    ax.set_title(f"y-axis starts at {bottom:g}", fontsize=10)
    ax.tick_params(labelsize=8)
    fig.tight_layout()
    save(fig, name, dpi=120)

# 4. only part of the years  vs  all of them
for name, data, title in (
    ("l11-bad-scope.png", per_year[per_year["Year"] <= 2021], "Reviews per year, 2019-2021"),
    ("l11-good-scope.png", per_year, "Reviews per year, 2019-2026"),
):
    fig, ax = pair_ax((4.0, 2.7))
    sns.lineplot(data=data, x="Year", y="Reviews", marker="o", ax=ax)
    ax.set_ylim(0, 35)
    ax.set_xticks(data["Year"])
    ax.set_title(title, fontsize=10)
    ax.tick_params(labelsize=8)
    ax.xaxis.label.set_size(9)
    ax.yaxis.label.set_size(9)
    fig.tight_layout()
    save(fig, name, dpi=120)
print(per_year.to_string(index=False))

# ---------------------------------------------------------------- L11-S03 one small chart per EDA goal
price = reviews["Ticket Price (USD)"]


def eda(name, draw):
    fig, ax = plt.subplots(figsize=(3.4, 2.3))
    draw(ax)
    ax.tick_params(labelsize=8)
    ax.xaxis.label.set_size(9)
    ax.yaxis.label.set_size(9)
    fig.tight_layout()
    save(fig, name, dpi=120)


def eda_distribution(ax):
    sns.histplot(x=price, bins=20, ax=ax)
    ax.axvspan(0, 500, color=RUST, alpha=0.12, zorder=0)
    ax.text(520, ax.get_ylim()[1] * 0.8, "most tickets\nunder $500", fontsize=8, color=RUST)


def eda_relationship(ax):
    sns.scatterplot(data=reviews, x="Flight Duration (hours)", y="Ticket Price (USD)", s=12, ax=ax)


def eda_anomaly(ax):
    rng = np.random.default_rng(1)
    p = price.dropna()
    top = p.idxmax()
    ys = rng.uniform(-0.3, 0.3, len(p))
    ax.scatter(p, ys, s=10, color=BLUE, alpha=0.6)
    ax.scatter([p[top]], [0], s=40, color=RUST, zorder=3)
    ax.annotate(f"${p[top]:,.2f}", (p[top], 0), xytext=(p[top] - 900, 0.55), fontsize=8, color=RUST,
                arrowprops=dict(arrowstyle="-", color=RUST, lw=0.8))
    ax.set_ylim(-0.8, 0.9)
    ax.set_yticks([])
    ax.set_xlabel("Ticket Price (USD)")


def eda_assumption(ax):
    sns.histplot(x=price, bins=20, ax=ax)
    for v, label, color, y in ((price.median(), "median", INK, 0.85), (price.mean(), "mean", RUST, 0.5)):
        ax.axvline(v, color=color, lw=1.4, ls="--")
        ax.text(v + 60, ax.get_ylim()[1] * y, f"{label}\n${v:,.0f}", fontsize=8, color=color)


def eda_feature(ax):
    words = reviews["Review"].str.split().str.len()
    sns.regplot(x=words, y=reviews["Rating"], scatter_kws=dict(s=10), line_kws=dict(color=RUST), ax=ax)
    ax.set_xlabel("Words in the review")


eda("l11-eda-distribution.png", eda_distribution)
eda("l11-eda-relationship.png", eda_relationship)
eda("l11-eda-anomaly.png", eda_anomaly)
eda("l11-eda-assumption.png", eda_assumption)
eda("l11-eda-feature.png", eda_feature)
print("price mean", round(price.mean(), 2), "median", round(price.median(), 2))

# ---------------------------------------------------------------- L11-S10 ECDF by hand (5 prices)
five = sorted(reviews["Ticket Price (USD)"].head(5))  # AR0001-AR0005
fig, ax = plt.subplots(figsize=(7.2, 3.6))
xs = [0] + five + [500]
ys = [0] + [(k + 1) / 5 for k in range(5)] + [1]
ax.step(xs, ys, where="post", color=BLUE, lw=2)
for k, v in enumerate(five):
    ax.plot(v, (k + 1) / 5, "o", color=BLUE, zorder=3)
    ax.annotate(f"${v:,.2f}\n{k + 1} of 5 = {(k + 1) / 5:.1f}", (v, (k + 1) / 5), xytext=(6, -26 if k < 4 else -30),
                textcoords="offset points", fontsize=8, color=INK)
ax.axvline(150, color=RUST, ls="--", lw=1)
ax.axhline(0.6, xmax=150 / 500, color=RUST, ls="--", lw=1)
ax.text(152, 0.08, "$150", color=RUST, fontsize=9)
ax.text(8, 0.63, "0.6 = 3 of 5 tickets cost $150 or less", color=RUST, fontsize=9)
ax.set_xlim(0, 500)
ax.set_ylim(0, 1.08)
ax.set_xlabel("Ticket Price (USD)")
ax.set_ylabel("Share of tickets at or below x")
ax.set_title("Sorted: every ticket adds one step of 1/5")
ax.grid(alpha=0.3)
fig.tight_layout()
save(fig, "l11-ecdf-by-hand.png")

# ---------------------------------------------------------------- L11-S11 box plot by hand (9 ratings)
nine = sorted([9.0, 7.5, 7.5, 6.0, 7.0, 1.5, 7.0, 6.5, 6.5])  # Thai Airways: AR0005 AR0016 AR0017 AR0019 AR0051 AR0091 AR0101 AR0106 AR0140
s9 = pd.Series(nine)
q1, med, q3 = s9.quantile([0.25, 0.5, 0.75])
iqr = q3 - q1
low_fence, high_fence = q1 - 1.5 * iqr, q3 + 1.5 * iqr
inside = s9[(s9 >= low_fence) & (s9 <= high_fence)]
print("nine:", nine, "Q1", q1, "median", med, "Q3", q3, "fences", low_fence, high_fence, "whiskers", inside.min(), inside.max())
fig, ax = plt.subplots(figsize=(7.6, 3.5))
chip_x = [1.0 + i * 1.05 for i in range(9)]
role = {0: ("outlier", RUST), 1: ("lowest\n(not outlier)", INK), 2: ("Q1", BLUE), 4: ("median", RUST), 6: ("Q3", BLUE), 8: ("highest", INK)}
targets = {0: nine[0], 1: inside.min(), 2: q1, 4: med, 6: q3, 8: inside.max()}
for i, (x, v) in enumerate(zip(chip_x, nine)):
    strong = i in role
    color = role[i][1] if strong else "#c9c3b8"
    ax.add_patch(plt.Rectangle((x - 0.45, 2.0), 0.9, 0.55, fc=color if strong else "white", ec=color, lw=1.5))
    ax.text(x, 2.275, f"{v:.1f}", ha="center", va="center", fontsize=11, fontweight="bold", color="white" if strong else MUTED)
    ax.text(x, 2.7, f"{i + 1}", ha="center", va="bottom", fontsize=9, color=MUTED)
    if strong:
        ax.annotate("", (targets[i], 0.42), xytext=(x, 1.98), arrowprops=dict(arrowstyle="->", color=color, lw=1))
ax.text(0.4, 2.7, "position", ha="right", va="bottom", fontsize=9, color=MUTED)
# the box plot drawn on the number line
ax.add_patch(plt.Rectangle((q1, 0.0), q3 - q1, 0.4, fc=BLUE, ec=INK, alpha=0.85))
ax.plot([med, med], [0, 0.4], color="white", lw=2.5)
ax.plot([inside.min(), q1], [0.2, 0.2], color=INK, lw=1.2)
ax.plot([q3, inside.max()], [0.2, 0.2], color=INK, lw=1.2)
for w in (inside.min(), inside.max()):
    ax.plot([w, w], [0.08, 0.32], color=INK, lw=1.2)
ax.plot(nine[0], 0.2, "o", color=RUST, ms=8)
for v, label, color, y in ((q1, "Q1", BLUE, -0.12), (med, "median", RUST, -0.55), (q3, "Q3", BLUE, -0.12)):
    ax.text(v, y, f"{label}\n{v:.1f}", ha="center", va="top", fontsize=9, color=color)
ax.text(inside.min(), -0.12, f"{inside.min():.1f}", ha="center", va="top", fontsize=9, color=INK)
ax.text(inside.max(), -0.12, f"{inside.max():.1f}", ha="center", va="top", fontsize=9, color=INK)
ax.text(nine[0], -0.12, f"outlier\n{nine[0]:.1f}", ha="center", va="top", fontsize=9, color=RUST)
ax.set_xlim(-0.9, 10.6)
ax.set_ylim(-1.05, 3.1)
ax.set_yticks([])
ax.set_xticks(range(0, 11))
ax.spines["bottom"].set_bounds(0, 10.6)
ax.set_xlabel("Rating")
for side in ("left", "right", "top"):
    ax.spines[side].set_visible(False)
ax.text(10.55, 2.275, "sorted", ha="right", va="center", fontsize=9, color=MUTED, rotation=90)
fig.tight_layout()
save(fig, "l11-box-by-hand.png")
