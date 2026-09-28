# Onderzoek en ontwerpbrief — makeover van de leerreis

## Kernbesluit

De kaart moet een **route met een huidige positie** worden, geen verzameling onderwerpknoppen op een decoratieve achtergrond. De leerling moet binnen enkele seconden vier dingen kunnen beantwoorden:

1. Waar ben ik nu?
2. Wat heb ik al afgelegd?
3. Wat is mijn volgende stop?
4. Welke oude stop vraagt opnieuw aandacht?

De beste richting voor deze trainer is een hybride van:

- de duidelijke, begeleide route van Duolingo;
- de afzonderlijke beheersingsniveaus van Khan Academy;
- een eigen, rustige leraarBob-stijl waarin de inhoud belangrijker blijft dan beloningen.

Een nieuwe illustratie alleen lost het probleem niet op. Route, stopplaatsen en statussen moeten eerst één visuele grammatica krijgen.

## Wat het online onderzoek leert

### Eén duidelijke route verlaagt twijfel

Duolingo verving zijn vrije vaardighedenboom door een geleid pad omdat leerlingen niet altijd wisten wat de beste volgende stap was. De route mengt nieuwe inhoud en herhaling, verdeelt inhoud in kleinere eenheden en bewaart eerder behaalde voortgang. Nieuwere mini-units zijn korter gemaakt omdat lange units repetitief en abstract aanvoelden; het afronden van een kleiner knooppunt voelt vaker bevredigend.

Vertaling naar leraarBob: laat de kaart één hoofdroute tonen en bouw herhaling in als een terugkerende stop op die route. De leerling mag oude plaatsen bezoeken, maar de aanbevolen volgende beweging moet ondubbelzinnig blijven.

Bronnen:

