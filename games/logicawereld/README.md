# Logicawereld in het leraarBob OS

Logicawereld v0.2 is aangesloten op de persoonlijke OS-pilot als trainer in **Logica & puzzels**. De zes gebieden, achttien haltes, negentig kernopdrachten en vier extra poortopdrachten behouden hun oorspronkelijke inhoud en wiskundige controle.

## Ingangen en bediening

Voeg Logicawereld toe via **Toevoegen → Logica & puzzels**. De kaart biedt Solo, Samen op één toestel, Duo Battle en Oefenbladen. Solo Battle staat bij Meer opties. Een gekozen werkvorm opent de kaart om een halte te kiezen; vanuit een bestaande halte gaat de OS-werkvormkeuze rechtstreeks naar diezelfde halte. Elke werkvorm behoudt haar eigen geopende venster.

| Ingang | Gedrag |
| --- | --- |
| `?mode=solo` | Kaart en vijf oorspronkelijke opdrachten per halte |
| `?mode=duo-learn` | Samen leren op één toestel, met partnerbeoordeling |
| `?mode=solo-battle` | Acht vragen uit het gekozen gebied |
| `?mode=local` | Tien beurten, twee spelers op één toestel |
| `?stop=4&mode=solo` | Rechtstreeks naar halte 4, of dezelfde bewaarde ronde hervatten |
| `?stop=halte-4&mode=duo-learn` | Dezelfde halte vanuit het centrale register |
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

Online Duo Learn, online Duo Battle, Klas Learn en Klas Battle hebben nog geen Logicawereld-provider. Ze staan daarom niet als startoptie in het OS. De brug accepteert alleen werkelijk geregistreerde sessiemodi en houdt leraarstart gescheiden van leerlingdeelname.

Voor de toekomstige samengestelde taken zijn de stabiele opdracht-ID's, leerdoelen, antwoordvormen, exacte controle en exporteerbare resultaten bruikbare bouwstenen. Een uitgegeven taakversie, centrale leerlinginzending, serverbeoordeling en leraarsrapport moeten nog worden aangesloten. De lokale oefenstatus is geen beveiligde toetsbeoordeling.

## Verificatie

De bron komt uit `Logicawereld_Propositielogica_v0.2.zip`. Het meegeleverde installatiescript is alleen in proefstand tegen de repository bekeken; de aansluiting is gericht uitgevoerd op de actuele OS-bron. `logic.js`, `content.js` en `worksheet.js` blijven inhoudelijk gelijk aan het pakket. De standalone HTML-bundel en externe proefsite worden niet als productie-ingang gebruikt.

- Oorspronkelijk pakket: `node --test tests/*.test.cjs` vanuit het uitgepakte pakket, 21 controles.
- Geïntegreerde logica, oefenflows, opslag en bridge: `node --test --test-isolation=none tests/logicawereld-logic.test.cjs tests/logicawereld-flow.test.cjs tests/logicawereld-integration.test.cjs`.
- Echte Chromium-interface: `NODE_PATH=<testdependencies>/node_modules node tests/logicawereld-os-browser.cjs`.
- Catalogus, desktopbediening en centrale oefenbladopslag gebruiken tevens de bestaande regressietests.

Het actuele browserresultaat en geselecteerde screenshots staan bij [de OS-controle](../../os/qa/logica/README.md). Productieaanmelding en cloudsynchronisatie zijn geen onderdeel van deze lokale proef.
