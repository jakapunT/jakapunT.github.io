"""Draws the lesson 14 (Streamlit) infographics. SVG, inlined into the page; ไทย/EN labels follow
the language switch. The app screenshots themselves are real: see scripts/l14_apps/shoot.sh.

    python3 scripts/diagrams/l14_figures.py courses/nlp-basic/images

Uses the nt-*, pl-*, ml-*, ks-*, in-*, dv-* and rc-* classes in templates/page.css.
"""

import os
import sys
import unicodedata
from html import escape

OUT = sys.argv[1] if len(sys.argv) > 1 else "courses/nlp-basic/images"
FS = 19


def width(s, fs=FS):
    return sum(0 if unicodedata.category(c) == "Mn" else fs * (1.1 if ord(c) > 0x1F000 else 0.58) for c in s)


class Svg:
    def __init__(self, w, title):
        self.w, self.title, self.out = w, title, []

    def add(self, s):
        self.out.append(s)

    def both(self, x, y, th, en, cls, anchor="start"):
        self.add(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}" data-only="th">{escape(th)}</text>')
        self.add(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}" data-only="en" lang="en">{escape(en)}</text>')

    def text(self, x, y, s, cls, anchor="start"):
        self.add(f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}">{escape(s)}</text>')

    def box(self, x, y, w, h, cls, rx=12):
        self.add(f'<rect x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}" rx="{rx}" class="{cls}"/>')

    def arrow(self, x1, y1, x2, y2, cls="pl-line"):
        self.add(f'<path d="M{x1:g} {y1:g} L{x2:g} {y2:g}" class="{cls}"/>')
        if y1 == y2:
            d = 8 if x2 > x1 else -8
            self.add(f'<path d="M{x2 - d:g} {y2 - 6:g} L{x2:g} {y2:g} L{x2 - d:g} {y2 + 6:g}" class="{cls}"/>')
        else:
            d = 8 if y2 > y1 else -8
            self.add(f'<path d="M{x2 - 6:g} {y2 - d:g} L{x2:g} {y2:g} L{x2 + 6:g} {y2 - d:g}" class="{cls}"/>')

    def save(self, name, h):
        svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {h}" class="diagram diagram-wide" role="img"><title>{escape(self.title)}</title>', *self.out, "</svg>"]
        open(os.path.join(OUT, name), "w", encoding="utf-8").write("\n".join(svg) + "\n")
        print("wrote", name, f"{self.w}x{h}")


# ---------------------------------------------------------------- 1a. what happens when you open a website (S01)
s = Svg(900, "Opening a website: your browser sends a request over the internet to a server, the server runs code and reads data, and sends a page back for the browser to show.")
# the two ends: you and the server
s.box(10, 40, 210, 200, "nt-band-a", 16)
s.text(115, 104, "👩‍💻", "gs-icon", "middle")
s.both(115, 146, "คุณ + เบราว์เซอร์", "You + a browser", "pl-label", "middle")
s.both(115, 172, "Chrome, Safari", "Chrome, Safari", "pl-note", "middle")
s.both(115, 212, "แสดงหน้าเว็บ", "shows the page", "in-sub", "middle")
s.box(680, 40, 210, 200, "nt-band-b", 16)
s.text(785, 104, "🖥️", "gs-icon", "middle")
s.both(785, 146, "Server", "Server", "pl-label", "middle")
s.both(785, 172, "คอมพิวเตอร์ที่เปิดตลอด", "an always-on computer", "pl-note", "middle")
s.both(785, 212, "รันโค้ด อ่านข้อมูล", "runs code, reads data", "in-sub", "middle")
# the internet in the middle, request going right, response coming back
s.text(450, 140, "🌐", "gs-icon", "middle")
s.both(450, 176, "อินเทอร์เน็ต", "the internet", "pl-note", "middle")
s.arrow(232, 92, 668, 92)
s.both(450, 80, "① ขอหน้าเว็บ (request)", "① asks for a page (request)", "ws-req", "middle")
s.arrow(668, 214, 232, 214)
s.both(450, 238, "③ ส่งหน้าเว็บกลับ (response)", "③ sends the page back (response)", "ws-res", "middle")
s.both(785, 30, "② ทำงาน", "② does the work", "ws-step", "middle")
s.both(115, 30, "④ เห็นหน้าเว็บ", "④ you see the page", "ws-step", "middle")
s.save("l14-web.svg", 256)

