# Structuurvoorstel voor leraarBob

Analyse van de bestaande website en voorstel voor verdere ontwikkeling, 5 oktober 2026.

**Update:** [Fase 1 is geïmplementeerd](fase-1-implementatie.md): één spelregister,
hervatbare Algebra-/Getallenroutes en compacte klasbattles, inclusief eenvoudige
stelsels met servercontrole. Het document hieronder blijft de analyse voor de
verdere fases; de implementatienotitie beschrijft wat nu echt werkt en wat nog volgt.

De aanbevolen richting is één platform met gedeelde accounts, navigatie, sessies,
activiteitenregistratie en oefenbladen, waarop verschillende wiskundemotoren
aansluiten. De spellen behouden hun eigen leerstof en werkborden. Een leerling
kiest een wereld en een level; daarna kiest die hoe er geoefend wordt. Dezelfde
oefening kan vervolgens op een solowerkbord, in een gezamenlijke les, in een
battle of op papier verschijnen.

Dit rapport scheidt **wat al bestaat**, **wat nu met Getallenwereld wordt
toegevoegd** en **wat een voorstel voor later is**. De voorgestelde dataverzameling,
publieke profielen, leerkrachtdeelname en nieuwe lesmodi zijn nog niet ingevoerd.
Uitgangspunt voor dit voorstel is een privé leerlingprofiel met resultaten binnen
de eigen klas. Publieke profielen vormen een afzonderlijke, beperkte mogelijkheid.

## 1 Wat de huidige website al kan

De website heeft al veel bouwstenen. Het grootste probleem is dat dezelfde
begrippen op verschillende plaatsen anders worden geregistreerd en aangeboden.

| Bouwsteen | Huidige situatie | Gevolg voor de volgende stap |
| --- | --- | --- |
| Account en avatar | Gedeelde accountservice, leerlingalias, klascode, leerkrachtrol en centrale avatarkeuze | Hergebruiken; geen nieuw account per spel |
| Spelvoortgang | Accountgebonden spelopslag met revisies, lokale bewaring en cloudopslag | Behouden als hervatbare spelstand |
| Leerkrachtoverzicht | Zoeken op alias, klas/thema/spel kiezen, CSV, individuele voortgang | Uitbreiden met echte activiteiten en een datumbereik |
| Activiteitenhistoriek | Enkele trainers bewaren een beperkte laatste lijst; andere vooral totalen of voltooiingen | Nog geen volledige tijdlijn over alle spellen |
| Oefentijd | Geen gedeelde meting van actieve interactietijd | Niet reconstrueren uit een opgeslagen tijdstip |
| Klasbattle | Centrale ingang voor vijf spellen, echte nagekeken punten, ranglijsten per spel en klas | Goede basis; nog geen periodefilter of meespelende leerkracht |
| Samen leren | Rechtenwereld heeft een eigen samenwerkingsroute met rollen en afzonderlijke ideeën | Waardevolle eerste adapter, nog geen algemene klassikale lesmotor |
| Afdrukken | Centrale oefenbladpagina en gedeelde A4-componenten, met verschillende vakgebonden printpaden | Gemeenschappelijke documentmotor uitbouwen |
| Bovenbalk | Gedeelde locatie, account, scherm/weergave, menu en blijvende inklapkeuze | Deze afspraak verplicht maken voor nieuwe aansluitingen |

De actuele code is hier leidend. Oudere opleverdocumenten beschrijven soms een
vroegere toestand, bijvoorbeeld vóór de centrale avatars, directe schermknoppen
of centrale Klasbattle.

De belangrijkste bronnen in de repository zijn [account en rollen](../../shared/axioma-auth.js),
[hervatbare opslag](../../shared/axioma-game.js), [cloudvoortgang](../../shared/axioma-progress.js),
[leerkrachtconsole](../../teacher/teacher.js), [trainerdetails](../../teacher/trainer-details.js),
[Klasbattle](../../klasbattle/hub.js), [gedeelde spelvormen](../../shared/play-modes.js)
en [de A4-renderer](../../shared/worksheet-render.js).

### Beschikbare functies zijn nog niet overal gelijk

Dit is de inventaris van de actieve routes, inclusief de nieuwe aansluiting van
Getallenwereld. **Niet aangesloten** betekent dat de centrale route/provider
ontbreekt; het zegt niet dat de wiskundige inhoud ongeschikt is voor die vorm.

| Onderdeel | Solo | Duo | Groepsbattle | Samen leren | Papier | Leerkracht |
| --- | --- | --- | --- | --- | --- | --- |
| Rechtenwereld | Eigen leerroute | Lokaal en online, met eigen toelatingsregels | Ja | Bestaande route voor 2–3 leerlingen met ideeën, bouwen en eigen eindcheck | Vier werkbladwerelden | Oefenen en lokale battle-simulatie |
| Algebrawereld | Levels, expliciet starten, herhaal-XP | Niet aangesloten | Vergelijkingen en eenvoudige unieke stelsels (`S1`) | Niet aangesloten | Vergelijkingen en stelsels | Oefenen en lokale simulatie |
| Vectormissie | Adaptieve leerroute | Lokaal | Ja | Niet aangesloten | Niet aangesloten | Oefenen en lokale simulatie |
| Bewerkingentrainer | Eigen route | Lokaal | Ja | Niet aangesloten | Eigen oefenbladen | Bespreekmodus met stappen en lokale simulatie |
| Wortelbouw | Eigen bouwpuzzels | Eigen lokale arena | Ja | Niet aangesloten | Niet aangesloten | Oefenen en lokale simulatie |
| Reële-getallentrainer | Eigen leerroute | Niet centraal aangesloten | Niet aangesloten | Niet aangesloten | Niet centraal aangesloten | Lokaal oefenen |
| Getallenwereld, nu toegevoegd | 15 onderdelen, elk zes opgaven | Verwijzing naar Bewerkingentrainer | Verwijzing naar Bewerkingentrainer | Niet aangesloten | Verwijzing naar Bewerkingentrainer | Gewone route lokaal oefenen |

