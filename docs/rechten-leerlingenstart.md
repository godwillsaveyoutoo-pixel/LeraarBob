# Rechten — eerste leerlingversie met de kaart als start

22 september 2026 · branch `feat/rechten-world-prototype` · lokaal te bekijken op
`http://localhost:8765/games/rechten/trainer/`.

## Wat een leerling ziet

De trainer opent standaard op **Kaart**. De hoofdkaart toont vijf onderwerpen;
elke deelkaart bevat de letterlijke leerdoelen uit de
[kaartstructuur](rechten-wereld-leerroute.md). Alle veertien stopplaatsen zijn
verbonden met de bestaande 27 skills. Beschikbare doelen starten echte adaptieve
oefenrondes. Er staan geen fictieve leerlingresultaten op deze schermen.

De navigatie bestaat uit **Kaart · Voortgang · Groep · Profiel**. Tijdens een
lopende ronde zijn ook **Oefenen** en **Uitleg** bereikbaar. Het leerkrachtoverzicht
en de bestaande DEV-ingang blijven beschikbaar voor hun bestaande doelgroep.

| Scherm | Inhoud van deze versie |
| --- | --- |
| Kaart | Eén persoonlijke aanbeveling met reden, hoofdkaart, deelkaarten, start/hervatknop, inspecteerbare voorbereiding en blijvende voltooiingssterren |
| Voortgang | Dezelfde aanbeveling, aantal geoefende stopplaatsen, stevige skills, bestaande vaardigheidsdetails en geplande herhaling |
| Groep | Eigen alias/klas, toegang tot de reeds bestaande samenspeelfunctie indien beschikbaar; geen nieuwe ranglijst voor adaptieve trainer-XP |
| Profiel | Eigen alias, account/toestelopslagstatus, link naar het platformaccount en bestaande instellingen |

## Hoe het spel reageert

| Situatie | Reactie |
| --- | --- |
| Eerste bezoek | Punten lezen en plaatsen wordt aanbevolen; latere doelen blijven bekijkbaar |
| Een ronde staat nog open | **Hervat opdracht** krijgt voorrang; de gekozen opgave en deelantwoorden blijven staan. De kaart toont hoeveel van de 12 opgaven beantwoord zijn |
| Je wilt een testronde verlaten | **Kaart → Ronde stoppen en opnieuw kiezen** beëindigt de ronde. Behaalde XP, resultaten, toegang en herhaling blijven bewaard; de onafgewerkte opgave vervalt. Een afgebroken ronde krijgt geen voltooiingsster of rondebonus |
| Herhaling | Komt automatisch mee in de gewone leerroute; er is geen aparte ingang voor gemengd herhalen |
| Onderwerptoets | Eigen eindpunt op de deelkaart **Punten en helling**. Selecteren toont uitleg, voorbereiding en zelfstandig bewijs; pas de hoofdknop start de toets. Ontbreekt voorbereiding, dan leidt die knop naar een benodigd leerdoel |
| Een volgende vaardigheid is beschikbaar | De kaart benoemt die concrete vaardigheid, ook binnen dezelfde stopplaats; geplande herhaling komt mee |
| Alleen herstel of onderhoud is nodig | Start een nieuwe ronde met gerichte herhaling en andere opgaven; eerdere rondes blijven afgerond |
| Alle beschikbare doelen zijn voorbereid | Aanbeveling voor onderhoud met nieuwe varianten bij eerder geoefende inhoud |
| Een ronde is afgerond | Ster bij de bezochte stopplaats, aantal zelfstandig gelukt, eventueel nieuwe toegang en een volgende stap |
| Een fout na eerdere voltooiing | Ster blijft; de actuele leerstatus kan ‘Opnieuw oefenen’ worden |
| Een antwoord is juist | Korte bevestiging (650 ms), daarna automatisch de volgende vraag; geen extra Verder-knop |
| Een enkelvoudige vraag is fout | Diagnose blijft staan; **Verder** opent de volgende vraag. De bestaande planner plant herhaling met nieuwe varianten |
| Een deelstap in een langere opgave is fout | Diagnose blijft staan; **Verder** hervat die stap. Eerdere juiste deelstappen blijven behouden, bijvoorbeeld a bij een fout in b |

