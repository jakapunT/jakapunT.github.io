#!/bin/bash
# Runs each lesson 14 demo app and saves a real screenshot of it.
#   bash scripts/l14_apps/shoot.sh   (from course/)
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/../../courses/nlp-basic/images"
PY="$HERE/../../.venv/bin/python"
shoot() {  # folder, port, output name, width, height
  (cd "$HERE/$1" && "$PY" -m streamlit run app.py --server.port "$2" --server.headless true \
     --browser.gatherUsageStats false >/dev/null 2>&1 & echo $! > "/tmp/l14_$2.pid")
  for i in $(seq 1 40); do curl -s "http://localhost:$2/_stcore/health" | grep -q ok && break; sleep 0.5; done
  node "$HERE/shoot.mjs" "http://localhost:$2/" "$OUT/$3" "$4" "$5"
  kill "$(cat /tmp/l14_$2.pid)" 2>/dev/null || true
  echo "wrote $3"
}
shoot first  8601 l14-first-app.png 900 560
shoot stage1 8602 l14-stage1.png 1000 1100
shoot stage2 8603 l14-stage2.png 1280 960
shoot stage3 8604 l14-stage3.png 1280 1000
# real apps from the Streamlit community gallery (online; they may need a moment to wake up)
# (lesson images are then resized to 1600 px wide; the dungeon one is saved as JPEG to stay under 300 KB)
for app in "wordler wordler" "llm-examples chatbot" "dungeon dungeon"; do
  set -- $app
  node "$HERE/shoot.mjs" "https://$1.streamlit.app/~/+/" "$OUT/l14-gallery-$2.png" 1280 820 10000
done
"$PY" - "$OUT" <<'PY'
import sys
from PIL import Image
out = sys.argv[1]
for name, ext in (("wordler", "png"), ("dungeon", "jpg")):
    im = Image.open(f"{out}/l14-gallery-{name}.png").convert("RGB")
    im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
    im.save(f"{out}/l14-gallery-{name}.{ext}", **({"quality": 82} if ext == "jpg" else {}), optimize=True)
PY
rm -f "$OUT/l14-gallery-dungeon.png"
cd "$HERE/../.." && "$PY" "$HERE/trim.py" courses/nlp-basic/images/l14-*.png
