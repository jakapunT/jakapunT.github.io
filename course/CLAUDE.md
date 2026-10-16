# Course pages: build brief

This folder (`course/`) turns lecture Markdown into password-protected lecture pages for
**jakapunt.github.io**. Read this whole file before writing code. The design was settled in a
long session; follow it rather than re-deciding. Ask before changing anything marked **Decided**.

Owner: อ.ดร.จักรพันธ์ เตไชยา (Jakapun Tachaiya), Linguistics / Language and Information Technology,
Chulalongkorn University. Courses: Python, pandas, scikit-learn, matplotlib, statistics for
digital humanities and NLP. Students are humanities majors, many new to programming.

---

## 1. Goal

- Stop rebuilding Google Slides every week. One Markdown file per lecture is the only thing the
  teacher edits.
- The same file produces **two views of one page**:
  - **Page view** for reading and review (scrolls, full explanations).
  - **Focus mode** for teaching on a projector (one idea per frame, step-by-step reveal).
- Pages are **static**, hosted on the existing GitHub Pages site, and **encrypted with one fixed
  password per course** (StatiCrypt). Nothing readable is ever committed.

## 2. Where things live (Decided)

```
jakapunt.github.io/                 existing Vite + React site, deployed by .github/workflows/deploy.yml
├── src/ ...                        do not touch the existing site except to add a link to courses
├── public/courses/<course>/        ENCRYPTED output only, committed, shipped by the existing deploy
│   ├── index.html                  course home (encrypted)
│   └── week05.html                 one encrypted file per lecture
└── course/                         this tool (own package.json, separate from the site)
    ├── CLAUDE.md                   this file
    ├── tokens.css                  design tokens (source of truth for colors/type)
    ├── reference/                  static HTML exports of the approved designs (visual spec)
    ├── courses/<course>/           SOURCE, gitignored, backed up outside git (Google Drive)
    │   ├── course.yml              course settings (title, env, password var name)
    │   ├── week05.md
    │   ├── data/*.csv              dataframe sources
    │   ├── images/*.png            figures and plot images
    │   └── notebooks/*.ipynb
    ├── templates/                  page shell, focus mode, password screen
    ├── src/                        build code
    ├── .preview/                   unencrypted local preview, gitignored
    ├── .env                        COURSE_PASSWORD_<COURSE>=..., gitignored
    └── .env.example
```

Course slug for the first course: `nlp-basic` ("Basic Programming for NLP").

## 3. Commands to build

| Command | Does |
|---|---|
| `npm run dev` | Build unencrypted into `.preview/`, serve on localhost, rebuild + reload on save |
| `npm run build` | Build unencrypted HTML into `.preview/` once |
| `npm run publish -- <course>` | Build, encrypt with the password from `.env`, write to `../public/courses/<course>/` |
| `npm run check` | The guard (section 9) on demand |

The teacher's loop: edit `.md` → watch `npm run dev` → `npm run publish -- nlp-basic` → commit → push.
The existing deploy workflow then ships `public/`.

## 4. Design system (Decided)

All values are in `tokens.css`. Use the variables; never hard-code colors in components.

- **Fonts** (Google Fonts):
  - Thai text: **Sarabun** (400/500/600). Body 20px, line-height 1.85.
  - English text and all headings: **Anuphan** (500/600).
  - Code: **IBM Plex Mono**, with Sarabun as fallback for Thai inside code.
  - Math: **textbook serif**. Render LaTeX with **KaTeX at build time**, using its default fonts.
  - Latin glyphs must use Anuphan even inside Thai paragraphs. Do this with `@font-face`
    `unicode-range` (Latin ranges → Anuphan, Thai range U+0E00–0E7F → Sarabun). The canvas
    mock only approximated this with `[lang="en"]`.
- **Theme: "Paper"**. Ink `#2a2722`, muted `#6b655c` (never lighter for text; the lighter grey
  `#8a8378` failed contrast at 3.8:1), accent rust `#a44f2b`, cream `#f5f2e9`, page ground
  `#efebe3`.
