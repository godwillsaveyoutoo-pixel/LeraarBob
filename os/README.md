# leraarBob-bureaublad · ontwikkelpilot

Het bureaublad op `/os/` is de standaardstartpagina: gewone bezoeken aan `/` en `/index.html` openen het OS. De eerdere catalogus blijft beschikbaar via [`/index.html?view=catalog`](../index.html?view=catalog) en OS Instellingen. Bestaande accountlinks voor aanmelden, terugkeer en verificatie blijven via de oorspronkelijke accountingang lopen. De oorspronkelijke pilot is geïntegreerd op `codex/os-pilot-20261009`, vanaf de GitHub-basis `6056ac4e7445f6bb15fa1b15dce43df32a6e17e6`.

## Werking

Acht themamappen en 24 bestaande bouwsels, met lessen, trainers, spellen en ateliers, Start en Ctrl/Cmd K, zoeken, pins, persoonlijke bewaarde ingangen en oefenbladgeneratoren. Iedere app blijft in haar oorspronkelijke wereld met dezelfde vragen, antwoordbediening, voortgangsidentiteit en leerflow.

Maximaal zes apps blijven tegelijk geopend op dezelfde origin. Terug, minimaliseren, Start, profiel en instellingen hergebruiken de oorspronkelijke iframe en DOM. Iedere app onthoudt haar eigen map, filter en zoekwoord. Hervatten herstelt de vorige antwoordfocus, ook wanneer je eerst Bewaren gebruikte. Ctrl/Cmd K en Escape werken ook in geneste Battle-werkborden. Andere toetsen blijven bij de app.

De bestaande centrale accountbediening en accountrol blijven leidend. Leraren starten klasactiviteiten; leerlingen krijgen de bestaande deelnameformulieren. Accountwisseling sluit geopende apps en isoleert pins, snelkoppelingen en vertraagde voortgangsantwoorden. XP, levels, ramen en rondes komen uit hun oorspronkelijke bronnen. De bestaande online opslag en sessieproviders blijven leidend.

Solo Zeeslag opent direct de bestaande computerpartij. De online ingang blijft de oorspronkelijke lobby. De gedeelde bovenbalk ondersteunt inklappen, heropenen, fullscreen en weergave. De expliciete inklapvoorkeur overleeft herladen. Aanraakdoelen van bureaubladnavigatie zijn minstens 44 × 44 px. De appnaam staat ook in de compacte bovenbalk.

Glasraam en de live les gebruiken de platformnavigatie van het bureaublad. Hun oorspronkelijke navigatienodes zijn binnen het frame verborgen; theme-handlers en voortgangsnodes blijven bestaan. Zeeslag heeft een beperkte CSS-correctie voor kleine schermen: beide borden, de oorspronkelijke formulebediening en VUUR blijven bereikbaar. Bewaarmeldingen staan in de taakbalk.

## Grenzen

Mijn taken bevat persoonlijke snelkoppelingen, geen door een leraar uitgedeelde opdrachten. Bewaren kopieert niet het volledige spelgeheugen. Minimaliseren pauzeert geen timer of online sessie. Na browserherladen geldt de eigen hervatfunctie van de app; onopgeslagen invoer in geheugen wordt niet door het bureaublad hersteld. Pins en bureaubladvoorkeuren worden per account op dit toestel bewaard. Spelvoortgang blijft de bestaande opslag gebruiken.

Alleen werkende providers worden aangeboden. Pythagoras krijgt geen verzonnen trainer, Battle of oefenbladgenerator. Productieauthenticatie en echte externe WebSocketverbindingen zijn nog niet met twee ingelogde testaccounts gecontroleerd.

## Oefenbladmappen en bewaarde reeksen

Oefenbladen opent eerst themamappen en daarna onderwerpmapjes. Rechten bevat Hellingrug, Grenspas, Formulewerf en Signaalstad; Algebra bevat Vergelijkingen en Stelsels; Getallen bevat Machten, Vierkantswortels en Wetenschappelijke notatie. Elke ingang opent de bestaande generator met zijn eigen keuzes, vragen, opmaak en afdrukbediening. Er verschijnen alleen onderwerpen waarvoor een generator bestaat.

