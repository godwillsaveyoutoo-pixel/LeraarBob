# Rechtenwereld: refactor van de bestaande trainer-v2

Datum: 26 september 2026.

De opgeleverde route is **Rechtenwereld → Grenspas → Wanneer is f(x) > 0?**.
De shell, kaart, gebiedsschermen, navigatie en Grenspas-weergave zijn vernieuwd
volgens de aangeleverde mockups. Er is geen trainer-v3 of nieuwe wiskundige engine.
De eerste v2-implementatie en de overige missies blijven aanwezig.

## Branch, werkmap en openen

- Repository: `godwillsaveyoutoo-pixel/LeraarBob`.
- Branch: `feat/rechten-v2-world-shell`.
- Basis: `e104ecf`, de bestaande `feat/rechten-radical-redesign-v2`.
- Vaste werkmap: `/home/johan/Documenten/GitHub/LeraarBob-rechten-shell`.
- Oorspronkelijke werkmap en niet-gecommitte experimenten zijn intact gebleven.
- De bestaande productiepagina `/games/rechten/trainer/` is ongewijzigd.
- Er is geen push, deployment, databasewijziging of migratie van leerlingdata uitgevoerd.

Start vanuit de werkmap `python3 -m http.server 8775 --bind 127.0.0.1`.
Tijdens de oplevering draait deze previewserver al.