# ---------------------------------------------------------------- 1b. the three layers as a restaurant (S01)
s = Svg(900, "A web app is like a restaurant: the frontend is the dining room you see, the backend is the kitchen that does the work, and the database is the store room. Shown with the review app built in this lesson.")
layers = [
    ("🍽️", "หน้าร้าน", "Dining room", "Frontend", "สิ่งที่ผู้ใช้เห็นและกด", "what users see and click",
     "ช่องพิมพ์รีวิว ปุ่ม กราฟ", "the text box, buttons, chart", "HTML · CSS · JavaScript", "nt-band-a"),
    ("👩‍🍳", "ครัว", "Kitchen", "Backend", "รับคำสั่งแล้วทำงาน", "takes the order, does the work",
     "ตัดคำ นับคำ เรียก Gemini", "tokenize, count, call Gemini", "Python, Node.js", "nt-band-b"),
    ("🧊", "ห้องเก็บของ", "Store room", "Database", "เก็บข้อมูลไว้ใช้ต่อ", "keeps data for later",
     "ไฟล์รีวิว CSV", "the reviews CSV file", "PostgreSQL, MySQL", "nt-band-a"),
]
for k, (icon, rth, ren, term, dth, den, ath, aen, tools, band) in enumerate(layers):
    x0 = 10 + k * 297
    cx = x0 + 142
    s.box(x0, 10, 285, 300, band, 16)
    s.text(cx, 66, icon, "gs-icon", "middle")
    s.both(cx, 104, rth, ren, "pl-label", "middle")
    s.text(cx, 134, "= " + term, "rr-term", "middle")
    s.both(cx, 168, dth, den, "pl-note", "middle")
    s.box(x0 + 18, 190, 249, 64, "dv-file", 10)
    s.both(cx, 214, "ในแอปของเรา:", "In our app:", "in-sub", "middle")
    s.both(cx, 240, ath, aen, "rr-app", "middle")
    s.text(cx, 290, tools, "ks-mono", "middle")
# Streamlit covers the first two layers
s.add('<path d="M20 326 V340 H584 V326" class="st-brace"/>')
s.box(162, 352, 280, 46, "ml-model", 12)
s.both(302, 382, "Streamlit: 2 ชั้นนี้ด้วย Python ล้วน", "Streamlit: both in pure Python", "ml-model-text", "middle")
s.save("l14-fullstack.svg", 408)

# ---------------------------------------------------------------- 2. every interaction reruns the script (S04)
s = Svg(900, "Every time the user changes a widget, Streamlit runs app.py again from the top, using the widget's new value, and redraws the page.")
s.box(10, 10, 270, 250, "nt-band-a", 14)
s.both(28, 42, "1. ผู้ใช้เลื่อน slider", "1. The user moves a slider", "pl-label")
s.text(40, 92, "Top words", "pl-note")
s.add('<path d="M40 120 H250" class="st-track"/><path d="M40 120 H175" class="st-track-on"/>')
s.add('<circle cx="175" cy="120" r="10" class="st-knob"/>')
s.text(175, 104, "8", "st-knob-t", "middle")
s.both(145, 170, "จาก 5 เป็น 8", "from 5 to 8", "pl-note", "middle")
s.arrow(286, 135, 318, 135)
s.box(326, 10, 300, 250, "nt-band-b", 14)
s.both(344, 42, "2. รัน app.py ใหม่ทั้งไฟล์", "2. app.py runs again", "pl-label")
code = ['import streamlit as st', 'top_n = st.slider(...)  # 8', 'result = analyze_text(', '    text, top_n=top_n)', 'st.dataframe(...)']
s.box(344, 58, 264, 150, "ks-term", 10)
for k, ln in enumerate(code):
    s.text(358, 84 + k * 26, ln, "ks-term-t")
