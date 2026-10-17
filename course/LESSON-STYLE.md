# Lesson style guide

How a lesson should look and read. It records what the teacher asked for while lesson 10
(pandas) was built, so every new lesson follows the same format. `courses/nlp-basic/lesson10-pandas.md`
is the worked example: when in doubt, copy how it does it. CLAUDE.md covers the build, the syntax
and security; this file covers teaching style.

## Who it is for

- Humanities students, many new to programming. Taught in a classroom on a projector, then
  reread at home. Desktop first, not mobile first.
- The teacher switches ไทย / EN often, so both languages must say the same thing.

## The main rule: show it, don't explain it

An infographic beats a paragraph. Before writing an explanation, ask which picture would make it
obvious, and use one of these:

| To show | Use |
|---|---|
| One table turning into another (filter, groupby, pivot, melt, explode, fill) | `::: transform {before after}` with tints by `group` |
| Two tables becoming one (merge, concat, duplicate keys) | `::: transform {before right after before_name right_name after_name}` |
| Several cases side by side (policies, statistics, join types, a task's steps, key terms) | ```` ```cards ```` (mini column before → after, `venn:`, or `cols`/`rows`) |
| An idea students should try with their hands | an interactive block (the ```` ```index-explorer ```` is the model) |
| A sequence | `::: steps`, or `{steps="…"}` on code for line-by-line focus |
| Code next to its explanation | `::: columns` (first block left) |

- Mini examples have 3–8 rows, are real rows of the course dataset (or clearly labelled practice
  tables), and every number in them is checked by running pandas.
- Colour tints connect the same thing across tables (same airline, same key value).
- Name the trap in the picture itself: NaN rows, a dropped row, a duplicated row.

## Data

- One running dataset per lesson (lesson 10: the airline reviews, `reviews`; the 8-row `small`).
- Show the data students need **inside the same card** as the question.
- Practice tables get a Download CSV (```` ```dataframe ````) so students can try them in VS Code (the nlp-basic course is taught in VS Code, `env: vscode`).

## Prompts (AI is part of the workflow)

- Every working code cell has the plain-words prompt that writes it: ```` ```prompt {attach} ````
  right after the cell (and its output). It sits behind a **Prompt** button.
- `{attach open}` starts it opened: use it where the prompt is the lesson (the groupby sections).
- Write prompts the way a student would: name the table (`` `reviews` ``), the columns, and what to
  get back. Short lines. Use **the same words as the code** so students can map one to the other,
  for example "group by `Airline Name` แล้วหา mean ของ `Rating`".
- No prompt on: deliberately broken code, predict-the-output exercise cells, timing demos.
- When code is wrong, explain **what is wrong** (a ระวัง box); don't show a "repair prompt".

## Exercises

- Always individual: `mode="solo"` (ทำคนเดียว / On your own).
- Self-contained: the question, the data and any rule are in the same card. Never "ตามกติกาใน
  L10-S25"; write the rule out.
- This holds everywhere, not only in exercises: never point students to another section or lesson
  ("L13-S06", "(บทที่ 12)", "ต้นบท", "see the chart in S05"). Show the data, chart, code or rule
  again where it is needed, or say it in a few words.
- Start with the goal (**โจทย์:** what we want and why), then short numbered steps.
- Students predict by hand first, then use AI or run the code, then compare.
- Answers are checked in pandas. In focus mode and the slide PDF, answers stay hidden.
- Important operations get hands-on practice per case (lesson 10: one set per join type), on
  small tables students can see, plus a "pick the right one for the job" set.

## Explaining

- Define a word before using it (lesson 10 had to add "key" before groupby and merge).
- Basics before shortcuts: `[n:m]` gives n … m-1 on a list before `.loc`/`.iloc` slices; write a
  function with `def`, test it on one example, then `.apply()` it.
- Show the bad way next to the good way when it matters, with real numbers (loop vs `.apply()`
  vs whole-column timing).
- Teach the most common use first (pivot tables: counting before means).
- Keep it simple. If an example or section is hard and not essential, cut it (lesson 10 removed
  the `fares` map/apply example and the assert/mean-of-means section).

## Wording (Thai)

- English technical terms stay in English inside Thai sentences (`DataFrame`, `key`, `merge`).
- "สร้าง copy" (not ทำสำเนา).
- Short sentences. Bold the one idea per paragraph.

## Code

- Lines short enough to fit their box without sideways scrolling (about 60 characters when the code
  shares space). Break long calls over lines; prefer a named step (`keys = [...]`, `extra = ...`)
  over a long one-liner.
- Outputs are real: run `npm run outputs -- <course> <lesson>` after editing code.

## Focus mode and PDFs

- Every frame must fit 1280×720 at projector size. Check each changed section in focus mode,
  in **both ไทย and EN**: the Thai subtitle under the heading makes Thai frames about 40px taller.
- Use `::: focus {page=false}` for a projector-only frame (for example the table plus the code to
  predict), so the page does not repeat it.
- When a frame is too tall, fix the projector, not the page: keep the page text as the teacher
  wrote it.
  - Cards: split the set into two ```` ```cards ```` blocks at a point that keeps the page's
    2-per-row rows whole (after card 2 or 4), and give the second `{start=N}` (L10-S28, S39, S40).
  - Transform: `{focus=false}` on it, then a `::: focus {page=false}` copy of the same transform
    with no caption; the teacher says the caption (L10-S28, S33, S35–S37).
  - Change shared CSS only as a last resort, scoped so it reaches no other lesson's frames.
- The only PDF students download is the slides (ดาวน์โหลด PDF (สไลด์): one 16:9 page per frame,
  answers left out), so every frame should also read well on paper.

## Checklist for a new or changed section

1. Picture first; text only for what the picture cannot say.
2. Data visible in the card; numbers verified in pandas; `npm run outputs`.
3. Prompts on working code, in the same words as the code.
4. Both languages say the same thing.
5. Page view at 1280px: nothing scrolls sideways. Focus mode: every frame fits.
6. `npm run check` passes. Publish, commit, push only when the teacher says so.
