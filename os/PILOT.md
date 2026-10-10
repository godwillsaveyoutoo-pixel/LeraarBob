# Pilot: oorspronkelijke bouwsels in het bureaublad

Doel: overgang tussen bureaublad, themamap, werkvorm en app, met behoud van oorspronkelijke vragen, antwoordbediening, stijl en leerflow. Gewone bezoeken aan `/` en `/index.html` openen het bureaublad op `/os/`. De eerdere catalogus blijft beschikbaar via [`/index.html?view=catalog`](../index.html?view=catalog) en OS Instellingen; bestaande accountlinks behouden de oorspronkelijke accountingang.

## Algebrawereld-navigatie · 10 oktober 2026

De [definitieve browserrun](qa/algebra-navigation/report.json) telt **18 interactiegroepen, 252 doelmetingen en 39 screenshots**, zonder browserexceptions of ontbrekende bronnen. Gecontroleerd op **1366 × 768 bij 100% zoom**, 390 × 844 en 640 × 360, `deviceScaleFactor: 1`, met de bovenbalk uitgeklapt en ingeklapt. Alle zestien bronhashes kloppen met de definitieve implementatie.

| Controle | Werkelijk uitgevoerd | Resultaat / grens |
| --- | --- | --- |
| Navigatielagen | OS: één platformbalk plus één gecombineerde appbalk; standalone: één platformbalk plus Werelden/Levels/Werkvormen | Dubbele Algebra-titel-/menurijen verborgen met behoud van nodes en handlers |
| Wereld en level | Beide werelden, alle zeven Vergelijkingen- en zes Stelsels-levels geselecteerd | Selectie start geen vraag en wijzigt geen poging; Spelen blijft expliciet |
| Vergelijkingen | Echte bewerking, hulp/pauze, Stappen en ongedaan maken; zes daadwerkelijke juiste antwoorden | Native 30 XP exact zichtbaar in de OS-balk |
| Stelsels | Voorstel uitvoeren, beide actuele vergelijkingen, hulp/historie en onafgemaakte `1/`-invoer | Exact werk en invoer blijven bestaan bij navigatie en hervatten |
| Werkvormen en papier | Eigen werkvormen per module; oefenblad van een ander level werkelijk gemaakt en automatisch bewaard | Lopende vraag, voorstel, invoer en XP veranderen niet |
| Start en venster | Ctrl/Cmd K, Escape, antwoordfocus, Bewaren, minimaliseren/hervatten, eigen map/filter/zoekwoord, fullscreen en weergave | Dezelfde iframe en werkbordnodes; aparte taakbalknamen voor Vergelijkingen en Stelsels |
| Balken en compacte ruimte | Beide standen, herstel ≥44 × 44 px en juiste toegankelijke status; native opgave en belangrijkste acties bereikbaar | Op 640 × 360 gebruiken de formule-/bewerkingspanelen hun eigen interne scroll |
| Account | Centrale dialoog tijdens een opgave; gast naar leerling wisselen | Oud frame verwijderd; vragen, XP en oefenbladen niet aan volgende gebruiker getoond |
| Klasbattle | Gast/leerling vanuit Vergelijkingen en leraar vanuit Stelsels; standalone gast/leerling/leraar; exact gekozen level en terugkeer | Rolbediening klopt; hubterugkeer hergebruikt de oorspronkelijke module met invoer. Authfixtures, geen nieuwe productieklas |
| Herladen | Volledig OS-herladen, behouden inklapkeuze, module opnieuw openen via echte wereldkaart en native hervatting | OS herstelt de eigen map; de bestaande Algebra-opslag herstelt opgeslagen werk en draft |

De [aanvullende regressies](qa/algebra-navigation/regressions/) slagen: **123 DOM-/platformcontroles**, **76 Algebra-/catalogusunits**, native flow op vijf schermmaten met twee echt gespeelde rondes (60 XP, één voltooid level), oorspronkelijke Algebra-klasbrowser, **795 Stelsels-browsercontroles** en de vier OS-pilots (**32 groepen / 23 layouts**). De native Werkvormen en hulplessen zijn daarnaast gericht uitgevoerd. [Dertien beschermde bronbestanden](qa/algebra-navigation/protected-sources.json) zijn gelijk aan de basis; de oorspronkelijke lokale werkmap heeft volgens de afzonderlijke rootvergelijking **1517 identieke hashes en nul wijzigingen**.