s.add('<path d="M612 66 V200" class="st-run"/><path d="M606 192 L612 202 L618 192" class="st-run"/>')
s.both(476, 240, "ทุกบรรทัด ทุกครั้งที่มีการโต้ตอบ", "every line, on every interaction", "pl-note", "middle")
s.arrow(632, 135, 664, 135)
s.box(672, 10, 218, 250, "nt-band-a", 14)
s.both(690, 42, "3. หน้าเว็บอัปเดต", "3. The page updates", "pl-label")
for k in range(8):
    s.box(690, 64 + k * 22, 170 - k * 14, 16, "st-bar", 4)
s.both(781, 252, "แสดง 8 คำ", "shows 8 words", "pl-note", "middle")
s.save("l14-rerun.svg", 270)

# ---------------------------------------------------------------- 3. layout regions (S06)
s = Svg(900, "Where things go on a Streamlit page: the sidebar, columns side by side, tabs, and bordered containers.")
s.box(10, 10, 880, 330, "st-page", 14)
s.box(10, 10, 210, 330, "st-side", 14)
s.text(30, 44, "st.sidebar", "ks-mono")
s.both(30, 72, "ตั้งค่า ตัวกรอง", "settings, filters", "pl-note")
for k in range(3):
    s.box(30, 96 + k * 46, 170, 30, "ks-bar", 8)
s.text(244, 52, "st.title(...)", "st-title")
# three metrics in columns
s.text(244, 84, "st.columns(3)", "ks-mono")
for k in range(3):
    s.box(244 + k * 212, 96, 200, 64, "st-metric", 10)
    s.text(260 + k * 212, 120, ["Reviews", "Words", "Unique"][k], "pl-note")
    s.text(260 + k * 212, 148, ["5", "25", "17"][k], "st-big")
# tabs
s.text(244, 192, "st.tabs([...])", "ks-mono")
for k, t in enumerate(["Table", "Chart"]):
    s.box(244 + k * 96, 202, 88, 30, "st-tab-on" if k == 0 else "st-tab", 8)
    s.text(288 + k * 96, 223, t, "pl-note", "middle")
s.box(244, 236, 626, 88, "st-metric", 10)
s.text(262, 262, "st.container(border=True)", "ks-mono")
s.both(262, 292, "กล่องมีกรอบ จัดของให้เป็นกลุ่ม", "a bordered box that groups things", "pl-note")
s.save("l14-layout.svg", 350)

# ---------------------------------------------------------------- 4. caching (S07)
s = Svg(900, "Without caching, slow work runs again on every rerun. With @st.cache_data it runs once and later reruns reuse the result.")
rows = [
    ("❌ ไม่มี cache", "❌ No cache", [3, 3, 3, 3], "ทุกครั้ง 3 วินาที", "3 seconds, every time"),
    ("✅ @st.cache_data", "✅ @st.cache_data", [3, 0.15, 0.15, 0.15], "ครั้งแรก 3 วินาที แล้วเร็วทันที", "3 seconds once, then instant"),
]
for i, (th, en, secs, nth, nen) in enumerate(rows):
    y = 14 + i * 120
    s.box(10, y, 880, 106, "nt-band-a" if i == 0 else "nt-band-b", 14)
    s.both(28, y + 34, th, en, "pl-label")
    s.both(28, y + 64, nth, nen, "pl-note")
    x = 330
    for k, sec in enumerate(secs):
        w = max(14, sec * 36)
        s.box(x, y + 30, w, 34, "st-load" if sec > 1 else "st-fast", 6)
        s.both(x + w / 2, y + 86, f"รอบ {k + 1}", f"run {k + 1}", "in-sub", "middle")
        x += max(w, 54) + 14
s.save("l14-cache.svg", 262)