| Route | Functie |
| --- | --- |
| [Rechtenwereld](http://127.0.0.1:8775/games/rechten/trainer-v2/#wereld) | Vijf geïllustreerde eilanden; Grenspas actief |
| [Grenspas](http://127.0.0.1:8775/games/rechten/trainer-v2/#grenspas) | Vijf herkenbare skillnodes; positieve tekenvraag actief |
| [Oefenen](http://127.0.0.1:8775/games/rechten/trainer-v2/#oefenen) | Start/hervat de actieve missie |
| [Voortgang](http://127.0.0.1:8775/games/rechten/trainer-v2/#voortgang) | Bewaard oefenbewijs en afgeronde route |
| [Profiel](http://127.0.0.1:8775/games/rechten/trainer-v2/#profiel) | Bestaand account, opslagstatus, synchronisatie en backup |

De volledige oude ontwikkelslices blijven bereikbaar via
`?slice=grenspas`, `?slice=hellingrug` en `?slice=signaalstad`.
Ze zijn niet als extra actieve gebieden in de nieuwe kaart ontsloten.

## Commits en bestanden

- `1b42e0839742246e31702b07afa42cc83394a4b4`: volledige refactor, illustraties,
  behoudcontracten en geteste shell/route.
- Het aparte documentatiecommit bevat dit rapport, 11 screenshots, logs en de
  volledige [bestandsinventaris](CHANGED_FILES.txt). De SHA is reproduceerbaar via
  `git log -1 --format=%H -- docs/rechten-v2/world-shell/IMPLEMENTATION_REPORT.md`.

Validatieomgeving: Node v24.18.1, Chromium 153.0.8010.36 (snap), geïsoleerd profiel
op CDP-poort 9245. Er zijn geen npm-dependencies of buildtools toegevoegd.

## Wat veranderde

De gedeelde bovenbalk heeft een logo, broodkruimelpad, profielicoon en menuknop.
XP/streak worden alleen getoond wanneer de bestaande opslag echte waarden bevat;
de voorbeeldwaarden uit screenshots worden niet als default in de app gezet.
Op kleine schermen verdwijnen secundaire HUD-elementen.

De vijf eilanden hebben native klikvlakken en labels. Een slot, vinkje en tekst
onderscheiden later beschikbaar, huidig en afgerond. Deze beschikbaarheid is de
scope van deze oplevering; het is geen vervangende unlockplanner. Voortgang is een
aparte bestemming en een afgeronde opgave wordt niet als volledige mastery geteld.

Grenspas toont een centraal eiland met vijf vaardigheidsnodes. De actieve route
behoudt de bestaande drie stappen: eigen nulwaarde plaatsen, een strikt x-gebied
kiezen en de ongelijkheid samenstellen. De nieuwe antwoordbediening gebruikt
stapknoppen, duidelijke gebiedskeuzes en tekenknoppen. De grafiek blijft exacte SVG.
Een blanco waardeveld toont `?`, nooit het antwoord. Tekenkleuren verschijnen pas
na een correcte gebiedscommit. Zelfstandige evidence krijgt geen ongevraagde hint.

Na een afgeronde opgave gaat de leerling terug naar Grenspas. De runtime heeft dan
al het volgende dalende positieve contrastgeval bewaard. Na beide positieve
gevallen biedt de shell expliciet opnieuw oefenen. Bestaande events blijven
behouden, zodat een verdiend vinkje niet verdwijnt bij opnieuw beginnen.

## Behouden contracten

[PRESERVED_CORE.json](PRESERVED_CORE.json) beschermt zeven bestanden byte voor byte:

- `semantic-math-core.js` en `mission-runtime.js`;
- `evidence-adapter.js` en `scheduler-adapter.js`;
- `storage.js`, `content/skills.json` en `components/workbench.js`.

Alle 27 skill-ID’s en skillfamilies, exacte validators, adaptieve planner,
commit/repair/refresh, evidence, accounts, conflictafhandeling en cloudprotocol
zijn behouden. De bestaande v1-regressiegate bevestigt ook **87/87 ongewijzigde
productie- en testbestanden**. Gedeelde auth- en progressmodules zijn niet aangepast.

De gebiedsstap gebruikt `settings.shell.area` binnen het bestaande uitbreidbare
settings-object. De toegestane runtime-schermen blijven world/mission/book/profile;
het is geen nieuwe opslagversie. Hashnavigatie bewaart terug/vooruit en heropening.
Een reeds actieve oudere Hellingrug- of Signaalstad-missie blijft hervatbaar.
Bij accountwissel verdwijnt de oude readmodel direct; bij een conflict blokkeert
bewerken totdat de bestaande keuze- en backupflow is afgerond.

## Mobile en toegankelijkheid

Wereld, gebied, profiel en voortgang passen in portret en landscape zonder scroll.
Gameplay behoudt het reeds afgesproken Mobile Layout Contract: minimaal 640×360
landscape, referentie 780×360. Portret toont een korte draaiaanwijzing en een
terugknop; het werk blijft bewaard. Dit contract is expliciet vastgelegd in de
meegeleverde masterprompt en [eerdere audit](../REDESIGN_AUDIT.md).

Er zijn native buttons en inputs, minimaal 44-pixel klikvlakken, benoemde controles,
zichtbare focus, toetsenbordbediening, statusfeedback, reduced motion en forced colors.
Het menu maakt de achterliggende inhoud inert en Escape herstelt de focus.
Wiskunde en labels zitten niet in de illustraties. De aangescherpte browsercheck
controleert ook labels binnen het kaartvlak, intro-overlap en knoptekst-overloop.

## Testresultaten

| Suite | Resultaat |
| --- | --- |
| Unit/math/runtime/storage/auth/catalogus/docent | **131/131 geslaagd** |
| Nieuwe shell/route/mobile/accessibility | **65 controles/groepen**, 37 screenshots |
| Bestaande v2-browserregressies | **145 controles/groepen**, 28 screenshots |
| Bestaande losse mechaniekproef | **5 groepen geslaagd** |
| Bestaande shell/accountintegratie | **5 groepen geslaagd** |
| Beschermde v2-kern | **7/7 SHA-256 identiek** |
| Beschermde v1-productie en tests | **87/87 SHA-256 identiek** |

Schermformaten: 320×568, 360×640, 390×844, 640×360, 780×360, 844×390,
1024×768, 1366×768 en 1920×1080. De route is volledig doorlopen met echte
browser-touch-events en zonder pointer met alleen toetsenbordevents. Onder meer
getest: fout gebied, behoud juiste grens, herstel, draft/commit-herladen,
browser-terug, voltooiing, dalend contrast, opnieuw oefenen en blijvend vinkje.

De bestaande v2-browser- en prototypeharness zijn ongewijzigd. De accounttest
behoudt alle vijf scenario’s en inhoudelijke assertions; alleen de klikroute naar
het gebied, de expliciete Hellingrug-ontwikkelroute en de nieuwe tekenknoppen zijn
aangepast. De harness wacht nu bovendien op een echte document-load bij heropening.
De bestaande assetregressietest is uitgebreid voor de definitieve WebP/font-assets:
kleine native renderers houden hun budget, raster/font krijgen aparte plafonds en
een controle van de werkelijke bestandsgrootte.

De tests gebruiken een geïsoleerd Chromiumprofiel, synthetische accounts en
onderscheppen extern verkeer. Er is niets naar echte leerlingaccounts geschreven.
De exacte commando’s staan in de [README](../../../games/rechten/trainer-v2/README.md).
Machineleesbare browserresultaten en logs staan in [validation/](validation/).

De eerder gemelde zes v1-browserfailures door verouderde UI-selectors blijven
historische baselinebevindingen uit de [vorige oplevering](../IMPLEMENTATION_REPORT.md).
Die suites zijn in deze shellronde niet opnieuw uitgevoerd en niet als groen meegeteld.
Hun bron en de v1-pagina zijn byte-identiek gebleven.

## Screenshots

De referentiebeelden zijn schermopnames van de werkende app, met synthetische
voortgang voor de HUD. De hieronder gekoppelde WebP-versies zijn alleen voor
compacte opname in Git geconverteerd; de volledige PNG-uitvoer staat lokaal in
`/tmp/rechten-shell-validation/` en kan met de browserharness opnieuw worden gemaakt.

| Weergave | Screenshot |
| --- | --- |
| Wereld, desktop | [1366×768](screenshots/world-1366x768.webp) |
| Grenspas, desktop | [1366×768](screenshots/area-1366x768.webp) |
| Oefening, desktop | [1366×768](screenshots/exercise-1366x768.webp) |
| Wereld, klein portret | [320×568](screenshots/world-320x568.webp) |
| Grenspas, klein portret | [320×568](screenshots/area-320x568.webp) |
| Oefening, minimum landscape | [640×360](screenshots/exercise-640x360.webp) |
| Fout antwoord / herstel | [640×360](screenshots/interval-repair-640x360.webp) |
| Correct x-gebied | [640×360](screenshots/interval-correct-640x360.webp) |
| Afgeronde route | [640×360](screenshots/area-completed-640x360.webp) |
| Correcte notatie | [1366×768](screenshots/exercise-correct-1366x768.webp) |
| Hoog contrast | [1366×768](screenshots/forced-colors-1366x768.webp) |

## Nog te beoordelen

Deze ronde bewijst de nieuwe shell en één leerlingroute. De overige gebieden
hebben nog geen nieuwe gebiedsschermen of gemigreerde mechanieken. Bestaande
ontwikkelslices zijn behouden, niet opnieuw vormgegeven.

Een fysieke Samsung A20, de echte mobiele toetsenbord-overlay, iOS Safari en
TalkBack/NVDA zijn nog niet handmatig getest. De automatische checks zijn geen
volledige WCAG-audit of gebruikerstest. Navigatie en gameplay zijn getest op de
opgegeven viewportmaten; grotere systeemtekst en browserzoom vragen nog een aparte
layoutbeoordeling. Een live cloud/account-proef is niet uitgevoerd; het bestaande
protocol is met synthetische revisies, offline werk en conflicten getest.

De twee nieuwe illustraties kosten samen ongeveer 1,14 MiB plus circa 220 KiB voor
het lokale font. Werkelijke cold-load/FPS op een fysiek toestel is nog te meten.
Herkomst, definitieve paden, licentie en prompts staan in [ART_ASSETS](ART_ASSETS.md).
