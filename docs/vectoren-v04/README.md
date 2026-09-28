# Vectormissie v0.4 — milestone 1

Verder gebouwd op `/home/johan/Downloads/vectorentrainer-v0.4-vectormissie-framework/vectoren`, in de bestaande `games/vectoren`-trainer. Branch: `feat/vectoren-vectormissie-v04`.

## Openen

- [Online klasmodus](../../games/vectoren/classroom.html) — leerkracht start een sessie; leerlingen doen mee met een code. Zie [werking en controles](klasmodus.md).

- [Vrij kanvas](../../games/vectoren/canvas.html) — via Menu → Vrij kanvas. Zie [bediening en controles](canvas.md).

- [Vectorbattle voor twee leerlingen](../../games/vectoren/battle.html) — ook via Menu → Battle met twee. Zie [werking en controles](battle.md).
- [Vectormissie v0.4](../../games/vectoren/Axioma_Vectorentrainer_v0.4_vectormissie.html)
- [Bestaande platformingang](../../games/vectoren/Axioma_Vectorentrainer_v0.2.html) — dezelfde gegenereerde toepassing; bestaande platformlinks blijven werken.
- Met de lokale server: `http://127.0.0.1:8775/games/vectoren/Axioma_Vectorentrainer_v0.4_vectormissie.html`.
- De parameter `?demo=headtail` opent een reproduceerbare vrije kop-staartoefening uit de bestaande generator. Een opgeslagen oefeningenreeks blijft daarbij beschikbaar.

## Opgeleverd

De bovenbalk is inklapbaar in de trainer, battle, klasmodus en het vrije kanvas. De gedeelde leraarBob-bovenbalk heeft op desktop en smartphone dezelfde knoppen voor account, instellingen, menu en inklappen. **Bovenbalk inklappen** staat ook in het menu. Een vaste herstelknop blijft zichtbaar. De gedeelde lokale voorkeur blijft behouden bij herladen en navigatie; de oefening, tekening en score worden niet gewijzigd. Deze afspraak is ook vastgelegd in [AGENTS.md](../../AGENTS.md) voor toekomstige wijzigingen.

Vier gekleurde routevectoren verbinden de opeenvolgende werelden visueel. Elke pijl loopt vanaf de kaartrand tot ongeveer driekwart van de vrije afstand naar de volgende wereld. De positie volgt de werkelijke kaarten bij schermrotatie, inclusief de verticale telefoonindeling.

Het oefenscherm volgt nu de [ruimte-cockpitreferentie](ruimtecockpit.md): doorlopende ruimteachtergrond, transparant grid en zwevende bediening links en rechts.

Donkere wereldkaart met vijf stations, actuele voortgang en een aanbevolen route. De kaart toont herkenbare vectorbouwwerken: een koersbaken, stuwmotor, dockingpoort, navigatieconsole en robotarm. Elk bouwwerk verwijst visueel naar de leerstof; op compacte schermen staat het als illustratie in de stationknop. Oefeningenreeks en Vrij oefenen openen de wereldkaart; stations openen de bijbehorende skills. Bij openen en herladen verschijnt eerst de wereldkaart, ook wanneer een oefening is opgeslagen. Hervat oefening opent die bewaarde oefening; Verder hervat de oefeningenreeks. Andere skills blijven zichtbaar en kunnen vrij worden verkend. Bij de overstap vanuit de oefeningenreeks naar een losse oefening verschijnt eerst een bevestiging: Vrij oefenen (zonder XP) of Annuleren. Escape annuleert ook; de opgeslagen reeks blijft bewaard. Vanuit de expliciete vrije oefenmodus verschijnt geen extra bevestiging.

De topbar toont Vectormissie als prominente knop naar de wereldkaart, met een kleinere stationknop. Het klikbare broodkruimelpad is: Vectormissie → station → oefening. Op compacte schermen blijven wereld en station zichtbaar; klikken bewaart het antwoord en de oefenmodus. Dezelfde halte opnieuw openen hervat de lopende oefening. Verder bevat de topbar, afhankelijk van de beschikbare ruimte, oefenvoortgang, echte XP, opeenvolgende oefendagen, een standaard verkenneravatar en het bestaande profiel-/opslagvenster. Het profiel toont de actuele status van de centrale opslag, ook met een statusstip en toegankelijke beschrijving. De avatar heeft een afzonderlijke `data-avatar`-aanduiding voor toekomstige varianten. Er is nog geen avatarkeuzescherm.