# ---------------------------------------------------------------- 5. project folder (S08)
s = Svg(900, "A small Streamlit project: the app, its NLP logic, the list of libraries, data, extra pages and settings.")
s.box(10, 10, 880, 330, "nt-band-a", 14)
s.text(30, 44, "📁 my-streamlit-app/", "ks-mono")
items = [
    ("app.py", "หน้าแรกของแอป (ส่วน interface)", "the app's main page (the interface)", "dv-file"),
    ("nlp_logic.py", "โค้ด NLP: ตัดคำ นับคำ", "the NLP code: tokenize, count", "dv-file"),
    ("requirements.txt", "รายชื่อไลบรารีที่ต้องติดตั้ง", "the libraries to install", "dv-file"),
    ("data/", "ไฟล์ CSV และข้อมูลอื่น", "CSV files and other data", "dv-file"),
    ("pages/", "หน้าเพิ่ม เช่น 01_Explore.py", "more pages, e.g. 01_Explore.py", "dv-file"),
    (".streamlit/", "config.toml (ธีม), secrets.toml (key ห้ามขึ้น GitHub)", "config.toml (theme), secrets.toml (keys, never on GitHub)", "dv-secret"),
]
for k, (name, th, en, cls) in enumerate(items):
    y = 64 + k * 44
    s.add(f'<path d="M44 52 V{y + 17} H64" class="dv-tree"/>')
    s.box(66, y, 210, 34, cls, 8)
    s.text(80, y + 23, name, "ks-mono")
    s.both(296, y + 23, th, en, "pl-note")
s.save("l14-structure.svg", 350)

# ---------------------------------------------------------------- 6. logic vs interface (S10)
s = Svg(900, "Keep the NLP logic in its own file; the Streamlit interface only calls it. AI may change the interface, never the logic.")
s.box(10, 10, 270, 230, "nt-band-a", 14)
s.both(28, 42, "nlp_logic.py", "nlp_logic.py", "pl-label")
s.both(28, 68, "ส่วนประมวลผล (คุณเขียนเอง)", "the processing (you write it)", "pl-note")
s.box(28, 86, 234, 96, "ks-term", 10)
for k, ln in enumerate(["def analyze_text(text):", "    words = tokenize(text)", "    return counts"]):
    s.text(40, 112 + k * 24, ln, "ks-term-t")
s.both(145, 222, "🔒 ห้าม AI แก้", "🔒 AI must not change it", "wv-note", "middle")
s.arrow(286, 125, 330, 125)
s.both(308, 112, "เรียกใช้", "called by", "in-sub", "middle")
s.box(336, 10, 270, 230, "nt-band-b", 14)
s.both(354, 42, "app.py", "app.py", "pl-label")
s.both(354, 68, "ส่วนหน้าตา (interface)", "the interface", "pl-note")
s.box(354, 86, 234, 96, "ks-term", 10)
for k, ln in enumerate(["text = st.text_area(...)", "r = analyze_text(text)", "st.metric(..., r[...])"]):
    s.text(366, 112 + k * 24, ln, "ks-term-t")
s.both(471, 222, "✏️ AI ช่วยปรับได้", "✏️ AI may improve it", "ml-ok", "middle")
s.arrow(660, 125, 616, 125)
s.box(668, 70, 222, 110, "ml-model", 16)
s.text(698, 132, "🤖", "fc-robot", "middle")
s.both(724, 118, "AI ช่วยเขียน", "AI assistant", "ml-model-text")
s.both(724, 144, "เฉพาะ interface", "interface only", "ml-model-sub")
s.save("l14-logic-ui.svg", 250)

