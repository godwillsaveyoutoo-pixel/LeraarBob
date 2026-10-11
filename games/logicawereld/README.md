# Logicawereld in het leraarBob OS

Logicawereld v0.2 is aangesloten op de persoonlijke OS-pilot als trainer in **Logica & puzzels**. De zes gebieden, achttien haltes, negentig kernopdrachten en vier extra poortopdrachten behouden hun oorspronkelijke inhoud en wiskundige controle.

## Ingangen en bediening

Voeg Logicawereld toe via **Toevoegen → Logica & puzzels**. De kaart biedt Solo, online Duo Battle en Oefenbladen; leerkrachten zien Klasbattle. Solo Battle en de lokale bordbattle blijven onder de overige werkvormen. Samen leren wordt niet meer aangeboden. Elke werkvorm behoudt haar eigen geopende venster.

| Ingang | Gedrag |
| --- | --- |
| `?mode=solo` | Kaart en vijf oorspronkelijke opdrachten per halte |
| `duo.html` | Klasgenoot op alias uitnodigen; accepteren en beiden klaarzetten vóór de eerste ronde |
| `classroom.html` | Leerkracht kiest gebied/mix, rondes en tijd; leerlingen gebruiken de centrale klascode |
| `?mode=solo-battle` | Acht vragen uit het gekozen gebied |
| `?mode=local` | Tien beurten, twee spelers op één toestel |
| `?stop=4&mode=solo` | Rechtstreeks naar halte 4, of dezelfde bewaarde ronde hervatten |
| `?mode=duo-learn` | Alleen historische compatibiliteit voor oude rondes; geen aangeboden OS-werkvorm |
| `?stop=10&view=worksheet` | Compatibiliteitsroute naar de centrale oefenbladmaker |

Binnen het OS bestaat één platformbalk. De eigen spelkop blijft verborgen in de DOM voor voortgang en navigatie. Leerroute, spelvoortgang en spelmenu staan in het OS-menu. Start, focusstand, terug, minimaliseren, bewaren en sluiten blijven OS-bediening. Zelfstandig gebruikt de app `shared/leraarbob-topbar.js`, inclusief account, volledig scherm, weergave en de bewaarde inklapkeuze. Smalle schermen gebruiken scrollbare inhoud in plaats van een verplicht draaivenster.

## Opslag en voortgang

De bestaande identiteit `logicawereld` en opdracht-ID's blijven behouden. Voortgang staat in `logicawereld:v1:<account-id>`; zonder aanmelding is de eigenaar `guest`. Authenticatie komt uit het bestaande OS-account of de gedeelde AxiomaAuth. Queryparameters verlenen geen accountrechten.

Rondes worden apart bewaard per account, werkvorm en halte. Oude `:run`-gegevens blijven leesbaar. Onvoltooide antwoorden, feedback en een wachtende duo-beoordeling kunnen hervatten. Bewijsevents van gelijktijdige solo-vensters worden samengevoegd zonder de andere ronde te overschrijven. Lokale duoresultaten blijven afzonderlijk voor Speler A en B en tellen niet als individuele accountbeheersing. CSV-export van de ronde blijft beschikbaar.

Het platform toont de echte oefenstatus op achttien haltes. Er is geen nieuwe XP-omrekening, cloudprogressprovider of lerarencijfer toegevoegd. Deze voortgang blijft op dit toestel. OS Bewaren maakt een snelkoppeling; het is geen toetsinzending.

## Centrale oefenbladen

Zes gebiedsmappen leiden naar `oefenbladen/maken.html`. Daar kiest de gebruiker een halte of heel het gebied, maakt een reeks en bewaart de exacte opgaven met bijbehorende sleutel. De maker laadt uitsluitend `logic.js`, `content.js` en `worksheet.js`, niet de spelcontroller. Het bestaande accountgebonden archief in IndexedDB verzorgt bewaren, terugvinden, printen en exporteren. Reeksen verschijnen in de eigen onderwerpmap en volledige OS-collectie.