Het kop-staartscherm heeft een donkere SVG-werkruimte, duidelijke vectornotatie, cyaan u, roze v en groene resultante. Deze kleuren blijven behouden bij gekopieerde pijlen. De coach vinkt alleen geometrisch correcte stappen af en herkent beide toegestane volgordes. Bestaande begeleide oefeningen blijven hun gevraagde volgorde volgen. Foutfeedback verduidelijkt onder andere een los geplaatste tweede vector en een resultante die niet in P begint. Correct werk blijft bewaard; Undo en hervatten blijven beschikbaar.

De stations zijn lokale haltekaarten: verbonden haltes met vectoriconen, nummers, namen, status en voortgang, met een eigen accentkleur per station. De SVG-route en HTML-knoppen gebruiken dezelfde procentuele ankers. Ook het uitklapmenu is vernieuwd.

“Zo doe je het” onthoudt de laatste handmatige open/dicht-keuze. Die blijft gelden bij volgende oefeningen, wisselen van skill, herladen en veranderen van schermformaat. Alleen zolang er geen handmatige keuze is gemaakt, gelden de automatische desktop-/mobielstandaarden.

Desktop toont de coach links naast het bord en feedback rechts. Op kleine schermen opent de coach als tijdelijk paneel naast de linker tekenknoppen; feedback blijft in de rechterkolom. De mobiele kaart heeft een eigen compositie met grote klikzones. De desktopkaart gebruikt één 16:9-stage met procentuele ankers; de volledige achtergrond blijft zichtbaar. De achtergrond is een getekende donkere SVG-sterrenhemel. Sterren clusteren per stationskleur: cyaan, oranje, paars, groen en roze. Een aparte portretcompositie volgt de verticale stationlijst. Hoekige metalen panelen, afgeschuinde knoppen en gekleurde randen volgen de stijl van de bouwwerken, ook in de submenus, battle en het kanvas. Tekst, voortgang en klikzones zijn HTML.

Het voortgangsscherm groepeert de 24 vaardigheden per wereld. Vijf wereldknoppen tonen een percentage en het aantal stevige vaardigheden; het detailpaneel toont alleen de gekozen wereld. Vanuit een oefening opent meteen de bijbehorende wereld. Wisselen en terugkeren bewaart de lopende oefening en het antwoord.

Het assenstelsel kadert automatisch op de gegeven figuur en de volledige constructie, inclusief tussenstappen, omgekeerde kop-staartvolgorde, componenten en uitschietende tussenpunten bij routes. Kleine figuren worden groter getoond. Beide assen houden dezelfde schaal; rondom blijft tekenruimte vrij. De kadrering blijft gelijk tijdens tekenen en tussen uitlegstappen en wordt opnieuw passend gemaakt wanneer het werkvlak van formaat verandert.

Pijlen hebben een steviger lijngewicht en gevulde pijlpunten; de resultante is iets zwaarder. Vectorletters zijn groter en vetter. De volledige naam, inclusief vectoraccent, wordt naast de pijl geplaatst met controle op andere pijlen, pijlpunten, puntnamen en vectorlabels. Dit geldt ook in de uitgewerkte voorbeelden en uitleg.

Opdrachten zijn groter gezet en coördinaten staan leesbaar onder de opdracht. Breuken in opgaven, gegevens, uitleg, feedback en vectorlabels worden gestapeld weergegeven, met een horizontale breukstreep en het minteken vóór de breuk. De numerieke waarden en breukinvoer blijven ongewijzigd. Routevragen en coördinaatrekenen tonen hun gegeven vectoren; puntvragen op basis van een figuur behouden ook op het rekenniveau hun gegeven figuur. De letters a, b en c delen de kleuren van hun pijlen. Alleen de gegevens worden getekend, geen onbekende vector of antwoordpunt.

