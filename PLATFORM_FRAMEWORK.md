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

De navigatie onderscheidt **Oefeningenreeks** (XP en adaptieve voortgang) en
**Vrij oefenen** (losse onderwerpen, zonder XP). De reeks blijft als
`suspendedSeries` in dezelfde accountgebonden opslag bewaard tijdens vrij oefenen.
Zowel de navigatieknop als de terugkeerknop bij de losse oefening hervatten die
exacte reeks, inclusief deelantwoord, feedback en verdiende XP. Oude vrije
concepten zonder bewaarde reeks kunnen rechtstreeks een nieuwe reeks starten.

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

Begeleide kop-staartconstructies controleren elke afgeronde pijl meteen:
**u vanuit P → v vanaf de kop van u → resultante vanuit P**. De volgende
instructie en tekentool staan automatisch klaar. Tussenfeedback verschijnt
boven het rooster en blokkeert of verschuift het bord niet. Bij een nieuwe
poging wordt alleen de huidige, nog onjuiste pijl vervangen; juiste eerdere
stappen blijven behouden. Undo en hervatten bepalen de actuele stap uit de
constructie. Alleen de voltooide opgave krijgt XP en een knop **Verder**.
Zelfstandige constructies blijven hun vrije tekenvolgorde en eindcontrole houden.

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

Alle zestien catalogusspellen gebruiken `shared/axioma-game.js` voor de
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

### Wedstrijden afronden

Kleiduifschieten gebruikt een gemengde vragenstroom uit
`shared/axioma-clay-questions.js`: vier kernvragen (0, ±½, ±1, ±2) en één
variant (±⅓ of ±¼) per vijf vragen. De kernrichtingen wisselen elkaar af in
een geschudde cyclus. Antwoordposities en de kant van de oorsprong variëren.
Alle antwoordopties verschillen minstens 18 graden; dit is een ontwerpgrens,
geen reeds met leerlingen gevalideerde perceptiedrempel. Een kwart en een
derde staan nooit als alternatieven bij dezelfde vraag. Soms verschijnen
halven en kwarten als exacte kommagetallen; derden blijven breuken.

De sessie-ID en het aantal verwerkte antwoorden bepalen de vraag. Iedereen
in dezelfde groep krijgt dus dezelfde stroom, inclusief antwoordposities en
notatie. Een misser zet de reeks op nul, maar gaat verder naar de volgende
vraag. De server beoordeelt de eigen gegenereerde vraag en bewaakt nog steeds
tempo, tabblad, antwoordversie, idempotentie en de eerste winnaar. Solo krijgt
zeven gegenereerde vragen en behoudt de herkansing van gemiste vragen.

`supabase_clay_mixed_questions.sql` voegt versie 2 toe via `axioma_clay_v2`.
De oorspronkelijke API en lopende wedstrijden behouden versie 1; oude pagina's
kunnen geen gemengde wedstrijd verkeerd beoordelen. Uitslagen worden niet gewist.
De uitbreiding is toegepast op het gekoppelde project en teruggelezen.
`tests/clay-questions.test.cjs` controleert 50.000 vragen. De server en browser
zijn bovendien op 510 voorbeelden met elkaar vergeleken. De bestaande en
nieuwe databasetests zijn met tijdelijke accounts binnen een rollback uitgevoerd.

Het startscherm van Kleiduifschieten richt zich op de groepswedstrijd: rechtstreeks
een groep maken met 3, 5 of 8 seconden per doel, of aansluiten bij een open groep.
Solo oefenen en de ranglijst staan als kleinere opties onderaan. Duonamen en
coachrollen maken geen deel meer uit van de bediening; solo gebruikt de eigen
accountalias. Bestaande opgeslagen oefentijden blijven behouden. Het startscherm
is gecontroleerd op 320 × 568, 390 × 844, 640 × 360, 780 × 360 en 1440 × 900.

De knop **Ranglijst** staat ook in de spelbalk en opent een eigen venster,
meteen op het tempo van de huidige wedstrijd. Wisselen tussen 3, 5 en 8 seconden
laadt automatisch de bijbehorende top 100. Die is gerangschikt op overwinningen,
daarna beste winnende tijd; de eigen rij is gemarkeerd. Solo-oefentijden blijven
apart bij het soloresultaat. Een lopende wedstrijd pauzeert niet bij het bekijken
van de ranglijst; bij de einduitslag sluit het ranglijstvenster automatisch.

