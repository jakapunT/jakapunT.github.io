"""Draws the teaching figures of stats-dh lesson 11 (logistic regression) as PNGs in images/.

    course/.venv/bin/python scripts/diagrams/stats_l11_charts.py courses/stats-dh

Charts students draw themselves come from the lesson's own code cells (npm run outputs); this
script draws only the annotated explainers. Data: the course's obesity.csv (Worksheet 4) and the
10-sample threshold example from the lecture slides.
"""

import os
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

course = sys.argv[1] if len(sys.argv) > 1 else "courses/stats-dh"
IMG = os.path.join(course, "images")
os.makedirs(IMG, exist_ok=True)
df = pd.read_csv(os.path.join(course, "data", "obesity.csv"))
df["Obese"] = (df["Label"] == "Obese").astype(int)

INK = "#2a2722"
MUTED = "#6b655c"
RUST = "#a44f2b"   # positive class (Obese, label 1)
BLUE = "#4d7aa8"   # negative class (Not obese, label 0)
GREEN = "#4f8a5f"
plt.rcParams.update({"axes.edgecolor": MUTED, "axes.labelcolor": INK, "xtick.color": MUTED, "ytick.color": MUTED, "font.size": 11})


def save(fig, name, dpi=144):
    fig.savefig(os.path.join(IMG, name), dpi=dpi, bbox_inches="tight", facecolor="white", metadata={"Software": None})
    plt.close(fig)
    print("wrote", name)


def sigmoid(z):
    return 1 / (1 + np.exp(-z))


# the same binary model the lesson fits in L11-S06: Obese (1) or not (0) from Weight alone
model = LogisticRegression().fit(df[["Weight"]], df["Obese"])
b0, b1 = model.intercept_[0], model.coef_[0, 0]
boundary = -b0 / b1
print(f"binary model: b0={b0:.2f} b1={b1:.4f} boundary={boundary:.1f} kg")
grid = np.linspace(0, 130, 400)


def obese_points(ax):
    pos, neg = df[df["Obese"] == 1], df[df["Obese"] == 0]
    ax.scatter(neg["Weight"], neg["Obese"], s=34, marker="s", facecolor="white", edgecolor=BLUE, lw=1.4, label="Not obese (0)", zorder=3)
    ax.scatter(pos["Weight"], pos["Obese"], s=40, marker="o", color=RUST, label="Obese (1)", zorder=3)


# ---------------------------------------------------------------- L11-S04 a line vs an S-curve
slope, intercept = np.polyfit(df["Weight"], df["Obese"], 1)
fig, axes = plt.subplots(1, 2, figsize=(10, 3.2), sharey=True)
for ax in axes:
    ax.axhspan(1, 1.6, color=RUST, alpha=0.07, lw=0)
    ax.axhspan(-0.6, 0, color=RUST, alpha=0.07, lw=0)
    ax.axhline(0, color=MUTED, lw=0.8)
    ax.axhline(1, color=MUTED, lw=0.8)
    obese_points(ax)
    ax.set_xlim(0, 130)
    ax.set_ylim(-0.45, 1.45)
    ax.set_xlabel("Weight (kg)")
    ax.grid(alpha=0.25)
axes[0].plot(grid, intercept + slope * grid, color=INK, lw=2)
axes[0].set_title("Linear regression: a straight line", color=INK, fontsize=12)
top = intercept + slope * 120
axes[0].plot([120], [top], "o", ms=9, mfc="none", mec=INK, mew=1.6, zorder=4)
axes[0].annotate(f"120 kg: only {top:.2f}", (120, top), xytext=(-118, 30), textcoords="offset points", fontsize=10, color=RUST, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.8))
axes[0].text(4, -0.32, "below 0: not a probability", color=RUST, fontsize=10, va="center")
axes[0].set_ylabel("Obese? (0 = no, 1 = yes)")
axes[1].plot(grid, sigmoid(b0 + b1 * grid), color=INK, lw=2)
axes[1].set_title("Logistic regression: an S-curve", color=INK, fontsize=12)
axes[1].text(4, 1.3, "always between 0 and 1", color=GREEN, fontsize=10, va="center")
axes[1].legend(loc="center left", frameon=False, fontsize=10)
print("line at 10 kg:", round(intercept + slope * 10, 2), "at 120 kg:", round(intercept + slope * 120, 2))
fig.tight_layout()
save(fig, "l11-line-vs-s.png")