# ---------------------------------------------------------------- 7. five parts of a good AI coding prompt (S11)
s = Svg(900, "Five parts of a good prompt for AI-built interfaces: context, goal, layout, style and constraints.")
parts = [
    ("Context", "งานที่ทำอยู่", "what you are working on", "แอป Streamlit ภาษา Python", "a Python Streamlit app", "rc-role"),
    ("Goal", "อยากให้ AI ทำอะไร", "what AI should do", "ปรับหน้าตาให้เป็น dashboard", "make it a clean dashboard", "rc-ctx"),
    ("Layout", "จัดวางอย่างไร", "how it is arranged", "sidebar + 2 คอลัมน์ + 3 metric", "sidebar, 2 columns, 3 metrics", "rc-res"),
    ("Style", "หน้าตาเป็นแบบไหน", "how it looks", "เรียบ สีฟ้า-ขาว ระยะห่างเท่ากัน", "minimal, blue and white, even spacing", "rc-con"),
    ("Constraints", "ห้ามเปลี่ยนอะไร", "what must not change", "ห้ามแก้ฟังก์ชันใน nlp_logic.py", "keep nlp_logic.py unchanged", "rc-role"),
]
for k, (key, qth, qen, eth, een, cls) in enumerate(parts):
    y = 12 + k * 60
    s.box(10, y, 880, 50, cls, 10)
    s.text(30, y + 32, f"{k + 1}. {key}", "rc-key")
    s.both(200, y + 32, qth, qen, "pl-note")
    s.both(470, y + 32, eth, een, "pl-text")
s.save("l14-prompt5.svg", 318)

# ---------------------------------------------------------------- 8. from code to a public app (S16)
s = Svg(900, "Deploying: your code goes to a GitHub repo, Streamlit Community Cloud runs it, and anyone on the internet can open the app.")
steps = [
    ("📄", "โค้ด", "code", "app.py ใน VS Code", "app.py in VS Code"),
    ("📁", "GitHub repo", "GitHub repo", "commit + push", "commit + push"),
    ("☁️", "Streamlit Cloud", "Streamlit Cloud", "ติดตั้งไลบรารี แล้วรัน", "installs, then runs it"),
    ("🌐", "แอปออนไลน์", "public app", "ชื่อ.streamlit.app", "name.streamlit.app"),
]
for k, (icon, th, en, sth, sen) in enumerate(steps):
    x0 = 10 + k * 222
    cx = x0 + 100
    s.box(x0, 14, 200, 180, "nt-band-a" if k % 2 == 0 else "nt-band-b", 14)
    s.text(cx, 76, icon, "gs-icon", "middle")
    s.both(cx, 120, th, en, "pl-label", "middle")
    s.both(cx, 150, sth, sen, "in-sub", "middle")
    if k < 3:
        s.arrow(x0 + 204, 104, x0 + 218, 104)
s.add('<path d="M110 206 V232 H776 V206" class="st-loop"/>')
s.both(443, 258, "แก้โค้ด → commit + push → แอปอัปเดตเอง", "edit → commit + push → the app updates itself", "ml-ok", "middle")
s.save("l14-deploy.svg", 272)

# ---------------------------------------------------------------- 9. what Git and GitHub do (S15)
s = Svg(900, "Git keeps save points (commits) of your project folder on your computer; push uploads them to GitHub, an online copy that Streamlit Cloud can read.")
s.box(10, 30, 330, 250, "nt-band-a", 16)
s.both(28, 62, "💻 เครื่องของเรา (Git)", "💻 Your computer (Git)", "pl-label")
s.box(28, 80, 140, 40, "dv-file", 8)
s.text(40, 106, "📁 my-app/", "ks-mono")
s.both(184, 106, "โฟลเดอร์โปรเจกต์", "project folder", "pl-note")
# a timeline of save points
for k, (th, en) in enumerate([("เพิ่ม app.py", "add app.py"), ("ใส่กราฟ", "add a chart"), ("แก้สีธีม", "change theme")]):
    y = 152 + k * 40
    s.add(f'<circle cx="48" cy="{y}" r="9" class="gt-dot"/>')
    if k:
        s.add(f'<path d="M48 {y - 31} V{y - 9}" class="gt-line"/>')
    s.both(68, y + 6, f"commit: {th}", f"commit: {en}", "pl-note")
