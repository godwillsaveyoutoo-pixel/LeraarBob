# Puntenbaai — twee werkende oefenreeksen

In de bestaande trainer-v2, werkboom `LeraarBob-rechten-shell`, branch
`feat/rechten-v2-world-shell`.

[Open Puntenbaai](http://127.0.0.1:8775/games/rechten/trainer-v2/#puntenbaai) ·
[Bekijk screenshots](index.html)

- **Coördinaten lezen (`point`)**: punt P op het rooster, vier unieke antwoordkeuzes;
  het coördinatenlabel verschijnt pas na een correct antwoord.
- **Coördinaten plaatsen (`point_plot`)**: tik/klik in het rooster of gebruik
  pijltjestoetsen; het gekozen punt en hulplijnen zijn direct zichtbaar.
- Beide gebruiken de bestaande papierstijl, topbar, hints, undo, expliciete
  controle, gerichte feedback, herstel en de bestaande voortgangsopslag.
- Zes opgaven per reeks: positief, de drie overige kwadranten, een as en oorsprong.
  Opnieuw oefenen varieert de punten. Beide reeksen bewaren hun eigen antwoord,
  hints en feedback wanneer je pauzeert, wisselt of de pagina vernieuwt.
- De kaart markeert afgeronde reeksen en beveelt de andere oefening aan.
  Er wordt geen productie-mastery of XP toegekend. Bestaande v1-voortgang blijft intact.

## Techniek

De nieuwe `points-core.js` adapter hergebruikt `RechtenWave.generate('point_plot')`
en `RechtenWave.constructionCheck` voor exacte x/y-vergelijkingen. De meerkeuzevraag
vertaalt de gekozen optie naar hetzelfde exacte coördinatenpaar. De originele
validators en skill-ID’s zijn niet gewijzigd.

`mission-runtime.js` is uitgebreid met de fase `coordinate`. Beide reeksen
staan onder hun eigen bestaande skill-ID in `state.missions`; de wereld blijft
`puntenbaai`. Het opslagschema blijft versie 1. Een bestaand `#oefenen`-adres
hervat de actieve reeks. Oude halte-adressen bieden nu een oefenknop.

De graph gebruikt echte SVG-coördinaten via de inverse schermmatrix; de
plaatsing blijft daardoor correct als het rooster schaalt of lege zijruimte heeft.
In portret blijft het bestaande draaischerm actief. Er is geen nieuwe modal of
nieuw navigatiesysteem. Geen nieuw rasterbeeld was nodig.

## Bestanden

Nieuw:
- `games/rechten/trainer-v2/points-core.js`
- `games/rechten/trainer-v2/components/points-view.js`
- `games/rechten/trainer-v2/styles/points.css`
- `tests/rechten-v2-puntenbaai.test.cjs`
- `tests/rechten-v2-puntenbaai-browser.cjs`
- Deze documentatie, rapporten en screenshots.

Aangepast:
- `games/rechten/trainer-v2/mission-runtime.js`: beide reeksen en commit/advance.
- `games/rechten/trainer-v2/app-shell.js`: start, render, muis/touch/toetsenbord.
- `games/rechten/trainer-v2/components/shell-view.js`: startknoppen en broodkruimel.
- `games/rechten/trainer-v2/content/area-maps.js`: speelbare haltes en afgeronde reeksen.
- `games/rechten/trainer-v2/index.html`: nieuwe modules en stijl laden.
- `games/rechten/trainer-v2/README.md`: actuele functionaliteit.
- Bestaande tests voor kaarten, Formulewerf, runtime, math en shell-preservation:
  historische preview-aannames bijgewerkt; de drie oude missies blijven afzonderlijk
  getest. Historische hashmanifesten zijn behouden, met expliciete uitzonderingen
  voor de voor deze opdracht uitgebreide runtime/controller en documentatie.

Ongewijzigd: v1, oorspronkelijke validators, skillcatalogus, storage,
scheduler, evidence-adapter, Grenspas-oefencomponent, andere gebiedsroutes en art.

## Validatie

- 68 unittests: beide complete reeksen, exacte beoordeling, dubbele commit,
  foute en ontbrekende antwoorden, hints, undo, nieuwe voorbeelden, hervatten,
  oude missies en opslag-/validatorbehoud.
- 26 Puntenbaai-browserlayoutcontroles plus volledige interactieroutes.
- Browser: 1920×1080, 1366×768, 1024×768, 780×360 en 640×360.
- Geen scroll, overlappende antwoorden of afgesneden bedieningsknoppen.
- Echte touch- en toetsenbordinvoer; beide reeksen volledig afgerond; wisselen,
  pauzeren, refresh, browsergeschiedenis, portret en hervatten gecontroleerd.
- 65 controles/groepen in de afzonderlijke browserregressie van de bestaande Grenspas-route.
- Bewijs: [unittests](unit-tests.txt), [Puntenbaai-browserrapport](puntenbaai-report.json),
  [Grenspas-regressierapport](grenspas-regression-report.json).

De browser gebruikt een geïsoleerd gastprofiel. Externe verzoeken worden
onderschept; geen echte accounts of voortgang zijn gebruikt.
