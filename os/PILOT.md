# Pilot: oorspronkelijke bouwsels in het bureaublad

Doel: overgang tussen bureaublad, themamap, werkvorm en app, met behoud van oorspronkelijke vragen, antwoordbediening, stijl en leerflow. Gewone bezoeken aan `/` en `/index.html` openen het bureaublad op `/os/`. De eerdere catalogus blijft beschikbaar via [`/index.html?view=catalog`](../index.html?view=catalog) en OS Instellingen; bestaande accountlinks behouden de oorspronkelijke accountingang.

## Vier pilots

| Bouwsel | Werkvorm | Behouden |
| --- | --- | --- |
| Pythagoras | Les | Oorspronkelijke opbouw, vierkanten, tegels, slepen en antwoordstappen |
| Rechtenwereld | Trainer | Wereldkaart, vraagvormen, hints, controle en bestaande voortgang |
| Rechten Zeeslag | Spel | Bord, regels, animaties, solo/online-bediening en beurtstatus |
| Glasraam | Atelier | Werkvlak, kleur, rechten, ontwerpbediening en afgeronde ramen |

Terug, minimaliseren, Start, bewaren, account, weergave en sluiten zijn bureaubladbediening. Minimaliseren houdt het oorspronkelijke scherm levend en pauzeert geen timer of online sessie. Bewaren maakt een snelkoppeling. Na browserherladen geldt de oorspronkelijke apphervatting.

## Automatische integratiecontrole

Uitgevoerd met Node/jsdom: eigen map/filter/zoekwoord per app; hervatten via taakbalk en vastgepinde ingang; blijvende DOM/invoer/handlers; Start en ESC in normale én geneste antwoordvelden; focus na Bewaren; centraal account; oorspronkelijke voortgangseenheden; rolgebonden klasacties; Learn-codeformulier en leraarinstellingen; opruimen/isolerende voorkeuren bij accountwisseling; verwerpen van verouderde voortgangsreacties; maximaal zes levende apps. Catalogus, providers en 114 routes zijn gecontroleerd.

## Daadwerkelijke browsercontrole · 9 oktober 2026

1366 × 768, 100% zoom, `deviceScaleFactor: 1`, geïsoleerde Chromium-profielen. Compact: 390 × 844; Zeeslag en Glasraam ook 844 × 390. Authenticatie is fictief, niet een bewijs voor productieaanmelding. Klas/live-tests gebruiken bestaande Edge-handlers en SQL-migraties in een tijdelijke lokale PostgreSQL/PGlite-database.

