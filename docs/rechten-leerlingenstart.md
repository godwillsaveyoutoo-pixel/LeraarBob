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
| Een ronde staat nog open | **Hervat opdracht** krijgt voorrang; de gekozen opgave en deelantwoorden blijven staan |
| Herstel of herhaling is aan de beurt | De kaart wijst naar het bijbehorende leerdoel en legt de herhaalreden uit |
| Geen verschuldigde herhaling | Eerste beschikbare doel dat nog voorbereiding vraagt, volgens de bestaande skillvolgorde |
| Alle beschikbare doelen zijn voorbereid | Aanbeveling voor onderhoud met nieuwe varianten bij eerder geoefende inhoud |
| Een ronde is afgerond | Ster bij de bezochte stopplaats, aantal zelfstandig gelukt, eventueel nieuwe toegang en een volgende stap |
| Een fout na eerdere voltooiing | Ster blijft; de actuele leerstatus kan ‘Opnieuw oefenen’ worden |
| Een deelstap is fout | De bestaande diagnostiek blijft gelden; bijvoorbeeld een correcte a behouden als alleen b fout is |

De prioriteit voor herstel is een ontwerpkeuze voor deze eerste versie. De
voorkeur beïnvloedt de ronde, maar bestaande introductie-, herstel- en
herhaalregels blijven leidend. Herhaling uit andere deelkaarten blijft terugkomen.

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

- 104 unit-/regressietests slagen, waaronder generators, migratie, toegang,
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
