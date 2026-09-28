#!/usr/bin/env bash
set -euo pipefail

# LeraarBob Rechten cleanup — pass 2
# Runs on the already-migrated worktree. Does NOT commit or push.
# It archives obvious local duplicates outside the repo before removing them.

fail() { echo "ERROR: $*" >&2; exit 1; }

[ -d .git ] || fail "Voer dit script uit in de root van de LeraarBob-repository."
[ -d games/rechten/rechtenwereld ] || fail "games/rechten/rechtenwereld ontbreekt."
[ -d games/rechten/core ] || fail "games/rechten/core ontbreekt."
[ -d games/rechten/trainer ] || fail "games/rechten/trainer ontbreekt."

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="../LeraarBob-cleanup-backup-$STAMP"
mkdir -p "$BACKUP"

archive_if_present() {
  local p="$1"
  if [ -e "$p" ]; then
    echo "Archiveer: $p"
    mkdir -p "$BACKUP/$(dirname "$p")"
    mv "$p" "$BACKUP/$p"
  fi
}

echo "== 1. Archiveer duidelijke lokale duplicaten =="
archive_if_present "games/rechten/trainer-v1"
archive_if_present "rechtentrainer-startpagina-mockup-v3-dropin"
archive_if_present "reorganize_leraarbob_rechten.sh"

echo "== 2. Rechtenwereld: alle core-verwijzingen naar games/rechten/core =="
python3 - <<'PY'
from pathlib import Path

root = Path("games/rechten/rechtenwereld")
exts = {".html", ".js", ".cjs", ".md"}
for p in root.rglob("*"):
    if not p.is_file() or p.suffix.lower() not in exts:
        continue
    s = p.read_text(encoding="utf-8")
    old = s
    # Preserve the relative depth, only change the directory name.
    s = s.replace("../trainer/transfer-workbench-core.js", "../core/transfer-workbench-core.js")
    s = s.replace("../trainer/transfer-core.js", "../core/transfer-core.js")
    s = s.replace("../trainer/wave-core.js", "../core/wave-core.js")
    s = s.replace("../trainer/journey-core.js", "../core/journey-core.js")
    s = s.replace("../../trainer/transfer-workbench-core.js", "../../core/transfer-workbench-core.js")
    s = s.replace("../../trainer/transfer-core.js", "../../core/transfer-core.js")
    s = s.replace("../../trainer/wave-core.js", "../../core/wave-core.js")
    s = s.replace("../../trainer/journey-core.js", "../../core/journey-core.js")
    if s != old:
        p.write_text(s, encoding="utf-8")
        print("  aangepast:", p)
PY

echo "== 3. Oude Rechtentrainer: gebruik dezelfde gedeelde core =="
python3 - <<'PY'
from pathlib import Path

root = Path("games/rechten/trainer")
exts = {".html", ".js", ".cjs", ".md"}
names = ("wave-core.js","journey-core.js","transfer-core.js","transfer-workbench-core.js")

for p in root.rglob("*"):
    if not p.is_file() or p.suffix.lower() not in exts:
        continue
    if p.name in names:
        continue
    s = p.read_text(encoding="utf-8")
    old = s

    # Browser script paths from trainer root.
    for n in names:
        s = s.replace(f'src="{n}"', f'src="../core/{n}"')
        s = s.replace(f"src='{n}'", f"src='../core/{n}'")
        # Node/CommonJS paths from files living in trainer/.
        s = s.replace(f"require('./{n}')", f"require('../core/{n}')")
        s = s.replace(f'require("./{n}")', f'require("../core/{n}")')

    if s != old:
        p.write_text(s, encoding="utf-8")
        print("  aangepast:", p)
PY

echo "== 4. Verwijder nu de vier dubbele corebestanden uit trainer/ =="
for f in wave-core.js journey-core.js transfer-core.js transfer-workbench-core.js; do
  if [ -f "games/rechten/trainer/$f" ]; then
    rm "games/rechten/trainer/$f"
    echo "  verwijderd: games/rechten/trainer/$f"
  fi
done

echo "== 5. Multiplayer buildscript naar Rechtenwereld + core =="
python3 - <<'PY'
from pathlib import Path
p = Path("scripts/build-multiplayer-pages.cjs")
if p.exists():
    s = p.read_text(encoding="utf-8")
    old = s
    s = s.replace("const rechten='games/rechten/trainer-v2'", "const rechten='games/rechten/rechtenwereld'")
    s = s.replace('const rechten="games/rechten/trainer-v2"', 'const rechten="games/rechten/rechtenwereld"')
    s = s.replace("'../trainer/transfer-workbench-core.js'", "'../core/transfer-workbench-core.js'")
    s = s.replace("'../trainer/transfer-core.js'", "'../core/transfer-core.js'")
    s = s.replace("'../trainer/wave-core.js'", "'../core/wave-core.js'")
    s = s.replace("'../trainer/journey-core.js'", "'../core/journey-core.js'")
    s = s.replace('"../trainer/transfer-workbench-core.js"', '"../core/transfer-workbench-core.js"')
    s = s.replace('"../trainer/transfer-core.js"', '"../core/transfer-core.js"')
    s = s.replace('"../trainer/wave-core.js"', '"../core/wave-core.js"')
    s = s.replace('"../trainer/journey-core.js"', '"../core/journey-core.js"')
    if s != old:
        p.write_text(s, encoding="utf-8")
        print("  aangepast:", p)