| Controle | Uitgevoerd en verwacht gedrag | Resultaat |
| --- | --- | --- |
| Bureaublad | Start/zoeken, thema’s, profiel, instellingen, bewaarde taken, centrale accountbediening | Browsercontrole geslaagd; screenshots/rapport in `qa/` |
| Appruimte | Vier pilots uitgeklapt/ingeklapt, herstelknop ≥44 px, extra inhoudsruimte, vraag/antwoordactie bereikbaar | Geslaagd op laptop en compact; originele Pythagoras/Rechtenwereld-draaibegeleiding in staande stand behouden |
| Les | Pythagoras onthullen, slepen, getaltegel, volgend level, gedeeltelijke formule, Start/ESC en hervatten | Geslaagd; zelfde iframe, fase, input, handlers en focus |
| Trainer | Rechtenwereldkaart, echte coördinatenopgave, hint, controle, feedback en Volgende; map/hervatten | Geslaagd; één geregistreerde poging en dezelfde vraag/status bij hervatten |
| Spel | Zeeslag echte plaatsing/formule/schot, minimaliseren/hervatten, Solo direct, online lobbyfixture | Geslaagd; compacte borden/VUUR hersteld. Bestaande socialtest speelt ook volledige online- en solopartijen |
| Atelier | Glasraam fout punt, verbeteren, raam afronden, kleur wijzigen, gedeeltelijke invoer, native weergave, taakbalk | Geslaagd; ontwerp/invoer/focus behouden en echte `1/8 ramen` zichtbaar |
| Terugkeerplek | Vier appmaps met eigen filter/zoekwoord, Start boven andere app, opgeslagen ingang via Mijn taken | Geslaagd; vastgepinde hervatting behoudt de oorspronkelijke terugkeerplek |
| Learn met klas | Leraarinstellingen, leerlingcode, 5 vragen, fout verbeteren, bespreken, afronden en verslag | Geslaagd met lokale Edge/SQL en fictieve auth; 45 bestaande XP. Productieaccounts nog open |
| Battle met klas | Getallen en Rechten, leraarstart, leerlingcode, 5 vragen elk, timer/keuzes, eindresultaat | Geslaagd met lokale Edge/SQL en fictieve auth; Getallen 50 XP. Productieaccounts nog open |
| Live les | Leraarsessie/code, leerling volgen, stemmen, uitslag, minimaliseren, afsluiten en aliasverslag | Geslaagd met lokale Edge/SQL en fictieve auth. Productieaccounts nog open |
| Start/focus | Ctrl/Cmd K uit een antwoordveld en genest Rechten-Battle-werkbord, ESC terug, gewone Enter bij app | Geslaagd; originele antwoordfocus en input behouden |
| Herladen | Inklapkeuze, bewaarde ingangen, oorspronkelijke Learn-draft/resume en bestaande spelhervatting | Geslaagd binnen de oorspronkelijke appbeloften; geen kopie van vluchtig spelgeheugen |
| Accounts/rollen | Leerling krijgt deelname, geen klasstart; leraar krijgt bestaande startacties; centraal accountvenster | UI/DOM/SQL-rolchecks en native inloglink en gast-live-lesknop → centrale dialoog geslaagd. Echte productieaanmelding niet uitgevoerd |

De actuele bewijsbestanden staan in [qa/pilot-browser-report.json](qa/pilot-browser-report.json), [qa/live/results.json](qa/live/results.json) en [qa/verification.json](qa/verification.json). Screenshots staan naast de rapporten. [REVIEW.md](REVIEW.md) bevat de bestandswijzigingen, alle testgrenzen en bestaande regressiefouten.

## Getallenwereld · oorspronkelijke vijftien onderdelen

De tweede ZIP is gericht geïntegreerd: alle 21 bestandshashes gecontroleerd, alleen de nieuwe Getallenwereldbron overgenomen en verbeterd. De oudere desktop/topbarbestanden uit het pakket zouden reeds herstelde integraties vervangen en zijn daarom niet gekopieerd.

| Controle | Werkelijk uitgevoerd | Grens |
| --- | --- | --- |
| Vijftien oorspronkelijke leeronderdelen | Alle acht machten- en zeven wortelonderdelen: oorspronkelijke regelkeuze, alle antwoorddelen en echte beoordeling; volledige zesvragenreeksen in jsdom | Geen nieuwe of omgerekende XP |
| Historische opslag | 30 editie-1/2-runs en 15 correcte antwoorden vóór Volgende exact hervat; hulpseed/stap via menu en documentherladen; oude resultaatlinks gecorrigeerd | Bestaande opslagidentiteiten behouden |
| Werkruimte | 92 controles van oorspronkelijke formulevarianten op 640 × 360 en 390 × 844, echte antwoordklikken en onbedekte knoppen ≥44 px | Grote keuzepanelen gebruiken hun eigen scrollruimte |
| Native regressies | Bestaande Getallenwereld- en verenigde-wereldbrowsers: alle routes, vijf schermmaten, inklappen/herladen/heropenen, invoer, accountwisseling en providerterugkeer | Auth/voortgangstransport expliciete fixtures |
| Bestaande providers | Numbers Space-browser: volledige klas, retry/reconnect/idempotentie, simulatie, solo-XP, vijf layouts en herladen; OS-klas/live-browser opnieuw volledig geslaagd | Externe auth/sessietransports vervangen door lokale testgrenzen |