Getallenwereld heeft een eigen tegel, accountgebonden spelstand en teller van
**15 onderdelen**, zonder verzonnen XP. De verwijzingen naar printen en battles
noemen Bewerkingentrainer expliciet. Het zijn bestaande mogelijkheden van die
trainer, geen nieuwe Getallenwereld-provider. De standaardselectie **Actuele
spellen** in het leerkrachtoverzicht volgt voortaan dezelfde catalogus als de
homepage, zodat nieuwe werelden daar niet door een tweede vaste lijst ontbreken.

De historische bronnen hebben ook verschillende dekking. De oorspronkelijke
Rechtentrainer bewaart maximaal 360 telemetriegebeurtenissen, met datum,
vaardigheid en verstreken taakduur. Vectoren en reële getallen hebben recente
activiteit en rijke docentdetails; Bewerkingentrainer bewaart een laatste lijst
antwoordevents. Algebra heeft oplossingsbewijzen en een XP-boek zonder uniforme
activiteitdatums. Deze bronnen vragen adapters en een zichtbaar label over hun
dekking. Verstreken taakduur is geen al gemeten actieve interactietijd.

## 2 Maak de betekenis van de onderdelen vast

Voorstel: gebruik deze begrippen overal met dezelfde betekenis.

| Begrip | Betekenis | Voorbeeld |
| --- | --- | --- |
| Wereld | De herkenbare omgeving waarin een leerling leerstof kiest | Algebrawereld, Getallenwereld |
| Onderwerp | Een inhoudelijke groepering binnen een wereld | Vergelijkingen, machten, wortels |
| Level | Een afgebakende oefenroute met een leerdoel | Twee stappen, macht van een macht |
| Opgave | Eén concrete, gegenereerde vraag | Een bepaalde vergelijking met haar tussenstappen |
| Poging | Het werk van één deelnemer aan één opgave | Eerste antwoord, hints en verbeteringen |
| Speelronde | Een nieuwe reeks binnen hetzelfde level | Opnieuw zes oefeningen spelen |
| Sessie | De context waarin iemand of een groep werkt | Solo, duo, klassikale les of groepsbattle |
| Resultaat | Afzonderlijke waarnemingen over een poging of sessie | Correct, geholpen, tijd, XP, battlepunten |

Een level afronden, XP verdienen en een leerdoel beheersen zijn drie verschillende
zaken. XP beloont deelname volgens de regels van het spel. Voltooiing zegt dat
een route is afgewerkt. Beheersing vraagt aanvullend bewijs, zoals zelfstandig
oplossen, variatie en later opnieuw slagen. Een battleplaats vervangt dat bewijs
evenmin.

Getallenwereld en Bewerkingentrainer gebruiken dezelfde rekenkern voor machten
en wortels. Het blijven afzonderlijke spelstanden. Later kunnen hun opgaven
wel naar dezelfde leerdoel-ID verwijzen. Daarmee kun je leerstof over spellen
heen bekijken zonder twee voltooiingen als twee verschillende beheersingen
van dezelfde rekenregel te presenteren.

## 3 Eén globale navigatie en één lokale leerroute

Voorstel voor de vaste platformbestemmingen:

- **Spellen:** de werelden en trainers.
- **Klasruimte:** gezamenlijke lessen en battles; aanvankelijk de bestaande Klasbattle.
- **Oefenbladen:** oefeningen samenstellen, bekijken en afdrukken.
- **Mijn voortgang:** eigen activiteiten en resultaten, binnen het privéprofiel.
- **Mijn klassen:** het leerkrachtoverzicht, alleen voor bevoegde leerkrachten.

Het account en de avatar blijven rechtsboven. Publiek profiel wordt een bewuste
actie vanuit dat account, geen tweede identiteit of standaard landingspagina.
De naam **Klasbattle** blijft passend voor competitieve sessies. Zodra ook echte
klassikale lessen bestaan, is **Klasruimte** de overkoepelende sectie, met
**Samen leren**, **Battle** en **Resultaten** als onderdelen. Hernoemen vóór
die lesfunctie werkt zou te veel beloven.

Binnen een spel is het pad:

```text
leraarBob → Algebrawereld → Vergelijkingen → Twee stappen
                         wereld            geselecteerd level

Werelden → Levels → Spelen
                    Oefenblad
                    Samen: samen leren of battle, waar ondersteund
```

Een levelkaart selecteert het level. Alleen **Spelen** of **Verder spelen** opent
de ronde. **Oefenblad** maakt een afzonderlijk document. Een keuze voor een
spelvorm opent eerst de instellingen; ze begint niet meteen een sessie.
Moeilijkheid is een instelling van de opgaven, geen extra hoofdsectie naast Levels.

