# Eén bovenbalk en bereikbare vensteracties

10 oktober 2026, vervolg op `7dc1c0b`, branch `codex/os-personal-pilot-20261010`, PR #13.

## Gewijzigd gedrag

- Zeeslag gebruikt nu dezelfde enkele OS-bovenbalk als Rechtenwereld. De extra balk met appnaam en vensteracties neemt geen speelruimte meer in. De native beurt-/sessiestatus blijft in het spel.
- **Terug** en **App afsluiten** staan rechtstreeks in de taakbalk, ook op smalle schermen. **Meer vensteracties** bevat alleen Bewaren, Apart openen en Minimaliseren. De bestaande sluitbevestiging blijft behouden.
- **Balken verbergen** vervangt het minder duidelijke label Focus. Zowel de grote bovenbalk als de taakbalk verdwijnen. Een gereserveerde strook van 52 pixels onder het spel bevat Terug, Balken tonen en Sluiten. De knoppen zijn minimaal 44 × 44 pixels en liggen buiten de opgave en antwoordbediening.
- Terug behoudt de geopende app; bevestigd sluiten verwijdert alleen dat appvenster en keert terug naar zijn eigen map/bureaublad. Andere apps blijven geopend. Sluiten annuleren verandert de invoer niet.
- Focus en de afzonderlijke inklapkeuze blijven voorkeuren; wisselen van weergave herlaadt de iframe niet. Bij herladen wordt de focusvoorkeur opnieuw toegepast wanneer je een app opent. Dit is geen nieuwe opslag van spelstatus.
- Op schermen van maximaal 360 pixels breed krijgt directe vensterbediening voorrang op de rij geopende apps. Start en Terug blijven beschikbaar. Bij terugkeer naar het bureaublad is de appwisselaar weer zichtbaar.

Dit wijzigt de centrale OS-bediening. Er zijn geen andere spelmenu’s gestript, rekenkernen aangepast of voortgangs-/accountproviders vervangen.

## Werkelijk getest

| Rapport | Uitgevoerd |
| --- | --- |
| [Rechtenwereld](rechten.json) | 5 groepen / 39 doelmetingen: één 58px bovenbalk, gekozen antwoord behouden, beide inklapstanden, focus, terug, hervatten, sluiten annuleren via knop en Escape, werkelijk sluiten en desktop herstellen; 1366 × 768, 640 × 360, 390 × 844, 320 × 568 |
| [Zeeslag](zeeslag.json) | 6 groepen / 21 layouts: beide balkstanden én focus op vijf schermmaten (ook 844 × 390), directe sluit-/terugknoppen buiten het spel, alle 63 richtinstellingen, echte vlootplaatsing en schot, computerbeurt, annuleren, alleen Zeeslag sluiten terwijl Rechtenwereld behouden blijft |
| [Vier OS-pilots](pilots.json) | 32 groepen / 23 layouts: oorspronkelijke oefening/spel, eigen terugkeerplek, bewaren, Start, accountdialoog, focus, minimaliseren en hervatten; Zeeslag op telefoon via Meer → Bewaren en vervolgens echt afvuren |
| [Centrale papierwerkruimte](paper.json) | 8 groepen / 39 doelmetingen: alle 13 Algebra-papieronderdelen, generatie/bewaren, onderwerpmap, native venster/formulier behouden, accountwisseling tijdens generatie; test wacht op het asynchroon geladen archief voordat hij de zes reeksen telt |
| [Desktop/topbar](units.txt) | 25 geslaagde unitcontroles |

Chromium/Brave bij 100% zoom en `deviceScaleFactor: 1`. Geïsoleerde lokale accounts; productieaanmelding en externe multiplayer zijn geen onderdeel van deze controle. Alle gerapporteerde browserruns hebben geen onverwachte browserfouten. Cataloguscontrole, pakketcontrole (74 elementen / 18 frontendafhankelijkheden), syntax en `git diff --check` slagen. Bestaande tests in CI zijn uitgebreid; GitHub-controles worden na push afzonderlijk uitgevoerd.

## Screenshots en preview

- [Rechtenwereld met één bovenbalk](rechten-expanded.png)
- [Oefening zonder grote balken, met directe uitgangen](rechten-focus.png)
- [Uitgangen op een telefoon van 320 pixels](rechten-focus-320.png)
- [Zeeslag met één bovenbalk](zeeslag-expanded.png)
- [Zeeslag in focusstand op telefoon](zeeslag-focus-390.png)

Preview: `http://127.0.0.1:8794/os/?previewUser=alex`. Vernieuw de OS-pagina voor de nieuwe bediening. Open Rechtenwereld via Solo, of zoek Zeeslag via Start. De knop **Balken verbergen** staat in de taakbalk; ook zonder balken kun je terug of sluiten.

Bronwijzigingen: `os/desktop.js` verplaatst bestaande knoppen zonder nieuwe handlers/iframes; `os/index.html` bevat de focusstrook en vernieuwde assetadressen; `os/personal.css` reserveert ruimte en maakt sluiten direct bereikbaar. Vier bestaande browsertests zijn aangepast/uitgebreid. [Hashes](source-hashes.json) identificeren de bronversie.

```sh
NODE_PATH=/tmp/leraarbob-os-deps/node_modules node tests/personal-chrome-browser.cjs
NODE_PATH=/tmp/leraarbob-os-deps/node_modules node tests/zeeslag-controls-browser.cjs
NODE_PATH=/tmp/leraarbob-os-deps/node_modules node tests/desktop-pilot-browser.cjs
NODE_PATH=/tmp/leraarbob-os-deps/node_modules node tests/central-worksheet-browser.cjs
NODE_PATH=/tmp/leraarbob-os-deps/node_modules node --test --test-isolation=none tests/desktop-dom.test.cjs tests/topbar-desktop.test.cjs
```

`LB_CHROMIUM` kiest de browser; de scripts ondersteunen hun eigen screenshot-uitvoermap. Geen productie-uitrol in deze wijziging.
