# Rechtenreis — gebieden, stopplaatsen en een doorlopende leerweg

Ontwerpvoorstel op basis van de huidige 27 skills en `chooseTask`, `sessionPhase`, `scheduleRepair`, `progressRepair` en `scheduleRefresh` in de Rechtentrainer. Dit document verandert de scheduler, prerequisites, scores of prototypekaart niet.

De eerste beperkte implementatie staat beschreven in [Kaartvallei — echte reisetappe](rechten-kaartvallei-etappe.md). De overige gebieden hieronder blijven een voorstel.

## Kernbesluit

Een gebied geeft een nieuw begrip een herkenbare thuisplek. Een stopplaats biedt terugkerende gebeurtenissen en kan meerdere samenhangende vaardigheden gebruiken. De bestaande leerengine blijft vragen kiezen over de grenzen van gebieden heen. Bezoek, voltooiing en huidige beheersing zijn afzonderlijke dingen.

Voorstel: vijf gebieden, dertien inhoudelijke stopplaatsen. Per gebied staan slechts twee of drie belangrijke plaatsen op de kaart. Herhaling verschijnt vooral binnen missies en onderweg; een kamp biedt daarnaast bewust gemengd oefenen. Geen route van 27 losse afvinkpunten.

## Concrete verdeling van alle huidige skills

| Gebied | Stopplaats | Eerste kennismaking / eigen leerdoelen | Wat later terugkeert |
| --- | --- | --- | --- |
| 1. De kaartvallei | Uitkijktoren en kamp | `point`, `point_plot` | Punten lezen/plaatsen bij tabellen, grafieken en reconstructie |
| 1. De kaartvallei | Meetpad | `delta`, `slope` | Verschillen in beide richtingen; gehele, negatieve en fractionele hellingen |
| 1. De kaartvallei | Verbindingsbrug | `slope_from_two_points` | Helling bepalen bij nieuwe datasets en grafieken |
| 2. Het landschap | Wegenpost | `line_behavior`, `special_lines` | Stijgen/dalen/constant, verticaal en identieke punten als verschillende situaties |
| 2. Het landschap | Peilstation | `intercept`, `ab` | a en b herkennen vóór en na zelfstandige modelbouw |
| 3. De werkplaats | Ontwerptafel | `equation_from_ab`, `graph_from_equation` | Formule ↔ grafiek; alternatieve geldige punten kiezen |
| 3. De werkplaats | Constructiehuis | `intercept_from_point`, `equation_from_point_slope`, `equation_from_two_points` | Gegevens reconstrueren; juiste deelstappen behouden bij herstel |
| 3. De werkplaats | Weegschaal | `rewrite_linear_equation` | Een andere vergelijking als hetzelfde model herkennen; voorbereiding op onbekende x |
| 4. De handelsplaats | Rekenbalie | `fx`, `table`, `input_from_output` | Vooruit en achteruit rekenen, tabelwaarden en contextcontroles |
| 4. De handelsplaats | Kaartbureau | `point_on_line`, `graph_from_table`, `equation_from_graph`, `equation_from_table` | Tussen representaties wisselen; ook de derde rij controleren |
| 4. De handelsplaats | Markt | `equation_from_context` | Startwaarde, verandering, eenheden en domein betekenis geven |
| 5. Het grensgebied | Nulpunt | `zeroRead`, `zero` | Waar bereikt een model nul? Koppeling met formule, grafiek en onbekende x |
| 5. Het grensgebied | Grenspost | `sign`, `signchart` | Waar is de uitvoer positief/negatief? Verband leggen met nulwaarde en helling |

Dit is een groepering van inhoud, geen nieuwe verplichte volgorde. Gebieden kunnen tegelijk toegankelijk zijn. De goedgekeurde conceptuele keten en voorschriftketen blijven leidend voor introducties. De bestaande prerequisites bepalen welke gebeurtenis een leerling kan krijgen. Zo kan de Rekenbalie beschikbaar worden zodra `fx` toegankelijk is, zonder eerst elk gebouw in de Werkplaats af te werken. Herleiden blijft een aparte route en blokkeert b uit een punt niet.

Het Kaartbureau heeft meerdere soorten afspraken: een punt controleren is een korte gebeurtenis; een voorschrift uit een onregelmatige tabel reconstrueren is een langere opdracht. Die horen niet allemaal in één verplicht bezoek.

`information_sufficiency` is nog niet geïmplementeerd. Later kan die als niet-blokkerende onderzoeksmissie op verschillende plekken opduiken. Zelfstandiger nulwaarden/tekenschema's en hun constante randgevallen blijven eveneens op de inhoudelijke afrondingslijst; deze kaart claimt die uitbreiding niet al te leveren.

## Gebeurtenissen met verschillende functies