De eerdere OS-browsermatrix van **128 interactiegroepen en 876 layouts** staat in [qa/getallen/report.json](qa/getallen/report.json): 1366 × 768 bij 100% zoom, 390 × 844 en 844 × 390; beide balkstanden/herstel, alle vijftien oorspronkelijke werkbanken binnen OS én zelfstandig, Start/ESC/focus/minimaliseren/pins/Bewaren/account, exacte hulp, historische negatieve vragen en daadwerkelijke wetenschappelijke solo-/papier-/Bordduobediening. Dit is het bewijs voor de versie vóór de vier nieuwe wetenschappelijke onderdelen. Duo Learn en Duo Battle openen voor elk van de drie onderwerpen de echte selectie, maakactie en lobby met lokale responsfixtures. Volledige klasvragen gebruiken de bestaande Edge-handlers/SQL zoals hierboven beschreven.

## Getallenwereld · vier nieuwe wetenschappelijke onderdelen

De werkplaats telt nu **19 begeleide onderdelen**: de vijftien oorspronkelijke doelen en vier nieuwe wetenschappelijke doelen. Grote getallen, kleine getallen, terugschrijven en normaliseren hebben elk zes verschillende opgaven, regelkeuze, eigen aanklikbare antwoorddelen, exacte beoordeling, hulp en resultaat. Het bestaande opslag-ID, de oorspronkelijke voltooiingen en de grens tussen begeleide onderdelen zonder XP en de zestien provider-vraagvormen met eigen XP blijven behouden.

| Controle | Werkelijk uitgevoerd | Grens |
| --- | --- | --- |
| Vier begeleide doelen | Vier volledige zesvragenreeksen binnen het OS, eigen voortgang op 19, zelfstandige routes en oorspronkelijke machten-/wortelopslag behouden | Voltooiing is bewijs van uitgewerkt werk, geen automatisch beheersingslabel |
| Navigatie en bewaren | Hoofdstuk/onderdeel/werkbank, hulp en fout verbeteren, Start/ESC, focus, minimaliseren/hervatten, pins, Bewaren en herladen | De bestaande eigen appopslag blijft leidend |
| Native regressies | Alle 19 routes op vijf schermmaten, inklappen/herladen/heropenen, invoer, accountwisseling en providerterugkeer; 106 formulecontroles op 640 × 360 en 390 × 844 met echte antwoordklikken en zichtbare doelen ≥44 px | Geïsoleerde accounts en voortgangsfixtures |
| Wetenschappelijke interface | **67 interactiegroepen en 190 gemeten layouts**, waaronder 1366 × 768 bij 100% zoom, 390 × 844 en 844 × 390; beide balkstanden, herstel en echte antwoorden met bereikbare keuzes ≥44 px | [Rapport en screenshots](qa/scientific/report.json); fictieve authenticatie en lokaal sessietransport |
| Drie provider-niveaus | Nieuwe wetenschappelijke solo-, Bordduo-, borduitleg-, papier- en simulatiereeksen gebruiken versie 2; Start, Basis en Verdieping verschillen inhoudelijk | Versieloze historische taken blijven versie 1 |
| Papier | Nieuwe vragen en verbetersleutel, native afdrukactie en afdrukweergave gecontroleerd; bestaande speelreeksen blijven behouden | Geen fysieke printer of productie-export gecontroleerd |
| Online UI en rollen | Wetenschappelijke Duo Learn, Duo Battle, Klaslearn en Klasbattle: selectie, maakactie, code, start en vraag met niveau 2; leerling krijgt deelname/duo en leraar klasstart | Browserresponses zijn expliciete lokale fixtures |
| Online SQL/Edge | Alle vier werkvormen op elk van de drie niveaus met echte lokale migraties/handler, antwoordbeoordeling, eenmaal XP, oudere client vóór deelname afgewezen, actieve historische sessie behouden | Migratie en `numbers-session` versie 2 op 10 oktober naar productie uitgerold; geen volledige productie-accountproef |
| Oude server | Nieuwe client houdt ontvangen historische generatie aan; instellingen vermelden dat Basis en Verdieping dezelfde bestaande vraagmix gebruiken | Compatibiliteitscontrole met een oude serverfixture; productiebackend ondersteunt nu versie 2 |

