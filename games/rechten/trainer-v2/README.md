# Rechtenwereld — bestaande trainer-v2, nieuwe shell

De zichtbare route is **Rechtenwereld → vijf gebiedskaarten → 28 afzonderlijke haltes**.
Alle vijf Grenspas-haltes zijn speelbaar: nulwaarde aflezen, nulwaarde berekenen,
tekenschema, f(x) > 0 en f(x) < 0. Elke halte heeft een eigen reeks van zes opgaven. Puntenbaai biedt nu ook
**coördinaten lezen** (`point`) en **coördinaten plaatsen** (`point_plot`).
Hellingrug biedt **Δx en Δy** (`delta`), **helling** (`slope`) en
**helling uit twee punten** (`slope_from_two_points`). De bestaande mission-runtime
is uitgebreid voor deze oefenreeksen.
De exacte validators, evidence-/scheduler-adapters, skillcatalogus en opslag blijven ongewijzigd.
De productieroute `../trainer/` blijft ongewijzigd.

## Openen op deze pc

Werkmap: `/home/johan/Documenten/GitHub/LeraarBob`

Geïntegreerd vanuit `rechten-hill-final`; bereikbaar via **Rechtenwereld** op de startpagina.

Vanaf de werkmap:

```sh
python3 -m http.server 8775 --bind 127.0.0.1
```