Dit bewijs gebruikt geïsoleerde gast-, leerling- en leraarfixtures, met geblokkeerd extern netwerk. De native klasseproef gebruikt de bestaande lokale serverlogica. Twee werkelijk ingelogde productieaccounts, cloudhervatting en externe multiplayer blijven open. De eerdere Rechtenwereld-draaihulp op 390 px is behouden; de desktopopgaven van alle vier pilots zijn werkelijk bediend. [Bewijsindeling en herhaalcommando](qa/algebra-navigation/README.md).

## Oefenbladmappen · 10 oktober 2026

- [x] Alle zeven bestaande generators werkelijk bediend in negen onderwerpen: vier Rechten-onderdelen, Vergelijkingen, Stelsels, Machten, Vierkantswortels en Wetenschappelijke notatie.
- [x] Automatisch bewaren na succesvolle generatie; exact oorspronkelijke opgaven en gepaarde verbetersleutel gecontroleerd met hashes, ook na volledig OS-herladen.
- [x] Opnieuw bewaren en de OS-knop Bewaren maken geen duplicaat of onjuiste snelkoppeling in Mijn taken. Terug naar de eigen onderwerpmap, minimaliseren, hervatten en Start/focus blijven werken.
- [x] Library/helper: 15 unitcontroles voor zeven bronnen, gast/accountisolatie, accountwisseling tijdens bewaren, volle/geblokkeerde opslag, de 200-reeksgrens, veilig HTML/MathML/SVG/JPEG en geldig/ongeldig backupherstel.
- [x] Definitieve browsermatrix op 1366 × 768 en 390 × 844, 100% zoom: 22 interactiegroepen, 47 layoutmetingen en 18 screenshots. Beide balkstanden, volledige A4-voorbeelden, herstelbediening ≥44 px, accountisolatie, echte download/herstel en zichtbare fouten bij geblokkeerde opslag slagen zonder browserfouten of 404.
- [x] Negen echte bewaarde opgaven-/sleuteldocumenten als A4-PDF; alle 62 pagina’s via Poppler gerenderd en zes contactvellen plus een volledige wortelpagina visueel gecontroleerd. Geen afgesneden inhoud, overlap of lege pagina’s; native schrijfruimte kan een opgave over twee bladen verdelen.

De nieuwe documentmap bewaart lokaal per account op dit toestel. JSON-kopieën kunnen in de eigen map worden teruggezet. Cloudsync, productie-login en echte externe testaccounts maken geen deel uit van dit bewijs.

Het [worksheetrapport](qa/worksheets/report.json) bewaart de controles, document- en bronhashes en screenshots; [PDF-review](qa/worksheets/pdf-review.json) legt het render- en visuele bewijs vast. De laatste regressierun op deze bronnen slaagt voor de vier oorspronkelijke pilots (32 groepen / 23 layouts), Getallenwereld (146 groepen / 1076 layouts) en wetenschappelijke schrijfwijze (67 groepen / 190 layouts). De [regressierapporten](qa/worksheets/regressions/) hebben geen browserfouten of ontbrekende bronnen. Rechtenwereld behoudt op 390 px de oorspronkelijke draaihulp; volledige opgavebediening is op 1366 px doorlopen. Deze runs gebruiken lokale fixtures, geen productieauthenticatie.

## Gemeenschappelijke Klasbattle-start · 10 oktober 2026

- [x] Rechtenwereld en Getallenwereld volgen dezelfde instelling- en wachtkamerstappen, met dezelfde plaats voor code, deelnemers, kopiëren, starten en afsluiten.
- [x] Leraaracties en leerlingdeelname blijven gescheiden. De originele velden, handlers, vraagborden, antwoordbediening, providers en XP blijven behouden.
- [x] 32 daadwerkelijke browsercontroles, 78 interactieve doelen en 22 screenshots op 1366 × 768 bij 100% zoom en 390 × 844; beide bovenbalkstanden, herstelknop ≥44 px en drie noodzakelijke interne scrollacties. Geen browserfouten of 404.
- [x] Herladen vóór aanmaken; eigen Home en Hervatten met dezelfde vraag, invoer en deadline; eenmalig deelnemen; simulatie en echte klas als aparte levende frames; Rechten Mixed; lege en ongeldige selecties.
- [x] Volledige bestaande live-browser: 12 groepen, Klas Learn met 45 XP, Getallen Battle met 50 XP, vijf native Rechten-vragen en live les met stemmen, afsluiten en verslag.
- [x] Vijf schermmaten van de centrale hub en 38 DOM/route/simulatiecontroles geslaagd.

