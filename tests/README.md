# Browsercontrole Pythagoras

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
1.800 gegenereerde opgaven met hun uitgewerkte voorbeelden en de leerroute.
`node tests/real-numbers-browser.cjs` doorloopt de tien werkvormen op 640 en
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