s.both(175, 272, "commit = จุดบันทึก ย้อนกลับได้", "commit = a save point you can go back to", "in-sub", "middle")
s.arrow(348, 150, 420, 150)
s.both(384, 136, "push", "push", "gt-verb", "middle")
s.both(384, 176, "อัปโหลด", "upload", "in-sub", "middle")
s.box(428, 30, 230, 250, "nt-band-b", 16)
s.both(446, 62, "☁️ GitHub", "☁️ GitHub", "pl-label")
s.both(446, 88, "เว็บเก็บโค้ดออนไลน์", "stores code online", "pl-note")
s.box(446, 108, 194, 100, "dv-file", 10)
s.text(460, 136, "repo: my-app", "ks-mono")
for k in range(3):
    s.add(f'<circle cx="466" cy="{160 + k * 16}" r="5" class="gt-dot"/>')
s.text(480, 182, "3 commits", "in-sub")
s.both(543, 236, "repository (repo)", "repository (repo)", "gt-verb", "middle")
s.both(543, 260, "= โฟลเดอร์โปรเจกต์บนเว็บ", "= the project folder, online", "in-sub", "middle")
s.arrow(666, 150, 718, 150)
s.box(726, 80, 164, 140, "ml-model", 16)
s.text(808, 132, "☁️", "fc-robot", "middle")
s.both(808, 168, "Streamlit Cloud", "Streamlit Cloud", "ml-model-text", "middle")
s.both(808, 194, "อ่านโค้ดจาก repo", "reads the repo", "ml-model-sub", "middle")
s.save("l14-git.svg", 290)

