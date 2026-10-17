"""Makes the three mock practice tables for the lesson 11 "choose the chart" exercises
(L11-S24 to S26). They copy the shape of the datasets in the original slides (calories burned,
AI-stance posts, car sales) but every value is generated here, with a fixed seed.

    course/.venv/bin/python scripts/diagrams/l11_practice_data.py courses/nlp-basic
"""

import os
import sys

import numpy as np
import pandas as pd

course = sys.argv[1] if len(sys.argv) > 1 else "courses/nlp-basic"
DATA = os.path.join(course, "data")
rng = np.random.default_rng(11)

# ---------------------------------------------------------------- workout: one row = one session
n = 150
gender = rng.choice(["female", "male"], n, p=[0.53, 0.47])
age = np.clip(np.round(rng.gamma(4.0, 7.0, n) + 18), 18, 79).astype(int)
duration = rng.integers(3, 31, n)
heart = np.clip(np.round(80 + duration * 1.1 + rng.normal(0, 6, n)), 75, 128).astype(int)
factor = np.where(gender == "male", 7.2, 6.0)
calories = np.clip(np.round(duration * factor + (heart - 95) * 0.9 + rng.normal(0, 14, n)), 5, None).astype(int)
workout = pd.DataFrame({
    "session_id": [f"W{i:03d}" for i in range(1, n + 1)],
    "gender": gender,
    "age": age,
    "duration_min": duration,
    "heart_rate": heart,
    "calories": calories,
})
workout.to_csv(os.path.join(DATA, "l11_workout.csv"), index=False)

# ---------------------------------------------------------------- posts: one row = one social post about AI
langs = ["Thai"] * 90 + ["English"] * 55 + ["Mixed"] * 35
rng.shuffle(langs)
stance_p = {  # each language leans a different way
    "Thai": [0.42, 0.23, 0.17, 0.18],
    "English": [0.25, 0.42, 0.18, 0.15],
    "Mixed": [0.31, 0.26, 0.29, 0.14],
}
stances = ["SUPPORTIVE", "CRITICAL", "MIXED", "NEUTRAL_UNCLEAR"]
stance = [rng.choice(stances, p=stance_p[l]) for l in langs]
words_mean = {"SUPPORTIVE": 34, "CRITICAL": 58, "MIXED": 49, "NEUTRAL_UNCLEAR": 22}
n_words = [max(5, int(rng.normal(words_mean[s], 12))) for s in stance]
days = pd.date_range("2026-03-01", "2026-03-21")
weights = np.ones(len(days))
weights[[9, 10, 11]] = [3.5, 5.0, 2.5]  # a news story on 10-12 March
weights /= weights.sum()
posted = np.sort(rng.choice(days, len(langs), p=weights))
posts = pd.DataFrame({
    "post_id": [f"P{i:03d}" for i in range(1, len(langs) + 1)],
    "user_alias": [f"user{u:02d}" for u in rng.integers(1, 13, len(langs))],
    "posted_at": pd.to_datetime(posted).strftime("%Y-%m-%d"),
    "language": langs,
    "stance": stance,
    "n_words": n_words,
})
posts.to_csv(os.path.join(DATA, "l11_posts.csv"), index=False)

# ---------------------------------------------------------------- cars: one row = one car sold
n = 160
makes = rng.choice(["Toyota", "Honda", "Nissan", "Ford", "BMW"], n, p=[0.32, 0.24, 0.17, 0.15, 0.12])
body = np.array([rng.choice(["Sedan", "SUV", "Pickup"], p=[0.35, 0.4, 0.25] if m in ("Toyota", "Ford", "Nissan") else [0.55, 0.45, 0.0]) for m in makes])
year = rng.integers(2014, 2024, n)
odometer = np.clip(np.round((2025 - year) * rng.normal(14000, 3500, n) + rng.normal(0, 6000, n), -2), 2000, None).astype(int)
base = {"Toyota": 21000, "Honda": 20000, "Nissan": 17000, "Ford": 22000, "BMW": 36000}
body_add = {"Sedan": 0, "SUV": 4500, "Pickup": 6000}
price = [
    base[m] + body_add[b] - 0.11 * o + (y - 2014) * 600 + rng.normal(0, 2500)
    for m, b, o, y in zip(makes, body, odometer, year)
]
cars = pd.DataFrame({
    "car_id": [f"C{i:03d}" for i in range(1, n + 1)],
    "make": makes,
    "body": body,
    "year": year,
    "odometer_km": odometer,
    "selling_price": np.round(np.clip(price, 3000, None), -1).astype(int),
})
cars.to_csv(os.path.join(DATA, "l11_cars.csv"), index=False)

for name, df in (("workout", workout), ("posts", posts), ("cars", cars)):
    print(f"\n{name}: {df.shape}")
    print(df.head(6).to_string())
