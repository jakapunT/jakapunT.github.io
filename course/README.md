# Course kit: start here

This kit holds everything needed to build the lecture-page template in Claude Code.

## 1. Put the files in place

1. Unzip this kit into your repo so the folder is `jakapunt.github.io/course/`.
2. Append the lines from `gitignore-additions.txt` to the **root** `.gitignore`. Do this before
   anything else, so `course/courses/` (your lecture sources) and `course/.env` can never be
   committed.
3. Copy `.env.example` to `.env` and set a long password.
4. Back up `course/courses/` to Google Drive. It isn't in git on purpose.

## 2. Open Claude Code in the repo and paste this

> Read `course/CLAUDE.md` fully, then look at `course/reference/` (open the HTML files) and
> `course/courses/nlp-basic/week05.md`. Do milestone 1 only: set up the build in `course/`, the
> guard (§9) first, then render week05 to `.preview/`, then encrypt and publish to
> `public/courses/nlp-basic/`. Stop and show me the preview before encrypting. Ask before
> changing anything marked Decided.

## 3. What's in the kit

| File | What it is |
|---|---|
| `CLAUDE.md` | The full build brief: structure, design, Markdown syntax, focus mode, encryption, guard, milestones |
| `tokens.css` | Colors, fonts, sizes as CSS variables (source of truth) |
| `courses/nlp-basic/course.yml` | Course settings (Colab vs VS Code, password variable) |
| `courses/nlp-basic/week05.md` | A complete lecture written in the final syntax, used for milestone 1 |
| `reference/lecture-page-th.html` | Approved page design, Thai mode |
| `reference/lecture-page-en.html` | Same page, English mode |
| `reference/lecture-page-th-answer-open.html` | Exercise with the answer revealed |
| `reference/focus-1…5-*.html` | Approved focus-mode frames (steps, code step-through, DataFrame change) |
| `reference/blocks-*.html` | Structure of each content block. Restyle these to the card look. |
| `.env.example` | Password file template |
| `gitignore-additions.txt` | Lines for the root `.gitignore` |

The design canvas with every screen stays available in Claude for reference.
