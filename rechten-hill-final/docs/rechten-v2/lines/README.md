# Laatste twee Hellingrug-haltes

## Huidige locatie

De oorspronkelijke werkboom `/home/johan/Documenten/GitHub/LeraarBob-rechten-shell`
is tijdens deze opdracht door het bestandssysteem alleen-lezen geworden
(`emergency_ro`). Er zijn geen herstel- of remountacties op de schijf uitgevoerd.
De wijzigingen zijn gemaakt en getest in `/tmp/rechten-hill-final`, een kopie
van de bestaande trainer-v2 inclusief eerdere lokale wijzigingen.

[Preview](http://127.0.0.1:8776/games/rechten/trainer-v2/#hellingrug) ·
[Screenshots](index.html)

Deze `/tmp`-kopie staat op tmpfs en is tijdelijk. Bewaar het bijgeleverde
wijzigingspakket buiten deze tijdelijke opslag vóór een herstart.

## Oefeningen

- `line_behavior`: negen opgaven met een grafiek, gegeven richtingscoëfficiënt,
  of twee zelf te plaatsen punten. Elke representatie bevat stijgend, dalend
  en constant. Gegeven puntvolgorde bepaalt niet de leesrichting: lees van links
  naar rechts. Halve coördinaten, waaronder de mockup A(1; 1/2), B(−1; 7/2),
  hebben halve roosterstappen.
- `special_lines`: zes opgaven over horizontale, verticale en schuine rechten,
  plus samenvallende punten. Kies het soort rechte en of die een functie is.
  Plaatsen is optioneel. Samenvallende punten geven geen unieke rechte; het
  functieantwoord is dan niet te bepalen.
- Native muisslepen, touchslepen, tikken en toetsenbord werken naast elkaar.
  Correct geplaatste punten blijven behouden tijdens herstel. Correcte
  classificatie-antwoorden blijven behouden als een optionele plaatsing fout is;
  die kan worden verbeterd of gewist.
- De bestaande hints, undo, expliciete controle, pauze, refresh en opslag blijven
  in gebruik. Afgeronde reeksen geven oefenbewijs, geen productie-mastery of XP.
- De A/B-subscripts uit de vorige correctie zijn behouden.

## Integratie

`lines-core.js` gebruikt het bestaande exacte puntenmodel en de bestaande
punt-, gedrag- en bijzondere-rechtenvalidators. De adapter behandelt daarnaast
schuine rechten als ‘geen van beide’ en het onbepaalde functieantwoord bij
samenvallende punten. De oorspronkelijke validators zijn niet gewijzigd.

De bestaande Hellingrug-adapter delegeert de twee nieuwe skill-ID’s naar deze
module. Hun missies gebruiken eigen sleutels in hetzelfde opslagschema. De
bestaande Hellingrug-missies, Puntenbaai, Grenspas, Formulewerf, scheduler en
storage zijn behouden.

Nieuw: `lines-core.js`, `components/lines-view.js`, `styles/lines.css`, twee tests,
plus deze documentatie en screenshots.

Aangepast: `hills-core.js`, `mission-runtime.js`, `app-shell.js`, `index.html`,
`components/shell-view.js`, `content/area-maps.js`, trainer-v2 README en de
bestaande gebiedskaart-/Hellingrug-tests. Geen nieuwe skill-ID’s.

## Validatie

- [80 unittests](unit-tests.txt) geslaagd.
- [66 nieuwe browserlayoutcontroles](lines-report.json) geslaagd: vijf formaten,
  alle representaties, volledige reeksen, native/touchdrag, halve roosterstappen,
  toetsenbord, herstel, optioneel plaatsen, reload, history en portret.
- [35 Hellingrug-regressiecontroles](hellingrug-regression-report.json) geslaagd,
  inclusief de eerder gemaakte coördinatenbouwer.
- Screenshots op desktop 1366×768 en compact 780×360. Daarnaast 1920×1080,
  1024×768 en 640×360 gecontroleerd; geen scroll of afgesneden knoppen.

Alle browserproeven gebruiken een geïsoleerde synthetische gast. Externe
verzoeken zijn onderschept en er zijn geen echte leerlingaccounts gebruikt.