- **Layout of the page view** (see `reference/lecture-page-th.html`):
  - Text students read always sits on **white cards**. The page ground is warm grey.
  - Header: white bar. Course name, ไทย/EN switch, Focus button.
  - Banner: soft gradient (`--banner-gradient`) with pill tags (week, number of sections, lab),
    English title, Thai subtitle, one-line lead.
  - Left: "ในบทเรียนนี้" (in this lesson) card listing numbered sections, plus the tag legend.
  - Each section is a card. It starts with a **summary strip** holding a one-sentence takeaway
    and the section ID, then the heading, the Thai subtitle, and the body.
  - **Type tags** label content kinds, each with color plus icon, never color alone:
    แนวคิด concept (blue), ตัวอย่าง example (amber), โค้ด code (dark), ระวัง watch out (rust),
    แบบฝึกหัด exercise (green, and the whole card is tinted green).
  - Prev/next week cards at the bottom.
- Readability rules: no text below 4.5:1 contrast. Thai never smaller than 16px. Touch targets
  ≥ 44px. Keyboard focus visible.

`reference/blocks-*.html` show the **structure** of each block. They predate the final page
style, so restyle them to the card/tag look of `lecture-page-th.html`.

## 5. Bilingual rules (Decided)

- Each page has a **ไทย / EN switch**. Thai is the default, and the choice is remembered in
  localStorage, wrapped in try/catch.
- **Thai mode:** Thai explanations, English technical terms, English headings with a Thai subtitle.
- **English mode:** English only, with no Thai subtitles. Thai *language data* stays (example
  sentences, tokens), because it is the object of study.
- Authoring: text outside a language block shows in both modes. `::: th` and `::: en` blocks show
  in one mode only. Headings carry their Thai subtitle as an attribute.

## 6. Markdown syntax (Decided; implement exactly)

Use markdown-it + markdown-it-container + markdown-it-attrs + gray-matter, or equivalents.
`courses/nlp-basic/week05.md` is the canonical example. Everything it uses is required, including
the forms shown only there:
- `{th="..."}` on table cells and steps items, which adds a Thai subtitle;
- definition lists whose definitions hold `::: th` / `::: en`;
- answer list items with `{th="..." en="..."}` meanings.

### Front matter
```yaml
---
course: nlp-basic
week: 5
title: Tokenization and text normalization
title_th: การตัดคำและการปรับรูปข้อความ
lead_th: โปรแกรมแบ่งข้อความดิบออกเป็นหน่วยที่นับได้อย่างไร ...
lead_en: How a program cuts raw text into units it can count ...
lab: { name: Tokenizer, url: https://jakapunt.github.io/dashboard/Lab-Tokenizer.dc.html }
reading: Jurafsky & Martin, SLP ch. 2
prev: week04
next: week06
---
```
`env` (`colab` | `vscode`) and `install` come from `course.yml` and can be overridden per week.

### Sections and IDs
```markdown
## Spaces are not enough {#w05-s02 th="เว้นวรรคอย่างเดียวไม่พอ"}
```
- The ID format is `w<WW>-s<NN>` and is **required**. Fail the build if an ID is missing or
  duplicated. IDs are shown as `W05-S02` and are how the teacher asks for fixes, so never
  renumber existing IDs automatically.
- The summary strip:
  ```markdown
  ::: summary
  th: ภาษาไทยไม่เว้นวรรคระหว่างคำ จึงตัดด้วย `split()` ไม่ได้
  en: Thai has no spaces between words, so `split()` fails.
  :::
  ```

### Content kinds (tags)
`::: concept`, `::: example`, `::: warning`, `::: exercise {time="5 นาที" mode="pairs"}`. Each can
contain `::: th` / `::: en`. An exercise may contain `::: answer`, which is hidden behind the
ดูเฉลย / Show answer button and also hidden in focus mode until revealed.

### Tokens visual (the chip rows used in examples)
```markdown
::: tokens {label="newmm" result="ok"}
ฉัน | กิน | ข้าว | ที่ | บ้าน
:::
```
`result="ok"` adds a green ✓ note and `result="bad"` a rust ✗ note. Notes come from `note_th` /
`note_en` attributes.