| Type | Zichtbare vorm | Leerfunctie | Verplicht? |
| --- | --- | --- | --- |
| Ontdekking | Een nieuwe plek of nieuw gereedschap | Eén nieuwe vaardigheid met uitleg en begeleide eerste toepassing | Benodigde voorbereiding moet worden aangetoond; exact deze plek bezoeken hoeft niet als dat al elders gebeurde |
| Opdracht | Een persoon, bouwplan of onderzoek | Nieuw werk verbinden met reeds gekende vaardigheden | De leerengine biedt een passende opdracht; soms zijn twee gelijkwaardige keuzes mogelijk |
| Ontmoeting onderweg | Kleine gebeurtenis op een verbinding of in de huidige missie | Korte herhaling of gerichte herstelvraag uit een vorig gebied | Kan deel van de aanbevolen route zijn; overslaan wist de herhaalbehoefte niet |
| Kamp | Een terugkerend vast symbool | Bewust een gemengde oefenreeks starten of hervatten | Extra ingang; noodzakelijke herhaling hangt niet af van vrijwillig kampbezoek |
| Zijpad | Een briefje of zijtak | Extra variant, verdieping of andere representatie | Optioneel; noodzakelijke basiskennis krijgt ook een ingang op de hoofdroute |
| Werelduitdaging | Een project of oversteek met meerdere opdrachten | Zelfstandig verbinden en toepassen van inhoud uit meerdere gebieden | Een mijlpaal; bestaande toegang verdwijnt niet bij een minder goede poging |

Een plaats is persistent; de actuele gebeurtenis verandert. Bij het eerste brugbezoek bepaalt de leerling een helling. Later verschijnt daar een negatieve helling, een breuk, een andere schaal of een toepassing met twee gegevens. Een specifieke afgeronde gebeurtenis krijgt een bewijs, zonder te suggereren dat het begrip nooit meer terugkomt.

## De bestaande sessie als reisetappe

De trainer gebruikt momenteel twaalf primaire opgaven per ronde. Een gewone ronde heeft drie opwarmmomenten, twee leergrensmomenten, focus, toepassing, twee gemengde momenten, herstel en twee uitdagingen. Gerichte herstelvragen kunnen op verschillende geschikte momenten tussendoor komen. Iedere vierde ronde is een checkpoint.

Die etappe kan op de kaart als een kleine reis worden getoond. De speler kiest een bestemming en ziet een concreet doel; de leerengine vult de route onderweg. Niet na ieder antwoord verplicht terug naar de grote kaart. Een korte voortgangslijn in de missie en terugkeer op betekenisvolle tussenpunten voorkomt navigatiewerk.

Een gewenste verdeling bij een bezoek aan het Kaartbureau kan bijvoorbeeld zijn: twee eerdere basisvragen, vier opgaven rond het actuele doel, twee representatievarianten, twee geplande herhaal/herstelvragen en twee verbindende uitdagingen. Dit is een illustratief evenwicht, geen extra hard script boven op het bestaande script. Bij veel herstelbehoefte komt minder nieuwe inhoud aan bod. Bij een nieuwe leerling is nog geen uitgebreide oude inhoud beschikbaar.

Meerstappenconstructies tellen nu net als korte herkenningsvragen als één primaire opgave, maar duren langer. Behoud eerst de bestaande twaalf-opgavenadministratie en maak een etappe tussentijds hervatbaar. Beslis pas na gebruikstests of een tijd-/werklastbudget beter past; maak niet onbedoeld twaalf lange reconstructies tot één verplichte speelsessie.

## Voorbeeld van verweven leren

De leerling bezoekt de Markt voor een tariefmodel:

1. Een eerdere puntvraag helpt een gegeven situatie als coördinatenpaar lezen.
2. De huidige opdracht koppelt startbedrag en verandering aan b en a.
3. De leerling bouwt en controleert het model binnen het gegeven domein.
4. Later komt een geplande hellingsvraag terug met andere, eventueel negatieve gegevens.
5. Bij een fout in b blijft de correcte a bewaard; de planner zet gerichte b-oefening klaar.
6. In een volgende etappe volgt die oefening op een andere plek, met andere getallen.

Dezelfde kennis reist mee. De Markt hoeft geen formule-identieke herhaling van de eerdere brugopgave te bevatten: de mathematische handeling blijft herkenbaar, terwijl gegevens, representatie en context wisselen.

## Technisch contract met de scheduler

Een gekozen stopplaats levert een voorkeur en verhaalcontext aan, geen gesloten whitelist van skills. De wereldlaag vraagt een geschikte volgende gebeurtenis aan de bestaande leerengine. Die weegt leergrens, introductie, herstel, herhaling, variatie en recente belasting mee.