# ---------------------------------------------------------------- 10. putting a project on GitHub, step by step (S15)
s = Svg(900, "Eight steps to put a project on GitHub from VS Code: install Git, sign up, sign in, create a repository, clone it, add files, commit and sync, then check on github.com.")
steps = [
    ("ติดตั้ง Git", "Install Git", "git"),
    ("สมัคร GitHub", "Sign up on GitHub", "signup"),
    ("ลงชื่อเข้าใช้ใน VS Code", "Sign in from VS Code", "vscode"),
    ("สร้าง repository", "Create a repository", "newrepo"),
    ("Clone มาที่เครื่อง", "Clone the repo", "clone"),
    ("ใส่ไฟล์ในโฟลเดอร์", "Add your files", "files"),
    ("Commit แล้ว Sync", "Commit, then Sync", "commit"),
    ("เช็กบน github.com", "Check on github.com", "check"),
]
PW, PH = 214, 176
for i, (th, en, kind) in enumerate(steps):
    x0, y0 = 10 + (i % 4) * (PW + 8.67), 10 + (i // 4) * (PH + 12)
    cx = x0 + PW / 2
    s.box(x0, y0, PW, PH, "nt-band-a" if (i + i // 4) % 2 == 0 else "nt-band-b", 14)
    s.add(f'<circle cx="{x0 + 20:g}" cy="{y0 + 24}" r="12" class="pl-dot"/>')
    s.text(x0 + 20, y0 + 30, str(i + 1), "pl-num", "middle")
    s.both(x0 + 38, y0 + 30, th, en, "ks-h")
    yv = y0 + 52
    if kind == "git":
        s.box(x0 + 14, yv, PW - 28, 30, "ks-bar", 15)
        s.text(cx, yv + 20, "git-scm.com", "ks-mono", "middle")
        s.both(cx, yv + 58, "Mac: ติดตั้งให้เองตอนใช้ครั้งแรก", "Mac: offered on first use", "in-sub", "middle")
        s.both(cx, yv + 78, "Windows: ดาวน์โหลดจากเว็บนี้", "Windows: download from here", "in-sub", "middle")
    elif kind == "signup":
        s.box(x0 + 14, yv, PW - 28, 30, "ks-bar", 15)
        s.text(cx, yv + 20, "github.com/signup", "ks-mono", "middle")
        s.both(cx, yv + 58, "ใช้อีเมลของเรา", "use your own email", "in-sub", "middle")
        s.both(cx, yv + 78, "ฟรี", "free", "in-sub", "middle")
    elif kind == "vscode":
        s.box(x0 + 14, yv, 40, 96, "ks-term", 8)
        s.text(x0 + 34, yv + 82, "👤", "ks-icon", "middle")
        s.add(f'<path d="M{x0 + 54:g} {yv + 76} H{x0 + 74:g}" class="pl-line"/>')
        s.box(x0 + 76, yv + 60, PW - 90, 32, "ks-btn", 16)
        s.text(x0 + 76 + (PW - 90) / 2, yv + 81, "Sign in with GitHub", "gt-tiny", "middle")
        s.both(x0 + 64, yv + 30, "Accounts (ล่างซ้าย)", "Accounts (bottom left)", "in-sub")
    elif kind == "newrepo":
        s.box(x0 + 30, yv, PW - 60, 30, "ks-btn-main", 15)
        s.text(cx, yv + 20, "+ New repository", "ks-btn-main-t", "middle")
        s.text(x0 + 18, yv + 56, "name: my-streamlit-app", "gt-small")
        s.add(f'<circle cx="{x0 + 24:g}" cy="{yv + 76}" r="5" class="gt-dot"/>')
        s.text(x0 + 36, yv + 81, "Public", "gt-small")
        s.both(x0 + 18, yv + 104, "✓ Add a README", "✓ Add a README", "gt-small")
    elif kind == "clone":
        s.box(x0 + 14, yv, 40, 96, "ks-term", 8)
        s.text(x0 + 34, yv + 28, "⑂", "gt-icon-w", "middle")
        s.box(x0 + 64, yv + 8, PW - 78, 32, "ks-btn", 16)
        s.text(x0 + 64 + (PW - 78) / 2, yv + 29, "Clone Repository", "gt-small", "middle")
        s.both(x0 + 64, yv + 64, "เลือก repo", "pick the repo", "in-sub")
        s.both(x0 + 64, yv + 84, "เลือกโฟลเดอร์ → Open", "pick a folder → Open", "in-sub")
    elif kind == "files":
        for k, f in enumerate(["app.py", "nlp_logic.py", "requirements.txt"]):
            s.box(x0 + 18, yv + k * 36, PW - 36, 28, "dv-file", 6)
            s.text(x0 + 30, yv + 19 + k * 36, "📄 " + f, "gt-small")
    elif kind == "commit":
        s.box(x0 + 14, yv, PW - 28, 30, "ks-bar", 8)
        s.both(x0 + 24, yv + 20, "ข้อความ: เพิ่มแอปแรก", "message: first app", "gt-small")
        s.box(x0 + 14, yv + 40, PW - 28, 30, "ks-btn-main", 8)
        s.text(cx, yv + 60, "✓ Commit", "ks-btn-main-t", "middle")
        s.box(x0 + 14, yv + 80, PW - 28, 30, "ks-btn-main", 8)
        s.text(cx, yv + 100, "⟳ Sync Changes", "ks-btn-main-t", "middle")
    else:
        s.box(x0 + 14, yv, PW - 28, 30, "ks-bar", 15)
        s.text(cx, yv + 20, "github.com/you/my-app", "gt-small", "middle")
        for k, f in enumerate(["app.py", "nlp_logic.py", "requirements.txt"]):
            s.text(x0 + 24, yv + 56 + k * 22, "✓ " + f, "gt-ok")
s.save("l14-github-steps.svg", 2 * PH + 32)

# ---------------------------------------------------------------- 11. deploying on Community Cloud, step by step (S16)
# Labels follow docs.streamlit.io/deploy/streamlit-community-cloud/deploy-your-app/deploy
s = Svg(900, "Six steps to deploy on Streamlit Community Cloud: sign in with GitHub, create an app, pick the repository, branch and main file, add secrets, deploy, then share the link.")
steps = [
    ("เข้า share.streamlit.io", "Open share.streamlit.io", "signin"),
    ("กด Create app", "Click Create app", "create"),
    ("เลือก repo และไฟล์", "Pick the repo and file", "form"),
    ("ใส่ Secrets (ถ้ามี key)", "Add secrets (if you use a key)", "secrets"),
    ("กด Deploy แล้วรอ", "Click Deploy and wait", "deploy"),
    ("แชร์ลิงก์", "Share the link", "share"),
]
PW, PH = 290, 176
for i, (th, en, kind) in enumerate(steps):
    x0, y0 = 10 + (i % 3) * (PW + 5), 10 + (i // 3) * (PH + 12)
    cx = x0 + PW / 2
    s.box(x0, y0, PW, PH, "nt-band-a" if (i + i // 3) % 2 == 0 else "nt-band-b", 14)
    s.add(f'<circle cx="{x0 + 20:g}" cy="{y0 + 24}" r="12" class="pl-dot"/>')
    s.text(x0 + 20, y0 + 30, str(i + 1), "pl-num", "middle")
    s.both(x0 + 38, y0 + 30, th, en, "ks-h")
    yv = y0 + 52
    if kind == "signin":
        s.box(x0 + 20, yv, PW - 40, 30, "ks-bar", 15)
        s.text(cx, yv + 20, "share.streamlit.io", "ks-mono", "middle")
        s.box(x0 + 50, yv + 44, PW - 100, 32, "ks-btn", 16)
        s.text(cx, yv + 65, "Continue with GitHub", "gt-small", "middle")
        s.both(cx, yv + 104, "ใช้บัญชี GitHub เดิม", "use your GitHub account", "in-sub", "middle")
    elif kind == "create":
        s.box(x0 + PW - 130, yv, 110, 30, "ks-btn-main", 15)
        s.text(x0 + PW - 75, yv + 20, "Create app", "ks-btn-main-t", "middle")
        s.both(x0 + PW - 75, yv + 48, "มุมขวาบน", "top right", "in-sub", "middle")
        s.box(x0 + 30, yv + 66, PW - 60, 30, "ks-btn", 15)
        s.text(cx, yv + 86, "Yup, I have an app", "gt-small", "middle")
    elif kind == "form":
        for k, (lab, val) in enumerate([("Repository", "you/my-streamlit-app"), ("Branch", "main"), ("Main file path", "app.py")]):
            yy = yv + k * 38
            s.text(x0 + 20, yy + 10, lab, "in-sub")
            s.box(x0 + 20, yy + 14, PW - 40, 20, "ks-bar", 6)
            s.text(x0 + 30, yy + 29, val, "gt-small")
    elif kind == "secrets":
        s.box(x0 + 20, yv, 150, 26, "ks-btn", 13)
        s.text(x0 + 95, yv + 18, "Advanced settings", "gt-small", "middle")
        s.text(x0 + 20, yv + 46, "Secrets", "in-sub")
        s.box(x0 + 20, yv + 52, PW - 40, 30, "ks-term", 6)
        s.text(x0 + 30, yv + 72, 'GEMINI_API_KEY = "…"', "ks-term-t")
        s.both(cx, yv + 108, "แล้วกด Save", "then click Save", "in-sub", "middle")
    elif kind == "deploy":
        s.box(x0 + 80, yv, PW - 160, 32, "ks-btn-main", 16)
        s.text(cx, yv + 21, "Deploy", "ks-btn-main-t", "middle")
        s.both(cx, yv + 58, "ติดตั้งไลบรารีจาก requirements.txt", "installs requirements.txt", "in-sub", "middle")
        s.both(cx, yv + 80, "รอสักครู่ (ไม่กี่นาที)", "takes a few minutes", "in-sub", "middle")
    else:
        s.box(x0 + 20, yv, PW - 40, 30, "ks-bar", 15)
        s.text(cx, yv + 20, "🔒 my-app.streamlit.app", "ks-mono", "middle")
        s.both(cx, yv + 58, "ส่งลิงก์ให้ใครก็เปิดได้", "anyone with the link can open it", "in-sub", "middle")
        s.both(cx, yv + 82, "แก้โค้ด → Commit → Sync", "edit → Commit → Sync", "gt-verb", "middle")
        s.both(cx, yv + 104, "แอปอัปเดตเอง", "and the app updates itself", "in-sub", "middle")
s.save("l14-deploy-steps.svg", 2 * PH + 32)