De opgaven komen uit de vaste bank; opnieuw genereren betekent geen onbeperkte nieuwe willekeurige vragen. Een halte bevat vijf kernopgaven. Een oude interne oefenbladlink opent dezelfde centrale maker.

## Grenzen en verdere implementatie

Online Duo Battle en Klasbattle hebben nu eigen providers in de ontwikkelversie. De app hergebruikt de centrale uitnodigingen, rollen, klascode, timers, herkoppeling en ranglijst. Het geïsoleerde werkbord gebruikt dezelfde `app.js`, `logic.js` en `content.js`; het herschrijft de antwoordbediening niet. Serverbeoordeling gebruikt diezelfde oorspronkelijke validator. Een battle verandert de lokale solo-beheersing of XP niet.

Duo: vijf rondes, bij gelijke eindstand maximaal twee extra. Eén antwoord, maximaal drie minuten per ronde, één rondepunt voor het juiste snelste antwoord (300 ms gelijkheidsmarge). Klas: 3/5/10/20 rondes, 30–180 seconden, de bestaande 1.000 juistheidspunten plus maximaal 250 snelheidspunten. Een mix van alle achttien haltes stelt 20 rondes in zodat elke halte voorkomt. Uitnodigingen gebruiken de bestaande bezetheidscontrole: één reservering tegelijk. Rechtenwereld behoudt zijn bestaande regels en tijdslimieten.

De productiebackend is nog niet gewijzigd. Voor uitrol zijn beide `20261011142721_logica_class_battle.sql` / `20261011142724_logica_duo_battle.sql` migraties en Edge Functions `logica-class` / `logica-duo` nodig, na hun bestaande afhankelijkheden. Bouw de gedeelde policy met `node scripts/build-logica-battle-worker.cjs`. Controleer vervolgens echte leerling- en leraaraccounts. Samen leren wordt voor Logicawereld niet aangesloten.

Voor de toekomstige samengestelde taken zijn de stabiele opdracht-ID's, leerdoelen, antwoordvormen, exacte controle en exporteerbare resultaten bruikbare bouwstenen. Voor Logicawereld als onderdeel van een samengestelde toets moeten de taakadapter, uitgegeven taakversie, inzending en leraarsrapport nog worden aangesloten. Battlebeoordeling is al afzonderlijk beschikbaar. De lokale oefenstatus is geen beveiligde toetsbeoordeling.

## Verificatie

De bron komt uit `Logicawereld_Propositielogica_v0.2.zip`. Het meegeleverde installatiescript is alleen in proefstand tegen de repository bekeken; de aansluiting is gericht uitgevoerd op de actuele OS-bron. `logic.js`, `content.js` en `worksheet.js` blijven inhoudelijk gelijk aan het pakket. De standalone HTML-bundel en externe proefsite worden niet als productie-ingang gebruikt.

- Oorspronkelijk pakket: `node --test tests/*.test.cjs` vanuit het uitgepakte pakket, 21 controles.
- Geïntegreerde logica, oefenflows, opslag en bridge: `node --test --test-isolation=none tests/logicawereld-logic.test.cjs tests/logicawereld-flow.test.cjs tests/logicawereld-integration.test.cjs`.
- Echte Chromium-interface: `NODE_PATH=<testdependencies>/node_modules node tests/logicawereld-os-browser.cjs`.
- Catalogus, desktopbediening en centrale oefenbladopslag gebruiken tevens de bestaande regressietests.

Het actuele browserresultaat en geselecteerde screenshots staan bij [de OS-controle](../../os/qa/logica/README.md). Productieaanmelding en cloudsynchronisatie zijn geen onderdeel van deze lokale proef.

De nieuwe battlecontroles en schermen staan in [het battleverslag](../../os/qa/logica-battles-20261011/README.md).