De rekencontrole bevriest 3600 historische wetenschappelijke taken en controleert 3600 nieuwe taken onafhankelijk met gehele-decimaalrekenkunde. De lokale SQL/Edge-controle verifieert ook de veilige terugval bij een nog niet gemigreerde database of oude arithmetic-bundle, herhaalde request-ID’s, het openbare RPC-delegaat en behoud van catalogusinstellingen en leerlingvoortgang. [De providerdocumentatie](../games/bewerkingen-trainer/README.md) beschrijft de afzonderlijke migratie/Edge/frontend-uitrolvolgorde.

Duo Learn deelt de bespreking, met eigen oplossingen. Betekenis/nulmacht en wortelregeltoetsing hebben een expliciete hoofdstukselectie bij de provider. Terugschrijven en normaliseren openen eveneens een hoofdstukselectie: de aanvullende provider oefent de voorwaartse wetenschappelijke schrijfwijze en is geen gelijkwaardige vervanging van die twee begeleide doelen.

Productieaanmelding, cloudhervatting en externe multiplayer met **twee daadwerkelijk ingelogde accounts** blijven open. Het bestaande leerlingaccount `bob` en de aanduiding `Leerkracht` zijn geen bewijs van twee bediende productiesessies.

## Productie-uitrol · 10 oktober 2026

De gerichte wetenschappelijke migratie is toegepast en `numbers-session` is actief als versie 2 met `verify_jwt=true`. De gedeployde `index.ts`, `handler.js` en `core.js` zijn bytegelijk aan de reviewbranch. Het catalogustotaal is 19. De oorspronkelijke sessiefunctie heeft dezelfde bronhash en de RPC blijft uitsluitend toegankelijk voor de service-role. Een anonieme HTTP-aanroep geeft 401.

Hashes vóór en na uitrol bevestigen behoud van alle 41 bestaande voortgangsrijen en de bestaande sessiegegevens: één ruimte, twee deelnemers, nul antwoorden en nul requests. Deze controle heeft geen leerlingwerk of nieuwe sessie gemaakt. De frontend wordt via GitHub Pages vanaf `main` gepubliceerd; publieke ingangen zijn [het bureaublad](https://godwillsaveyoutoo-pixel.github.io/LeraarBob/os/) en [Getallenwereld](https://godwillsaveyoutoo-pixel.github.io/LeraarBob/games/getallenwereld/). Actuele releasecontroles staan in [PR #7](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/pull/7) en [het verificatierapport](qa/verification.json). De eerdere ontwikkelpilot stond als draft ter review.

## Nog open voor productiecontrole

- Twee daadwerkelijke ingelogde testaccounts gebruiken voor productieauthenticatie, cloudhervatting en externe live/WebSocketverbindingen. Er is geen bruikbare loginconfiguratie of actieve browsersessie beschikbaar gesteld.
- Afzonderlijke bestaande fouten opvolgen: verouderde voortgangshash in de Rechten-regressietest, Signaalstad-oefenbladdekking en de Kleiduif-lobby op 320 × 568. Zij zijn ook op de oorspronkelijke main gereproduceerd. De vier OS-pilots en hun volledige klasruns slagen.

Na acceptatie kunnen de overige bouwsels op dezelfde aansluiting aansluiten. Centrale door leraren uitgedeelde taken en nieuwe profiel-/werkvormfuncties zijn vervolgstappen.
