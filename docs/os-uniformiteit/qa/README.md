# Bewijs van de interfaceanalyse

Onderzochte publicatie: main `296e06b7afb84564f7737ba0f790e27ebf6fa800`, 10 oktober 2026. De [analyse](../ANALYSE.md) beschrijft de conclusies en de voorgestelde bediening.

- [Publieke navigatie en lay-out](report.json): 30 schermmetingen, 34 screenshots, 12 bytegelijke bronbestanden; frisse gasten, alleen same-origin GET, geen antwoorden ingediend of sessies aangemaakt.
- [Vectormissie-kop](vector-header-report.json): zes metingen van de verborgen maar gereserveerde kop, plus zelfstandige menuvergelijking.
- [Rechterklik](rightclick/report.json): lokale mainbron, fictieve leraar, werkelijke rechterknop; oude Grenspas-invoer verandert, actuele Puntenbaai blijft gelijk. Dit is een aangetoond bestaand defect, geen geslaagde eis.

De publieke runs hebben geen JavaScriptfouten of 404. Ze zijn geen bewijs voor productie-login, multiplayer of het volledig beantwoorden van vragen. Historische functionele regressies zijn niet opnieuw uitgevoerd.

## Vervolg: interne structuur

Het [vervolgonderzoek](../INTERNE-STRUCTUUR.md) bevat nieuwe lokale controles, los van de publieke runs hierboven:

- [Native interfaces en vier navigatieproeven](internal-structure-report.json), met [reproduceerbaar script](internal-structure-browser.cjs): frisse gasten op 1366 × 768, 100%, alle externe verbindingen en schrijfacties geblokkeerd.
- [Vijf opnieuw uitgevoerde testbestanden](internal-structure-tests.txt): register, routes, desktopmodel, native Getallen-integratie en documentenbibliotheek; alle geslaagd met fictieve account-/opslagconfiguratie.

Start een lokale frontend met `OS_PREVIEW_PORT=8791 node scripts/serve-os-preview.cjs`. Voer de browserproef uit met `node docs/os-uniformiteit/qa/internal-structure-browser.cjs` en beschikbare Playwright-dependencies. `LB_STRUCTURE_BASE` en `LB_CHROMIUM` kunnen respectievelijk het lokale testadres en browserpad aanpassen. De proef wijzigt uitsluitend zijn JSON-rapport en lokale gastopslag.

## Screenshots

De 36 onderstaande beelden zijn screenshots van bestaande interfaces; geen mock-ups van het voorstel.

| Scherm | Screenshot |
| --- | --- |
| getallen-home-1366 | [Open](getallen-home-1366.png) |
| getallen-play-1366-expanded | [Open](getallen-play-1366-expanded.png) |
| getallen-play-1366-collapsed | [Open](getallen-play-1366-collapsed.png) |
| getallen-play-390-expanded | [Open](getallen-play-390-expanded.png) |
| getallen-play-390-collapsed | [Open](getallen-play-390-collapsed.png) |
| getallen-play-640-expanded | [Open](getallen-play-640-expanded.png) |
| getallen-play-640-collapsed | [Open](getallen-play-640-collapsed.png) |
| getallen-os-menu | [Open](getallen-os-menu.png) |
| getallen-native-menu | [Open](getallen-native-menu.png) |
| algebra-home-1366 | [Open](algebra-home-1366.png) |
| algebra-play-1366-expanded | [Open](algebra-play-1366-expanded.png) |
| algebra-play-1366-collapsed | [Open](algebra-play-1366-collapsed.png) |
| algebra-play-390-expanded | [Open](algebra-play-390-expanded.png) |
| algebra-play-390-collapsed | [Open](algebra-play-390-collapsed.png) |
| algebra-play-640-expanded | [Open](algebra-play-640-expanded.png) |
| algebra-play-640-collapsed | [Open](algebra-play-640-collapsed.png) |
| algebra-os-menu | [Open](algebra-os-menu.png) |
| rechten-home-1366 | [Open](rechten-home-1366.png) |
| rechten-play-1366-expanded | [Open](rechten-play-1366-expanded.png) |
| rechten-play-1366-collapsed | [Open](rechten-play-1366-collapsed.png) |
| rechten-play-390-expanded | [Open](rechten-play-390-expanded.png) |
| rechten-play-390-collapsed | [Open](rechten-play-390-collapsed.png) |
| rechten-play-640-expanded | [Open](rechten-play-640-expanded.png) |
| rechten-play-640-collapsed | [Open](rechten-play-640-collapsed.png) |
| rechten-os-menu | [Open](rechten-os-menu.png) |
| rechten-native-menu | [Open](rechten-native-menu.png) |
| vector-home-1366 | [Open](vector-home-1366.png) |
| vector-play-1366-expanded | [Open](vector-play-1366-expanded.png) |
| vector-play-1366-collapsed | [Open](vector-play-1366-collapsed.png) |
| vector-play-390-expanded | [Open](vector-play-390-expanded.png) |
| vector-play-390-collapsed | [Open](vector-play-390-collapsed.png) |
| vector-play-640-expanded | [Open](vector-play-640-expanded.png) |
| vector-play-640-collapsed | [Open](vector-play-640-collapsed.png) |
| vector-os-menu | [Open](vector-os-menu.png) |
| vector-standalone-menu | [Open](vector-standalone-menu.png) |
| compatibility-grenspas-after-rightclick | [Open](rightclick/compatibility-grenspas-after-rightclick.png) |

## Herhalen

Vanaf de repositoryroot, met Playwright en een geïnstalleerde browser:

```sh
NODE_PATH=/tmp/leraarbob-os-deps/node_modules node docs/os-uniformiteit/qa/audit-browser.cjs
NODE_PATH=/tmp/leraarbob-os-deps/node_modules node docs/os-uniformiteit/qa/vector-header-browser.cjs
NODE_PATH=/tmp/leraarbob-os-deps/node_modules node docs/os-uniformiteit/qa/rightclick-browser.cjs
```

`LB_CHROMIUM` kan een andere Chromium-binary aanwijzen; standaard wordt lokale Brave gebruikt. De twee publieke scripts vereisen netwerk naar GitHub Pages en controleren frontendbestanden tegen de lokale checkout. De rechterklikproef start uitsluitend een tijdelijke localhostserver en gebruikt expliciete authfixtures. Nieuwe rapporten/screenshots overschrijven de bewijsbestanden; gebruik desgewenst een afzonderlijke checkout.
