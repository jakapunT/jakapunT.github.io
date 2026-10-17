"""Draws the teaching figures of stats-dh lesson 10 (model tuning) as PNGs in images/.

    course/.venv/bin/python scripts/diagrams/stats_l10_charts.py courses/stats-dh

Explainers only (no course data): the train / validation / test split, and grid search vs random
search when one hyperparameter matters and the other doesn't (after Bergstra & Bengio, 2012).
"""

import os
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

course = sys.argv[1] if len(sys.argv) > 1 else "courses/stats-dh"
IMG = os.path.join(course, "images")
os.makedirs(IMG, exist_ok=True)

INK = "#2a2722"
MUTED = "#6b655c"
RUST = "#a44f2b"
BLUE = "#4d7aa8"
GREEN = "#4f8a5f"
AMBER = "#c08a2e"
plt.rcParams.update({"axes.edgecolor": MUTED, "axes.labelcolor": INK, "xtick.color": MUTED, "ytick.color": MUTED, "font.size": 11})


def save(fig, name, dpi=144):
    fig.savefig(os.path.join(IMG, name), dpi=dpi, bbox_inches="tight", facecolor="white", metadata={"Software": None})
    plt.close(fig)
    print("wrote", name)


# ---------------------------------------------------------------- L10-S08 train / validation / test
from matplotlib.colors import to_rgba

fig, ax = plt.subplots(figsize=(9.4, 2.3))
parts = [("Training", "60%", 0, 58, GREEN, "fit the model:\nlearns the β"), ("Validation", "20%", 60, 19, AMBER, "compare settings:\npick features, α"), ("Test", "20%", 81, 19, RUST, "one final check:\nnever used to choose")]
for label, share, start, width, color, note in parts:
    ax.add_patch(plt.Rectangle((start, -0.35), width, 0.7, fc=to_rgba(color, 0.18), ec=color, lw=1.8))
    ax.text(start + width / 2, 0.08, label, ha="center", va="center", fontsize=12, color=INK, fontweight="bold")
    ax.text(start + width / 2, -0.17, share, ha="center", va="center", fontsize=10.5, color=INK)
    ax.text(start + width / 2, -0.5, note, ha="center", va="top", fontsize=10, color=MUTED, linespacing=1.25)
ax.annotate("", xy=(69, 0.4), xytext=(29, 0.4), arrowprops=dict(arrowstyle="<->", color=INK, lw=1.2, connectionstyle="arc3,rad=-0.18"))
ax.text(49, 1.02, "try a setting on training, score it on validation, repeat", ha="center", fontsize=10, color=INK)
ax.set_xlim(-1, 101)
ax.set_ylim(-1.2, 1.18)
ax.axis("off")
save(fig, "l10-split.png")

# ---------------------------------------------------------------- L10-S09 grid vs random search
rng = np.random.default_rng(7)
f = lambda x: np.exp(-((x - 0.62) ** 2) / 0.012)  # accuracy depends on the important parameter only
xs = np.linspace(0, 1, 300)
grid = [(x, y) for x in (0.2, 0.5, 0.8) for y in (0.2, 0.5, 0.8)]
rand = list(zip(rng.uniform(0.05, 0.95, 9), rng.uniform(0.05, 0.95, 9)))
fig, axes = plt.subplots(1, 2, figsize=(9.6, 4.4))
for ax, pts, title in [(axes[0], grid, "Grid search: 9 tries, 3 values"), (axes[1], rand, "Random search: 9 tries, 9 values")]:
    ax.set_xlim(0, 1)
    ax.set_ylim(-0.02, 1.32)
    ax.add_patch(plt.Rectangle((0, 0), 1, 1, fill=False, ec=MUTED, lw=1))
    ax.fill_between(xs, 1.04, 1.04 + 0.26 * f(xs), color=GREEN, alpha=0.25, lw=0)
    ax.plot(xs, 1.04 + 0.26 * f(xs), color=GREEN, lw=1.6)
    ax.text(0.02, 1.26, "model score", fontsize=10, color=GREEN)
    best = max(pts, key=lambda p: f(p[0]))
    for x, y in pts:
        ax.plot(x, y, "o", ms=10, color=BLUE if (x, y) != best else RUST, zorder=3)
        ax.plot([x, x], [y, 1.04], color=MUTED, lw=0.6, ls=":", zorder=1)
    ax.plot(best[0], 1.04 + 0.26 * f(best[0]), "v", color=RUST, ms=8)
    ax.set_title(title, fontsize=12, color=INK)
    ax.set_xticks([])
    ax.set_yticks([])
    for side in ("top", "right", "left", "bottom"):
        ax.spines[side].set_visible(False)
    ax.set_xlabel("important parameter (e.g. α)", fontsize=10.5)
    ax.set_ylabel("unimportant parameter", fontsize=10.5)
    print(title, "best score", round(f(best[0]), 2))
fig.tight_layout()
save(fig, "l10-grid-random.png")

# ---------------------------------------------------------------- L10-S01 under / good / overfit
# Illustration (made-up points around a curve): a model that is too simple, about right, too flexible.
rng = np.random.default_rng(3)
x = np.linspace(0.04, 0.96, 12) + rng.uniform(-0.015, 0.015, 12)
y = np.sin(2 * np.pi * x) + rng.normal(0, 0.22, x.size)
grid = np.linspace(0, 1, 300)
for name, deg, color in [("l10-fit-under.png", 1, RUST), ("l10-fit-good.png", 3, GREEN), ("l10-fit-over.png", 11, RUST)]:
    coef = np.polyfit(x, y, deg)
    fig, ax = plt.subplots(figsize=(3.2, 2.2))
    ax.scatter(x, y, s=22, color=BLUE, zorder=3)
    ax.plot(grid, np.clip(np.polyval(coef, grid), -2.2, 2.2), color=color, lw=2.2)
    ax.set_ylim(-2, 2)
    ax.set_xticks([])
    ax.set_yticks([])
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    fig.tight_layout()
    save(fig, name)