In Stuwkrachtlab volgt na een juist antwoord een [proefvlucht met twee ruimteschepen](stuwkracht-proefvlucht.md). De schepen volgen de gegeven vector en de antwoordvector in dezelfde tijd. Pauzeren en opnieuw afspelen veranderen de voortgang niet.

## Architectuur

- `vector-core.js` blijft de bron voor alle generators, validators, skill-ID's, scheduler en XP-berekeningen.
- `vector-lessons.js` blijft de bron voor bestaande uitleg en uitgewerkte voorbeelden.
- `vector-mission.js` bevat de stationindeling en zuivere presentatiehelpers: coachstappen, aanvullende fouttekst, dagstreak en automatische kadrering van het tekengebied. Deze helpers bepalen nooit of een antwoord wordt goedgekeurd.
- `vector-app.js` verbindt de bestaande engine en opslag met de missiekaart, de coach en de topbar. Dezelfde opslagkey en gedeelde accountgebonden opslag blijven in gebruik. `practiceDays` is aanvullende UI-metadata.
- `vector-shell.html` bevat de echte bedieningselementen en toegankelijke labels. Het profiel opent de bestaande gedeelde accountdialoog.
- Vijf afzonderlijke stylesheets regelen shell, wereldkaart, stationkaarten, voortgang en het oefenscherm; `mission-architecture.css` voegt de gedeelde bouwwerkstijl toe. De bestaande basis-CSS is ongewijzigd.
- De build maakt beide HTML-ingangen uit dezelfde bronnen. De overige oefenfamilies gebruiken de gedeelde donkere kleuren, maar zijn niet afzonderlijk herontworpen.

Ontbinden staat onder Manoeuvreveld; componentrekenen onder Navigatienet. Alle 24 bestaande skill-ID's zijn exact eenmaal ingedeeld. De inhoudelijke schedulerafhankelijkheden zijn ongewijzigd.

## Bestandenlijst

Gewijzigd:

- `games/vectoren/vector-app.js`
- `games/vectoren/vector-core.js` — getekende gegevens en ondersteunde rekenvoorstellingen
- `games/vectoren/vector-shell.html`
- `games/vectoren/Axioma_Vectorentrainer_v0.2.html` — gegenereerde compatibele platformingang
- `scripts/build-vector-trainer.cjs`
- `tests/vector-trainer-browser.cjs` — bestaande regressies aangepast aan de gevraagde wereldkaartflow; geïsoleerde gastcontext en geen externe verzoeken

Toegevoegd:

- `games/vectoren/vector-mission.js`
- `games/vectoren/styles/mission-shell.css`
- `games/vectoren/styles/mission-world.css`
- `games/vectoren/styles/mission-station.css`
- `games/vectoren/styles/mission-exercise.css`
- `games/vectoren/styles/mission-progress.css`
- `games/vectoren/assets/stations/*.svg` — vijf schaalbare stationbouwwerken
- `games/vectoren/styles/mission-architecture.css` — gedeelde metalen panelen en bediening
- `games/vectoren/assets/vector-night-sky.svg` en `vector-night-sky-portrait.svg` — getekende sterrenvelden per stationskleur
- `games/vectoren/assets/vector-world-bg.webp` — bewaarde oorspronkelijke frameworkachtergrond, niet meer gebruikt
- `games/vectoren/Axioma_Vectorentrainer_v0.4_vectormissie.html` — gegenereerde versie-ingang
- `games/vectoren/CHANGELOG_v0.4_vectormissie.md`
- `tests/vector-mission.test.cjs`
- `tests/vector-mission-browser.cjs`
- `docs/vectoren-v04/README.md`, `browser-report.json` en `screenshots/*.png`

De bestaande wijzigingen aan de rechtentrainer zijn niet aangepast.

## Screenshots

