"""Run a lesson's Python cells like a notebook and write their real outputs into the Markdown.

    npm run outputs -- nlp-basic lesson10      (uses course/.venv, which pins Colab's pandas)

Rules
- Cells run top to bottom in one namespace, with the course's data/ folder as the working
  directory, so pd.read_csv("airline_reviews.csv") works as it does with the CSV next to the student's .py file.
- Like Jupyter, a bare expression on the last line is displayed. A DataFrame result becomes a
  table (```output {table=...}); anything else becomes text.
- Each python cell's following ```output block is replaced, or inserted if missing.
- {run=false} on a cell skips it. {output=false} runs it but writes no output block.
  Lines starting with ! or % (pip installs, magics) are skipped.
- {plot="images/l11-name.png"} on a cell saves the figure it draws (matplotlib/seaborn) to that
  file and writes ```output {plot="..."}, which the page shows as the chart. End such cells with
  plt.show(), as students do.
- The previous version of the file is kept in .preview/.history/ before writing.
"""

import ast
import contextlib
import datetime
import io
import os
import re
import shutil
import sys
import traceback

import pandas as pd

try:  # plotting cells need matplotlib (and seaborn); lessons without plots don't
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    plt.show = lambda *args, **kwargs: None  # the figure is saved instead (see {plot=...})
except ImportError:
    plt = None

FENCE = re.compile(r"^(\s*)(`{3,}|~{3,})\s*([\w-]*)\s*(.*?)\s*$")
TABLE_ROWS = 10


def parse_attrs(src):
    return dict(re.findall(r'([\w-]+)\s*=\s*"([^"]*)"', src)) | {
        k: v for k, v in re.findall(r"([\w-]+)\s*=\s*([^\s\"}]+)", src)
    }


def find_cells(lines):
    """Yield python cells: (start, end, code, attrs, output_start, output_end)."""
    i = 0
    cells = []
    while i < len(lines):
        m = FENCE.match(lines[i])
        if not m:
            i += 1
            continue
        indent, marker, lang, info = m.groups()
        j = i + 1
        while j < len(lines):
            c = FENCE.match(lines[j])
            if c and c.group(2)[0] == marker[0] and len(c.group(2)) >= len(marker) and not c.group(3) and not c.group(4):
                break
            j += 1
        if lang in ("python", "py", "python3"):
            code = "\n".join(l[len(indent):] if l.startswith(indent) else l for l in lines[i + 1 : j])
            # an existing ```output right after (blank lines allowed)
            k = j + 1
            while k < len(lines) and not lines[k].strip():
                k += 1
            out = None
            o = FENCE.match(lines[k]) if k < len(lines) else None
            if o and o.group(3) == "output":
                e = k + 1
                while e < len(lines):
                    c = FENCE.match(lines[e])
                    if c and c.group(2)[0] == o.group(2)[0] and not c.group(3) and not c.group(4):
                        break
                    e += 1
                out = (k, e)
            cells.append({"start": i, "end": j, "code": code, "attrs": parse_attrs(info), "indent": indent, "out": out})
        i = j + 1
    return cells


def display_value(value):
    if isinstance(value, pd.DataFrame):
        shape = f"{value.shape[0]} rows × {value.shape[1]} columns"
        shown = value if len(value) <= TABLE_ROWS else value.head(TABLE_ROWS)
        csv = shown.to_csv(lineterminator="\n").rstrip("\n")
        note = shape if len(value) <= TABLE_ROWS else f"{shape} (first {TABLE_ROWS} shown)"
        return "table", csv, note
    return "text", repr(value), None


