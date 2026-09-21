# Gedeelde platformafspraken

LeraarBob heeft een gedeelde platformlaag en verschillende vakinhoudelijke
spel- en trainermotoren. Nieuwe functies komen in de laag die verantwoordelijk
is voor dat gedrag, zodat spellen geen kopieën van platformcode nodig hebben.

## Navigatie: één bestemming per bediening

- **leraarBob-logo**: de startpagina van de website, ook op GitHub Pages onder
  een repositorypad. Een echte link ondersteunt toetsenbord en nieuw tabblad.
- **Oefenen**: de lopende oefening hervatten; alleen zonder lopende oefening
  een nieuwe sessie starten.
- **Uitleg**: een apart scherm; vraag en deelantwoorden blijven bestaan.
- **Voortgang**: beheersing en gepland herstel, zonder de sessie te vervangen.
- **Vrij oefenen**: bewust buiten de persoonlijke leersessie; geen mastery bijschrijven.
- **DEV**: een ontwikkelhulpmiddel, niet de gewone leerling- of leerkrachtinterface.
  In de Rechtentrainer is het expliciet op te roepen met `?dev=1`; de bestaande
  beperkingen voor leerlingaccounts blijven gelden.

`shared/axioma-platform.js` beheert dit contract met `wireHome`, `homeURL`,
`goHome`, `bindTrainer` en `trainerScreen`. Alle 15 catalogusspellen gebruiken
nu dezelfde terugnavigatie. De gekopieerde home-urlfuncties zijn verwijderd uit
de geïmporteerde spellen. Spellen melden hun bestaande logo expliciet aan;
algemene knoppen zoals een kamerkeuze of een spelmenu worden niet omgebogen.

Een spel kan via `beforeLeave` eerst afsluiten. Zeeslag behoudt daardoor de
bestaande afhandeling van opgeven en uitslag voordat de speler vertrekt.

Voor een nieuw spel:

```html
<script src="../../shared/axioma-platform.js"></script>
<a href="../../index.html" data-platform-home>leraarBob</a>
```

De paden worden aangepast aan de diepte van de spelmap. De module bepaalt de
websitebasis vanuit haar eigen scriptlocatie. Voor een portable build kan
exact dezelfde bron inline worden opgenomen met `data-platform-root`.

## Trainers: dezelfde bediening, eigen vakinhoud

Rechten en Vectoren gebruiken dezelfde navigatiebindingen. Vectoren opent nu
meteen een sessie of hervat de opgeslagen oefening. Constructie, herkennen via
meerkeuze en coördinatenrekenen wisselen af. Beoordeling blijft vakinhoudelijk:
een correcte resultante is iets anders dan een complete constructiemethode.

De oefenmotor bewaart taak en deelantwoorden bij hulp/voortgang. In Vectoren
blijft feedback naast het werkbord staan tot de leerling zelf verdergaat. Bij
een fout kan de leerling de feedback sluiten en het eigen antwoord aanpassen.
Uitleg raadplegen telt als ondersteund oefenen; later volgt een zelfstandige
controle. Ook fouten krijgen gerichte herhaling met nieuwe gegevens.

De schedulers zijn nog afzonderlijk. Rechten heeft al eigen telemetrie en
herstelregels; Vectoren voegt geometrische methodebeoordeling toe. Die motoren
nu samenvoegen zou hun verschillen verbergen. Een volgende gedeelde trainerlaag
moet eerst hetzelfde expliciete resultaatformaat kunnen dragen: skill,
representatie, zelfstandig/ondersteund, resultaat, methode, foutcode en herhaling.

### Vectoren: uitgewerkte voorbeelden en XP

`vector-lessons.js` levert stapsgewijze voorbeelden voor alle 24 vaardigheden.
Dezelfde voorbeelden verschijnen bij een nieuw begrip in de leerroute en in de
uitlegcollectie. Ze gebruiken de taakgenerator, het bestaande rooster en dezelfde
vectornotatie. Getallen en tekenstappen komen uit het taakmodel; uitleg staat
niet als afzonderlijke, mogelijk afwijkende antwoorden in de pagina. Geometrische
lessen gaan vooraf aan coördinatenrekenen. Het uitlegscherm heeft een eigen
voorbeeld zonder het lopende deelantwoord te veranderen.