| Scherm | Desktop | 780×360 |
| --- | --- | --- |
| Wereldkaart | [1920×1080](screenshots/world-1920x1080.png) | [Mobiel](screenshots/world-780x360.png) |
| Dockingzone-subkaart | [1920×1080](screenshots/dockingzone-1920x1080.png) | [Mobiel](screenshots/dockingzone-780x360.png) |
| Navigatienet-subkaart | [1920×1080](screenshots/navigatienet-1920x1080.png) | [Mobiel](screenshots/navigatienet-780x360.png) |
| Voortgang per wereld | [1366×768](screenshots/progress-1366x768.png) | [Mobiel](screenshots/progress-780x360.png) |
| Ingezoomde kleine constructie | [1366×768](screenshots/zoom-arrow-1366x768.png) | [Mobiel](screenshots/zoom-arrow-780x360.png) |
| Uitgekaderde route | [1366×768](screenshots/zoom-route-1366x768.png) | [Mobiel](screenshots/zoom-route-780x360.png) |
| Kop-staart | [1920×1080](screenshots/headtail-1920x1080.png) | [Mobiel](screenshots/headtail-780x360.png) |
| Foutfeedback | [Desktop](screenshots/error-desktop.png) | [Mobiel](screenshots/error-780x360.png) |
| Succes na verbetering | [Desktop](screenshots/success-desktop.png) | [Mobiel](screenshots/success-780x360.png) |

Ook vastgelegd: wereld en oefening op 1366×768, 1024×768 en 640×360, plus de coach op 780×360 en 640×360.

## Verificatie

- 26 Node-tests geslaagd: bestaande wiskunde, generators, validators, scheduler en lessen, plus stationdekking, geometrische coachstappen, foutdiagnostiek en dagstreak.
- [102 browserchecks geslaagd](browser-report.json): wereld en alle vijf stations op 1920×1080, 1366×768, 1024×768, 780×360 en 640×360; bereikbare knoppen van minimaal 44×44 pixels; geen paginascroll, stationsoverlap of afgesneden coach-/feedbackpanelen.
- Aanvullend: klikbare kruimelnavigatie met behoud van vrije én gescoorde antwoorden, hervatten via dezelfde halte, uitklapmenu, onderlinge klikzone-overlap, en wereld-/stationnavigatie op 390×844 en 320×568.
- Labelplaatsing gecontroleerd met echte SVG-afmetingen in acht uitgewerkte constructies op desktop en 640×360: geen overlap tussen vectornamen en pijlschachten, pijlpunten of andere vectornamen, en geen afgesneden namen.
- Automatische zoom: alle geometrische families, niveaus en varianten op meerdere seeds gecontroleerd op zichtbare gegeven figuren en volledige oplossingsstappen. Browserchecks op 1366×768, 780×360 en 640×360 controleren muis-/touchinvoer, grotere weergave van kleine figuren, bereikbare route-eindpunten, stabiele schaal tijdens tekenen, herladen en openen/sluiten van de coach. De bestaande draaiaanwijzing voor tekenen in portretstand blijft gelden.
- Voortgang per wereld getest op 1366×768, 780×360, 640×360 en 390×844: alle 24 vaardigheden exact eenmaal ingedeeld, echte percentages en bewijs, juiste wereld geselecteerd, alle vaardigheden bereikbaar en oefening behouden.
- Kop-staart getest met muisdrag, tik-tik en touch; beide volgordes; tweede segment eerst tekenen; fout en correctie; Undo; gedeeltelijk antwoord hervatten na herladen; XP eenmaal toekennen; succes hervatten; volgende vraag; onderbroken reeks hervatten na vrij oefenen.
- De bestaande uitgebreide browserregressie slaagt voor alle 24 oefenfamilies, alle uitlegstappen op 780×360, vrije oefeningen op 640×360, een volledige reeks van 12 oefeningen en openen via `file://`.
- Geen JavaScript-excepties tijdens de browserchecks. Gastopslag en het profielvenster zijn getest. `tests/vector-account-progress-browser.cjs` controleert met testaccounts de echte trainer en voortgangsservice: een antwoord online aanbieden via de bestaande RPC, herstellen in een nieuwe browsercontext, offline opnieuw bewaren en accountisolatie. Het netwerk/backenddeel is gesimuleerd; er zijn geen echte leerlinggegevens gebruikt. Live account-/cloudsynchronisatie is niet met een echte leerlingaccount getest; de gedeelde accountbestanden zijn ongewijzigd.
- Chromium met geëmuleerde viewport en touch is gebruikt. Er is geen fysieke Samsung A20 gebruikt.