def run_cell(code, ns):
    src = "\n".join(l for l in code.split("\n") if not l.lstrip().startswith(("!", "%")))
    buf = io.StringIO()
    kind, text, note = "text", "", None
    try:
        tree = ast.parse(src)
        last = tree.body[-1] if tree.body else None
        show_last = isinstance(last, ast.Expr) and not src.rstrip().endswith(";")
        body = tree.body[:-1] if show_last else tree.body
        with contextlib.redirect_stdout(buf):
            exec(compile(ast.Module(body=body, type_ignores=[]), "<cell>", "exec"), ns)
            value = eval(compile(ast.Expression(last.value), "<cell>", "eval"), ns) if show_last else None
        printed = buf.getvalue().rstrip("\n")
        if value is not None:
            k, t, note = display_value(value)
            if k == "table" and not printed:
                return "table", t, note
            text = (printed + "\n" if printed else "") + (t if k == "text" else value.to_string(max_rows=TABLE_ROWS))
        else:
            text = printed
    except Exception as exc:  # show the error the way a notebook's last traceback line does
        printed = buf.getvalue().rstrip("\n")
        name = type(exc).__name__
        text = (printed + "\n" if printed else "") + f"{name}: {exc}".rstrip()
        kind = "error"
    return kind, text, note


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: outputs.py path/to/lessonNN.md")
    md_path = os.path.abspath(sys.argv[1])
    course_dir = os.path.dirname(md_path)
    with open(md_path, encoding="utf-8") as f:
        original = f.read()
    lines = original.split("\n")
    cells = find_cells(lines)

    ns = {"__name__": "__main__"}
    data_dir = os.path.join(course_dir, "data")
    cwd = os.getcwd()
    os.chdir(data_dir if os.path.isdir(data_dir) else course_dir)
    pd.set_option("display.width", 100)
    pd.set_option("display.max_columns", 20)
    results = []
    try:
        for n, cell in enumerate(cells, 1):
            if cell["attrs"].get("run") == "false":
                results.append(None)
                continue
            plot = cell["attrs"].get("plot")
            if plot and plt is not None:
                plt.close("all")
            kind, text, note = run_cell(cell["code"], ns)
            if plot and kind != "error":
                if plt is None or not plt.get_fignums():
                    kind, text = "error", "plot: this cell drew no figure (is matplotlib installed in course/.venv?)"
                else:
                    out_file = os.path.join(course_dir, plot)
                    os.makedirs(os.path.dirname(out_file), exist_ok=True)
                    plt.gcf().savefig(out_file, dpi=144, bbox_inches="tight", facecolor="white", metadata={"Software": None})
                    plt.close("all")
                    kind, note = "plot", plot
            results.append((kind, text, note))
            flag = {"error": "  ✗ raised", "table": "  table", "plot": f"  plot → {note}"}.get(kind, "")
            print(f"cell {n:>2} (line {cell['start'] + 1}){flag}")
    finally:
        os.chdir(cwd)

    # rewrite from the bottom up so earlier line numbers stay valid
    for cell, res in reversed(list(zip(cells, results))):
        if res is None or cell["attrs"].get("output") == "false":
            continue
        kind, text, note = res
        ind = cell["indent"]
        if not text.strip() and kind != "plot":
            if cell["out"]:  # nothing printed: drop a stale output block
                a, b = cell["out"]
                del lines[cell["end"] + 1 : b + 1]
            continue
        head = f"{ind}```output"
        if kind == "table":
            head += f' {{table="{note}"}}'
        elif kind == "error":
            head += " {error=true}"
        elif kind == "plot":
            head += f' {{plot="{note}"}}'
        body = text.split("\n") if text.strip() else []
        block = [head] + [ind + l if l else l for l in body] + [f"{ind}```"]
        if cell["out"]:
            a, b = cell["out"]
            lines[a : b + 1] = block
        else:
            lines[cell["end"] + 1 : cell["end"] + 1] = [""] + block

    updated = "\n".join(lines)
    if updated == original:
        print("outputs unchanged")
        return
    history = os.path.join(os.path.dirname(os.path.dirname(course_dir)), ".preview", ".history")
    os.makedirs(history, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%Y%m%dT%H%M%S")
    shutil.copy(md_path, os.path.join(history, f"{os.path.basename(md_path)}.{stamp}.before-outputs.md"))
    with open(md_path + ".saving", "w", encoding="utf-8") as f:
        f.write(updated)
    os.replace(md_path + ".saving", md_path)
    print(f"wrote outputs to {os.path.relpath(md_path)} (pandas {pd.__version__})")


if __name__ == "__main__":
    main()