- [The Science Behind Duolingo's Home Screen Redesign](https://blog.duolingo.com/new-duolingo-home-screen-design/)
- [Duolingo’s New Mini-Units](https://blog.duolingo.com/intermediate-mini-units/)

### Afgerond en beheerst zijn verschillende dingen

Khan Academy maakt expliciet onderscheid tussen niet gestart, geprobeerd, vertrouwd, vaardig en beheerst. Een activiteit uitvoeren is dus niet hetzelfde als de vaardigheid stevig beheersen. Hun huidige koersniveau is gekoppeld aan vaardigheden die minstens het niveau proficient bereiken.

Vertaling naar leraarBob: een ronde afronden krijgt een permanent voltooiingssymbool. Goed en later opnieuw zelfstandig presteren krijgt een sterker beheersingssymbool. Een geplande herhaling overschrijft die prestatie niet, maar voegt een aparte status toe.

Bronnen:

- [How Khan Academy's Mastery levels work](https://support.khanacademy.org/hc/en-us/articles/5548760867853--How-do-Khan-Academy-s-Mastery-levels-work)
- [Why Khan Academy uses skills to proficient](https://blog.khanacademy.org/why-khan-academy-will-be-using-skills-to-proficient-to-measure-learning-outcomes/)

### Voortgang moet van buiten een module zichtbaar zijn

Gebruikersonderzoek van het Britse Department for Education leidde tot een voortgangsindicator op de modulekaart zelf. De gebruiker hoeft de module daardoor niet eerst te openen om te weten hoever die staat. Richtlijnen voor stapindicatoren benadrukken daarnaast een duidelijk verschil tussen voltooid, huidig en toekomstig, plus tekst zoals “stap 2 van 5”.

Vertaling naar leraarBob: hoofdstukken en haltes tonen hun voortgang rechtstreeks op de kaart. De detailkolom is uitleg, niet de enige plaats waar de status leesbaar is.

Bronnen:

- [DfE design history: features to support the user journey](https://design-histories.education.gov.uk/early-years-child-development-training/new-features-to-support-the-user-journey-within-the-training)
- [Utah Design System: Step Indicators](https://designsystem.utah.gov/library/components/widgetsIndicators/stepIndicators)

### Een kaart heeft een echte locatieaanwijzer nodig

Onderzoek naar leeromgevingen en locatiegames benoemt drie terugkerende voorwaarden: de leerling herkent de huidige locatie, ziet de volgende actie en begrijpt hoe een voltooide opdracht bijdraagt aan de route. In usabilityonderzoek rond museumgames was het niet markeren van voltooide missies op de kaart een expliciet probleem.

Vertaling naar leraarBob: een vaste “Jij bent hier”-markering hoort op de route. De kaart moet na terugkeer automatisch bij die plek openen en een knop “Terug naar mijn plek” aanbieden wanneer de leerling weg navigeert.

Bronnen:

- [VLEPIC: interaction design for a gamified learning environment](https://www.mdpi.com/2673-6470/6/3/56)
- [Co-designing location-based games for museums](https://www.mdpi.com/2414-4088/6/5/36)

### Kleur mag de toestand versterken, maar niet alleen dragen

WCAG schrijft voor dat kleur niet het enige middel mag zijn om informatie of toestand over te brengen. Een verandering van kleur moet worden aangevuld met vorm, icoon of tekst.

Vertaling naar leraarBob: “afgerond”, “stevig”, “huidig” en “herhalen” krijgen elk een eigen vorm en symbool, met een korte tekst in de detailweergave en een toegankelijke naam.

Bron:

- [W3C: Understanding Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color)

## Diagnose van de huidige kaart

De huidige hoofdkaart bezit al bruikbare inhoud en toestand, maar de presentatie verbergt de reis:

- De lijnen in het landschap zijn decoratief. Ze verbinden de vijf hoofdstukken niet tot één leesbare route.
- Alle hoofdstukken gebruiken vrijwel hetzelfde huisje. Daardoor zijn het geen herkenbare landmarks.
- De huidige plek is alleen af te leiden uit een groene rand en “Volgende stap”. Er staat geen reiziger of positieaanduiding op de route.
- De belangrijke toestanden staan als kleine tekst onder identieke knoppen. Op afstand lijken “Later”, “Beschikbaar”, “Stevig” en “Herhaling” te veel op elkaar.
- Een afgeronde ronde verschijnt als een kleine ster op de hoek van een icoon. Dat is te subtiel voor een belangrijke prestatie.
- De route achter de leerling verandert niet zichtbaar. Daardoor voelt voltooiing niet als vooruitreizen.
- De vijf hoofdstukken staan ruim verspreid, maar de blik krijgt geen vaste leesrichting van hoofdstuk 1 naar hoofdstuk 5.
- Op de deelkaarten zijn plaatsen inhoudelijk belangrijker, maar ze gebruiken dezelfde generieke visuele taal als de hoofdstukken.

Technisch is de basis gunstig. `journey-core.js` levert al de belangrijkste toestanden: beschikbaar, bezocht, stevig, herhaling gepland, actieve ronde en aanbevolen volgende stap. De makeover kan daarom grotendeels in `journey-ui.js` en `journey.css` gebeuren. Alleen voor een gedeeltelijke voortgangsring per stop is mogelijk een kleine, afgeleide UI-waarde nodig.

## Voorgesteld concept: één weg, twee zoomniveaus

### Hoofdkaart: vijf hoofdstukken als grote etappes

De hoofdkaart toont één doorlopende weg van hoofdstuk 1 tot hoofdstuk 5. Elk hoofdstuk is een groot, eigen landmark. De weg kent drie visuele segmenten:

- **Afgelegd:** volle, duidelijke lijn met kleine routepunten.
- **Nu:** een reizigersmarker op de huidige etappe en een korte actieve gloed rond de volgende stop.
- **Straks:** lichtere of gestippelde lijn, zichtbaar maar duidelijk toekomstig.

De vijf hoofdstukken krijgen verschillende silhouetten die inhoudelijk passen:

| Hoofdstuk | Landmark | Visuele associatie |
|---|---|---|
| Punten en helling | uitkijktoren | positie, hoogte, richting |
| Eigenschappen van rechten | brug of wegwijzer | stijgen, dalen, soorten rechten |
| Tabellen en grafieken | meetstation | gegevens lezen en tekenen |
| Nulwaarden en tekens | bergpas met vlag | grens, omslagpunt, controle |
| Voorschriften opstellen | eindstation of werkplaats | alles samenbrengen |

De hoofdstuktitel staat naast het landmark. Onder de titel staat slechts één compacte regel, bijvoorbeeld `2 van 3 haltes afgerond`. Details zoals vereisten en leerdoelen blijven in het zijpaneel.

### Deelkaart: echte stopplaatsen binnen een etappe

Na het openen van een hoofdstuk zoomt de kaart in op een korter stuk van dezelfde weg. De bestaande leerdoelen worden afzonderlijke haltes. De leerling ziet:

- de halte waar die vandaan komt;
- de huidige halte;
- de eerstvolgende halte;
- een eventueel herhalingslusje naar een eerder bezochte halte;
- de onderwerptoets als duidelijk eindpunt, wanneer die beschikbaar is.

Hier mag de route speelser kronkelen. Elke halte houdt wel dezelfde toestandstaal als op de hoofdkaart.

## Visuele grammatica van een stopplaats

De kaart heeft één component nodig met vaste anatomie: landmark, statusring, toestandssymbool, titel en korte voortgang. Dezelfde component wordt groter gebruikt op de hoofdkaart en kleiner op de deelkaart.

| Toestand | Vorm op de kaart | Betekenis |
|---|---|---|
| Nog niet beschikbaar | silhouet, onderbroken rand, klein slot | deze stop komt later |
| Beschikbaar | lege volle ring | hier kan de leerling starten |
| Huidige stop | reizigersmarker plus dikke dubbele ring | hier bevindt de leerling zich |
| Ronde bezig | gedeeltelijke ring met `5/12` | opdracht is gestart en bewaard |
| Ronde afgerond | dichtgestempelde cirkel met vink | deze stop is bezocht en afgerond |
| Stevig beheerst | afgerond plus gouden ster in het landmark | de vaardigheden zijn voldoende bewezen |
| Herhaling klaar | kleine lus-pijl naast de bestaande prestatie | kennis vraagt onderhoud; prestatie blijft zichtbaar |
| Aanbevolen volgende stop | korte bewegende pijl op het volgende wegsegment | dit is de logische volgende actie |

“Geselecteerd” is geen leerstatus. Het krijgt alleen een tijdelijke focusrand; “huidige stop” blijft zichtbaar wanneer een andere stop wordt bekeken.

## Informatiehiërarchie

Boven de kaart komt één compacte routekop:

`Hoofdstuk 2 van 5  ·  stop 1 van 2  ·  7 stopplaatsen afgerond`

Op de kaart zelf staan alleen:

- hoofdstuk- of haltetitel;
- huidige positie;
- voltooiings- of beheersingssymbool;
- een korte voortgang zoals `1/3` of `5/12`.

Het detailpaneel toont:

- wat de leerling hier leert;
- waarom deze stop wordt aanbevolen;
- welke vaardigheden erin zitten;
- de betekenis van de huidige status;
- één duidelijke hoofdactie.

De legenda onderaan verdwijnt uit de permanente kaart. Statussen moeten zonder legenda herkenbaar zijn. Een link `Wat betekenen de symbolen?` kan een compacte uitleg openen.

## Reismomenten

### Bij het openen

De kaart centreert of focust op de huidige stop. De reizigersmarker staat al klaar. Het volgende wegsegment is duidelijker dan alle overige toekomstsegmenten.

### Na een afgeronde ronde

1. De zojuist voltooide stop krijgt een stempel of vink.
2. Het afgelegde wegsegment vult zich richting de volgende stop.
3. De reizigersmarker verplaatst naar de nieuwe positie.
4. Een korte kaartmelding zegt wat is bereikt en wat nu beschikbaar is.

De animatie duurt kort en kan worden overgeslagen. Bij `prefers-reduced-motion` veranderen de toestanden onmiddellijk.

### Wanneer beheersing groeit

De voltooiingsvink blijft staan en een ster verschijnt erbij. Daardoor is zichtbaar dat “gedaan” en “goed beheerst” twee verschillende prestaties zijn.

### Wanneer herhaling nodig is

De stop verliest zijn vink of ster niet. Een luspijl verschijnt naast de stop en een zijpad of routepijl wijst tijdelijk terug. Herhaling voelt daardoor als een volgende reisopdracht, niet als teruggezet worden.

## Stijlrichting

De kaart mag rijker worden zonder op een drukke mobiele game te lijken:

- warme, geschilderde kaartvlakken met duidelijke voorgrond-achtergrondlagen;
- één accentkleur per hoofdstuk, binnen een gezamenlijke gedempte kaartpalet;
- landmarks met herkenbare silhouetten en iets meer volume dan de huidige lijniconen;
- een stevige, contrastrijke route die boven het landschap ligt;
- tekst op rustige labels of vaandels, nooit rechtstreeks over drukke illustratie;
- kleine natuurlijke details langs de route, maar geen decoratie die met stopplaatsen kan worden verward;
- subtiele micro-animaties voor huidige positie en nieuw geopende stop.

Het landschap ondersteunt de route. Het mag de route nooit kruisen op een manier waardoor een rivier, heuvelrand of decoratieve lijn voor het leerpad wordt aangezien.

## Responsief gedrag

### Desktop en laptop

De hoofdkaart toont de vijf hoofdstukken als één brede, slingerende weg. Het detailpaneel staat rechts of opent als compacte kaartlaag. De huidige positie blijft in het eerste zichtbare scherm.

### Kleine liggende schermen

Toon drie etappes rond de huidige positie: vorige, huidige en volgende. Links en rechts navigeren verplaatst de kaart. De detailkaart mag als onderpaneel openen.

### Staande telefoon

Gebruik een verticale route. Dat voorkomt kleine, dicht opeengepakte stopplaatsen. Een zwevende knop `Naar mijn plek` verschijnt zodra de huidige stop buiten beeld is, vergelijkbaar met het terugkeermechanisme dat Duolingo voor lange paden beschrijft.

## Wat we bewust vermijden

- Geen vijf losse kaarten of cards die alleen netjes in een raster staan; dan verdwijnt het reisgevoel opnieuw.
- Geen percentuele mastery op elke stop. Exacte percentages suggereren meer meetprecisie dan de leerling nodig heeft.
- Geen status die alleen door groen, goud of grijs wordt aangegeven.
- Geen grote hoeveelheid badges, munten en confetti. De beloning is zichtbaar vooruitreizen en een blijvende prestatie op de kaart.
- Geen verborgen aanbevolen stap in alleen het detailpaneel.
- Geen automatische verplaatsing waardoor de leerling niet meer begrijpt waarom een stop afgerond of geopend is.

## Aanpak in vier fasen

### 1. Route en toestanden als grijs prototype

Bouw eerst de weg, echte stopplaatsen, de reizigersmarker en alle statussen zonder uitgewerkte illustraties. Test of leerlingen binnen vijf seconden hun plaats en volgende stap vinden.

### 2. Hoofdkaart en deelkaart verenigen

Gebruik dezelfde routecomponent, statuscomponent en animatielogica op beide zoomniveaus. Behoud de bestaande `journey-core`-toestanden en opgeslagen voortgang.

### 3. Visuele wereld uitwerken

Ontwerp vijf unieke landmarks, terrein per hoofdstuk en een eigen reizigersmarker. Pas dit toe nadat route en status zonder decoratie al begrijpelijk zijn.

### 4. Reismomenten en toegankelijkheid

Voeg voortgangsanimatie, kaartmelding, focusgedrag, schermlezerteksten, voldoende contrast en reduced-motion toe. Controleer muis, touch en toetsenbord op alle bestaande schermmaten.

## Te testen met leerlingen

Een korte gebruikerstest met vijf tot acht leerlingen kan al veel problemen zichtbaar maken. Geef geen uitleg vooraf en vraag:

1. “Waar ben je nu?”
2. “Wat heb je al gedaan?”
3. “Wat heb je echt goed onder de knie?”
4. “Waar moet je nu naartoe?”
5. “Welke plaats vraagt herhaling?”
6. “Start de volgende oefenronde.”
7. “Ga terug naar een oude stop en kom daarna terug naar je huidige plek.”

Acceptatiecriteria:

- minstens 80% vindt de huidige positie en volgende stap binnen vijf seconden;
- minstens 80% onderscheidt afgerond, stevig en herhaling zonder de legenda te openen;
- alle leerlingen kunnen de volgende ronde met één duidelijke hoofdactie starten;
- niemand interpreteert een decoratieve lijn als de route;
- een oude stop bekijken verandert de zichtbare huidige positie niet;
- toetsenbord- en schermlezergebruikers krijgen dezelfde statusinformatie;
- bestaande voortgang, sterren en actieve rondes blijven na de makeover behouden.

## Aanbevolen eerste ontwerp

Maak één high-fidelity prototype van de hoofdkaart in drie toestanden:

1. nieuwe leerling bij hoofdstuk 1;
2. leerling halverwege met enkele afgeronde en stevige haltes;
3. terugkerende leerling met een actieve ronde en een geplande herhaling.

Werk daarna één deelkaart uit met drie haltes en een onderwerptoets. Daarmee kunnen route, statusgrammatica en responsief gedrag worden beoordeeld voordat alle illustraties en hoofdstukken worden geproduceerd.