Voor integratie zijn drie afgebakende wijzigingen nodig:

- Voeg een optionele missievoorkeur toe aan `chooseTask`, met een begrensd aandeel actuele missiedoelen. Vervallen herhaling uit eerdere gebieden blijft in aanmerking komen.
- Maak herhaalachterstand zichtbaar in de planning en geef oude verschuldigde items op termijn een gegarandeerd moment. Nu zijn sommige keuzes probabilistisch; alleen een extra kamppictogram voorkomt langdurig uitstel niet.
- Laat de wereld na één verwerkt resultaat reageren op dezelfde poging-ID. De wereld kent geen extra XP toe en berekent mastery niet opnieuw.

De huidige herhaalafstanden zijn aantallen opgaven, geen kalenderdagen. De kaart mag daarom niet suggereren dat al een volledig dagschema voor gespreide herhaling bestaat. Kalenderherhaling is een eventuele latere ontwerpkeuze.

Een samengestelde opdracht behoudt één primaire skill. Correcte deelstappen zijn diagnostiek en mogen niet automatisch alle onderliggende skills opwaarderen. Als zelfstandig bewijs voor een basisvaardigheid ontbreekt, plant de engine een opgave waarin die vaardigheid zelf het primaire doel is.

## Werelduitdagingen: examen als project

Een werelduitdaging kan aanvoelen als een examen, met een zichtbaar doel zoals een routeplan opleveren, een installatie afstellen of een tarief onderzoeken. De inhoud is cumulatief: het huidige gebied domineert, maar eerdere concepten en minstens één verbindende toepassing blijven aanwezig.

Het huidige checkpoint kiest vooral zwakke beschikbare skills. Dat is bruikbaar voor oefenen, maar garandeert geen brede inhoudsdekking. Voor een werelduitdaging is een aparte blueprint nodig: welke vaardigheden/representaties zijn verplicht aanwezig, welk zelfstandig bewijs telt en welke varianten worden gebruikt? Een totaalpercentage alleen is onvoldoende om een belangrijk ontbrekend concept te herkennen.

Voorgestelde voorbeelden:

- Kaartvallei: lees en plaats punten, bepaal verschillen, reconstrueer een helling.
- Landschap: vergelijk richtingen en bijzondere rechten; interpreteer a en b met eerdere coördinatenkennis.
- Werkplaats: reconstrueer een voorschrift uit gegevens en controleer of het aan de punten voldoet; teken een passend model als afzonderlijke opdracht.
- Handelsplaats: onderzoek of een tabel en een context hetzelfde model beschrijven; controleer alle gegevens en het domein.
- Grensgebied: verbind formule, nulwaarde en teken in een toepassing.

Start wanneer er voldoende voorbereiding is. Een minder goede poging maakt een concreet herstelpad zichtbaar. Reeds behaalde onderdelen, sterren en bestaande toegang blijven staan; een herkansing richt zich op ontbrekend bewijs met nieuwe gegevens. Hulp blijft beschikbaar, maar die poging telt dan niet als zelfstandig examenbewijs. De precieze aantallen en criteria moeten vóór integratie worden vastgelegd en met leerlingen worden gekalibreerd.

## Wat is werkelijk optioneel?

Een specifieke stopplaats of gebeurtenis kan optioneel zijn terwijl het leerdoel verplicht blijft. Een al beheerste introductie kan worden overgeslagen op basis van geldig bestaand bewijs. Een extra variant of decoratieve ontdekking kan volledig optioneel zijn. Een nog niet gekend basisconcept dat een volgende opdracht nodig heeft, verdwijnt niet uit de route doordat de leerling zijn bijbehorende gebouw overslaat.

Laat per moment hoogstens twee of drie betekenisvolle keuzes zien: verder met de aanbevolen opdracht, een beschikbaar alternatief, of gemengd oefenen. De rest van de kaart blijft bekijkbaar. Dat houdt dertien plaatsen overzichtelijk en laat keuze bestaan zonder dat de leerling zelf zijn volledige didactische planning moet verzorgen.

## Gevolg voor het huidige prototype

De proefkaart gebruikt nog een eenvoudige lineaire voorbeeldroute. Vervang die bij de echte koppeling door bovenstaande scheiding tussen plaats, gebeurtenis, prerequisites en planner. Bouw eerst één gebied met een terugkerende ontmoeting uit een eerder leerdoel en een kleine cumulatieve einduitdaging. Test juist ook de leerling die herhaling uitstelt, hulp gebruikt, een zijpad overslaat of terugkomt na een pauze.

Pas daarna de overige gebieden vullen. Het succescriterium is dat de leerling de kaart begrijpt én dat de inhoudsplanning ten minste dezelfde leergrens-, herstel- en variatiedekking behoudt als de huidige trainer.