### Code cell (depends on `env`)
````markdown
```python {file="week05_counts.py"}
import pandas as pd
pd.Series(words).value_counts().head(3)
```
```output
ที่     2
...
```
````
- `env: colab` renders `[n]`, a Copy button, and **Download .ipynb** (see section 8 for why this
  isn't Open in Colab). `install` becomes `!pip install -q ...` at the top.
- `env: vscode` renders the filename, Copy, and Download .py. `install` becomes a terminal line
  `$ pip install ...`. If the last line is a bare expression, wrap it in `print()` in the shown code.
- Highlight at build time with Shiki or Prism. Ship no highlighter to the browser.

### Other blocks
~~~~markdown
```dataframe {name="df_tokens" src="data/token_counts.csv" show=5}
```
```prompt {title="ตัดคำด้วย LLM"}
system: คุณเป็นผู้เชี่ยวชาญด้านการตัดคำภาษาไทย
user: |
  ตัดคำประโยคต่อไปนี้ แล้วตอบเป็น JSON list เท่านั้น
  ประโยค: {sentence}
output: ["ฉัน", "กิน", "ข้าว", "ที่", "บ้าน"]
```
```figure {src="images/w05-pipeline.png" source="https://web.stanford.edu/~jurafsky/slp3/"}
ขั้นตอนของ text preprocessing ตั้งแต่ข้อความดิบจนถึง tokens
```
```plot {src="images/w05-freq.png"}
<matplotlib code, shown behind a ดูโค้ด / Show code toggle>
```
```error {name="KeyError"}
<traceback>
---
meaning: ไม่มีคอลัมน์ชื่อ `year` ใน DataFrame
cause: ชื่อคอลัมน์สะกดต่าง หรือมีช่องว่างติดมา
fix: |
  print(df.columns)
  df.columns = df.columns.str.strip()
```
```formula
\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i
---
name: ค่าเฉลี่ยของตัวอย่าง (sample mean)
\bar{x}: ค่าเฉลี่ย
n: จำนวนข้อมูลทั้งหมด
code: df["sentence_length"].mean()
```
```read-result
context: เปรียบเทียบความยาวประโยคเฉลี่ยของนวนิยายสองยุค ด้วย `scipy.stats.ttest_ind`
result: p = 0.03
means:
  - ถ้าไม่ต่างกันจริง โอกาสเห็นความต่างขนาดนี้หรือมากกว่ามีประมาณ 3%
not:
  - มีโอกาส 97% ที่สมมติฐานของเราถูก
```
~~~~
Inline math is `$...$`. Display math is `$$...$$`.

- **dataframe:** pandas-like table with dtypes under the headers, an index column, `N rows × M
  columns`, and *Download CSV* (the full file) plus *Copy code* (`pd.read_csv(...)`). Infer dtypes
  as int64, float64, or object.
- **figure:** if `src` is missing, render the dashed placeholder showing the expected filename.
  Number figures automatically per week (รูปที่ 5.1, 5.2 ...).
- **plot:** show the image first and hide the code. Remind authors in the docs that matplotlib
  needs a Thai font, or Thai labels render as boxes. Colab has no Thai font installed.

## 7. Focus mode (Decided)

The same page, toggled with the **Focus** button or the **F** key. See `reference/focus-*.html`.

- One idea per frame, full screen, 16:9-friendly, large type: heading ~60px, Thai example text
  ~90px. **Paragraphs never show.** The teacher says them.
- Frame chrome: top bar `W05-S02 · <English heading>` and `ขั้นที่ 2 / 3` (step 2 of 3). Bottom:
  step dots and the key hints `→ ขั้นถัดไป · ← ย้อนกลับ · F ออก` (next, back, exit).
- What makes a frame:
  - By default, a section's frame is its heading plus its first example, tokens, figure, plot,
    dataframe, or code block.
  - `::: focus ... :::` overrides that with exactly what to show.
  - `::: steps` gives one frame per list item. Past steps stay visible but faded, and future
    steps stay hidden. The changing thing stays in the same screen position, so students see it
    change (string → dashed box → token chips).
  - Code step-through: `{steps="3,4,6"}` on a code block highlights one line per press and dims
    the rest. Each step's output comes from
    ```markdown
    ::: step-outputs
    4: ['ฉันกินข้าวที่บ้าน']
    6: ['ฉัน', 'กิน', 'ข้าว', 'ที่', 'บ้าน']
    :::
    ```
  - `::: transform {before="data/x.csv" after="data/y.csv" code="df.groupby(...)" group="decade"}`
    shows a before → after table. Rows in the same group share a tint and also carry a text
    label, and the columns being used are highlighted. Authors supply both CSVs; nothing is
    computed in the browser.
- Arrow keys and PageUp/PageDown move between frames (clickers send these). Esc and F exit back
  to the same section in page view. Respect `prefers-reduced-motion`.

## 8. Encryption and what must never leak (Decided)

- Use StatiCrypt v3 (`npx staticrypt`; check `--help` for the exact flags) with `--short` and
  `--remember 30`, and a **custom template** styled like the lecture page: white card on the
  page ground, course title, Sarabun, one password field, Thai instructions.
- The password comes from `.env` (`COURSE_PASSWORD_NLP_BASIC`). Never print it, log it, or write
  it into any file outside `.env`.
- **Everything content-bearing must sit inside the encrypted HTML.** Anything placed in `public/`
  as a separate file is public. So:
  - Inline CSV data and generate the CSV download from a Blob after decryption.
  - Inline images as data URIs, after compressing them (target < 300 KB each).
  - Inline notebooks and `.py` files the same way, for Download .ipynb / .py.
  - Shared CSS, JS, and fonts may be separate public files, since they are design, not content.
- "Open in Colab" needs a public GitHub notebook URL, which would leak the notebook. **Default:**
  Download .ipynb (students upload it to Colab). A course may set `colab_public_notebooks: true`
  in `course.yml` to enable Open in Colab for notebooks the teacher is happy to make public.
- Interactive JS (language switch, focus mode, answer reveal, downloads) must work after
  StatiCrypt decrypts the page. Test that in the encrypted build, not just the preview.
- The course home `index.html` is encrypted too (week list with titles and status). The public
  site gets one link card: "Courses → Basic Programming for NLP".

## 9. The guard (must exist before the first publish)

A pre-commit hook (simple-git-hooks or a committed `scripts/` hook installed by `npm install`)
blocks the commit if:
1. any staged path is under `course/courses/` or is `course/.env`;
2. any staged `public/courses/**/*.html` is not a StatiCrypt file (check for its encrypted
   payload marker, and check that known content strings such as section titles from the source
   are absent);
3. any staged file under `public/courses/` is a `.csv`, `.ipynb`, `.py`, `.md`, or an image.

Also add `course/courses/`, `course/.env`, and `course/.preview/` to the root `.gitignore`.
Git history is permanent, so one plain-text commit leaks forever.

## 10. Dropped from earlier ideas

- The in-browser ✎ edit mode is dropped, because encrypted static pages cannot save back.
  Editing happens in Markdown with Claude Code.
- Vercel and server-side auth were considered and rejected in favor of simplicity.

## 11. Milestones

1. **Week 5 end to end.** Build `courses/nlp-basic/week05.md` (provided). It covers banner,
   cards, summary strips, tags, TH/EN, code, the tokens visual, the exercise with answer, key
   terms, and prev/next. Encrypt it, add the guard, and publish. Compare with
   `reference/lecture-page-th.html` and `-en.html`.
2. **Focus mode** for week 5, matching `reference/focus-*.html`.
3. **Blocks:** dataframe, prompt, figure, plot, error, formula, read-result. Add a demo section
   using each to a scratch `week00-blocks.md`.
4. **Course home** page and the link card on the public site.
5. **Docs:** a `course/AUTHORING.md` cheat sheet in Thai covering the syntax above with
   copy-paste examples.

### Acceptance checks for each milestone
- It renders correctly at 1280px and 390px wide. The page body never scrolls horizontally, and
  wide code and tables scroll inside their own box.
- Both languages work, and the language choice survives a reload.
- Viewing the source of the published file shows no readable lecture text.
- `npm run check` passes, and an intentional plain commit is blocked.
- The Lighthouse accessibility score is at least 95 on the preview build.
