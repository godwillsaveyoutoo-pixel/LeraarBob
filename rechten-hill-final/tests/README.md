# Browsercontrole Pythagoras

Cataloguscontrole zonder browser:

```sh
node scripts/build-catalog.cjs --check
node --test tests/catalog.test.cjs tests/catalog-progress.test.cjs
```

De eerste controle meldt een verouderde offlinekopie. Herstel die met
`node scripts/build-catalog.cjs`. De tests vergelijken alle catalogusvelden,
controleren dubbele spel-id's en vergelijken het aantal vaardigheden van Reële
getallen met de daadwerkelijke trainer. GitHub voert deze controles ook uit.

Benodigd: Node.js 22+ (ingebouwde WebSocket), Python 3 en Chromium.
Start vanuit de projectmap een lokale server en een **apart, tijdelijk browserprofiel**:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
chromium --headless --remote-debugging-port=9235 --user-data-dir=/tmp/leraarbob-interaction-test about:blank
node tests/pythagoras-interactions.cjs
```

Voer de drie opdrachten in aparte terminals uit. Sluit de server en testbrowser daarna.
Gebruik dit profiel niet voor een echte leerlinglogin: de test doorloopt oefeningen en slaat testvoortgang lokaal op.

De controle gebruikt echte muis-, toetsenbord- en touchgebeurtenissen: getaltegels,
schaalfactor, formuletegels, klikken, verkeerde plaatsingen, dubbele rechthoekszijden,
annuleren, Escape, herstarten, wisselen van stap en liggende/staande weergave.

## Wortelbouw

Met dezelfde server en geïsoleerde Chromium:

```sh
node tests/wortelbouw.test.cjs
node tests/wortelbouw-browser.cjs
node --test tests/wortelbouw-progress.test.cjs
node tests/wortelbouw-progress-browser.cjs
```

De geometriecontrole verifieert 840 maat/richting/spiegelcombinaties, exact
grenscontact, echte overlap, verbondenheid, minimale routes en herstel per stuk.
De browser bouwt alle veertien puzzels handmatig met muis (780×360) en aanraking
(640×360), controleert daarnaast de optionele tikbediening op beide formaten en controleert voortijdige onthullingen ook in canvaslabels,
de uitgebreide liniaal, beide routes naar √6, de doelbeloning, het gedraaide lengtelabel, undo tijdens
de animatie, toetsenbord, schermrotatie, overlappende knoppen en tekenen in rust. Screenshots verschijnen in `/tmp/wortelbouw-*.png`.
De opslagtest gebruikt fictieve accounts en een nagebootste database. Hij controleert
voltooiing, beste stappen, hervatten op een tweede toestel, herladen, gedeeltelijke
√6-routes, offline opnieuw bewaren en gescheiden gast-, leerling- en leraarvoortgang.
Zie [speelverslag en acceptatie](../docs/wortelbouw-playthrough.md).

## Zeeslag en platformuitnodigingen

Met dezelfde lokale server en geïsoleerde Chromium:

```sh
node tests/social-browser.cjs
node --test tests/catalog-progress.test.cjs
```

De social-browsertest gebruikt twee gescheiden browsercontexten, fictieve
leerlingen en een transport in het geheugen. Er worden geen echte accounts of
cloudresultaten aangemaakt. Hij doorloopt uitnodigen vanaf Home, ontvangen in
Pythagoras, weigeren, navigeren naar Verfwinkel met een open uitnodiging,
accepteren, gezamenlijk Zeeslag openen, schepen plaatsen met twee muisklikken of
aanrakingen, een schip verplaatsen van rechts naar links, een ongeldig eindpunt
weigeren, verplaatsen/selecteren/wissen ongedaan maken,
missen/raken, beurtwisseling, dubbele schotpakketten, vernieuwen, opgeven,
verbindingsherstel, uitloggen en 320/390/768/1440px-schermen.

`social-database.sql` controleert de echte RPC-regels met tijdelijke gegevens:
zelfuitnodigingen, dubbele uitnodigingen, onbevoegd accepteren, privacy,
bezet/offline, vervaldatums, tabbladbinding en privékanalen. Voer het uitsluitend
uit tussen `BEGIN` en `ROLLBACK`, op een database waar de social-definities zijn
geïnstalleerd. De controle maakt synthetische authgebruikers binnen die transactie;
na de rollback blijven er geen testaccounts, uitnodigingen of resultaten over.

De browsertest vervangt Supabase-transport. Een volledige test met twee echte
authsessies en echte WebSockets is daarmee niet afgedekt. De uitgerolde RPC's,
rollen en beleidsfuncties zijn afzonderlijk op het gekoppelde project gecontroleerd.

## Groepswedstrijden Kleiduifschieten

```sh
node tests/clay-game.test.cjs
node tests/clay-service.test.cjs
node --test tests/clay-questions.test.cjs
node tests/catalog-progress.test.cjs
```

De groepsspeltest gebruikt de echte spellogica met een minimale DOM en een
bestuurbare klok: gezamenlijke start, misser/reset, timeout, zeven op rij,
een andere winnaar en annuleren van oude starttimers. De servicetest controleert
tabbladidentiteit, antwoordcodes en het verwerpen van late antwoorden na uitloggen.
De social-browsertest is uitgebreid met sessie openen, vanuit Pythagoras deelnemen,
samen starten, reeks resetten na een fout, winnaar en ranglijst. Hij is met twee
fictieve leerlingen doorlopen. Het Supabase-transport wordt daarbij vervangen;
de echte backend wordt afzonderlijk met teruggedraaide transacties getest.

`clay-groups-database.sql` wordt alleen tussen `BEGIN` en `ROLLBACK` uitgevoerd.
Hetzelfde geldt voor `clay-mixed-database.sql`, na installatie van
`supabase_clay_mixed_questions.sql`. Die controleert de gemengde reeks,
oude-cliëntcompatibiliteit, een nieuwe vraag na een misser, dubbel ontvangen
antwoorden, de winnaar, opnieuw spelen en de toegangsrechten. De vragenbanktest
controleert 50.000 vragen, 80/20-verdeling, exacte breuk- en kommanotatie en
minstens 18 graden verschil tussen alle antwoordmogelijkheden.
Hij controleert startrechten, minstens twee spelers, lidmaatschap en tabblad,
gedeelde starttijd, foute/te late antwoorden, idempotentie, één winnaar,
ranglijsten per tempo en de eerste Zeeslag-overwinning. Synthetische accounts
en uitslagen verdwijnen bij de rollback. Deze test is ook op de uitgerolde
database uitgevoerd.

`node tests/trainer-teacher-browser.cjs` controleert met vervangende auth dat een
leerkracht de Rechtentrainer kan openen, een oefening kan starten en via Opvolging
heen en terug kan, zonder leerlingvoortgang op te halen. Gebruik dezelfde lokale
server en Chromium als bij de andere browsertests. Voer browsertests na elkaar uit.
De catalogusbrowsertest controleert ook de gedeelde onderwerpkleur en gouden rand.
De social-browsertest controleert groepsaanmaak door een leerling in het spel en
de zichtbaarheid van die groep in het startscherm van een andere leerling.

## Platformnavigatie en trainerflow

`node tests/platform-navigation-browser.cjs` doorloopt alle catalogusspellen en
controleert de gedeelde native teruglink. De vectorbrowsertest controleert ook
direct starten, Uitleg/Voortgang zonder verlies van deelantwoorden en
herkenningsvragen. Zie `PLATFORM_FRAMEWORK.md` voor de platformafspraken.

## Universele accounts en voortgang

`node --test tests/account-auth.test.cjs` controleert accountwissels en late
authreacties. `node tests/account-progress-browser.cjs` gebruikt de echte
spelpagina's met fictieve accounts, geblokkeerde externe verzoeken en een
database in het geheugen. De test dekt het hervatten van alle geïmporteerde
spellen, offline herstel, accountwisseling tijdens opslaan en het volledige
vectorconcept op een tweede browsercontext. De vectorbrowsertest controleert
ook pijltjes boven symbolen en coherente keuzenummers. De social-browsertest
doorloopt nu ook een complete solopartij en terugkeer naar de online lobby.

`tests/account-progress-database.sql` wordt uitsluitend binnen BEGIN/ROLLBACK
uitgevoerd. Hij maakt fictieve accounts binnen de transactie en controleert
accountbinding, revisieconflicten en uitvoerrechten. Deze controle is op het
gekoppelde project uitgevoerd; de testgegevens zijn teruggedraaid.

## Didactische opbouw, uitleg en XP

`node tests/verfwinkel-curriculum.test.cjs` rekent onafhankelijk alle legale
recepten door, inclusief voorraad en opeenvolgende bestellingen.
`node tests/verfwinkel-browser.cjs` controleert ze in de echte spelmotor en
controleert of de planningsmelding geen knoppen afdekt op 780 × 360 en desktop.

`node tests/vector-lessons.test.cjs` controleert de 576 voorbeeldvarianten en
XP voor zelfstandig oplossen, verbeteren, herstel en overslaan.
`node tests/vector-trainer-browser.cjs` doorloopt alle uitlegstappen, controleert
leesbare feedback zonder automatisch doorgaan en herladen zonder dubbele XP.
De tests controleren ook de afzonderlijke modi, terugkeren vanuit oude vrije
concepten en het bewaren van een reeks tijdens vrij oefenen en herladen.
De accounttest controleert die terugkeer ook op een tweede toestel.
`node tests/account-progress-browser.cjs` controleert ook verdiende XP en het
opgeloste antwoord op een tweede toestel met fictieve accounts.

## Reële getallen

`node tests/real-numbers.test.cjs` controleert exacte waarden, foutdiagnoses,
2.160 gegenereerde opgaven met hun uitgewerkte voorbeelden en de leerroute.
`node tests/real-numbers-browser.cjs` doorloopt de twaalf werkvormen op 640 en
780 × 360, alle introductiestappen, bediening, context bij fouten, hervatten van
invoer en XP, volledige reeksen en lichte/donkere weergave. De accountbrowsertest
controleert ook deze trainer op een tweede toestel met fictieve accounts.
Zelfgekozen onderwerpen gebruiken dezelfde XP en foutopvolging als de leerroute.
De tests controleren de omzetting van oude vrij-oefenopgaven, het behoud van de
routeopgave en sessieteller, en automatisch bewaren van gekozen onderwerpen en
onafgewerkte antwoorden naar het account zonder handmatige bewaaractie.
Bouw na bronwijzigingen met `node scripts/build-real-trainer.cjs`.

De Reële Getallen-tests controleren ook intervalconstructies in beide
richtingen, alle open/gesloten combinaties, het kruisen en annuleren van
versleepte eindpunten, één tik voor een eencijferige periode, selectie in
omgekeerde richting, en behouden invoer na herladen. De kerncontrole controleert
bovendien dat de voortzettingsregel het kleinste herhaalblok noemt.

De uitbreiding controleert ook alle twaalf interval- en decimaalvarianten,
negatieve vierkantswortelwaarden en positieve/negatieve derdemachtswortels,
exacte vergelijkingen tussen wortels, echte sleepgebaren met muis en touch,
onbegrensde kanten na herladen, oude concepten en nieuwe vaardigheden met XP.

## Leesbare leraarsdetails

`node --test tests/teacher-details.test.cjs` controleert de oorspronkelijke
beheersingsregels, foutvertalingen, herhaling in aantallen opgaven, activiteit
met echte uitkomsten en de veilige terugval voor oude of beschadigde opslag.
`node tests/teacher-details-browser.cjs` controleert het leraarsdashboard op
desktop en mobiel, filters en leerlingwissel, escaping en accountwissel tijdens
een lopend verzoek. Alle leerlingen en database-antwoorden zijn fictief.
De bestaande accountbrowsertest controleert het behoud van nieuwe activiteiten
bij het hervatten op een tweede toestel.

## Rechtentrainer — Wave 1

```sh
node tests/rechten-wave.test.cjs
node tests/rechten-wave-browser.cjs
node tests/trainer-teacher-browser.cjs
node scripts/build-rechten-db-test.cjs > /tmp/rechten-wave-database-test.sql
```

De browsertest gebruikt dezelfde lokale server/Chromium als hierboven en alleen
fictieve voortgang. Hij injecteert een testhook in de geserveerde pagina; de
productiepagina heeft geen test-API. De test omvat 640×360/780×360, echte touch en
muis, alle zes nieuwe skills, bijzondere rechten, herladen, hulp, foutcorrectie,
eenmalige scoring, DEV, 6.600 bestaande taken, oude lokale versies, accounts,
dirty cache, offline writes, revisies en de opslaglimiet.

De gegenereerde SQL-transactie test de kandidaat-RPC uitsluitend met tijdelijke
tabellen en een tijdelijke functie; BEGIN/ROLLBACK is inbegrepen. Hij leest geen
echte leerlingvoortgang en wijzigt geen productiefunctie. Het afzonderlijke
`supabase_rechten_wave1.sql` is een uitrolscript en is geen onderdeel van de
automatische tests. Zie [verslag en uitrolvolgorde](../docs/rechten-wave-1.md).

## Rechtentrainer — Wave 2

```sh
node tests/rechten-construction.test.cjs
node tests/rechten-construction-browser.cjs
node scripts/build-rechten-db-test.cjs --wave2 > /tmp/rechten-wave2-database-test.sql
```

De constructietests dekken puntplaatsing, formuletokens en grafiekconstructie,
alle drie niveaus, schalen, breuken, alternatieve puntenparen, pointercancel,
tik én sleepbediening, undo, deelherstel, navigatie/DEV, herladen en v701→v702.
De Wave 1-tests blijven afzonderlijk de zes bestaande nieuwe werkvormen testen;
de bereikbaarheidstest dekt nu alle twintig skills. De database-test gebruikt
weer alleen tijdelijke objecten en fictieve gegevens binnen BEGIN/ROLLBACK.
Het nieuwe zelfstandige uitrolscript omvat beide waves en is niet automatisch
toegepast. Zie [Wave 2-verslag](../docs/rechten-wave-2.md).

## Rechtentrainer — Wave 3

```sh
node tests/rechten-algebra.test.cjs
node tests/rechten-algebra-browser.cjs
node scripts/build-rechten-db-test.cjs --wave3 > /tmp/rechten-wave3-database-test.sql
```

De nieuwe tests dekken algemene herleiding, onbekende x en puntcontrole: 1.800
exacte opgaven, verschillende geldige bewerkingsroutes, verticale rechten,
constante functies met geen/alle oplossingen en diagnose per stap. De browser
test op beide mobiele maten undo, pointercancel, breukbediening, navigatie,
herladen, eenmalige scoring, v702→703 en een duurtest van 450 opgaven.
De eerdere suites blijven hun eigen waves testen tegen de huidige versie;
de bereikbaarheidstest omvat nu 23 skills. Voer browsertests na elkaar uit.
De SQL-transactie gebruikt uitsluitend tijdelijke objecten en fictieve data.
Zie [Wave 3-verslag](../docs/rechten-wave-3.md) voor uitrolvolgorde en open checks.

## Rechtentrainer — Wave 4

```sh
node tests/rechten-transfer.test.cjs
node scripts/build-rechten-db-test.cjs --wave4 > /tmp/rechten-wave4-database-test.sql
```

De archieftests dekken bewaarde Wave 4-opgaven uit grafiek/tabel/context:
2.400 taken, alle gekozen kolomparen, alternatieve roosterpunten, beide
b-routes, inconsistentie van de derde rij, exacte breuken, constanten, eenheden
en contextdomeinen. De browser test beide mobiele maten, muis/touch,
annuleren, undo, navigatie/herladen, diagnose zonder dubbeltelling en v703→704.
De duurtests omvatten 450 transfer- en 640 gemengde opgaven; de omvang wordt
inclusief JSONB-scheidingstekens getoetst aan de serverlimiet van 256 KiB.
De huidige catalogus telt 26 actieve skills; context is voorlopig gepauzeerd.
`rechten-transfer-browser.cjs` beschrijft de oude bediening. Gebruik voor de
huidige bediening de workbench-test hieronder. Voer browsertests na elkaar uit.
SQL wordt alleen op tijdelijke objecten met fictieve data getest.
Zie [Wave 4-verslag](../docs/rechten-wave-4.md) voor bestanden en uitrolvolgorde.

## Rechtentrainer — Kaartvallei

```sh
node tests/rechten-journey.test.cjs
node tests/rechten-journey-browser.cjs
```

De policytest controleert toegang, globale herhaling, vijf zelfstandige einddoelen
en herkansingen. De browsertest gebruikt de bestaande lokale server/Chromium,
met onderschepte externe aanvragen en uitsluitend fictieve accounts. Ze speelt
echte rondes, opent de kaart tijdens opgaven en controleert hulp, herladen,
deelantwoorden, eenmalige scoring, accountwisseling en drie schermmaten.
Voer browsertests na elkaar uit. Zie [implementatieverslag](../docs/rechten-kaartvallei-etappe.md).

## Rechtentrainer — leerlingenschermen

```sh
node tests/rechten-shell-browser.cjs
```

Controleert de standaard hoofdkaart, vijf deelkaarten, letterlijke leerdoelen,
persoonlijke aanbeveling, blijvende vinkjes bij herhaling en de vier hoofdtabs.
De kaartcontroles toetsen ook verbonden wegen op elke schermmaat, de vaste
leerlingpositie bij het bekijken van andere stops, terugkeren via Mijn plek,
aparte badges voor afgerond/beheerst/herhalen en meteen starten op mobiel.
Een voltooide latere stop kleurt eerdere, onvoltooide wegen niet in.
De hoofdstukregressie controleert dat herhaling uit hoofdstuk 1 tijdens hoofdstuk 2
de kaartpositie niet terugzet, ook na stoppen en herladen. Het hoofdstuklabel
blijft zichtbaar op laptop en 640×360. De pure routeproeven controleren ook dat
nieuwe stof in de gekozen stop blijft en alle vijf hoofdstukken bereikbaar zijn.
Behoud van de actieve opgave en veilige aliasweergave worden met fictieve data
getest op 1366×768, 1100×700, 1024×768, 780×360, 640×360 en 390×844.
De bestaande Wave-testopstellingen sluiten de nieuwe standaardkaart voordat
ze hun vaste inhoudstestvraag tonen. Alle inhoudelijke assertions blijven gelden.
Voer de browsersuites na elkaar uit op de geïsoleerde testbrowser.
Zie [eerste leerlingversie](../docs/rechten-leerlingenstart.md).

## Rechtentrainer — automatisch doorgaan

`node tests/rechten-answer-flow-browser.cjs` controleert de standaardflow met
fictieve voortgang: juist → automatisch verder, fout → diagnose en handmatig
verder, latere herhaling, b verbeteren met behoud van a, juist na hulp zonder
zelfstandige score, kaart/DEV pauzeren, herladen en eenmalige rondebeloning.
De controles gebruiken echte knoppen op laptopformaat en 640×360; opgaven en
voortgang worden alleen in het geïsoleerde browserprofiel klaargezet.
Voer deze suite na de andere browsersuites uit, op dezelfde lokale server.

`node tests/rechten-leave-round-browser.cjs` test het stoppen van eerder opgeslagen gemengde en
gewone rondes via de kaart, starten van een nieuwe ronde, behoud van scores,
herhaling en sterren, annuleren van een geplande automatische overgang en
herladen na het stoppen van een gedeeltelijk ingevulde constructie.
Alle voortgang is fictief; de test gebruikt dezelfde geïsoleerde browser.

De leerlingenschermtest controleert ook de onderwerptoets als selecteerbaar
kaarteindpunt: voorbereiding bekijken zonder te starten, naar een benodigd
leerdoel gaan, bewust een voorbereide toets starten en een lopende ronde behouden.
Er staat geen aparte ingang voor gemengd herhalen meer op de kaart; de bestaande
reis- en stoptests controleren wel het hervatten van oude herhaalrondes.

`node tests/rechten-ux-browser.cjs` controleert de geselecteerde hoofdactie op de
kaart, rechtstreeks wisselen van ronde zonder resultaten te verliezen,
pauzeren/hervatten/stoppen en herladen met een gedeeltelijk ingevulde breuk.
De test gebruikt echte muis-, touch- en toetsenbordacties voor coördinatenplaatsing:
negatieve breuken, beide aftrekvolgordes, een verkeerde as, afgebroken sleepactie,
een half ingevulde rij en herstel van een verkeerde noemervolgorde. Hij opent
ook alle 27 vraagvormen op drie niveaus via de DEV-catalogus, varianten en
rechtstreekse deelstappen, en controleert dat leerlingvoortgang behouden blijft.
Gebruik dezelfde lokale server en geïsoleerde Chromium op poort 9235 als bij
de andere browsertests; voer deze tests na elkaar uit omdat ze één tab delen.
De inhoudelijke optimalisatielijst staat in `docs/rechten-ux-werkkaart.md`.

`node tests/rechten-polish-browser.cjs` doorloopt alle vijftien actieve toegevoegde skills
op drie niveaus en hun deelstappen bij 1920×1080, 1366×768, 1024×600 en 640×360.
Controleert inhoudsschaling, bedieningsgrootte, overlap, algebra met vorige regel,
de sobere coördinatenbreuk en de drie bijzondere puntengevallen. De grafiek mag
bij de puntenvariant niet vooraf het antwoord prijsgeven. Horizontaal/verticaal
behouden hun formule en functiebetekenis; identieke punten krijgen meerdere
voorbeeldrechten. De bestaande constructie- en UX-suites testen echte pointer-,
touch- en toetsenbordinteractie. Gebruik dezelfde geïsoleerde browser en voer
browsersuites na elkaar uit.

### Rechtentrainer: directe bediening en algebra slepen

Met de lokale server en de geïsoleerde testbrowser op poorten 8765 en 9235:

```sh
node tests/rechten-redesign-browser.cjs
node tests/rechten-polish-browser.cjs
node --test tests/rechten-wave.test.cjs tests/rechten-construction.test.cjs tests/rechten-algebra.test.cjs tests/rechten-transfer.test.cjs tests/rechten-journey.test.cjs
```

De redesign-test gebruikt echte muis-, touch- en toetsenbordgebaren. Hij controleert direct punten plaatsen, punten verplaatsen, formulevakken die automatisch doorschuiven, de verkorte hellingroute, substitutie door slepen, termen over het gelijkheidsteken verplaatsen, een factor lospakken om te delen, de live preview, afbreken en ongedaan maken. Schermafbeeldingen staan na afloop in `/tmp/rechten-redesign-*.png`. De polish-test controleert alle nieuwe vraagvormen en hun tussenstappen op vier schermformaten.

### Rechtentrainer: tabel en grafiek als werkblad

```sh
node tests/rechten-transfer-workbench.test.cjs
node tests/rechten-transfer-workbench-browser.cjs
```

De kernsuite controleert 1.800 nieuwe opgaven, consistente tabellen, beide routes voor b, alle kolomparen en aftrekvolgordes, bereikbare scrollwaarden, foutcorrectie, undo en historische voortgang. De browsertest gebruikt echte muis- en touchgebaren bij 1366×768 en 640×360: tabelwaarden naar de breuk/formule slepen, a en b invullen, b vrijmaken door slepen, scrollen/vegen in de formule en een rechte door twee zelf geplaatste punten. De tabel blijft rechts zichtbaar. Schermafbeeldingen staan in `/tmp/rechten-workbench-*.png`.

De compacte werkbladen behouden de coördinatenbreuk tijdens het invullen van teller en noemer. De redesign-test controleert ook noemer nul, negatieve noemers, direct selecteren, hervatten en teruggaan. Punt + a gebruikt drie zichtbare stappen: a invullen, b bepalen en het voorschrift afwerken. Een volledig punt wordt in de vergelijking gesleept. Product, transpositie en optelling gebeuren daarna via afzonderlijke sleepbewegingen, zonder vooraf berekende tussenregels. Dezelfde bediening geldt voor een gekozen punt bij het voorschrift uit twee punten. De kernsuite controleert het hervatten van oudere versies op de juiste stap.

De hoofdstuk- en kerntests controleren dat voorschriften uit a en b, punten, tabel en grafiek in het laatste hoofdstuk staan, na nulwaarden en tekens. Eerdere vaardigheden blijven bereikbaar zonder voorschriften als vereiste; bestaande toegang, rondes en sterren blijven bewaard.
