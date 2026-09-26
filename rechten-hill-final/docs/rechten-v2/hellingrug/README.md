# Hellingrug — drie werkende oefenreeksen

Bestaande trainer-v2 in `LeraarBob-rechten-shell`, branch `feat/rechten-v2-world-shell`.

[Open Hellingrug](http://127.0.0.1:8775/games/rechten/trainer-v2/#hellingrug) ·
[Screenshots](index.html)

## Oefeningen

1. **Δx en Δy (`delta`)**: per grafiek eerst de horizontale, daarna de verticale
   verandering van A naar B kiezen. Geen vooraf ingevulde oplossing bij de vraag.
2. **Helling (`slope`)**: gegeven verschillen Δx en Δy omzetten in de
   richtingscoëfficiënt a; vier unieke exacte antwoordkeuzes, ook breuken.
3. **Helling uit twee punten (`slope_from_two_points`)**: drie stappen — de punten
   bekijken, de vier coördinaten in de breuk plaatsen, de helling berekenen.
   Werkt met echt slepen op desktop en met tikken of toetsenbord. Bij invullen
   worden coördinaatrollen én consistente aftrekrichting gecontroleerd.

Zes opgaven per reeks, met positieve, negatieve en nulhelling, gehele getallen,
breuken en negatieve coördinaten. Een nieuwe reeks verschuift de punten. Verticale
en samenvallende punten horen bij de afzonderlijke halte Bijzondere rechten,
die nog een preview is.

De bestaande papierstijl, navigatie, hints, undo, expliciete controle, herstel,
voortgangsopslag en het draaischerm blijven in gebruik. Geen nieuwe modal.
De oplossing wordt niet automatisch ingevuld. Bij een foute noemer blijft een
correcte teller behouden. Equivalent geschreven breuken zijn geldig.

## Integratie en behoud

- Nieuwe adapters gebruiken de oorspronkelijke `RechtenV2Math.checkDeltas` en
  `RechtenWave.check` voor exacte beoordeling. De invuladapter controleert aanvullend
  of de tokens daadwerkelijk x- of y-coördinaten voorstellen.
- De runtime is uitgebreid met de nieuwe fasen. De bestaande `?slice=hellingrug`
  gebruikt zijn oorspronkelijke missie; nieuwe haltes hebben eigen sleutels
  `delta`, `slope` en `slope_from_two_points` in `state.missions`.
- Geen wijzigingen aan oorspronkelijke validators, skillcatalogus, storage,
  scheduler, evidence-adapter, v1 of andere oefencomponenten.
- Afgeronde reeksen blijven zichtbaar op de kaart, ook bij opnieuw oefenen.
  Een afgeronde basisroute beveelt een beschikbare oefening aan, geen vergrendelde preview.
- Oefenbewijs wordt opgeslagen; geen automatische productie-mastery of verzonnen XP.

## Bestanden in deze wijziging

Nieuw:
- `games/rechten/trainer-v2/hills-core.js`
- `games/rechten/trainer-v2/components/hills-view.js`
- `games/rechten/trainer-v2/styles/hills.css`
- `tests/rechten-v2-hellingrug.test.cjs`
- `tests/rechten-v2-hellingrug-browser.cjs`
- Deze documentatie, screenshots en testresultaten.

Aangepast:
- `games/rechten/trainer-v2/mission-runtime.js`
- `games/rechten/trainer-v2/app-shell.js`
- `games/rechten/trainer-v2/components/shell-view.js`
- `games/rechten/trainer-v2/content/area-maps.js`
- `games/rechten/trainer-v2/index.html`
- `games/rechten/trainer-v2/README.md`
- `tests/rechten-v2-area-maps.test.cjs` en `tests/rechten-v2-formulewerf.test.cjs`:
  Hellingrug heeft nu drie speelbare haltes; historische preview-aannames bijgewerkt.

## Validatie

- 74 unittests: alle oude en nieuwe reeksen, exacte breuken, consistente richtingen,
  ontbrekende/foute antwoorden, correcte vakjes behouden, undo, hints, herladen en
  behoud van de oorspronkelijke Hellingrug-missie.
- 35 Hellingrug-browserlayoutcontroles: alle fasen op 1920×1080, 1366×768,
  1024×768, 780×360 en 640×360; geen scroll, afgesneden knoppen of voetoverlap.
- Alle drie reeksen volledig doorlopen. Echte native drag/drop, touch en
  toetsenbord; herstel na gemengde richting, ongeldige breuk en omgekeerde breuk;
  wisselen, pauze, refresh, browsergeschiedenis en portret/hervatten.
- Puntenbaai: 26 browserlayoutcontroles en beide reeksen opnieuw volledig doorlopen.
- Grenspas: 65 browsercontroles/groepen geslaagd.

Testprofiel geïsoleerd; auth is een synthetische gast en externe requests worden
onderschept. Geen echte accounts of leerlinggegevens gebruikt.

Testbewijs: [unittests](unit-tests.txt), [Hellingrug](hellingrug-report.json),
[Puntenbaai-regressie](puntenbaai-regression-report.json) en
[Grenspas-regressie](grenspas-regression-report.json).
