#!/usr/bin/env python3
"""Build the public architecture report; requires Python-Markdown (pip install Markdown)."""
from pathlib import Path
import argparse
import posixpath
import re
import sys

try:
    import markdown
except ImportError:
    sys.exit("Install Python-Markdown to build this report: python3 -m pip install Markdown")

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "docs/platform-architecture/README.md"
TARGET = SOURCE.with_name("index.html")
md = markdown.Markdown(extensions=["tables", "fenced_code", "toc"], extension_configs={"toc": {"toc_depth": "2-2"}})
article = md.convert(SOURCE.read_text())

def source_link(match):
    href = match.group(1)
    path = posixpath.normpath("docs/platform-architecture/" + href)
    return 'href="https://github.com/godwillsaveyoutoo-pixel/LeraarBob/blob/main/' + path + '"'

article = re.sub(r'href="(\.\./\.\./[^"?#]+\.(?:js|css|md|html))"', source_link, article)
article = re.sub(r"(<table>.*?</table>)", r'<div class="table-scroll" tabindex="0" role="region" aria-label="Vergelijkingstabel, horizontaal te verschuiven">\1</div>', article, flags=re.S)
# The technical examples remain available without scripting while keeping the first read focused.
article = re.sub(r'(<h2 id="18[^"]*".*?)(?=<h2 id="19)', r'<details class="technical"><summary>Technische contracten en voorbeeldvelden</summary>\1</details>', article, flags=re.S)
page = '''<!doctype html>
<html lang="nl-BE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#193b4e">
<title>Structuurvoorstel · leraarBob</title><link rel="icon" href="../../assets/favicon.svg">
<script>try{document.documentElement.dataset.mode=localStorage.getItem('axioma-mode')==='dark'?'dark':'light';}catch{}</script>
<link rel="stylesheet" href="../../shared/collapsible-topbar.css"><link rel="stylesheet" href="../../shared/leraarbob-topbar.css">
<style>
:root{color-scheme:light;--paper:#fffdf8;--page:#f3f0e7;--ink:#173b50;--text:#253b47;--muted:#526877;--line:#ccd6d9;--tint:#e2edf2;--accent:#a94e06}
html[data-mode=dark]{color-scheme:dark;--paper:#162834;--page:#0f1d27;--ink:#d2e7f3;--text:#e1e9ed;--muted:#b7cbd5;--line:#3f5868;--tint:#203c4d;--accent:#ffb778}
*{box-sizing:border-box}html{scroll-padding-top:100px}body{margin:0;background:var(--page);color:var(--text);font:17px/1.65 system-ui,-apple-system,sans-serif}
header{background:#193b4e;color:white;min-height:52px}a{color:var(--accent);text-underline-offset:3px;overflow-wrap:anywhere}a:hover{text-decoration-thickness:2px}
.skip{position:absolute;top:-80px;left:12px;padding:12px;background:var(--paper);z-index:1000}.skip:focus{top:8px}
.page-layout{max-width:1440px;margin:auto;display:grid;grid-template-columns:270px minmax(0,1fr);gap:28px;padding:28px}
.contents{position:sticky;top:96px;align-self:start;max-height:calc(100vh - 120px);overflow:auto;background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:14px;font-size:14px}
.contents summary{font-weight:750;color:var(--ink);cursor:pointer;min-height:44px;display:flex;align-items:center}.contents ul{list-style:none;padding:0;margin:0}.contents li+li{border-top:1px solid var(--line)}.contents a{display:flex;align-items:center;min-height:44px;padding:8px 4px;line-height:1.45;color:var(--ink);text-decoration:none}
article{min-width:0;background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:clamp(18px,3vw,46px);box-shadow:0 2px 8px #00000008}article>h1{font-size:clamp(28px,4vw,42px);line-height:1.18;margin:8px 0 18px;color:var(--ink)}
h2{font-size:27px;line-height:1.3;margin:56px 0 18px;border-top:2px solid var(--line);padding-top:25px;color:var(--ink);scroll-margin-top:100px}h3{font-size:21px;color:var(--ink);margin-top:30px}p{margin:16px 0}li{margin:7px 0}strong{color:var(--ink)}code{font-size:.88em;overflow-wrap:anywhere}pre{max-width:100%;overflow:auto;background:var(--tint);padding:18px;border-radius:6px;line-height:1.6}pre code{overflow-wrap:normal}
.table-scroll{max-width:100%;overflow:auto;margin:24px 0;border:1px solid var(--line);border-radius:6px;outline-offset:3px}table{border-collapse:collapse;width:100%;font-size:14px;line-height:1.55;min-width:640px}th,td{padding:12px 14px;vertical-align:top;text-align:left;border-bottom:1px solid var(--line)}th{background:var(--tint);color:var(--ink)}tbody tr:last-child td{border-bottom:none}
.eyebrow{font-size:12px;font-weight:750;letter-spacing:.13em;color:var(--muted);text-transform:uppercase}.report-actions{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:24px}.report-actions a{display:inline-flex;align-items:center;min-height:44px;padding:8px 13px;border:1px solid var(--line);border-radius:5px;color:var(--ink);text-decoration:none;font-size:14px}
.architecture{margin:30px 0;padding:20px;background:var(--tint);border:1px solid var(--line);border-radius:8px}.architecture h2{border:0;margin:0 0 15px;padding:0;font-size:22px}.architecture .engine,.architecture .reports{background:var(--paper);padding:13px;border:1px solid var(--line);border-radius:5px;text-align:center}.architecture small{display:block;font-size:13px;line-height:1.5;color:var(--muted)}.architecture .branches{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.architecture .branch{padding:12px;background:var(--paper);border:1px solid var(--line);border-radius:5px;text-align:center}.architecture .arrow{text-align:center;line-height:1.3;color:var(--muted);font-size:22px}.architecture .footnote{font-size:13px;margin:12px 0 0}
.technical{border:1px solid var(--line);border-radius:6px;padding:12px 18px;margin-top:36px}.technical summary{min-height:44px;cursor:pointer;font-weight:750;color:var(--ink)}.technical h2{margin-top:12px}footer{max-width:1000px;margin:10px auto 30px;padding:0 24px;color:var(--muted);font-size:14px}
:focus-visible{outline:3px solid var(--accent);outline-offset:3px}html:has(.lb-collapsed){scroll-padding-top:60px}body.topbar-collapsed .contents{top:64px}body.topbar-collapsed .page-layout{padding-top:64px}
@media(max-width:980px){.page-layout{display:block;padding:16px}.contents{position:static;max-height:none;margin-bottom:16px}.contents ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}.contents li{border-top:1px solid var(--line)}}
@media(max-width:560px){body{font-size:16px}.page-layout{padding:10px}.contents ul{display:block}article{padding:18px 15px}h2{font-size:23px;margin-top:38px}.architecture{padding:14px}.architecture .branches{grid-template-columns:1fr}.technical{padding:10px}pre{padding:12px}footer{padding:0 16px}}
@media print{header,.lb-restore,.contents,.report-actions,.skip{display:none!important}.page-layout{display:block;padding:0}body,article{background:white;color:#111}article{border:0;box-shadow:none;padding:0}a{color:#111}h2{break-after:avoid}.table-scroll{overflow:visible}table{min-width:0;font-size:10px}th,td{padding:5px}pre{white-space:pre-wrap}.architecture,.technical{break-inside:avoid}}
</style><script src="../../shared/leraarbob-topbar.js" data-title="Structuurvoorstel" data-game-href="docs/platform-architecture/" data-context="none" data-theme-mode="site" data-nav-pilot="true" defer></script>
</head><body><a class="skip" href="#report">Naar het rapport</a><header data-collapsible-topbar><span>leraarBob · Structuurvoorstel</span></header>
<div class="page-layout"><nav class="contents" aria-label="Inhoud van het rapport"><details open><summary>Inhoud · 19 onderdelen</summary>__TOC__</details></nav>
<article id="report"><div class="eyebrow">Analyse en ontwikkelvoorstel · 5 oktober 2026</div><div class="report-actions"><a href="../../index.html">Naar leraarBob</a><a href="../../games/getallenwereld/">Getallenwereld openen</a><a href="https://github.com/godwillsaveyoutoo-pixel/LeraarBob/blob/main/docs/platform-architecture/README.md">Bronversie op GitHub</a></div>
__ARTICLE__
</article></div><footer>Dit rapport bevat bestaande functies en voorstellen voor volgende fasen. Leerlinganalytics, nieuwe sessierollen en publieke profielen zijn hiermee niet automatisch ingevoerd.</footer>
<script>
const contents=document.querySelector('.contents details'),compact=matchMedia('(max-width:980px)');
if(compact.matches)contents.open=false;
document.querySelector('.contents').addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const id=decodeURIComponent(a.hash.slice(1)),target=document.getElementById(id);if(target?.closest('.technical'))target.closest('.technical').open=true;if(compact.matches)contents.open=false;});
</script><script src="../../shared/collapsible-topbar.js"></script></body></html>
'''
diagram = '''<section class="architecture" aria-label="Voorgestelde architectuur"><h2>De samenhang in één overzicht</h2><div class="engine"><strong>Wereld → onderwerp → level → opgave</strong><small>Gedeelde inhoudsdefinitie, met een eigen generator en validator per vak</small></div><div class="arrow" aria-hidden="true">↓</div><div class="branches"><div class="branch"><strong>Solo-werkbord</strong><small>Eigen poging, feedback en echte spelvoortgang</small></div><div class="branch"><strong>Samen met de klas</strong><small>Leren of battle · host, leerling en leerkracht-deelnemer</small></div><div class="branch"><strong>Oefenblad</strong><small>Vaste vragen, A4 en aparte sleutel · geen XP-poging</small></div></div><div class="arrow" aria-hidden="true">↓</div><div class="reports"><strong>Privé voortgang en bevoegde rapportage</strong><small>Spelstand + afzonderlijke activiteiten en resultaten; publieke kaart met eigen veldselectie</small></div><p class="footnote">Eén platform voor routes, accounts, rollen en presentatie. Vakmotoren bewaren de inhoudelijke correctheid. Papier blijft een document; een papieren leerresultaat ontstaat pas bij een afzonderlijk geregistreerde poging.</p></section>'''
# Put the overview after the opening caveat, before the numbered analysis.
article = article.replace('<h2 id="1-', diagram + '<h2 id="1-', 1)
page = page.replace('__TOC__', md.toc).replace('__ARTICLE__', article)
parser = argparse.ArgumentParser()
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
if args.check:
    if not TARGET.exists() or TARGET.read_text() != page:
        sys.exit("Platform report is out of date: python3 scripts/build-platform-report.py")
    print("Platform report is current")
else:
    TARGET.write_text(page)
    print("Built docs/platform-architecture/index.html")