Een nieuw gemaakte reeks wordt automatisch in **Mijn oefenbladen** bewaard. De generator en de OS-knop Bewaren bewaren de werkelijk gemaakte opgaven en hun bijbehorende verbetersleutel; dezelfde reeks opnieuw bewaren maakt geen duplicaat. Mijn oefenbladen heeft dezelfde indeling per thema en onderwerp. Bij terugkeren of herladen opent het OS de bewaarde pagina’s, zonder nieuwe willekeurige vragen te maken. Een nieuw blad vervangt oudere reeksen niet.

Deze documenten worden apart van leerlingvoortgang in IndexedDB bewaard, **per account op dit toestel**. Gastbladen blijven bij de gast. Accountwisseling sluit geopende documenten en geeft geen toegang tot de vorige gebruiker. Er is geen cloudsync of automatische overdracht naar een ander toestel. Download kopie maakt een volledig JSON-bestand dat via Kopie terugzetten opnieuw in de eigen map kan worden gezet. Download oefenblad maakt een zelfstandig HTML-document met de opgaven, sleutel en ingesloten opmaak. Afdrukken / PDF gebruikt de bewaarde documentpagina’s.

De map bewaart maximaal 200 reeksen en maximaal 16 MiB per reeks. Bij volle of geblokkeerde opslag verschijnt een melding dat de reeks niet bewaard is; bestaande bladen worden niet automatisch verwijderd. De oorspronkelijke generator blijft beschikbaar om het blad af te drukken of als PDF op te slaan. Een gedownloade kopie blijft bruikbaar als browsergegevens worden gewist.

## Gedeelde Klasbattle-ingang

Getallenwereld en Rechtenwereld gebruiken vanuit het OS dezelfde stappen voor een klasbattle: leerstof kiezen, instellingen bepalen, een code maken, deelnemers ontvangen en de battle starten. De gezamenlijke opstartbediening gebruikt de originele velden en knoppen. De eigen vraagvormen, antwoordbediening, spelstatus, XP en bestaande providers blijven bij elke wereld. Verschillen in beschikbare leerstof of provideropties worden behouden.

## Algebrawereld

Binnen het OS heeft Algebra twee navigatielagen: de gedeelde platformbalk en één appbalk met terugkeer, **Werelden / Levels / Werkvormen**, Bewaren en vensterbediening. De extra native titel-/menubalken nemen binnen het frame geen ruimte in; hun oorspronkelijke nodes en handlers blijven bestaan. Zelfstandig geopend gebruikt Algebra één gedeelde platformbalk en dezelfde drie bestemmingen.

Vergelijkingen behoudt zeven levels, Stelsels zes. Kiezen start geen nieuwe oefening: daarvoor blijft Spelen nodig. Werkvormen toont de eigen reeks, oefenbladen, klasbattle en hervatting voor de gekozen wereld. De klasbattle gebruikt de bestaande centrale hub met het geselecteerde level en de eigen terugkeerroute. Vergelijkingen, Stelsels en hun klasbattlevensters zijn afzonderlijk herkenbaar in de taakbalk. Wisselen tussen werelden of terugkeren uit de hub houdt het oorspronkelijke moduleframe, de tussenstappen en onafgemaakte invoer intact.

Inklappen houdt de native oefening en voortgang intact, met een bereikbare herstelknop van minstens 44 × 44 px. Op mobiel kan de ene appbalk twee regels gebruiken; zeer korte liggende schermen gebruiken interne scroll in het oorspronkelijke formule-/bewerkingspaneel. Na browserherladen opent het OS de eigen map. De bestaande native opslag hervat het werk wanneer de module opnieuw wordt geopend.

De [nieuwe Algebra-browsercontrole](qa/algebra-navigation/report.json) slaagt met **18 interactiegroepen, 252 doelmetingen en 39 screenshots** op 1366 × 768 bij 100% zoom, 390 × 844 en 640 × 360, met beide balkstanden. Werkelijke bewerkingen, hulp/historie, zes antwoorden met de native 30 XP, Stelsels-voorstel en onafgemaakte invoer, oefenbladbewaring, Start/focus, hervatten, accountisolatie, klasroutes en herladen zijn uitgevoerd. De [regressies](qa/algebra-navigation/regressions/) slagen met 123 DOM-/platformcontroles, 76 Algebra-/catalogusunits, de bestaande native flow en klasbrowser, 795 Stelsels-controles en de vier OS-pilots. Rol- en accountproeven gebruiken gescheiden lokale fixtures; echte productieaanmelding met twee accounts blijft open. Zie [bewijs en grenzen](qa/algebra-navigation/README.md).