- [Rechtenwereld](http://127.0.0.1:8775/games/rechten/trainer-v2/#wereld)
- [Hellingrug](http://127.0.0.1:8775/games/rechten/trainer-v2/#hellingrug)
- [Puntenbaai](http://127.0.0.1:8775/games/rechten/trainer-v2/#puntenbaai)
- [Grenspas](http://127.0.0.1:8775/games/rechten/trainer-v2/#grenspas)
- [Oefenen / hervatten](http://127.0.0.1:8775/games/rechten/trainer-v2/#oefenen)
- [Mijn voortgang](http://127.0.0.1:8775/games/rechten/trainer-v2/#voortgang)

Wereld, gebied, voortgang en profiel passen ook in portret. Actieve gameplay
behoudt het bestaande Mobile Layout Contract: landscape, minimaal 640×360,
met 780×360 als Samsung A20-referentie. Er is geen normale navigatie- of gameplayscroll.

Alle vijf wereldeilanden openen hun eigen kaart. Puntenbaai heeft 2 haltes,
Hellingrug 5, Signaalstad 7, Formulewerf 9 en Grenspas 5. Formulewerf heeft
twee verbonden fullscreen werkplaatsen: `#formulewerf/bouwen` en
`#formulewerf/omzetten`. Alle 27 oorspronkelijke skill-ID’s blijven behouden;
de twee sign-haltes delen één skill-ID met afzonderlijke vraagvariant.

Nog niet gemigreerde haltes openen een preview, ook als hun leerstatus
vergrendeld is. Een preview bekijken verandert geen mastery, unlock of
oefenbewijs. Met een geïmporteerde v1-snapshot toont de kaart read-only de
bestaande `unlock`, `ready` en schedulerkeuze. Zonder snapshot markeert elke
kaart met alleen previews zijn eerste halte als huidige halte. Grenspas biedt vijf afzonderlijke oefenreeksen. Beide Puntenbaai-haltes zijn speelbaar;
na een afgeronde reeks verschuift de aanbeveling naar de andere oefening.

`Terug naar kaart` gaat altijd naar `#wereld`. Vanuit een preview gaat de
aparte gebiedsknop naar dezelfde werkplaats en focust dezelfde halte.
Browsergeschiedenis, refresh en hervatten behouden gebied, werkplaats en halte.
Na een volledige reeks kun je terug naar Grenspas. Elke halte bewaart zijn eigen
voortgang. Een eerder begonnen oorspronkelijke Grenspas-missie blijft hervatbaar. Een afgeronde opgave geeft oefenbewijs,
geen nieuwe productie-mastery of XP.

## Behouden ontwikkelroutes

De eerdere volledige slices blijven bereikbaar voor regressie en bestaand werk:

- `/games/rechten/trainer-v2/?slice=grenspas` (alle vier contrastvarianten)
- `/games/rechten/trainer-v2/?slice=hellingrug`
- `/games/rechten/trainer-v2/?slice=signaalstad`
- `/games/rechten/trainer-v2/prototype.html` (losse mechaniekproef zonder opslag)

Deze routes zijn niet de nieuwe leerlingnavigatie. Een reeds actieve oude missie
blijft bij heropening hervatbaar. Er is geen trainer-v3, buildstap of nieuwe JS-dependency.

## Modules

| Module | Verantwoordelijkheid |
| --- | --- |
| `app-shell.js` | Bestaande appcontroller; nieuwe gebiedsstap en browsergeschiedenis |
| `components/shell-view.js` | Wereld, vijf gebieden, haltepreviews, header, menu, profiel en voortgang |
| `content/area-maps.js` | Afzonderlijke haltes, vaste ankers, subzones, URL’s en read-only statuspresentatie |
| `styles/area-maps.css` | Gedeelde 3:2 map-stage, schaalbare HTML-nodes en compacte navigatie |
| `components/boundary-view.js` | Exacte SVG-weergave en nieuwe antwoordbediening voor Grenspas |
| `styles/world-shell.css`, `styles/boundary.css` | Responsive papier-/waterverfstijl |
| `mission-runtime.js` | Hervatbare commit/repair/continue-toestandsmachine, uitgebreid met Puntenbaai |
| `points-core.js` | Zes punten per reeks, unieke keuzes en adapter naar de bestaande exacte puntenvalidator |
| `components/points-view.js`, `styles/points.css` | Herinneringskaart, interactief rooster en antwoordzone volgens de mockups |
| `semantic-math-core.js` | Ongewijzigde exacte taken, validators en causale feedback |
| `components/workbench.js` | Bestaande native waardevelden, breuken, tabel en grafiek |
| `evidence-adapter.js`, `scheduler-adapter.js` | Ongewijzigde evidence- en plannercontracten |
| `storage.js` | Ongewijzigde account-, revision-, backup- en conflictadapter |
| `content/skills.json` | Alle 27 bestaande IDs en families |
| `content/assets.json` | Actuele assets, vervangcontracten en fallbacks |

## Tests

Gebruik Node 22+ en Chromium met een apart testprofiel. De harness gebruikt
synthetische accounts en wist uitsluitend zijn testopslag; externe requests
worden onderschept. Gebruik hiervoor geen dagelijks browserprofiel.

```sh
node --test tests/rechten-*.test.cjs tests/account-auth.test.cjs tests/catalog*.test.cjs tests/teacher-details.test.cjs
chromium --headless=new --disable-gpu --no-first-run --remote-debugging-port=9245 --user-data-dir=/tmp/rechten-shell-tests about:blank
```

Voer deze browserruns **na elkaar** uit, naast de server:

```sh
V2_BASE_URL=http://127.0.0.1:8775 V2_BROWSER_PORT=9245 node tests/rechten-v2-world-shell-browser.cjs
V2_BASE_URL=http://127.0.0.1:8775 V2_BROWSER_PORT=9245 node tests/rechten-v2-browser.cjs
V2_BASE_URL=http://127.0.0.1:8775 V2_BROWSER_PORT=9245 node tests/rechten-v2-browser.cjs --prototype
V2_BASE_URL=http://127.0.0.1:8775 V2_SHELL_PORT=9245 node tests/rechten-v2-shell-integration.cjs
```

Zie het [nieuwe implementatierapport](../../../docs/rechten-v2/world-shell/IMPLEMENTATION_REPORT.md),
[assets en prompts](../../../docs/rechten-v2/world-shell/ART_ASSETS.md),
[eerste v2-implementatie](../../../docs/rechten-v2/IMPLEMENTATION_REPORT.md) en
[het migratieplan](../../../docs/rechten-v2/MIGRATION_PLAN.md).

## Gebiedskaarten controleren

```sh
node --test tests/rechten-v2-area-maps.test.cjs
V2_SCREENSHOT_DIR=/tmp/rechten-area-validation node tests/rechten-v2-area-maps-browser.cjs
```

De browserrun gebruikt bovengenoemde geïsoleerde Chromium op poort 9245 en
localhost:8775, plus een tijdelijk `chrome://settings`-tabblad voor browserzoom.
Zie [kaartoverzicht en screenshots](../../../docs/rechten-v2/area-maps/README.md).

## Puntenbaai-oefeningen

Elke halte heeft een afzonderlijke, hervatbare reeks van zes punten. De eerste
opgave gebruikt positieve coördinaten; daarna volgen negatieve coördinaten,
een punt op een as en de oorsprong. Een herhaling krijgt andere punten.

Bij aflezen kies je uit vier unieke antwoorden. De grafiek noemt het punt P;
het coördinatenlabel verschijnt pas na een juist gecontroleerd antwoord.
Bij plaatsen gebruik je het rooster of de pijltjestoetsen. Je gekozen punt is
zichtbaar, maar wordt pas na **Controleer** als juist beoordeeld.

Undo, hints, herstel, pauze, refresh en wisselen tussen haltes gebruiken de
bestaande runtime en opslag. De kaart onthoudt afgeronde reeksen ook bij opnieuw
oefenen. Deze reeksen leveren oefenbewijs, geen automatische productie-mastery
of verzonnen XP.

```sh
node --test tests/rechten-v2-*.test.cjs
V2_SCREENSHOT_DIR=/tmp/puntenbaai-validation node tests/rechten-v2-puntenbaai-browser.cjs
```

Zie [implementatie en screenshots](../../../docs/rechten-v2/puntenbaai/README.md).

## Hellingrug-oefeningen

De eerste drie haltes zijn speelbaar en bewaren elk hun eigen reeks van zes
opgaven. Δx en Δy worden na elkaar bevraagd. De gevraagde waarde blijft verborgen
tot na controle. Bij helling zijn Δx en Δy gegeven en kiest de leerling a = Δy/Δx.

Helling uit twee punten heeft drie stappen: punten bekijken, coördinaten invullen
en de helling berekenen. Coördinaten kunnen via muisdrag of via tik/toetsenbord
in de vier vakjes worden gezet. De bovenste twee moeten y-coördinaten zijn, de
onderste twee x-coördinaten, in dezelfde richting. Beide consistente richtingen
zijn geldig. Correcte tellervakjes blijven staan bij een fout in de noemer.
Het laatste antwoord accepteert equivalente breuken en decimalen.

De originele `?slice=hellingrug` blijft afzonderlijk hervatbaar. De nieuwe haltes
gebruiken `hills-core.js`, `components/hills-view.js` en `styles/hills.css`.
Er zijn geen nieuwe skill-ID’s, opslagversies of masteryregels. De oorspronkelijke
validators blijven ongewijzigd.

```sh
V2_SCREENSHOT_DIR=/tmp/hellingrug-validation node tests/rechten-v2-hellingrug-browser.cjs
```

Zie [implementatie en screenshots](../../../docs/rechten-v2/hellingrug/README.md).

## Laatste Hellingrug-haltes

Alle vijf Hellingrug-haltes zijn nu speelbaar. `line_behavior` bevat negen
opgaven: drie representaties (grafiek, gegeven a, punten plaatsen), elk met
stijgend, dalend en constant. Bij de puntenvariant controleert de leerling A en B
voordat de gedragsvraag beschikbaar wordt. Breukcoördinaten gebruiken halve
roosterstappen. Muis, touch en pijltjestoetsen worden ondersteund.

`special_lines` bevat zes opgaven met horizontale, verticale, schuine en
samenvallende punten. Punten plaatsen is optioneel. De antwoorden zijn het soort
rechte en of die een functie voorstelt. Samenvallende punten bepalen geen unieke
rechte; daarvoor is ‘niet te bepalen’ beschikbaar. Foute optionele plaatsingen
kunnen worden verbeterd of gewist zonder juiste classificatie-antwoorden te verliezen.

De nieuwe modules zijn `lines-core.js`, `components/lines-view.js` en
`styles/lines.css`. De bestaande skill-ID’s, originele validators, opslag,
scheduler en eerdere oefeningen blijven behouden.

```sh
node --test tests/rechten-v2-*.test.cjs
V2_BASE_URL=http://127.0.0.1:8776 V2_BROWSER_PORT=9246 V2_SCREENSHOT_DIR=/tmp/lines-validation node tests/rechten-v2-lines-browser.cjs
```

[Implementatie en screenshots](../../../docs/rechten-v2/lines/README.md).

## Grenspas: nulwaarden en tekens

De vijf haltes gebruiken `grens-core.js`, `components/grens-view.js` en
`styles/grens.css`. Nulwaarde aflezen en berekenen gebruiken vier unieke keuzes.
Tekenschema wisselt grafiek en formule af; tik een vakje en kies −, 0 of +.
De invulpositie schuift vanzelf door. Juiste vakjes blijven staan na herstel.

Bij een formule verwijzen herinnering, hints en foutfeedback naar de
richtingscoëfficiënt a, de coëfficiënt van x. Bij een grafiek verwijst de uitleg
naar boven en onder de x-as. De nulwaarde wordt bij het tekenschema gegeven.
De twee ongelijkheden vragen eerst de nulwaarde en daarna x <, = of > die grens.
Een keuze wordt pas na **Controleer** beoordeeld.

```sh
node --test tests/rechten-v2-grens.test.cjs
V2_SCREENSHOT_DIR=/tmp/grens-validation node tests/rechten-v2-grens-browser.cjs
```

Zie [Grenspas: implementatie en screenshots](../../../docs/rechten-v2/grenspas/README.md).

## Formulewerf A: voorschrift en grafiek

Alle vier de haltes in `#formulewerf/bouwen` zijn speelbaar met zes opgaven per
halte: bouwen met a/b, tekenen vanuit een voorschrift, a/b uit een grafiek en
vergelijkingen herschrijven. Ze gebruiken `formula-core.js`,
`components/formula-view.js` en `styles/formula.css`.

Bij tekenen is de hulp algemeen: de leerling leest zelf a/b af en kiest twee
verschillende punten. Antwoordpunten worden niet vooraf getoond. Bouwstenen
werken via tikken, toetsenbord, muisdrag en touchdrag. Parameters accepteren
breuken en decimalen. Algebra past een gekozen bewerking op beide leden toe,
met zichtbare tussenstappen en ongedaan maken. Ook eerst delen is toegestaan.

Correcte onderdelen blijven staan bij herstel. De kaart bewaart voltooiing per
halte, ook tijdens een nieuwe ronde. De oorspronkelijke validators, opslag en
masteryregels blijven behouden. Werkplaats B bevat de bestaande voorvertoningen.

[Implementatie, validatie en screenshots](../../../docs/rechten-v2/formulewerf-a/README.md).

## Formulewerf B: afleiden met punten

De haltes `intercept_from_point`, `equation_from_point_slope` en
`equation_from_two_points` zijn speelbaar in `#formulewerf/omzetten`, elk met zes
opgaven. De leerling vult zelf de coördinaten en de helling in, berekent het
product en bepaalt b. De twee volledige voorschriftreeksen eindigen met het
samenstellen van de formule. Vanuit twee punten wordt eerst de coördinatenbreuk
opgebouwd en a berekend; beide consistente richtingen en beide punten zijn geldig.

De nieuwe modules zijn `derive-core.js`, `components/derive-view.js` en
`styles/derive.css`. Het stappenplan toont alleen gecontroleerd werk. De kaart
voltooit een halte pas na de laatste stap van de zesde opgave. De oorspronkelijke
validators, skill-ID's, opslag en masteryregels blijven behouden.

[Werking en validatie](../../../docs/rechten-v2/formulewerf-b/README.md).