Het [browserrapport](qa/uniform-class-flow/report.json) bevat de bronhashes en screenshots. Vragen en beoordeling gebruiken de bestaande Edge-/SQL-providers in een lokale testdatabase; accounts zijn fictief en extern netwerk is geblokkeerd. Dit bewijst geen productieaanmelding of twee externe multiplayeraccounts. Duo en overige wereldprocedures behouden hun bestaande opstart.

## Vier pilots

| Bouwsel | Werkvorm | Behouden |
| --- | --- | --- |
| Pythagoras | Les | Oorspronkelijke opbouw, vierkanten, tegels, slepen en antwoordstappen |
| Rechtenwereld | Trainer | Wereldkaart, vraagvormen, hints, controle en bestaande voortgang |
| Rechten Zeeslag | Spel | Bord, regels, animaties, solo/online-bediening en beurtstatus |
| Glasraam | Atelier | Werkvlak, kleur, rechten, ontwerpbediening en afgeronde ramen |

Terug, minimaliseren, Start, bewaren, account, weergave en sluiten zijn bureaubladbediening. Minimaliseren houdt het oorspronkelijke scherm levend en pauzeert geen timer of online sessie. In gewone apps maakt Bewaren een snelkoppeling; in een oefenbladgenerator bewaart die knop de gemaakte reeks in Mijn oefenbladen. Na browserherladen geldt voor gewone apps de oorspronkelijke apphervatting.

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

De gerichte wetenschappelijke migratie is toegepast en `numbers-session` is actief als versie 2 met `verify_jwt=true`. De gedeployde `index.ts`, `handler.js` en `core.js` zijn bytegelijk aan de toenmalige reviewbranch. Het catalogustotaal is 19. De oorspronkelijke sessiefunctie heeft dezelfde bronhash en de RPC blijft uitsluitend toegankelijk voor de service-role. Een anonieme HTTP-aanroep geeft 401.

Hashes vóór en na uitrol bevestigen behoud van alle 41 bestaande voortgangsrijen en de bestaande sessiegegevens: één ruimte, twee deelnemers, nul antwoorden en nul requests. Deze controle heeft geen leerlingwerk of nieuwe sessie gemaakt. De frontend wordt via GitHub Pages vanaf `main` gepubliceerd; publieke ingangen zijn [het bureaublad](https://godwillsaveyoutoo-pixel.github.io/LeraarBob/os/) en [Getallenwereld](https://godwillsaveyoutoo-pixel.github.io/LeraarBob/games/getallenwereld/). De historische Getallenwereld-releasecontroles staan in de inmiddels samengevoegde [PR #7](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/pull/7) en [het verificatierapport](qa/verification.json). [PR #8](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/pull/8) maakt `/` de OS-hoofdingang. De mappen-/klasstartwijziging uit `codex/os-folders-classflow-20261010` is via [PR #9](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/pull/9) samengevoegd en gepubliceerd als main `a365d15`.

## Nog open voor productiecontrole

- Twee daadwerkelijke ingelogde testaccounts gebruiken voor productieauthenticatie, cloudhervatting en externe live/WebSocketverbindingen. Er is geen bruikbare loginconfiguratie of actieve browsersessie beschikbaar gesteld.
- Afzonderlijke bestaande fouten opvolgen: verouderde voortgangshash in de Rechten-regressietest, Signaalstad-oefenbladdekking en de Kleiduif-lobby op 320 × 568. Zij zijn ook op de oorspronkelijke main gereproduceerd. De vier OS-pilots en hun volledige klasruns slagen.

Na acceptatie kunnen de overige bouwsels op dezelfde aansluiting aansluiten. Centrale door leraren uitgedeelde taken en nieuwe profiel-/werkvormfuncties zijn vervolgstappen.