# ---------------------------------------------------------------- L11-S07 probability → label
fig, ax = plt.subplots(figsize=(8.4, 3.9))
ax.axvspan(boundary, 130, color=RUST, alpha=0.08, lw=0)
ax.axvspan(0, boundary, color=BLUE, alpha=0.06, lw=0)
ax.plot(grid, sigmoid(b0 + b1 * grid), color=INK, lw=2, zorder=2)
obese_points(ax)
ax.axhline(0.5, color=MUTED, lw=1.2, ls="--")
ax.axvline(boundary, color=MUTED, lw=1.2, ls=":")
ax.text(2, 0.46, "threshold 0.5", color=MUTED, fontsize=10, va="top")
ax.text(boundary + 1.2, 0.08, f"{boundary:.1f} kg", color=INK, fontsize=10)
ax.text(boundary / 2, 1.12, "p < 0.5 → predict Not obese", color=BLUE, ha="center", fontsize=11)
ax.text((boundary + 130) / 2, 1.12, "p ≥ 0.5 →\npredict Obese", color=RUST, ha="center", fontsize=11, linespacing=1.1)
for w in (95, 100):
    p = sigmoid(b0 + b1 * w)
    ax.plot([w], [p], marker="o", ms=9, mfc="none", mec=INK, mew=1.6, zorder=4)
    ax.annotate(f"{w} kg: p = {p:.2f}", (w, p), xytext=(-92 if w == 95 else 10, 12 if w == 95 else -16), textcoords="offset points", fontsize=10, color=INK)
ax.set_xlim(0, 130)
ax.set_ylim(-0.08, 1.25)
ax.set_xlabel("Weight (kg)")
ax.set_ylabel("p = P(Obese)")
ax.grid(alpha=0.25)
ax.legend(loc="upper left", bbox_to_anchor=(0.0, 0.86), frameon=False, fontsize=10)
fig.tight_layout()
save(fig, "l11-threshold-weight.png")

# ---------------------------------------------------------------- L11-S08 log loss
p = np.linspace(0.005, 0.995, 300)
fig, ax = plt.subplots(figsize=(7.6, 3.9))
ax.plot(p, -np.log(p), color=RUST, lw=2.2, label="true label = 1:  loss = −log(p)")
ax.plot(p, -np.log(1 - p), color=BLUE, lw=2.2, ls="--", label="true label = 0:  loss = −log(1 − p)")
for x, y, txt, dx, dy in [(0.9, -np.log(0.9), "p = 0.9, right:\nloss 0.105", -30, 40), (0.1, -np.log(0.1), "p = 0.1, wrong:\nloss 2.303", 16, 4)]:
    ax.plot([x], [y], "o", color=RUST, ms=8, zorder=4)
    ax.annotate(txt, (x, y), xytext=(dx, dy), textcoords="offset points", fontsize=10, color=INK, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.8))
ax.set_xlabel("predicted probability of class 1 (p)")
ax.set_ylabel("loss")
ax.set_ylim(0, 4.2)
ax.set_xlim(0, 1)
ax.grid(alpha=0.25)
ax.legend(frameon=False, fontsize=10, loc="upper center")
fig.tight_layout()
save(fig, "l11-logloss.png")

# ---------------------------------------------------------------- L11-S17 one model, three thresholds
labels = np.array([1, 1, 1, 1, 1, 0, 0, 0, 0, 0])
probs = np.array([0.95, 0.85, 0.70, 0.55, 0.40, 0.60, 0.45, 0.30, 0.20, 0.10])
fig, axes = plt.subplots(3, 1, figsize=(8.8, 4.6), sharex=True)
for ax, t in zip(axes, (0.3, 0.5, 0.7)):
    pred = probs >= t
    tp, fn = int(((labels == 1) & pred).sum()), int(((labels == 1) & ~pred).sum())
    fp, tn = int(((labels == 0) & pred).sum()), int(((labels == 0) & ~pred).sum())
    ax.axvspan(t, 1.02, color=RUST, alpha=0.09, lw=0)
    ax.axvline(t, color=INK, lw=1.6)
    pos, neg = labels == 1, labels == 0
    ax.scatter(probs[neg], np.zeros(neg.sum()), s=90, marker="s", facecolor="white", edgecolor=BLUE, lw=1.6, zorder=3)
    ax.scatter(probs[pos], np.zeros(pos.sum()), s=100, marker="o", color=RUST, zorder=3)
    ax.text(t + 0.008, 0.62, f"threshold {t}", fontsize=10, color=INK, va="center")
    ax.text(1.05, 0, f"TP {tp}  FN {fn}\nFP {fp}  TN {tn}", fontsize=10.5, color=INK, va="center", family="monospace", linespacing=1.3)
    ax.set_ylim(-0.7, 1)
    ax.set_yticks([])
    for side in ("left", "right", "top"):
        ax.spines[side].set_visible(False)
    print(f"t={t}: TP {tp} FN {fn} FP {fp} TN {tn}")
axes[-1].set_xlim(-0.02, 1.02)
axes[-1].set_xlabel("predicted probability (score)")
handles = [
    plt.Line2D([], [], marker="o", color=RUST, ls="none", ms=9, label="actually positive (1)"),
    plt.Line2D([], [], marker="s", mfc="white", mec=BLUE, mew=1.6, ls="none", ms=9, label="actually negative (0)"),
    plt.Rectangle((0, 0), 1, 1, color=RUST, alpha=0.15, label="predicted positive (score ≥ threshold)"),
]
fig.legend(handles=handles, loc="upper center", ncol=3, frameon=False, fontsize=10, bbox_to_anchor=(0.5, 1.04))
fig.tight_layout()
save(fig, "l11-thresholds.png")
