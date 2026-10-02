# Rechtenwereld — actieve wereldshell

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

Dit is de actieve productieversie van **Rechtenwereld** op de startpagina.

Vanaf de werkmap:

```sh
python3 -m http.server 8775 --bind 127.0.0.1
```

- [Rechtenwereld](http://127.0.0.1:8775/games/rechten/rechtenwereld/#wereld)
- [Hellingrug](http://127.0.0.1:8775/games/rechten/rechtenwereld/#hellingrug)
- [Puntenbaai](http://127.0.0.1:8775/games/rechten/rechtenwereld/#puntenbaai)
- [Grenspas](http://127.0.0.1:8775/games/rechten/rechtenwereld/#grenspas)
- [Oefenen / hervatten](http://127.0.0.1:8775/games/rechten/rechtenwereld/#oefenen)
- [Mijn voortgang](http://127.0.0.1:8775/games/rechten/rechtenwereld/#voortgang)

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

- `/games/rechten/rechtenwereld/?slice=grenspas` (alle vier contrastvarianten)
- `/games/rechten/rechtenwereld/?slice=hellingrug`
- `/games/rechten/rechtenwereld/?slice=signaalstad`
- `/games/rechten/rechtenwereld/prototype.html` (losse mechaniekproef zonder opslag)

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

## Papierroute Hellingrug

`worksheets.html` maakt A4-oefenbladen en een afzonderlijke verbetersleutel. De route is **Hellingrug → Leren, spelen of papier → Oefenblad maken**; het spelmenu heeft ook een directe ingang. Zes selecteerbare vraagtypen dekken Δx/Δy, helling uit grafiek of punten, lijnverloop, bijzondere rechten en foutanalyse. Kies 6, 8, 12, 16 of 24 vragen en begeleiding (`Met tussenstappen`, `Opbouwend`, `Zelfstandig`).

De papieradapter gebruikt `RechtenWave.generate`, exacte breukrekenfuncties en `model`. Gecontroleerde vertalingen houden punten binnen het rooster en leveren verschillende opgaven. De geordende reeks wordt uit versie, seed en instellingen gereconstrueerd; de reekscode bevat ook opbouw, aantal en leerdoelselectie. Bij wijzigingen die dezelfde seed andere opgaven geven moet `HellingrugWorksheet.VERSION` omhoog. De generator beloont geen downloads en schrijft geen leerprogressie. De bestaande `account-progress.js` toont alleen de echte XP. Een gast kan eveneens werkbladen maken.

`shared/worksheet-layout.js` verdeelt vragen zonder herschikking over fysieke A4-rijen. `shared/worksheet-layout.css` bewaakt de papiermaten. Dit is de eerste gedeelde papiercomponent; Algebra en Vectormissie zijn er nog niet op aangesloten. Hun inhoud en engines blijven ongewijzigd.

Het scherm schaalt de complete pagina als afdrukvoorbeeld; roosters en tekst worden in de PDF scherp afgedrukt. **PDF / afdrukken** opent het browserafdrukvenster: kies daar `Opslaan als PDF`. Oefenblad en sleutel worden afzonderlijk afgedrukt. Het laatst bevestigde werkblad wordt lokaal hervat, onafhankelijk van de spelvoortgang. Niet-bevestigde wijzigingen worden niet in het bestaande afdrukvoorbeeld verwerkt.

Controles:

```sh
node --test tests/hellingrug-worksheets.test.cjs tests/rechten-v2-area-maps.test.cjs tests/rechten-v2-shell-preservation.test.cjs
node tests/hellingrug-worksheets-browser.cjs
```

De browserproef gebruikt een geïsoleerde sessie en fictieve voortgang. Hij controleert 24 indelingen met lange vraag-/antwoordteksten, werkelijke A4-PDF-paginering, scheiding van vragen en antwoorden, echte afdrukklikken, vier schermformaten, beide balkstanden, herladen, gastgebruik en de kaartingang. Voorbeeldbestanden worden naar `/tmp/leraarbob-hellingrug-worksheets/` geschreven. De test vereist de lokale server op 8775, Chromium CDP op 9245 en `pdfinfo`/`pdftotext`.


## Papierroute Grenspas

`worksheets.html?world=grenspas` gebruikt dezelfde generatorinterface en A4-opmaak. De ingang is **Grenspas → Leren, spelen of papier → Oefenblad maken**, of rechtstreeks via het spelmenu. De wereldkeuze boven de leerdoelen wisselt tussen Hellingrug en Grenspas. De laatst bevestigde reeks en de documentkeuze worden per wereld afzonderlijk bewaard.

De vijf leerdoelen sluiten aan op `RechtenV2Grens`: nulwaarde aflezen, nulwaarde berekenen, tekenschema, positief gebied en negatief gebied. Papier geeft geen meerkeuzeopties: leerlingen schrijven nulwaarden, vullen tekenschema’s in, formuleren strikte ongelijkheden en verklaren of de grens erbij hoort. Tekenschema’s wisselen grafieken en voorschriften af. Alle getekende rechten zijn niet-constante lineaire functies, overeenkomstig deze vijf digitale oefenreeksen; horizontale en verticale uitzonderingen blijven bij Hellingrug.

`grenspas-core.js` hergebruikt de hellingen uit de digitale opgaven en verschuift de nulwaarde gecontroleerd binnen −3 tot 3. De eerste opgaven per type gebruiken gehele nulwaarden; verdere herhalingen kunnen halve waarden bevatten. Berekeningen, tekens en grenzen gebruiken de exacte breukenkern. Elke reeks is reproduceerbaar uit versie, seed, opbouw, aantal en leerdoelselectie (`GP1-…`). Wijzig de versie bij veranderingen die dezelfde instellingen andere opgaven laten opleveren.

`shared/worksheet-render.js` verzorgt nu voor beide werelden de paginakop, vraagvolgorde, paginering en voettekst; de inhoud blijft per wereld gescheiden. De PDF bevat vectorroosters en echte tekst, met een afzonderlijke verbetersleutel. Er worden geen XP of beheersingsresultaten toegekend voor het genereren of afdrukken.

```sh
node --test tests/grenspas-worksheets.test.cjs tests/hellingrug-worksheets.test.cjs
node tests/grenspas-worksheets-browser.cjs
node tests/hellingrug-worksheets-browser.cjs
```

De Grenspas-controles toetsen de antwoorden aan de bestaande nulwaarde-, teken- en intervalvalidators, inclusief foutief gesloten grenzen, beide hellingtekens en negatieve/gehele/halve nulwaarden. Alle 31 leerdoelselecties worden met 24 vragen en drie begeleidingsvormen getest. De browsercontrole meet 36 fysieke indelingen, maakt beide PDF’s, controleert vier schermformaten en beide kopbalkstanden, wisselt tussen werelden en volgt de kaartingang met geïsoleerde testvoortgang. Voorbeelden staan na de test in `/tmp/leraarbob-grenspas-worksheets/`.

## Formulewerf en centrale oefenbladen

`/oefenbladen.html` bundelt Hellingrug, Grenspas, Formulewerf en de bestaande Algebra Trainer-papierroute. Het gedeelde platformmenu heeft één ingang ‘Alle oefenbladen’. In Rechtenwereld opent ‘Oefenbladen’ de huidige ondersteunde wereld; vanuit de wereldkaart kan ook ‘Leren, spelen of papier’ gebruikt worden. Verdere werelden kunnen aan de subjectregistratie in `worksheets/worksheets.js` worden toegevoegd.

`worksheets.html?world=formulewerf` biedt de acht beschikbare Formulewerf-vaardigheden. De papieradapter hergebruikt exacte digitale modellen, verschuift die gecontroleerd en leidt punten, tabellen en equivalente vergelijkingen daaruit af. Reeksen hebben een reproduceerbare `FW1-…`-code. Er zijn lege tekenroosters, open uitwerkingen, afbouwende begeleiding en een afzonderlijke sleutel die andere juiste punten en equivalente algebraïsche routes toestaat. Voorbeelden en echte PDF-controles staan na de browserproef in `/tmp/leraarbob-formulewerf-worksheets/`.

Docenttoegang gebruikt uitsluitend de accountrol uit de bestaande accountadapter. `statuses`, `unlocked` en `recommendation` krijgen deze als apart argument; er wordt geen ontgrendelvlag of fictieve beheersing opgeslagen. Niet-uitgebrachte levels blijven als voorbereiding herkenbaar. De router controleert ook directe oefenlinks met het juiste wereld-ID. Afmelden blokkeert de docentcontext en opent vervolgens de eigen gastgegevens.

```sh
node --test tests/formulewerf-worksheets.test.cjs tests/rechten-v2-area-maps.test.cjs tests/rechten-v2-graph-scale.test.cjs
node tests/formulewerf-worksheets-browser.cjs
node tests/rechten-teacher-paper-browser.cjs
```

De controles omvatten alle 255 vraagtypeselecties, exacte modelconsistentie, 54 fysieke papierindelingen, werkelijke A4-paginering, vier schermformaten, beide balkstanden en herladen. De toegangstest gebruikt een fictief docentaccount zonder cloudschrijfacties en controleert directe toegang, halve coördinaten, afmelden en de centrale papierroute.

## Papierroute Signaalstad

`worksheets.html?world=signaalstad` biedt uitsluitend het uitgewerkte onderdeel `graph_from_table`: een rechte tekenen vanuit drie tabelkolommen. De overige Signaalstad-stops zijn digitaal speelbaar en zijn niet toegevoegd als papierleerdoel. Zowel de centrale oefenbladenpagina als het contextmenu en de speelkeuze van Signaalstad openen deze route.

De generator gebruikt de digitale tabelmodellen, vertaalt ze exact en kiest drie verschillende x-waarden waarvan de punten binnen het papierrooster vallen. De eerste begeleide vragen hebben gehele waarden; daarna zijn ook halve waarden en horizontale rechten mogelijk. Opbouwende hulp verdwijnt geleidelijk. De leerling krijgt een leeg rooster; de aparte sleutel toont de lijn en drie punten en accepteert elk correct tweetal. Reeks `SS1-…` is reproduceerbaar zonder leerlingvoortgang te schrijven.

```sh
node --test tests/signaalstad-worksheets.test.cjs
node tests/signaalstad-worksheets-browser.cjs
node tests/rechten-teacher-paper-browser.cjs
```

De inhoudstest toetst 120 seeds in drie hulpvormen aan de bestaande digitale tekenvalidator, inclusief alle drie de puntparen, negatieve/gehele/halve waarden en de roostergrenzen. De browserproef controleert A4-paginering, vragen/sleutel, vier schermformaten, inklappen/heropenen en bewaarbehoud. PDF-voorbeelden staan na de test in `/tmp/leraarbob-signaalstad-worksheets/`.

Leerlingteksten gebruiken ‘snijpunt met de y-as’; waar een getal gevraagd wordt, is b de y-coördinaat van dat snijpunt (0; b).


## Signaalstad levels 1 en 2

Level 1 (`?practice=intercept`) leert het volledige snijpunt P = (x; y) met de y-as aflezen in zes grafieken. Beide coördinaten beginnen leeg: leerlingen bepalen zelf x = 0 en de y-coördinaat. Bij herstel blijft een juiste coördinaat bewaard.
Level 2 (`?practice=ab`) laat de leerling eerst b aflezen, daarna a meten bij één stap in x, en vervolgens het functievoorschrift bouwen. De zes grafieken bevatten stijgende, dalende, horizontale en halve hellingen.
Beide levels zijn individueel speelbaar op de Signaalstadkaart. De bestaande toegang tot de wereld blijft gelden. Correcte tussenstappen, voortgang en de inklapkeuze blijven bewaard. Alleen een volledige opgave levert de bestaande 5 of 10 XP op.

Controle: `node --test tests/rechten-v2-signaalstad-*.test.cjs`. De bijbehorende `*-browser.cjs` scripts controleren alle opgaven, mobiele bediening, pauzeren, herladen en inklappen/terug openen.


## Signaalstad: levels 3 en 4 — functiewaarden en tabellen

`?practice=fx` geeft zes voorschriften en een concrete invoer. De leerling vervangt eerst zelf x door de gegeven invoer in het voorschrift (`fx-substitute`). Pas na controle volgt het product ax en de functiewaarde f(x) (`fx-calculate`). De gecontroleerde substitutie blijft staan; een tussenstap levert nog geen XP op. Beide antwoorden worden exact gecontroleerd; bij herstel blijft een correcte tussenstap of uitvoer staan.

`?practice=table` geeft zes voorschriften met vijf x-waarden per tabel. Eén kolom bij x = 0 is gegeven; de leerling berekent de vier overige outputs. Latere opgaven hebben onregelmatige x-afstanden. Correcte cellen blijven vergrendeld bij herstel. Beide levels bevatten negatieve invoer, negatieve/halve coëfficiënten en een constante functie. Breuken en equivalente decimalen zijn geldig.

Het voorschrift staat prominent boven het werkblad; de getallenknoppen staan rechts van de berekening of tabel. De tabel gebruikt hetzelfde groene horizontale/verticale lijnenkruis als de andere functietabellen. De ingebouwde getallenknoppen en native tekstvelden ondersteunen aanraken en toetsenbord; `inputmode=none` houdt de werktafel zichtbaar op smartphones. Selecteren verandert geen antwoord. Pauzeren, herladen, ongedaan maken, herhalen en inklappen gebruiken de bestaande opslag en echte XP. Alleen volledig correcte opgaven leveren XP op, zonder dubbele beloning bij herhalen. De haltes zijn individueel speelbaar; duo-, battle- en papierroutes blijven bij hun bestaande onderdelen.

Controle: `node --test tests/rechten-v2-signaalstad-values.test.cjs` en `node tests/rechten-v2-signaalstad-values-browser.cjs`. De browserproef controleert alle twaalf opgaven op desktop en liggende smartphones, inclusief getallenknoppen, breuken, herstel, echte kaartnavigatie, beide balkstanden, herladen en rotatie. Screenshots: `/tmp/rechten-signaalstad-values-screenshots/`.


## Signaalstad: levels 5 en 6 — invoer vinden en punten controleren

`?practice=input_from_output` opent level 5. De leerling vult eerst de gegeven functiewaarde in voor f(x), werkt b aan beide kanten weg, deelt door a en controleert de gevonden x in het oorspronkelijke voorschrift. De zes opgaven bevatten een positieve en negatieve gehele oplossing, een gebroken oplossing, een negatieve halve coëfficiënt en twee constante functies. Bij a = 0 berekent de leerling de vaste uitvoer en bepaalt of elke x of geen enkele x mogelijk is; delen door nul wordt niet aangeboden.

`?practice=point_on_line` opent level 6. De leerling vervangt x door de x-coördinaat van P, berekent het product en f(x), en vergelijkt daarna de berekende waarde met de gegeven y-coördinaat. Een uitspraak over het punt verschijnt pas na de berekening. De zes opgaven bevatten punten op en naast de rechte, negatieve en halve waarden, een punt dat slechts een halve eenheid afwijkt en constante functies.

Beide levels hergebruiken het grote functievoorschrift bovenaan, de getallenknoppen rechts en de gedeelde inklapbare platformbalk. De stap, invoer en correcte onderdelen blijven bewaard bij herstel, pauzeren, herladen en schermrotatie. XP wordt alleen toegekend na de laatste stap van een volledige opgave. Elke ronde telt zes opgaven en een herhaling telt alleen een verbetering. Alle zeven Signaalstad-stops zijn nu digitaal speelbaar; deze twee nieuwe stops zijn voor zelfstandig oefenen en worden niet in de bestaande battles of samenleerroute opgenomen.

Controle: `node --test --test-isolation=none tests/rechten-v2-signaalstad-checks.test.cjs` en `node tests/rechten-v2-signaalstad-checks-browser.cjs`. De inhoudstest vergelijkt inverse oplossingen en puntlidmaatschap met een onafhankelijke rationale rekenproef. De browserproef doorloopt beide rondes op 1366 × 768, 780 × 360 en 640 × 360 pixels, inclusief touch, breuken, constante functies, herstel, kaartnavigatie, XP, beide balkstanden, herladen en rotatie. Screenshots: `/tmp/rechten-signaalstad-checks-screenshots/`.