Zelfstandig oplossen verdient 10–14 XP, afhankelijk van het niveau. Een
opgeloste herstelvraag levert 15 XP op, de bevestigende herhaling 18 XP. Juist na
hulp of verbetering levert 5 XP op. Voorbeelden, overslaan en vrij verkennen
leveren geen XP op. De motor verwerkt een opgave maar één keer; hervatten van een
al afgewerkt antwoord telt niet opnieuw. XP staat los van beheersing: de gouden
voltooiingsrand blijft gebaseerd op zelfstandig aangetoonde vaardigheden.
Bestaande vectorvoortgang behoudt versie 2; oudere gegevens zonder XP beginnen
met 0 XP en houden hun vaardigheden, fouten en sessie.

### Verfwinkel: opbouw van verhoudingen

De 16 opdrachten gaan van zuivere kleuren en delen naar evenredig opschalen,
verdunnen, twee mengsels combineren en recepten met drie vaten. Er zijn zes
doelverhoudingen. Oefening 7 vraagt 8 l en 4 l uit twee verschillende mengsels;
oefening 8 vraagt achtereenvolgens een ander doel en een ander recept. De latere
opdrachten onderscheiden meerdere recepten, voorraadbeperkingen, een reserve en
vooruitplannen. De volgende bestelling en eventuele reserve zijn vooraf zichtbaar
in beide werkweergaven. Elke reeks is oplosbaar met de toegestane schenkstappen
(en gehele liters pigment voor de werktafel). Bestaande voltooiingsmarkeringen
blijven behouden; de herziening wist geen eerdere voortgang.

## Accounts en voortgang: één levenscyclus

Alle vijftien catalogusspellen gebruiken `shared/axioma-game.js` voor de
accountstatus en het veilig openen. `axioma-auth.js` beheert de gedeelde login.
Bij accountwisseling wordt de oude oefenmotor meteen geblokkeerd; opnieuw openen
laadt de nieuwe leerling. Een accountfout wordt niet als een gastlogin behandeld.
De statusknop staat in de bovenbalk en houdt per schermbreedte dezelfde breedte,
onafhankelijk van de tekst tijdens het opslaan.

Voor de negen geïmporteerde spellen, Brandweer, Kleiduifschieten en Vectoren:

1. Wacht op het account en haal de online voortgang op voordat de motor start.
2. Gebruik uitsluitend `AxiomaGame.storage` voor de spelopslag. De browsercache
   is gescheiden per Supabase-project, rol, gebruiker en spel. Alleen gastmodus
   kan de oude, niet toegewezen browsergegevens lezen; die worden nooit
   automatisch in een leerlingaccount geïmporteerd.
3. `axioma-game-adapters.js` declareert de opslagsleutels die online mogen en
   vertaalt oude online voltooiingslijsten naar het native spelformaat.
   `onWrite` werkt de samenvatting direct bij, zodat sluiten vóór de volgende
   timer geen achterhaalde voortgang op de startpagina achterlaat.
4. Opslag gebruikt een revisie en een expliciet verwacht leerling-ID. De nieuwe
   databasefuncties controleren dit ID tegen `auth.uid()`, ook als de sessie
   wisselt terwijl een aanvraag onderweg is. Wijzigingen tijdens een lopende
   opslag worden daarna opnieuw verzonden.
5. Bij verbindingsverlies blijft de eigen cache bruikbaar. Zonder bruikbare
   cache stopt het laden met een herstelknop; er wordt geen lege online
   voortgang teruggeschreven. Revisieconflicten blokkeren overschrijven en laten
   de lokale kopie staan. Bij kiezen voor de online versie blijft een reservekopie
   met tijdstempel op het toestel bewaard.

De generieke cloudrij bevat `completed`, `total`, `finished`, `schemaVersion: 2`
en `storage` met de gedeclareerde, geserialiseerde spelgegevens. Vectoren bewaart
hierin het volledige leermodel, fouten/herhalingen, XP, de sessie, de uitlegstap
en het deelantwoord. Ook de laatst getoonde feedback blijft bij hervatten bewaard.
De catalogus en leraarsconsole tonen het aantal stevige vectorvaardigheden.
De Rechtentrainer behoudt zijn gespecialiseerde `axioma_progress` en
conflictafhandeling, maar gebruikt dezelfde accountstatus en extra ID-controle.
Leerkrachten oefenen zonder leerlingresultaten bij te schrijven.