Bij Zeeslag plaats je elk schip met twee klikken of tikken: beginpunt en een
gemarkeerd eindpunt. Daarna volgt automatisch het volgende schip. Een geplaatst
schip aanklikken selecteert het voor verplaatsing; de oude positie blijft bewaard
tot een geldig nieuw begin- en eindpunt gekozen zijn. **Ongedaan maken** annuleert
een selectie of herstelt de vorige plaatsing, verplaatsing of gewiste vloot.
Alleen **Vloot klaar** bevestigt de volledige vloot voor de wedstrijd.

Zeeslag toont na winst, verlies of het vertrek van de tegenstander een eindscherm
met **Opnieuw** en **Beëindigen**. De uitslag wordt eerst gemeld; daarna sluit de
gedeelde service de partij af en zijn de spelers weer beschikbaar. Bij een
opslagfout blijven de uitslag en een herstelmelding staan. Opnieuw nodigt dezelfde
tegenstander uit voor een nieuwe partij, met opnieuw expliciete acceptatie.
Solo begint rechtstreeks een nieuwe partij en schrijft geen online uitslag.

Bij Kleiduifschieten opent de organisator met **Opnieuw** een nieuwe groep op
hetzelfde tempo. De vorige uitslag blijft behouden. De andere deelnemers zien
**Opnieuw meedoen** zodra die groep beschikbaar is, of kiezen **Verlaten**.
De organisator kan de uitslag sluiten met **Beëindigen**. Een wachtende groep
wordt gesloten wanneer de organisator vertrekt; een andere deelnemer verlaat
alleen de eigen deelname. Tijdens een lopende race verlaten ook organisatoren
alleen hun deelname, zodat de anderen verder kunnen spelen.

Het Online-menu biedt rechtstreeks toegang tot de eigen groep en een knop om
die te verlaten. Het tabblad waarin je deelnam blijft hiervoor verantwoordelijk.
Een al geopende groep stuurt de leerling bij terugkeer naar de startpagina niet
opnieuw automatisch naar het spel.

`tests/social-browser.cjs` controleert deze afsluiting, een echte overwinning,
herstellen van mislukte uitslagopslag, revanche vanaf het eindscherm, solo opnieuw,
expliciet opnieuw deelnemen, verlaten en behoud van de vorige groepsuitslag.
De twee leerlingen en het transport in deze test zijn fictief.

## Vectornotatie

Punten krijgen hoofdletters zonder pijl; vectorsymbolen zoals a, u, AB en eₓ
krijgen een echte pijl erboven. De tekstweergave gebruikt `mathText`; SVG-labels
tekenen hetzelfde accent. Antwoordpijlen zijn genummerde keuzes, met dezelfde
nummers op het rooster en op de knoppen. De menutegel gebruikt dezelfde conventie.

## Controle

- `tests/platform-navigation-browser.cjs`: alle 16 spellen hebben een native
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

## Trainer Reële Getallen

`games/reele-getallen/` bevat tien werkvormen, met geneste verzamelingen en decimale classificatie.
De leerroute start met breuken bouwen, plaatsen, vergelijken en equivalenten
groeperen. Wortelgrenzen verbinden dit met intervallen en getalsoorten; periodieke
decimalen volgen na een eigen introductie. Elke familie heeft stapsgewijze uitleg
op hetzelfde werkvlak en is ook afzonderlijk vrij toegankelijk. `real-core.js`
beheert exacte waarden, beoordeling en planning; `real-lessons.js` de voorbeelden;
`real-app.js` de schermtoestanden en bediening. De portable `index.html` wordt
gebouwd met `node scripts/build-real-trainer.cjs`.

Deze versie gebruikt rationele invoer, geijkte lijnen, eindige en onbegrensde
intervallen, positieve en negatieve vierkantswortelwaarden, derdemachtswortels
van positieve en negatieve getallen, en korte periodes. Intervallen worden uit
ongelijkheden, natuurlijke taal of verzamelingsnotatie opgebouwd. De gebruikte
conventie voor ℝ⁺/ℝ⁻ staat bij de opgave; een oneindige kant heeft een pijl en
is altijd open. De geneste sleepgebieden tonen ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ en vragen om de
kleinste passende verzameling. Decimale classificatie onderscheidt eindig,
zuiver repeterend, gemengd repeterend en irrationaal, op grond van de waarde.