Herhalen met een lokale HTTP-server op poort 8775 en een test-Chromium met remote debugging op poort 9245:

```sh
node scripts/build-vector-trainer.cjs
node --test tests/vector-trainer.test.cjs tests/vector-lessons.test.cjs tests/vector-mission.test.cjs
node tests/vector-mission-browser.cjs
node tests/vector-account-progress-browser.cjs
node --test tests/vector-battle-ranking.test.cjs
node tests/vector-battle-browser.cjs
VECTOR_BROWSER_PORT=9245 VECTOR_BASE_URL=http://127.0.0.1:8775 node tests/vector-trainer-browser.cjs
```

## Wiskundige kern en visuele ondersteuning

`vector-core.js` voegt inmiddels gegeven pijlen en figuren toe aan routevragen en coördinaatrekenen. Voormalig symbolische rekenvragen gebruiken `supported-number`, zodat de voortgang verschillende oefenvoorstellingen blijft onderscheiden. Getallen, gevraagde antwoorden, validators, skill-ID's, schedulerregels en XP-berekeningen zijn niet gewijzigd.

`vector-lessons.js` is herzien op wiskundetaal, stapsgewijze constructies en aansluiting van tekst op tekening; zie [controle van de uitlegreeks](uitleg-review.md). `vector-style.css` en gedeelde platform-, account- en opslagbestanden zijn ongewijzigd.

## Terugbladeren, sterrenhemel en lokaal battle spelen

Via **Vorige vraag** kun je de laatste 24 verwerkte vragen van de huidige reeks of vrije oefensessie bekijken, inclusief eigen tekening en feedback. De terugblik is alleen-lezen. **Volgende vraag** bladert vooruit; **Huidige vraag** herstelt het lopende antwoord. De geschiedenis zit in dezelfde opgeslagen oefendraft, ook bij een tijdelijke uitstap naar vrij oefenen. Herladen tijdens een terugblik hervat de actuele vraag. Terugbladeren verandert geen XP of vaardigheidsbewijs. Een nieuwe sessie of andere losse halte begint met een nieuwe geschiedenis.

Het werkbord gebruikt de donkere SVG-sterrenhemel achter het rooster. Pijlen en ruimteschepen hebben een kleine gloed; Extra contrast verwijdert sterren en gloed voor duidelijker geometrie. Het smartphone-menu gebruikt brede knoppen, past binnen het scherm en kan indien nodig scrollen. De bovenbalk blijft bereikbaar boven de melding om het toestel te draaien. De tekenoefeningen blijven bedoeld voor liggende schermen.

Battle is gecontroleerd bij rechtstreeks openen via `file://`, zonder browserbeveiliging uit te schakelen. Beide kanten herkennen de ondoorzichtige oorsprong van lokale bestanden; ontvangen berichten worden nog steeds getoetst aan het echte oudervenster of de juiste speelhelft. HTTP(S) houdt een exacte oorsprongscontrole. De achtergrondpaden in battle en kanvas zijn gecorrigeerd voor de externe stylesheet. Ongebruikte autofocus-attributen worden weggelaten uit de gegenereerde speelhelften.

Aanvullende controles: `tests/vector-history-browser.cjs` en `tests/vector-battle-file-browser.cjs`. Die testen vraaggeschiedenis, behoud van huidig antwoord en XP, herladen, smartphone-menu's, lokaal laden van beide speelhelften, antwoorden, volgende ronde en ontbrekende bestanden/consolefouten. Referenties voor de lokale protocolfix: [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) en [relatieve URL's in CSS-variabelen](https://www.w3.org/TR/css-variables-1/).

De solo-oefenruimte gebruikt nu zijpanelen: tekengereedschap en Vorige vraag links, het rooster in het midden en invoer, feedback en acties rechts. De brede onderbalk is verwijderd. Een leeg linkerpaneel verdwijnt bij vragen zonder tekengereedschap. Lange uitleg kan binnen het rechterpaneel scrollen terwijl de volgende-stapknop zichtbaar blijft. De battlehelften houden hun eigen compacte indeling.