Eerder opgeslagen gemengde herhaalrondes kunnen nog worden hervat of gestopt.
De aparte startknop en de losse activiteitenbalk onder de kaart zijn verwijderd.
Alleen de bestaande toets voor Punten en helling wordt aangeboden.

De antwoordflow geldt standaard, zowel vanuit de kaart als in gewone training. Het gaat om
het daadwerkelijk gegeven antwoord: juist na hulp gaat ook automatisch verder,
maar telt nog steeds niet als zelfstandig beheerst. Foute puntplaatsing en
richtingskeuze worden eenmaal geregistreerd, zonder een voltooide constructie
of zelfstandige beheersing te claimen. Bij langere berekeningen wordt de opgave
zoals voorheen eenmaal bij voltooiing geregistreerd; fouten plannen dan herstel.

Kaart, uitleg, DEV en een verborgen browsertab pauzeren de automatische overgang.
Bij terugkeer is de bevestiging opnieuw kort zichtbaar. Herladen bewaart de
antwoordstatus en telt de poging niet opnieuw. Introducties houden **Probeer**;
na de laatste vraag volgt het rondeoverzicht. DEV houdt handmatige varianten.

De aanbeveling geeft beschikbare nieuwe introducties en verdere opbouw zonder open
herstel voorrang op het opnieuw aanwijzen van een oud herhaaldoel. De concrete
vaardigheid staat in beeld, niet alleen de naam van de stopplaats. **Start volgende
ronde** begint een nieuwe reeks; de vorige ronde wordt niet opnieuw geopend.
Dezelfde voorkeur geldt voor de eerste focusopgave van de ronde. Gereserveerde
herhaalmomenten blijven eerdere vragen bedienen. Prerequisites worden niet versoepeld.

Een **ster** betekent een afgeronde ronde. **Stevig** komt uitsluitend uit de
bestaande `skillPhase`, inclusief variantdekking en later zelfstandig bewijs waar
de skill dit vereist. Een afgeronde stopplaats is dus geen diploma voor alle
onderliggende skills. Historische oefening wordt niet achteraf omgezet in
verzonnen kaartbezoeken of sterren.

De hoofdkaart toont hoeveel stopplaatsen een afgeronde ronde hebben. Een gemengde
herhaalronde geeft geen voltooiingsster aan een willekeurige geselecteerde plek.
De eerste onderwerptoets blijft beperkt tot Punten en helling, met het reeds
geteste dekkingsplan voor vijf doelen. Andere onderwerpen hebben echte oefenrondes,
maar nog geen nieuw geïmplementeerde onderwerptoets.

## Behoud van gegevens

De bestaande elf historische skill-IDs, overige skill-IDs, prerequisites, toegang,
generators en scores veranderen niet. `rewrite_linear_equation` blokkeert b uit
a en een punt niet. De trainer blijft eigenaar van XP en beheersing.

`state.journey.version` blijft 1. Bestaande `tower`, `trail`, `bridge`, bezoeken,
proefbewijzen en actieve concepten blijven behouden. Nieuwe optionele velden:
`region`, `view`, `active.accessBefore`, en bij `last` de nieuw beschikbare skills,
zelfstandig gelukte skills en skills die nog ondersteuning vroegen. Oude actieve
rondes zonder `accessBefore` krijgen geen verzonnen lijst nieuwe unlocks.

Het account- en opslagcontract blijft ongewijzigd: geen nieuwe tabellen, RPC's,
registratieprocedure of database-installatie voor deze kaartlaag. Tests gebruiken
uitsluitend fictieve accounts en een nagebootste server.

## Ondersteunde schermen

De eerste klasversie richt zich op laptops en Chromebooks. De kaart en secundaire
schermen kunnen scrollen; inhoud verdwijnt niet onder de onderrand. Geteste
formaten: 1366×768, 1100×700, 1024×768, 780×360, 640×360 en 390×844.

Wiskundige werkvlakken behouden de bestaande eis: liggend vanaf 640×360. Op een
smalle telefoon kan de leerling de kaart, voortgang, groep en profiel bekijken;
voor de oefening verschijnt de bestaande melding om het toestel te draaien.

## Validatie en publicatie