Dit maakt ook de overgang voorspelbaar: selecteren verandert instellingen,
starten verandert de werkruimte. De W3C-richtlijn over invoer ondersteunt het
vermijden van onverwachte contextwisselingen bij een instellingswijziging;
onze keuze voor een afzonderlijke startknop is de concrete toepassing hier.
[W3C: On Input](https://www.w3.org/WAI/WCAG22/Understanding/on-input).

Voorstel voor de bovenbalk:

```text
leraarBob → wereld → onderwerp | account + echte voortgang | scherm | weergave | menu | inklappen
```

Timers, codes, rondes, antwoordknoppen en docentbediening staan onder deze rij.
Op een telefoon worden locatie en acties verdeeld over compacte rijen. Bij
inklappen blijft één herstelknop bereikbaar en komt de ruimte ten goede aan de
oefening. Een ingebed werkbord krijgt geen tweede platformbalk.

Dit past bij de W3C-richtlijn om herhaalde navigatie in dezelfde relatieve volgorde
te houden. De concrete keuze voor deze bestemmingen is ons ontwerpvoorstel,
niet een voorgeschreven W3C-menu. [W3C over consistente navigatie](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html).

## 4 Maak links en terugwegen voorspelbaar

Een centrale routetabel moet bepalen welke bestemmingen bestaan. Dezelfde tabel
voedt de menubalk, spelvormkeuze, leerkrachtconsole, oefenbladpagina en uitnodigingen.
Nu zijn spelpaden en ondersteunde modi nog over meerdere bestanden verdeeld.

Elke overgang bewaart ten minste wereld, onderwerp, gekozen level, spelvorm en
een veilige terugbestemming. Een concrete sessie gebruikt haar sessie-ID; een
menuvoorkeur wordt apart bewaard. Het werkbord behoudt zijn eigen opgave-ID en
invoer. Dat laatste hoort niet alleen in een URL of in de zichtbare menustatus.

De volgende afspraken zijn controleerbaar:

1. **Levels** keert terug naar hetzelfde gekozen level, zonder de ronde te verwijderen.
2. **Werelden** opent het wereldmenu, met een zichtbare mogelijkheid om werk te hervatten.
3. **Overzicht** vanuit een battle bewaart de lopende sessie en haar antwoorden.
4. **Terug naar je wereld** verwijst naar de werkelijke solo-ingang, ook als een spelmap geen index heeft.
5. Een oude deelnamelink met code blijft bruikbaar; een nieuwe code is een expliciete keuze voor een andere sessie.
6. Alleen een bewust gekozen actie opent een andere spelvorm. Een avatar, menu of schermknop doet dit nooit.
7. Een accountwissel verwijdert onmiddellijk het oude zichtbare werk en oude leerlinggegevens; uitstaande reacties krijgen geen kans dat terug te zetten.
8. De browserknoppen terug/vooruit volgen dezelfde routeafspraken als de zichtbare knoppen.

Gebruik de bestaande HTML-modules en adapters; een volledige herschrijving naar
één groot JavaScript-raamwerk is hiervoor niet nodig. Eerst het contract en de
router centraal maken, daarna scherm voor scherm aansluiten.

## 5 Spelvormen met twee afzonderlijke keuzes

**Solo, duo en groep** beschrijven wie meedoet. **Samen leren en battle**
beschrijven wat die deelnemers doen. Die begrippen horen niet door elkaar in
één lange lijst, en niet elke combinatie heeft meteen een werkende uitvoering.

| Deelname | Leren en oefenen | Battle |
| --- | --- | --- |
| Alleen | Een level spelen, met feedback en eigen voortgang | Eventueel een tijd- of score-uitdaging; geen schijntegenstander |
| Duo | Samen bouwen en controleren, op één of twee toestellen | Twee echte deelnemers, lokaal of online |
| Groep | Leerkracht begeleidt een gezamenlijke les, of leerlingen werken in kleine groepjes | Leerkracht organiseert rondes en een uitslag |

Voor een leerling is **Spelen** de duidelijke standaard. **Samen** toont daarna
alleen ondersteunde mogelijkheden, met uitleg over toestellen en deelnemers.
Voor een leerkracht komen **Les tonen**, **Samen leren**, **Groepsbattle** en
**Simulatie** beschikbaar zodra de bijbehorende adapter werkt.

Een beschikbaarheidsregister voorkomt lege of misleidende knoppen. Per spel
staan daarin de generator, validator, werkbord, printadapter, sessieprovider,
progressieadapter en ondersteunde rollen. Eén vlag `multiplayer: true` is te
grof: een lokaal duo, een online duel en een klassikale les hebben andere regels.

## 6 De leerkracht kan begeleiden én meedoen

Voorstel: ondersteun beide rollen, zonder het leerkrachtaccount om te zetten
naar een leerlingaccount.

**Les tonen** gebruikt een projectorwerkbord met dezelfde opgavegenerator. De
leerkracht kiest level en moeilijkheid, bouwt stappen op en toont op verzoek de
uitleg. Dit kan als eerste uitbreiding al zonder online klasregistratie werken.

**Samen leren met de klas** voegt leerlingwerk toe. Iedereen ziet dezelfde opgave;
de leerkracht ziet wie begonnen is, waar leerlingen vastlopen en welke inzendingen
klaarstaan. Antwoorden verschijnen pas op het bord na een docentactie. Een
voorstel kan anoniem geprojecteerd worden. Fouten zijn bespreekbaar zonder dat
iedere poging een competitie of publiek oordeel wordt.

**Zelf meedoen** geeft de leerkracht een eigen werkbord naast de hostbediening.
De leerkracht kan een oplossing voordoen of als herkenbare deelnemer meespelen.
In een battle mag die demonstratiescore niet in de leerlingranglijst of de
klasgemiddelden terechtkomen.

Hiervoor is een echt sessiecontract nodig: een account heeft een platformrol,
maar binnen een sessie daarnaast bijvoorbeeld `host`, `participant`, `observer`
of `projector`. De huidige groepsbattle-backend weigert echte leerkrachtdeelname.
De bestaande lokale **Zelf proberen** in Simulatie is daarom geen bewijs dat
online host en deelnemer al tegelijk werken.

Een gezamenlijk juist antwoord geeft evenmin automatisch iedere leerling
zelfstandige beheersing of XP. Registreer hun eigen bijdrage en, waar het
leerdoel dat vraagt, een afzonderlijke eindcheck.

GeoGebra Lessons laat een bruikbaar verwant patroon zien: materiaal toewijzen,
leerlingwerk volgen en antwoorden bespreken, met mogelijkheden voor groepen en
anonieme bespreking. We nemen dat onderscheid tussen begeleiden en presenteren
als inspiratie; het is geen voorstel om leraarBob naar GeoGebra te verplaatsen.
[GeoGebra: Assign Resources](https://help.geogebra.org/hc/en-us/articles/8828154551965-Assign-GeoGebra-Resources).

## 7 Een centrale oefenbladmotor

Het gewenste systeem centraliseert de documentopbouw, niet alle wiskunde in
één gigantische generator. Elke inhoudsmotor blijft verantwoordelijk voor
correcte opgaven, toegestane varianten, antwoorden en uitwerkingen.

```text
Wereld en level
      ↓
Zelfde opgavegenerator met vaste seed en versie
      ├── schermwerkbord → leerlingpoging en feedback
      ├── les of battle → deelnemers en beoordeling
      └── printadapter → A4-pagina's en afzonderlijke verbetersleutel
```

De gedeelde motor verzorgt titel, aantal opgaven, moeilijkheid, paginering,
antwoordruimte, kop/voet, preview, PDF en print. De printadapter van het vak
verzorgt grafieken, bouwfiguren, wiskundetekst en de mogelijke uitwerking.
De bestaande [A4-paginering](../../shared/worksheet-layout.js) en
[renderlaag](../../shared/worksheet-render.js) zijn een bruikbaar begin, maar de
renderlaag heeft nog een vaste Rechtenwereld-kop en is dus nog geen algemene
vakoverschrijdende documentmotor.

Een oefenblad krijgt een eigen document-ID, seed, generatorversie, configuratie
en een onveranderlijke kopie van de **concrete vragen en het antwoordmodel**.
Alleen een seed bewaren is onvoldoende zodra de generator verandert. De kopie
houdt een eerder uitgedeeld blad en zijn sleutel gelijk; de versie verklaart
hoe de reeks oorspronkelijk is gemaakt. **Nieuwe opgaven**
verandert de documentseed. **Dezelfde reeks afdrukken** gebruikt een expliciete
kopie van de huidige vragen. Beide acties laten de spelpoging en XP intact.

Voorstel voor de flow:

1. Vanuit een geselecteerd level: **Oefenblad**.
2. Level staat al ingevuld; kies aantal, moeilijkheid en hulp/antwoordruimte.
3. Bekijk vragen en eventueel de aparte sleutel.
4. **Download PDF** of **Print**.
5. **Terug naar level** brengt je bij dezelfde selectie en hetzelfde lopende werk.

De centrale sectie gebruikt precies dezelfde configuratiecomponenten. Ze is
geen tweede, afwijkende generator. Standaard staan naam en klas leeg op het
papier; voeg leerlinggegevens alleen bewust toe. Een antwoordbestand hoort
niet automatisch bij een publieke leerlinglink of een lopende battle.

Begin met de gedeelde HTML-voorvertoning en A4-printstijl. Maak PDF een vaste
download zodra consistente paginering over de gebruikte browsers nodig is.
Test daarbij zwart-wit, breuken, lange uitwerkingen, figuren en paginaovergangen.
Geavanceerde `@page`-mogelijkheden verschillen per browser; Chrome documenteert
zijn ondersteuning, maar dat bewijst niet dat iedere schoolbrowser diezelfde
afdruk maakt. [Chrome: Print Margins](https://developer.chrome.com/blog/print-margins).

## 8 Maak van voortgang en activiteiten twee gegevenslagen

De bestaande spelstand is geschikt om een oefening te hervatten. Ze is minder
geschikt om achteraf te bepalen wat een leerling op dinsdag tussen 10 en 11 uur
heeft gedaan. Een overschreven JSON-stand bewaart niet vanzelf alle eerdere
gebeurtenissen.

Voorstel voor vier samenhangende lagen:

| Laag | Doel | Voorbeelden |
| --- | --- | --- |
| Account en lidmaatschap | Wie is het, in welke klas en met welke toegangsrechten? | Stabiele gebruiker-ID, alias, klaslidmaatschap, toegewezen leerkracht |
| Hervatbare spelstand | Waar ging het werk verder? | Opgave, tussenstappen, invoer, levelselectie en opslagrevisie |
| Activiteiten en resultaten | Wat gebeurde er wanneer en in welke context? | Opgave gestart, antwoord nagekeken, hint, level afgerond, battle geëindigd |
| Samenvattingen | Snel filteren en vergelijken | Dagtotalen per leerling, leerdoel, wereld en spelvorm |

De stabiele gebruiker-ID is de sleutel, **niet de aliastekst**. Een alias kan
wijzigen; twee leerlingen kunnen vergelijkbare namen hebben. De console laat
de alias zien en filtert daarop, terwijl de onderliggende koppeling hetzelfde
account blijft volgen. Lidmaatschap heeft een begin- en einddatum, zodat een
klaswissel oudere rapporten niet onjuist hergroepeert.

Nieuwe activiteiten worden append-only vastgelegd met een uniek event-ID.
Herhaald versturen bij een netwerkstoring telt niet dubbel. De server bindt het
event aan het aangemelde account; een leerling kan geen andere actor-ID
aanleveren om onder een klasgenoot te schrijven.

Minimale velden zijn: event-ID, sessie-ID, actor-ID, spel/wereld/level/leerdoel,
opgave-ID en generatorversie, deelnamevorm, doel van de sessie, gebeurtenistype,
clienttijd, serverontvangsttijd, resultaat, hulpaanduiding en betrouwbaarheid.
Bewaar getypte tussenstappen alleen als ze voor feedback of de afgesproken
docentfunctie nodig zijn; een volledige toetsaanslagregistratie is niet nodig.

## 9 Definieer de metingen vóór je er grafieken van maakt

| Metriek | Voorgestelde definitie | Grenzen |
| --- | --- | --- |
| Opgaven gemaakt | Aantal unieke afgeronde opgavepogingen | Een hint of tussenstap is geen nieuwe opgave |
| Juist bij eerste beoordeling | Correcte eerste nagekeken inzendingen gedeeld door eerste nagekeken inzendingen | Apart tonen van een antwoord dat na hulp is verbeterd |
| Uiteindelijk opgelost | Opgaven die na de toegestane hulp of verbetering slagen | Geen automatische aanduiding ‘zelfstandig’ |
| Levelvoltooiing | Uniek afgeronde leerroute | Nieuwe herhaalrondes geven geen extra uniek level |
| XP | Werkelijk toegekende beloningen van het spel | Geen uniforme moeilijkheids- of beheersingsschaal |
| Battlepunten | Nagekeken competitiepunten, met beoordelingsbron en validator-/scorepolicyversie | Alleen binnen een vergelijkbare regelset vergelijken |
| Deelname | Echte inschrijving en eventuele inzendingen in een sessie | Aanwezig zonder antwoord is iets anders dan een fout antwoord |
| Actieve interactietijd | Geschatte tijd waarin het oefenwerkbord actief gebruikt wordt | Geen bewijs van aandacht, rekentijd op papier of leerkwaliteit |

Toon bij percentages altijd de teller en noemer, bijvoorbeeld **8 van 10**.
Ontbrekende data krijgen **Niet geregistreerd**, niet nul. Maak per bron zichtbaar
of een resultaat lokaal door de trainer is beoordeeld of door de server is
geverifieerd. Oude lokale XP worden niet achteraf ‘geverifieerde battlepunten’.

Een klein aantal opgaven is een beperkt signaal. Een dashboard kan bijvoorbeeld
‘nog weinig gegevens’ tonen, zonder er een diagnose van de leerling aan te verbinden.
Vergelijkingen in de tijd moeten dezelfde leerdoelen en moeilijkheid zichtbaar houden.

## 10 Oefentijd zorgvuldig meten

Voorstel: noem de eerste meting **actieve interactietijd**. Meet met een monotone
browserklok terwijl de oefening open is, het document zichtbaar is, geen blokkerend
accountvenster openstaat en er recent een betekenisvolle oefenactie is geweest.
Pauzeer bij een verborgen tab, een pauzeknop en in menu's of uitslagoverzichten.

Een startinstelling van 60 seconden zonder actie is een voorstel voor een pilot,
geen vastgestelde onderwijsnorm. Bij lezen, hoofdrekenen en rekenen op papier
kan iemand langer bezig zijn zonder te klikken. Daarom horen de gekozen
meetsystematiek en die beperking bij de rapportage.

Stuur tijd in kleine, begrensde segmenten met unieke ID's. Tel geen volledige
interval op omdat een tab een uur openstond. Bij herladen sluit of begrens je
het oude segment. Gelijktijdige tabs van dezelfde leerling mogen overlappende
seconden niet dubbel optellen. Offline gebeurtenissen behouden zowel de
waargenomen tijd als de latere serverontvangsttijd.

Bewaar tijdstippen in UTC en toon/filter ze in de afgesproken schooltijdzone,
hier Europe/Brussels. Een datumfilter gebruikt het begin van de eerste dag tot
het begin van de dag ná de laatste dag. Dat voorkomt fouten rond middernacht
en zomer-/wintertijd. ‘Laatst opgeslagen’ blijft apart zichtbaar van ‘laatst
geoefend’ en ‘laatst gesynchroniseerd’.

Browseractiviteit blijft een benadering. Gebruik deze tijd als context voor
begeleiding, niet als zelfstandig cijfer of publieke tijdsranglijst.

De HTML-standaard beschrijft de zichtbaarheidstoestand van een document. Die
helpt pauzeren als een tab verborgen is; zij meet geen concentratie of rekenen
buiten het scherm. [WHATWG: Page Visibility](https://html.spec.whatwg.org/multipage/interaction.html#page-visibility).

## 11 Een leerkrachtdashboard dat begint bij een vraag

Voorstel voor de standaardflow: **Mijn klassen → klas → periode → leerlingen**.
Daarna kun je op alias, wereld, onderwerp, level, moeilijkheid en spelvorm filteren.
Een globale leerkrachtrol alleen is voor een toekomstige site met meerdere
leerkrachten of scholen geen voldoende klasafbakening. Werk met expliciete
toewijzingen aan klassen; de server controleert die bij iedere gegevensaanvraag.

Een overzichtsrij toont alias, gemaakte opgaven, eerste-pogingresultaat,
zelfstandig/met hulp, interactietijd, laatste activiteit en relevante battledeelname.
XP en voltooide levels staan apart. Vanuit de rij opent een profiel met vier tabbladen:

- **Overzicht:** voortgang en recente onderwerpen.
- **Activiteiten:** een tijdlijn binnen het gekozen datumbereik.
- **Leerstof:** bewijs per leerdoel, met aantallen en hulpgebruik.
- **Sessies:** lessen, duo's en battles, met de relevante resultaten.

Voorbeelden van nuttige vragen zijn: wie begon deze week niet aan het level,
welke rekenregel gaf problemen, wie slaagt zelfstandig na eerdere hulp, en welke
leerlingen deden wel mee aan de battle maar dienden niet in?

Laat filters deelbaar zijn binnen bevoegde accounts en behoud ze bij teruggaan
uit een leerlingprofiel. Voer de filtering en paginering op de server uit. De
huidige console haalt veel resultaten vooraf naar de browser; dat schaalt niet
goed naar een langdurige activiteitenhistoriek.

CSV-export volgt dezelfde selectie en toegang als het scherm. Toon in de export
definities, periode, tijdzone en eventuele ontbrekende data. Namen hoeven niet
automatisch mee als een alias voldoende is.

Khan Academy biedt een bruikbaar onderzoeksvoorbeeld: aparte rapporten voor
activiteit, vaardigheden en opdrachten, en een individueel leerlingrapport voor
detail. Dat ondersteunt ons voorstel om tijdlijn, leerdoelen en sessieresultaten
te verbinden zonder ze in één totaalgetal te persen. De precieze menu's en
metingen hierboven zijn een ontwerp voor leraarBob.
[Khan Academy: Reports](https://support.khanacademy.org/hc/en-us/articles/360031052391-How-do-I-use-Reports-to-view-Activity-Skills-and-Assignment-score-reports),
[Individual Student Report](https://support.khanacademy.org/hc/en-us/articles/7263187791373-How-do-I-use-the-Individual-Student-Report).

## 12 Privéprofiel en publiek profiel zijn verschillende weergaven

Voorstel voor de standaardtoegang:

| Informatie | Leerling zelf | Toegewezen leerkracht | Klasgenoten | Internet |
| --- | --- | --- | --- | --- |
| Alias en gekozen avatar | Ja | Ja | Binnen deelname/context | Alleen in een afzonderlijk ingesteld publiek profiel |
| Eigen voortgang en XP | Ja | Voor begeleidingsdoel | Alleen expliciet gedeelde elementen | Standaard nee |
| Fouten, hints en interactietijd | Ja | Voor begeleidingsdoel | Nee | Nee |
| Battleuitslag | Eigen resultaat en toegestane ranglijst | Sessies en toegewezen klas | Binnen toegestane klas/sessie | Standaard nee |
| Login, e-mail en accountbeheer | Alleen eigen beheer | Geen wachtwoord of sessietokens | Nee | Nee |
| Leerkrachtprofiel | Eigen beheer | Volgens schoolrol | Alleen afgesproken informatie | Eventueel naam, vak en gedeelde lesmaterialen |

Een publieke leerlingkaart kan beperkt blijven tot alias, avatar en bewust
gedeelde badges. Zet daar geen klascode, aanwezigheidsstatus, foutanalyse,
volledige activiteitenkalender of privé-link in. Een alias is niet automatisch
anoniem: de klascontext kan herkenning mogelijk maken.

Maak een preview **Zo ziet een ander jouw profiel** en een eenvoudige mogelijkheid
om delen weer uit te zetten. Publieke data worden via een aparte, beperkte
serverweergave geleverd, niet door privégegevens in de browser te verbergen.
Schoolafspraken, geschikte grondslag en bewaartermijnen moeten vóór bredere
publicatie worden vastgesteld. Dit rapport kiest de product- en toegangsstructuur;
het vervangt geen beoordeling van de specifieke schoolcontext.

Herleidbare gepseudonimiseerde gegevens blijven persoonsgegevens volgens de
Europese Commissie. De EDPB werkt beperkte toegang, noodzakelijke gegevens en
bewaartermijnen uit bij bescherming door ontwerp en standaardinstellingen.
Dat onderbouwt de beperkte standaardzichtbaarheid; de concrete grondslag en
publicatievoorwaarden moeten bij de schoolcontext passen.
[Europese Commissie: toepassing van gegevensbescherming](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/application-gdpr_en),
[EDPB: Data Protection by Design and Default, paragrafen 40–57](https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_201904_dataprotection_by_design_and_by_default_v2.0_en.pdf).

## 13 Ranglijsten die leerdoelen niet door elkaar halen

Behoud ranglijsten per wereld. Wortelbouw en vergelijkingen hebben verschillende
vragen en puntensystemen; een optelsom geeft geen betrouwbare algemene
wiskunderangorde. Bied als eerste uitbreiding een periodefilter: deze sessie,
deze week, deze maand of een gekozen datumbereik.

Ook **binnen één spel** bestaan historische scoreformules: de bestaande routes
kennen onder meer 500 basispunten plus maximaal 500 tijdpunten, en 1000 plus
maximaal 250. De server beoordeelt Rechten, Vectoren, Algebra en Bewerkingen;
Wortelbouw wordt momenteel met de echte validator in het leerkrachtvenster
nagekeken. Bewaar daarom scorepolicy, validatorversie en beoordelingsbron.
Splits onvergelijkbare regimes of toon ze als afzonderlijke perioden; alleen
hetzelfde spel-ID is geen voldoende garantie van vergelijkbare punten.

De huidige klasranglijst gebruikt de actuele klas uit het profiel. Een
klaswissel kan daardoor historische resultaten anders groeperen. Nieuwe
sessies moeten hun klas- en schooljaarcontext bij deelname vastleggen.
Oudere resultaten zonder dat gegeven krijgen een expliciet kwaliteitslabel;
een historische klas mag niet achteraf worden verzonnen.

Toon ook het aantal battles en nagekeken antwoorden. Een cumulatieve score
beloont immers eveneens vaker deelnemen. Voor een seizoenscompetitie kun je
later een afzonderlijke regel afspreken, bijvoorbeeld een vooraf gekozen aantal
meetellende battles. Verander die regels niet achteraf zonder ze te vermelden.

De standaardranglijst is van de eigen klas. De leerkracht kan de toegestane klas
kiezen. Een publieke competitie wordt een expliciet ingerichte activiteit met
eigen deelnemers en zichtbaarheid; ze is geen kopie van alle leerlingenprofielen.
Fouten, interactietijd, geholpen antwoorden en docentinformatie komen er niet op.

Houd battlepunten, oefen-XP, badges en beheersing in aparte registers. Een
leerkracht die meedoet krijgt een herkenbare demonstratierij en telt niet mee
in de leerlingplaatsen. Simulaties blijven volledig gescheiden van echte resultaten.

## 14 Technische onderdelen die bij elkaar moeten passen

Voorstel voor een klein gedeeld aansluitcontract:

| Onderdeel | Verantwoordelijkheid |
| --- | --- |
| Spelregister | Stabiele ID's, titels, routes, mogelijkheden en versiegegevens |
| Opgaveprovider | Genereren vanuit leerdoel/configuratie/seed en versie |
| Validator | Invoer en tussenstappen beoordelen volgens de inhoudsmotor |
| Werkbordadapter | Opdracht tonen, invoer bewaren, feedback en projectie |
| Printadapter | Op dezelfde opgavegegevens vragen en sleutel renderen |
| Sessieprovider | Deelnemers, hostrol, les/battlefase, deadlines en herstel |
| Voortgangsadapter | Bestaande spelstand en beloningen behouden |
| Activiteitenservice | Accountgebonden gebeurtenissen en tijdsegmenten ontvangen |
| Rapportservice | Bevoegd filteren, samenvatten, rangschikken en exporteren |

Een kleine manifeststructuur kan al aangeven welke verbindingen bestaan.
Vermijd één record met handgeschreven links op de homepage, een andere lijst
voor battles en een derde afwijkende lijst voor de leerkracht. Gebruik adapters
waar historische ID's of opslagformaten anders zijn; herschrijf opgeslagen IDs
niet omdat een zichtbare titel verandert.

De bestaande Supabase-database en GitHub Pages zijn een bruikbare basis. De
browser toont de schermen; serverfuncties beheren toegangsrechten en vertrouwde
beoordeling. Nieuwe analytics horen niet als steeds grotere JSON-lijsten in de
spelstand: de bestaande opslag heeft een groottebegrenzing en revisieconflicten.

Een eenvoudige eigen eventspecificatie is als eerste stap voldoende. Gebruik
de begrippen actor, activiteit, context en resultaat zodat later koppeling met
onderwijsstandaarden mogelijk blijft. Een volledig Learning Record Store of
nieuw extern analyseplatform is voor deze eerste uitbreiding niet noodzakelijk.

Caliper biedt nuttige onderwijsbegrippen voor events. xAPI is eveneens een
mogelijke latere exportgrens; de oude ADL-repository verwijst inmiddels naar
xAPI 2.0. QTI kan later uitwisseling van toetsmateriaal helpen. Kies eerst een
klein intern contract en maak pas een standaardadapter wanneer een school
daadwerkelijk zo'n koppeling nodig heeft.
[1EdTech: Caliper](https://www.1edtech.org/standards/caliper),
[ADL: xAPI-versies](https://github.com/adlnet/xAPI-Spec#specification-versions),
[1EdTech: QTI 3](https://www.imsglobal.org/spec/qti/v3p0/oview/).

## 15 Bouw dit in fasen met een toetsbaar resultaat

| Fase | Werk | Klaar wanneer |
| --- | --- | --- |
| 1 Gemeenschappelijke ingangen | Register, routecontract, menunamen, rollen en mogelijkheden vastleggen | Iedere aangeboden link heeft een juiste heen- en terugweg; niet-ondersteunde modi worden niet beloofd |
| 2 Leerlingactiviteiten | Events en interactietijd in twee trainers, servertoegang, periodefilters | Geen dubbele events, geen accountlek, heldere definities en ontbrekende data blijven herkenbaar |
| 3 Centrale printstudio | A4-kop, configuratie, seeds en adapters voor Rechten/Algebra/Bewerkingen | Dezelfde reeks is reproduceerbaar; PDF en sleutel kloppen; lopend werk en XP blijven intact |
| 4 Leerkrachtwerkbord | Les tonen, host plus deelnemer, samen leren met klas | Echte leerlingen kunnen aansluiten; docentwerk blijft buiten leerlingcijfers en ranglijsten |
| 5 Verbreding en profielen | Overige adapters, historische rapporten, gecontroleerde publieke kaart | Zelfde contract werkt in alle trainers; publieke endpoint bevat uitsluitend gekozen velden |

Mijn aanbevolen eerste analytics-pilot is **Algebrawereld en Getallenwereld**:
die maken het verschil tussen herhaalde XP, unieke voltooiing en opgave-activiteit
goed zichtbaar. Rechtenwereld dient daarnaast als inhoudelijk rijk voorbeeld
voor hulp, verschillende tussenstappen en Samen leren. Begin met één klas en
enkele echte lessessies om de tijdmeting en docentflow te beoordelen.

Maak eerst de metriekdefinities en klasbevoegdheden concreet; voeg dan registratie
toe; bouw vervolgens de filters en grafieken. Anders ontstaat een dashboard
dat preciezer lijkt dan de onderliggende gegevens werkelijk zijn.

## 16 Vaste acceptatievoorwaarden

- Menu open/dicht, herstel en herladen werken op desktop, laag liggend scherm en staande telefoon.
- Elke zichtbare actie heeft een duidelijk label, keyboardfocus en minstens 44 × 44 pixels volgens onze interfaceafspraak.
- Account, volledig scherm en weergavekeuze blijven direct bereikbaar in de uitgeklapte bovenbalk.
- Geen opgave, invoerveld of belangrijke actie verdwijnt onder een herstelknop; een te laag werkbord scrollt in plaats van onbruikbaar te krimpen.
- Geen nieuwe oefening, XP-beloning of gegevensoverdracht ontstaat alleen door menu- of profielnavigatie.
- Nieuw antwoord, herhaald verzoek, herladen, offline herstel en meerdere tabs tellen niet dubbel.
- Een leerling kan geen andere klas aanvragen om privégegevens te lezen; een leerkracht krijgt alleen toegewezen contexten.
- Printvoorbeeld en werkbord gebruiken dezelfde generatorversie; de sleutel wordt inhoudelijk gecontroleerd, niet alleen visueel.
- Docentmeedoen, publieke preview en simulatie hebben expliciete rollen en afzonderlijke resultaatregels.
- Filters, exports en ranglijsten gebruiken dezelfde periode, tijdzone, tellers en noemers.

De ARIA-disclosurevorm beschrijft hoe een aan/uit-knop haar toestand via
`aria-expanded` bekendmaakt. Daarnaast vraagt zichtbare keyboardfocus aandacht
wanneer vaste balken of herstelknoppen boven de inhoud staan. De 44-pixelgrens
is onze expliciete projectafspraak; presenteer die niet als de algemene
WCAG AA-minimumgrens. [W3C disclosurepatroon](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/),
[W3C focus mag niet geheel afgedekt zijn](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).

## 17 Beslissingen om vóór de volgende implementatie vast te leggen

1. Klasruimte als overkoepelende naam zodra echte klassikale lessen beschikbaar zijn.
2. Docentmeedoen naast docentprojectie, met uitsluiting van leerlingranglijsten.
3. Privé als uitgangspunt; welke beperkte elementen eventueel publiek mogen zijn.
4. Hoe klaslidmaatschap en leerkrachttoewijzing worden vastgesteld.
5. De definitie en pilotgrens voor actieve interactietijd.
6. Bewaartermijnen voor ruwe gebeurtenissen en samenvattingen, en mogelijkheden voor verwijderen/exporteren.
7. Eén opgave- en documentcontract als voorwaarde voor het aansluiten van een nieuwe trainer.

Deze keuzes kunnen afzonderlijk worden bijgesteld. Ze zijn geen reden om nu
alle bestaande spellen massaal te vervangen. De aanpassing van Getallenwereld
is een concrete eerste aansluiting; de rest van dit document is de routekaart
voor de volgende ontwikkelfasen.

## 18 Concrete voorbeelden van de voorgestelde contracten

Deze voorbeelden verduidelijken het ontwerp. Ze zijn **geen al ingevoerde API**
en leggen geen fictieve getallen, XP of leerlingresultaten vast.

### Een spel beschrijft zijn mogelijkheden

```json
{
  "gameId": "getallenwereld",
  "progressId": "getallenwereld",
  "engineId": "bewerkingen-core",
  "units": ["machten-product", "wortels-product"],
  "routes": {"solo": "games/getallenwereld/"},
  "capabilities": {
    "solo": true,
    "ownPaperProvider": false,
    "ownClassBattleProvider": false,
    "teacherParticipatesOnline": false
  },
  "relatedProviders": {
    "paper": "bewerkingen-trainer",
    "classBattle": "bewerkingen"
  },
  "progressMetric": {"kind": "completedUnits", "total": 15}
}
```

De werkelijke versie-ID van de motor hoort erbij zodra deze contractlaag wordt
ingevoerd. De lijst `units` hierboven bevat slechts twee voorbeelden. Een
automatische controle verifieert dat routes bestaan, providers bij hun
registratie horen, bevoegdheden aansluiten en elk actief level een leerdoel
heeft. Verwijzingen en eigen ondersteuning blijven zo onderscheidbaar.

### Een resultaat verwijst naar een echte poging

```text
eventId             uniek, idempotent ontvangstbewijs
eventType           answer_graded
actorId             door server aan aangemeld account gebonden
sessionId           concrete ronde of les
attemptId           eigen poging, niet alleen level-ID
exerciseId          concrete vraag binnen de ronde
skillId             inhoudelijk leerdoel
generatorVersion    bron van die vraag
validationSource    trainer | teacher | server
validatorVersion    gebruikte nakijkregel
scorePolicyVersion  alleen waar competitiepunten worden toegekend
occurredAt          waargenomen uitvoeringstijd
receivedAt          serverontvangsttijd
result              correct, hulp en aantal inzendingen
quality             live | offline | legacy_partial
```

Een leerling mag een client-side leerresultaat inzenden binnen een toegestane
trainer, met die herkomst zichtbaar. Competitiepunten komen uit de bevoegde
validator, niet uit een vrij aangeleverde `points`-waarde. Duplicaten met hetzelfde
event-ID en gelijke inhoud krijgen dezelfde ontvangstbevestiging; hetzelfde
ID met afwijkende inhoud wordt geweigerd. Een XP-beloning heeft een eigen
unieke beloningssleutel, zodat retries geen dubbele beloning geven.

### Een rapportquery heeft een afgebakend doel

```text
klas + bevoegde leerling(en)
periode [begin, einde), omgezet vanuit Europe/Brussels
wereld / level / leerdoel / moeilijkheid
vorm solo / duo / groep, doel leren / battle
beoordelingsbron / scorepolicy waar relevant
cursor + begrensde paginagrootte
```

De server controleert eerst de klasbevoegdheid en leest daarna alleen passende
gegevens. Indexen volgen deze concrete queries, bijvoorbeeld actor/tijd,
klas/tijd en sessie/volgorde. Dagtotalen zijn herberekenbaar; ze bevatten hun
meetversie en datadekking. Een CSV-export wordt begrensd en gebruikt dezelfde
query, geen onbeperkte download van alle native spelstanden.
[Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Supabase: indexen](https://supabase.com/docs/guides/database/postgres/indexes).

### Bewaren en verwijderen vormen een eigen werkstroom

Leg vóór de analytics-pilot vast welke ruwe antwoorden nodig zijn, hoe lang,
wie een export krijgt en hoe correctie of verwijdering doorwerkt naar dagtotalen,
ranglijsten en caches. Een beperkte profielkaart is geen tweede ongecontroleerde
kopie van de leerlinghistoriek. Bewaar een verifieerbare verwijderingsstatus
zonder de verwijderde antwoordinhoud opnieuw in een auditlog te stoppen.
De concrete termijnen horen bij het afgesproken schoolbeleid; dit voorstel
kiest geen willekeurige universele termijn.

## 19 Onderzoeksbasis en grenzen

De analyse combineert broninspectie van de gepubliceerde website op commit
`1ce7702eefeaca12353462b3951d3a19ec9af4c8`, de nieuwe Getallenwereld-integratie,
en de hierboven gelinkte officiële bronnen, geraadpleegd op 5 oktober 2026.
Er zijn geen echte leerlinggegevens onderzocht om dit rapport te maken.

De productvoorbeelden laten bruikbare patronen zien, geen bewijs dat hun
volledige systeem voor leraarBob passend is. Er is evenmin een effectonderzoek
uitgevoerd naar XP, competitie of een optimale inactiviteitsgrens. Test die
keuzes met een kleine klas voordat ze als vaste leerindicatoren worden gebruikt.

Aanvullende toegankelijkheidsbronnen ondersteunen de schermtests:
[W3C Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow),
[Orientation](https://www.w3.org/WAI/WCAG22/Understanding/orientation),
[Target Size Enhanced, 44 pixels op AAA-niveau](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced),
[Target Size Minimum, het afzonderlijke AA-criterium](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).

De voorgestelde eerste opleverproef is één doorlopende route: de leerkracht
selecteert een level, maakt er een blad van, toont dezelfde inhoud als les,
doet herkenbaar mee en bekijkt daarna een alias binnen een datumbereik. De
leerling hervat ondertussen een eigen solo-opgave na inklappen en herladen.
Die proef maakt samenhang toetsbaar voordat alle trainers worden aangesloten.