### Een bestaande HTML-motor aansluiten

Laad auth, progress, platform en de adapters als gewone scripts. Markeer de
spelscripts als `type="text/axioma-game"`; externe spelscripts gebruiken
`data-src="game.js"`. Laad daarna `axioma-game.js` met `data-game-id="..."`.
De module voert de motoren na het laden in documentvolgorde uit als klassieke
scripts. Hierdoor blijven bestaande globale spel-API's werken. Gebruik geen
nieuwe DOMContentLoaded-listeners in deze uitgestelde motoren: de DOM is klaar.
Alleen de spelmotor verwijst naar `AxiomaGame.storage`; de echte browseropslag
van Supabase wordt niet onderschept of vervangen.

`supabase_account_progress.sql` bevat de aanvullende, als SECURITY INVOKER
uitgevoerde opslagfuncties en de registratie van Vectoren. Deze wijziging is op
het gekoppelde project toegepast en met teruggedraaide testtransacties gecontroleerd.
Er zijn geen bestaande leerlingresultaten gereset of historische resultaten
herverdeeld: hun oorspronkelijke eigenaar kan achteraf niet betrouwbaar worden afgeleid.

## Samenspelen en solo

`axioma-social.js` en `axioma-groups.js` blijven verantwoordelijk voor
platformuitnodigingen en groepssessies. Zeeslag biedt daarnaast direct een
computertegenstander, met of zonder account. Solo gebruikt dezelfde regels voor
plaatsing, treffen, opnieuw schieten en winnen, en schrijft geen uitslagen naar
de online ranglijst. De computer kiest ongebruikte toegestane rechten zonder
kennis van de verborgen leerlingvloot. Er worden geen fictieve online spelers
of ranglijstresultaten meer getoond.

## Vectornotatie

Punten krijgen hoofdletters zonder pijl; vectorsymbolen zoals a, u, AB en eₓ
krijgen een echte pijl erboven. De tekstweergave gebruikt `mathText`; SVG-labels
tekenen hetzelfde accent. Antwoordpijlen zijn genummerde keuzes, met dezelfde
nummers op het rooster en op de knoppen. De menutegel gebruikt dezelfde conventie.

## Controle

- `tests/platform-navigation-browser.cjs`: alle 15 spellen hebben een native
  platformlink met de juiste bestemming; de link navigeert naar de website.
- `tests/vector-trainer-browser.cjs`: direct starten, antwoorden behouden bij
  uitleg/voortgang, meerkeuze en foutfeedback, constructie en volledige sessie,
  780 × 360, thema's en portable HTML.
- `tests/vector-trainer.test.cjs`: wiskundige validatie en herstelplanning.
- `tests/vector-lessons.test.cjs`: 576 voorbeeldvarianten, rekenstappen en XP.
- `tests/verfwinkel-curriculum.test.cjs`: onafhankelijke controle van recepten,
  schenkstappen, voorraad en volledige reeksen.
- `tests/verfwinkel-browser.cjs`: recepten in de echte motor en bereikbare
  bediening met zichtbare planningsvoorwaarden.
- `tests/trainer-teacher-browser.cjs`: Rechten blijft toegankelijk voor
  leerkrachten en DEV is standaard verborgen.
- `tests/social-browser.cjs`: uitnodigingen, Zeeslag en groepswedstrijden.

- `tests/account-auth.test.cjs`: directe accountinvalidatie, late profielen en herproberen.
- `tests/account-progress-browser.cjs`: oude gastgegevens, alle negen adapters,
  accountwisseling tijdens opslaan, offline starten/herstellen, revisieconflict,
  Vectoren hervatten op een ander toestel en vaste breedte van de accountknop.
- `tests/account-progress-database.sql`: ID-binding, revisies en grants op de
  echte database, uitsluitend tussen BEGIN en ROLLBACK met fictieve accounts.