Nieuwe concepten hebben `contentVersion: 2`; bestaande opgeslagen oefeningen
zonder versie worden met de oude generatorvarianten hervat. De voortgangsversie
en opslagkey blijven gelijk, met lege vaardigheidsvelden voor nieuwe onderdelen.
Zoom, wortelalgebra en de overige werkvormen uit de 31-templatebank volgen later.
De 155 vaste documentitems zijn niet als volledige bank overgenomen.

Na twee zelfstandige antwoorden opent een volgend begrip. Stevig vereist vier
zelfstandige antwoorden, drie verschillende opgaven, twee voorstellingen, een
latere herhaling en drie recente juiste antwoorden zonder open herstelvraag.
Dit is een toetsbare ontwerpregel, geen bewezen maat voor leerwinst. Een reeks
heeft acht opgaven; beide stappen van wortelbegrenzing vormen één opgave.
Zelfstandig oplossen levert 10–14 XP, een herstelvraag 15 XP, opgelost na hulp of
verbetering 5 XP. Voorbeelden en overslaan leveren geen XP. Zelfgekozen onderwerpen gebruiken dezelfde beoordeling, XP en foutopvolging als de leerroute. `topic` bepaalt alleen de onderwerpkeuze; `suspendedSeries` bewaart de onderbroken routeopgave. Beide delen dezelfde sessieteller. Oude `free`-opgaven worden bij het hervatten omgezet naar een zelfgekozen onderwerp; reeds afgeronde antwoorden krijgen niet opnieuw XP.

De registratie is `reele-getallen-trainer`, met tien vaardigheden en opslagkey
`axioma-real-numbers-v1`. De gedeelde accountlaag bewaart leerroute, XP, sessie,
invoer, uitlegstap en feedback. De database gebruikt de bestaande tabellen en
accountcontrole; `supabase_real_numbers.sql` registreert alleen het spel. Die
registratie is uitgevoerd en teruggelezen. Leerlinggegevens zijn niet gewijzigd.

Controles: `tests/real-numbers.test.cjs` (1.800 opgavevarianten en hun voorbeelden),
`tests/real-numbers-browser.cjs` (640/780 × 360, touch/pointer, toetsenbord, uitleg,
foutfeedback, XP, herladen, thema's, portretuitleg en offline HTML) en de uitgebreide
`tests/account-progress-browser.cjs` (hervatten op een tweede toestel met fictieve
accounts). De fysieke Samsung A20 en leertransfer zijn nog niet met leerlingen getest.

### Rechtstreeks intervallen en periodes aanduiden

Bij Reële Getallen plaatst een tik op de lijn een open grenspunt; nogmaals
op hetzelfde punt tikken wisselt open/gesloten. Beide tekenrichtingen werken.
Verslepen en de stapknoppen verplaatsen een punt met behoud van zijn inclusie;
bij het kruisen worden waarden én inclusies samen geordend. Annuleren herstelt
het vorige antwoord. De validator accepteert beide invoervolgordes.

Eén tik op een decimaal selecteert meteen een blok van één cijfer. Twee tikken
of een sleepbeweging selecteren een langer blok, in beide richtingen. Een
aparte wisknop maakt opnieuw kiezen expliciet. Selectie en eventueel eerste
selectiepunt blijven in het bestaande concept bewaard. De voortzettingsregel
noemt het kleinste herhaalblok (bijvoorbeeld 3, niet 33).

### Wortelbouw

Wortelbouw gebruikt dezelfde `AxiomaGame`-levenscyclus als de overige spellen.
De accountgebonden sleutel is `axioma.wortelbouw.progress.v1`; de samenvatting
bevat stabiele opgave-ID’s en een totaal van veertien opgaven. De engine wordt
pas geladen na het ophalen van het account en de voortgang. Voltooiingen en
beste routes blijven behouden bij opnieuw spelen; compacte bouwacties maken
hervatten met Undo mogelijk. De twee routes naar √6 tellen samen als één
voltooide opgave. De catalogus en het lerarenoverzicht hergebruiken de bestaande
voortgangsweergave. SQL-registratie: `supabase_wortelbouw.sql`.