## Getallenwereld

De werkplaats telt negentien begeleide onderdelen: acht over machten, zeven over vierkantswortels en vier over wetenschappelijke notatie. De oorspronkelijke vijftien behouden hun vragen en antwoorddelen. De vier nieuwe onderdelen behandelen grote getallen, kleine getallen, terugschrijven en normaliseren, met regelkeuze, klikantwoorden, exacte beoordeling, hulp en resultaat. Je kiest vrij; beginnen blijft een expliciete actie. Oude vragen, invoer, voortgang, hulpvoorbeeld/hulpstap en correcte antwoorden die op Volgende wachten blijven hervatbaar. Het OS-kruimelpad volgt het actuele hoofdstuk/onderdeel, Bewaren bewaart die ingang en de directe weergaveknop verandert ook het native werkbord zonder herladen.

De bestaande reeksprovider blijft, samen met solo met XP, Bordduo, Duo Learn, Duo Battle, Klaslearn, Klasbattle, borduitleg en oefenbladen, via dezelfde wereld bereikbaar. Leraarstart en leerlingdeelname blijven afzonderlijk. De begeleide leerroute rapporteert negentien onderdelen zonder XP; de reeksprovider behoudt zestien vraagvormen en zijn eigen XP/opslag. Nieuwe wetenschappelijke eigen reeksen, Bordduo, borduitleg, oefenbladen en simulaties hebben drie verschillende niveaus: grote gehele getallen, grote en kleine getallen, en interne nullen met exponenten tot ±20. Historische taken blijven hun oorspronkelijke generatie gebruiken. Zie [WORKSHOP.md](../games/getallenwereld/WORKSHOP.md) en [de uitgevoerde controle](PILOT.md).