PY

echo "== 6. Tests: actieve route en corepaden actualiseren =="
python3 - <<'PY'
from pathlib import Path

roots = [Path("tests")]
for root in roots:
    if not root.exists():
        continue
    for p in root.rglob("*"):
        if not p.is_file() or p.suffix.lower() not in {".cjs",".js",".md",".json"}:
            continue
        s = p.read_text(encoding="utf-8")
        old = s
        s = s.replace("games/rechten/trainer-v2", "games/rechten/rechtenwereld")
        s = s.replace("/games/rechten/trainer-v2/", "/games/rechten/rechtenwereld/")
        s = s.replace("games/rechten/trainer/wave-core.js", "games/rechten/core/wave-core.js")
        s = s.replace("games/rechten/trainer/journey-core.js", "games/rechten/core/journey-core.js")
        s = s.replace("games/rechten/trainer/transfer-core.js", "games/rechten/core/transfer-core.js")
        s = s.replace("games/rechten/trainer/transfer-workbench-core.js", "games/rechten/core/transfer-workbench-core.js")
        # A few tests compare a return URL as plain text.
        s = s.replace("includes('trainer-v2')", "includes('rechtenwereld')")
        s = s.replace('includes("trainer-v2")', 'includes("rechtenwereld")')
        if s != old:
            p.write_text(s, encoding="utf-8")
            print("  aangepast:", p)
PY

echo "== 7. Productcatalogus en actieve README opruimen =="
python3 - <<'PY'
from pathlib import Path

# games.json
p = Path("games.json")
if p.exists():
    s = p.read_text(encoding="utf-8")
    s = s.replace("games/rechten/trainer-v2/#wereld", "games/rechten/rechtenwereld/#wereld")
    p.write_text(s, encoding="utf-8")

# Rechtenwereld README: remove obsolete migration phrasing and stale paths.
p = Path("games/rechten/rechtenwereld/README.md")
if p.exists():
    s = p.read_text(encoding="utf-8")
    s = s.replace("bestaande trainer-v2, nieuwe shell", "actieve wereldshell")
    s = s.replace("trainer-v2", "rechtenwereld")
    s = s.replace("Geïntegreerd vanuit `rechten-hill-final`; bereikbaar via **Rechtenwereld** op de startpagina.",
                  "Dit is de actieve productieversie van **Rechtenwereld** op de startpagina.")
    p.write_text(s, encoding="utf-8")
PY

echo "== 8. Documentatie: alleen concrete padverwijzingen actualiseren =="
python3 - <<'PY'
from pathlib import Path
root = Path("docs")
if root.exists():
    for p in root.rglob("*"):
        if not p.is_file() or p.suffix.lower() not in {".md",".html",".json",".txt"}:
            continue
        try:
            s = p.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        old = s
        s = s.replace("games/rechten/trainer-v2/", "games/rechten/rechtenwereld/")
        s = s.replace("/games/rechten/trainer-v2/", "/games/rechten/rechtenwereld/")
        if s != old:
            p.write_text(s, encoding="utf-8")
PY

echo
echo "== 9. Controle =="
echo "--- onverwachte actieve trainer-v1/mockup refs ---"
grep -RIn \
  --exclude-dir=.git \
  --exclude-dir=docs \
  --exclude-dir=games/rechten/trainer-v2 \
  -E 'trainer-v1|rechtentrainer-startpagina-mockup-v3-dropin|rechten-hill-final|wereld-prototype' \
  games scripts tests ./*.json ./*.md 2>/dev/null || true

echo
echo "--- oude trainer-core refs buiten compatibiliteitsredirect ---"
grep -RIn \
  --exclude-dir=.git \
  -E '\.\./(\.\./)?trainer/(wave-core|journey-core|transfer-core|transfer-workbench-core)\.js' \
  games/rechten/rechtenwereld scripts tests 2>/dev/null || true

echo
echo "--- trainer-v2 refs in actieve code/tests (redirectmap zelf uitgezonderd) ---"
grep -RIn \
  --exclude-dir=.git \
  --exclude-dir=trainer-v2 \
  'trainer-v2' \
  games/rechten scripts tests games.json 2>/dev/null || true

echo
echo "Backup van verwijderde lokale duplicaten:"
echo "  $BACKUP"
echo
echo "Geen commit of push uitgevoerd."
echo "Controleer nu:"
echo "  git status --short"
echo "  python3 -m http.server 8775 --bind 127.0.0.1"
echo "  open: http://127.0.0.1:8775/games/rechten/rechtenwereld/#wereld"