- 105 unit-/regressietests slagen, waaronder generators, migratie, toegang,
  aanbevelingen, herhaling, behoud van sterren en alle veertien stopplaatsen.
- `rechten-shell-browser.cjs`: echte kaartklikken, alle vijf deelkaarten, vier
  navigatieschermen, behoud van een lopende opgave, een echte contextopgave,
  veilige aliasweergave en zes schermformaten.
- De vier Wave-browsersuites slagen, inclusief 6.600 legacy-generatoropgaven,
  deelstapdiagnose, migratie en begrensde opslag. Het leerkrachtoverzicht slaagt.
- `rechten-journey-browser.cjs`: echte ronde, einduitdaging, hulp, herkansen,
  touchbediening, herladen, conceptantwoorden, score eenmaal en accountwisseling.

Deze branch is nog geen bewijs dat de online leerlinglink de nieuwe versie toont.
Voor klassengebruik moet de geteste branch worden gepubliceerd en de uiteindelijke
leerlinglink met een testleerlingaccount worden gecontroleerd op aanmelden,
antwoord bewaren en hervatten. Er zijn geen echte leerlinggegevens ingezien.

Nog uit te bouwen na deze eerste versie: onderwerptoetsen voor de overige vier
onderwerpen, een eerlijk vergelijkbare ranglijst, gezamenlijke leerdoelen en
meer onderscheid tussen de getekende landschappen. De herkenbaarheid van de
labels, de aanbeveling en het verschil tussen ster en beheersing moet nog met
leerlingen worden beoordeeld.

## Correctie: na afronden leek dezelfde ronde verplicht terug te komen

De eerdere aanbeveling koos altijd eerst een verschuldigde herhaalvraag. Bij een
stopplaats met meerdere skills kon dat de volgende beschikbare vaardigheid aan
het zicht onttrekken. ‘Oefen opnieuw’ maakte bovendien niet duidelijk dat de knop
een nieuwe ronde begon. De kaart noemt nu de concrete vaardigheid, het volgende
rondenummer en de aparte actie **Start volgende ronde**. Na afronden wordt de
aanbevolen stopplaats geselecteerd. De status **Herhaling gepland** betekent
niet dat de vorige ronde mislukt of onvoltooid is.

Een browserregressie begint bij een fictieve 10/12-ronde, met open herstel voor
punten lezen en reeds beschikbare oefening in punten plaatsen. Ze controleert
een nieuwe ronde vanaf nul, gelijkblijvende XP bij starten, behoud van de ster,
werkelijke puntplaatsingsopgaven, ingeplande eerdere herstelvragen en vervolgens
toegang tot Verschillen en helling. Accountgegevens worden niet gereset.

## Afwerking: indeling, hoofdactie en voortgangsreacties

De kaart staat direct onder de compacte titel. De aanbevolen of geselecteerde
activiteit staat in één detailpaneel rechts. Per kaartscherm is er precies één
primaire knop: de eerste/volgende ronde starten, een open opgave hervatten of
teruggaan naar een beschikbare stap. Op de deelkaart start die knop de gekozen
stopplaats; tijdens een open ronde hervat ze altijd de bestaande opgave.
Gemengd herhalen, toetsen en terugnavigatie blijven secundaire acties.

Vaardigheidsdetails en het laatste rondresultaat zijn uitklapbaar. Een ster staat
als klein teken bij de locatie, naast een afzonderlijke leerstatus. Nieuwe toegang
heeft een zichtbaar label en een korte highlight. De ster verschijnt met een korte
animatie, eenmaal per nieuw resultaat en kaartweergave in deze sessie. Selecteren
speelt dezelfde reactie niet telkens opnieuw af. De visuele administratie is
alleen tijdelijk in het scherm aanwezig en verandert geen opgeslagen voortgang.
Bij verminderde beweging blijven alle tekens en labels staan zonder animatie.

Het afrondingsscherm zet resultaat en vervolg bovenaan; XP is een kleinere
vermelding. De kaart en hoofdactie passen op 1366×768, 1100×700 en 1024×768 zonder
scrollen in beeld. Smalle schermen mogen blijven scrollen. De browserregressie
controleert één primaire actie, de plaats van de kaart, de zichtbaarheid van de
startknop, behoud van werk bij andere selecties en de voortgangsreacties.