De productiebackend voor de drie nieuwe online wetenschappelijke niveaus is op **10 oktober 2026** uitgerold: de gerichte migratie en `numbers-session` versie 2 zijn actief. De gedeployde bronbestanden zijn gelijk aan deze branch; bestaande voortgang en sessiegegevens bleven ongewijzigd. De frontend wordt via GitHub Pages vanaf `main` gepubliceerd; publieke ingangen zijn [het bureaublad](https://godwillsaveyoutoo-pixel.github.io/LeraarBob/os/) en [Getallenwereld](https://godwillsaveyoutoo-pixel.github.io/LeraarBob/games/getallenwereld/). De historische releasecontroles staan in de samengevoegde [PR #7](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/pull/7) en [het verificatierapport](qa/verification.json). Nieuwe clients volgen steeds de versie van de ontvangen sessie; historische sessies houden hun oorspronkelijke vragen. Twee echte ingelogde productieaccounts, cloudhervatting en externe realtimeverbindingen zijn nog niet gecontroleerd.

Duo Learn gebruikt eigen antwoorden en gezamenlijk bevestigde bespreking. Betekenis/nulmacht en het toetsen van wortelregels openen expliciet een hoofdstukselectie bij de reeksprovider, omdat die geen equivalente vraagvorm heeft. Terugschrijven en normaliseren verwijzen eveneens naar een hoofdstukselectie voor aanvullende oefeningen in de voorwaartse wetenschappelijke schrijfwijze; de provider biedt voor deze twee doelen geen gelijkwaardige vraagvorm. De vier begeleide wetenschappelijke doelen zelf werken wel volledig in de werkplaats.

## Lokale preview

```sh
node scripts/serve-os-preview.cjs
```

Open <http://127.0.0.1:8787/os/>. `OS_PREVIEW_PORT` kan een andere poort instellen. De server bindt alleen aan localhost en biedt uitsluitend frontendbestanden aan; verborgen bestanden, SQL, tests, documentatie en directorylijsten worden geblokkeerd.

## Verificatie

```sh
node scripts/build-catalog.cjs --check
node tests/game-registry.cjs
node tests/desktop-package-check.cjs
node --check os/desktop.js
npm install --no-save --package-lock=false --prefix /tmp/leraarbob-os-tests jsdom@26.1.0 playwright@1.64.0 @electric-sql/pglite@0.5.8 fake-indexeddb@6.2.4
NODE_PATH=/tmp/leraarbob-os-tests/node_modules node --test --test-isolation=none tests/desktop-model.test.cjs tests/desktop-dom.test.cjs tests/topbar-desktop.test.cjs tests/catalog.test.cjs tests/catalog-progress.test.cjs tests/platform-mode-context.test.cjs tests/platform-routes.test.cjs
/tmp/leraarbob-os-tests/node_modules/.bin/playwright install chromium
NODE_PATH=/tmp/leraarbob-os-tests/node_modules node tests/desktop-pilot-browser.cjs
NODE_PATH=/tmp/leraarbob-os-tests/node_modules node tests/desktop-live-browser.cjs
NODE_PATH=/tmp/leraarbob-os-tests/node_modules node --test --test-isolation=none tests/getallen-workshop-dom.test.cjs tests/getallen-world-integration.test.cjs
NODE_PATH=/tmp/leraarbob-os-tests/node_modules node tests/getallen-os-browser.cjs
NODE_PATH=/tmp/leraarbob-os-tests/node_modules node --test --test-isolation=none tests/getallen-scientific-lessons.test.cjs tests/scientific-provider.test.cjs tests/scientific-session-version.test.cjs
NODE_PATH=/tmp/leraarbob-os-tests/node_modules node tests/getallen-scientific-browser.cjs
NODE_PATH=/tmp/leraarbob-os-tests/node_modules node --test --test-isolation=none tests/worksheet-library.test.cjs tests/worksheet-save.test.cjs
WORKSHEETS_SCREENSHOTS=/tmp/leraarbob-worksheets-qa NODE_PATH=/tmp/leraarbob-os-tests/node_modules node tests/desktop-worksheets-browser.cjs
ALGEBRA_OS_SCREENSHOTS=/tmp/leraarbob-algebra-qa NODE_PATH=/tmp/leraarbob-os-tests/node_modules node tests/algebra-os-browser.cjs
```

Een geïnstalleerde Brave wordt automatisch gebruikt. `LB_CHROMIUM` kan een andere browserbinary kiezen. Anders gebruiken de tests de geïnstalleerde Playwright Chromium. Authenticatie is fictief en gescheiden; de live-test voert de bestaande Edge-handlers en SQL-migraties daadwerkelijk uit in een tijdelijke PostgreSQL/PGlite-database. Productiegegevens worden niet geschreven.

Zie [PILOT.md](PILOT.md) voor de afgevinkte praktijkcontrole en [REVIEW.md](REVIEW.md) voor vergelijking, fixes, testresultaten, screenshots en resterende beperkingen. De catalogusworkflow draait de DOM- en browsercontroles en bewaart QA-artifacts. `GETALLEN_SCREENSHOTS` bepaalt de uitvoermap van de Getallenwereldcontrole; `SCIENTIFIC_SCREENSHOTS` die van de aanvullende wetenschappelijke controle; `WORKSHEETS_SCREENSHOTS` die van de oefenbladcontrole; `ALGEBRA_OS_SCREENSHOTS` die van de Algebra-navigatiecontrole.

De huidige oefenbladcontrole slaagt met 15 unitcontroles, 22 browsergroepen, 47 layoutmetingen en 18 screenshots. Negen echte bewaarde PDF’s zijn op alle 62 pagina’s gerenderd en visueel beoordeeld. De gedeelde klasstart slaagt met 32 groepen, 78 interactieve doelen en 22 screenshots. De laatste [regressierapporten](qa/worksheets/regressions/) slagen voor de vier pilots (32 groepen / 23 layouts), Getallenwereld (146 / 1076) en wetenschappelijke schrijfwijze (67 / 190), zonder browserfouten of ontbrekende bronnen. Rechtenwereld behoudt zijn oorspronkelijke draaihulp op 390 px; de volledige opgavebediening is op 1366 px uitgevoerd. Alle auth- en externe sessiegrenzen in deze browserruns gebruiken lokale fixtures. De eerdere matrix van 128 groepen / 876 layouts blijft historisch bewijs voor de oorspronkelijke vijftien werkbanken.
