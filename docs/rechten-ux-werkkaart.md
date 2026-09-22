# Rechtentrainer — UX-werkkaart

Deze beoordeling is gebaseerd op de huidige renderers en bediening, niet op
leerlingonderzoek. P1 = eerst aanpakken (betekenisvolle gegevens en invoer staan
te ver uiteen), P2 = gerichte interactieverbetering, P3 = verfijning. De tabel
bevat alle 27 bestaande skill-IDs; prioriteit verandert geen leerroute of toegang.

## Nu aangepast

- De geselecteerde kaartplaats bepaalt de hoofdactie. Een andere beschikbare
  plaats start direct een nieuwe ronde; bij de knop staat dat de huidige ronde
  stopt. Behaalde resultaten en geplande herhaling blijven behouden.
- Een afzonderlijke balk toont de lopende ronde en biedt hervatten of stoppen.
  Alleen een kaartplaats bekijken vervangt geen opgave.
- **Pauze** onderaan de oefening opent hervatten, ander leerdoel kiezen en stoppen.
- Bij het opbouwen van een helling staan A en B direct bij de grote invulbreuk.
  Coördinaten kunnen gesleept worden, of aangeklikt en daarna in een vakje
  geplaatst. Teller en noemer worden apart gecontroleerd. Beide consistente
  aftrekvolgordes blijven geldig; negatieve waarden krijgen haakjes.
- Dezelfde coördinatenbediening geldt in de voorschriftketens uit twee punten,
  grafiek, tabel en context, zodra daar de helling wordt opgebouwd.

## Alle vraagvormen bekijken

Open lokaal `http://localhost:8765/games/rechten/trainer/?dev=1` en kies **DEV**.
De vraagcatalogus toont alle 27 werkvormen, hun prioriteit en een concreet
verbeterpunt. Elke werkvorm opent op niveau 1, 2 of 3. Tijdens een DEV-vraag
brengt **Vraagoverzicht** je terug naar de catalogus.

Voor de nieuwere skills kun je in DEV een van de twaalf generatorvarianten
kiezen. Bij de zes oorspronkelijke Wave 1-skills zijn afzonderlijke deelstappen
rechtstreeks te openen. DEV vult daarvoor de voorafgaande stappen correct in;
dit is geen leerlingprestatie. Gewone oude meerkeuzevragen gebruiken nieuwe
willekeurige voorbeelden. Eindeloos veel getallencombinaties worden dus niet
als afzonderlijke kaartjes opgesomd.

DEV behoudt een lopende leerlingopgave en wijzigt daarbij geen XP, reviews of
beheersing. **Terug naar mijn oefening** herstelt de opgave. De DEV-ingang blijft
beperkt tot de bestaande ontwikkel-/leerkrachttoegang, niet leerlingaccounts.

## Optimalisatielijst

| Skill-ID | Prioriteit | Volgende verbetering / huidige beperking |
| --- | --- | --- |
| `point` | P2 | Coördinaten dichter bij het rooster kiezen; x en y afzonderlijk laten aanwijzen. |
| `point_plot` | Aangepast | Rechtstreeks klikken, tikken of slepen; geen x/y-stapknoppen. Assenschaal en bevestiging blijven expliciet. |
| `delta` | P2 | De horizontale en verticale verplaatsing rechtstreeks laten markeren. |
| `slope` | P2 | Δy en Δx vanuit de stapdriehoek naar een grote breuk laten plaatsen. |
| `slope_from_two_points` | Aangepast | Sobere sleepbreuk zonder vraagtekens of aslabels per getal. De volgende rekenstappen kunnen nog in hetzelfde werkblad worden samengebracht. |
| `line_behavior` | Aangepast | Grafiek, hellingsgetal en punten hebben een passende schaal. Ronde keuzes; grafiek verschijnt bij de puntenvariant pas na het antwoord. |
| `special_lines` | Aangepast | Grafiek, vaste coördinaat, x = c of y = b en functiebegrip blijven verbonden. Identieke punten tonen meerdere mogelijke rechten. |
| `intercept` | P3 | Het snijpunt met de y-as rechtstreeks laten aanwijzen. |
| `ab` | P1 | Afzonderlijke vaste invulplaatsen voor a en b; huidige gemengde antwoordkeuzes zijn moeilijk te overzien. |
| `equation_from_ab` | P2 | Tekens en negatieve coëfficiënten in de formuletokens verduidelijken. |
| `intercept_from_point` | P1 | x en y vanuit het punt naar de substitutie slepen; b in dezelfde grote vergelijking berekenen. |
| `equation_from_point_slope` | P1 | Eén zichtbaar rekenblad voor substitutie, b, formule en controle; minder losse schermstappen. |
| `equation_from_two_points` | P1 | Coördinatenplaatsing is aangepast; puntkeuze, b en beide controles nog in hetzelfde rekenblad samenbrengen. |
| `graph_from_equation` | P2 | Actief punt en bevestiging verduidelijken; fout bij één punt lokaal markeren. |
| `fx` | P1 | x rechtstreeks in de formule plaatsen; berekening verbinden met het punt op de grafiek. |
| `rewrite_linear_equation` | P1 | Vorige regel en bewerking zijn nu zichtbaar. Bewerkingen nog directer naast beide leden aanbieden; de losse invoerstappen blijven omslachtig. |
| `input_from_output` | P1 | Gegeven uitvoer in de formule plaatsen en onbekende x zichtbaar houden tijdens herleiding. |
| `point_on_line` | P2 | Substitutie en vergelijking met de gegeven y in één controlekaart tonen. |
| `table` | P2 | Ontbrekende tabelcel als invoervak gebruiken in plaats van losse antwoordbollen. |
| `graph_from_table` | P2 | Gekozen tabelkolom met het actieve roosterpunt verbinden en derde-puntcontrole duidelijker maken. |
| `equation_from_graph` | P1 | Coördinatenplaatsing is aangepast; gekozen grafiekpunten en latere berekening samen zichtbaar houden. |
| `equation_from_table` | P1 | Coördinatenplaatsing is aangepast; kolommen, formule en controle van de derde kolom verbinden. |
| `equation_from_context` | P1 | Gegevens en eenheden uit de tekst naar de formule plaatsen; context zichtbaar houden tijdens rekenen. |
| `zeroRead` | P3 | Nulpunt rechtstreeks selecteren; verschil met nulwaarde expliciet tonen. |
| `zero` | P1 | Berekening 0 = ax + b als invulbare vergelijking opbouwen in plaats van alleen resultaatkeuze. |
| `sign` | P2 | Het gevraagde x-gebied rechtstreeks op de as kiezen. |
| `signchart` | P1 | Tekens naar specifieke schemavakken plaatsen en afzonderlijk kunnen verbeteren; volgorde van klikken nu te impliciet. |

## Validatie van deze wijziging

- `node --test tests/*.test.cjs`: alle 18 testbestanden geslaagd.
- Tien browsersuites geslaagd: UX, Wave 1, constructie, algebra, transfer,
  antwoordflow, ronde stoppen, leerlingenschermen, leerroute en leerkrachttoegang.
- DEV: alle 27 vraagvormen op drie niveaus geopend, zonder gewijzigde
  leerlingresultaten; terugkeer naar een half ingevulde leerlingopgave getest.
- Slepen en tikken afwisselen, toetsenbordactivatie, annuleren, negatieve
  breuken, beide aftrekvolgordes en gerichte foutfeedback getest. Desktop- en
  mobiele landschapsindeling visueel gecontroleerd; kaart getest op zes breedtes.
- Oude hinttimers worden bij wisselen opgeruimd en kunnen na het stoppen geen
  verdwenen opgave meer aanspreken. Herladen behoudt een gedeeltelijk ingevulde
  breuk. Een andere ronde starten behoudt behaalde resultaten en herhaling.

De overige verbeterpunten in de tabel zijn voorstellen voor volgende stappen;
deze wijziging herontwerpt die vraagvormen nog niet volledig.

## Tweede controle — schermverhouding en leerwaarde (23 september 2026)

De zestien toegevoegde vraagvormen zijn opnieuw bekeken op alle drie de niveaus.
De grootste gedeelde fout zat in vaste telefoonmaten: grafieken, getallen,
tabellen en antwoordbediening bleven op laptops klein. De inhoud schaalt nu mee;
voor kleine schermen blijft een compacte indeling bestaan.

| Vraagvormen | Aanpassing en inhoudelijke beoordeling |
| --- | --- |
| `point_plot` | Geen x/y-stapknoppen. Selectie gebeurt op het rooster met klik, touch of slepen; daarna bevestigen. Pijltjestoetsen blijven als toegankelijke bediening beschikbaar. Hogere niveaus blijven kwadranten en assenschalen oefenen. |
| `slope_from_two_points` | Eén rustige getallenschaal, lege invulvakken zonder vraagtekens of herhaalde aslabels. Coördinaatidentiteit blijft intern behouden, zodat gelijke getallen uit verschillende punten niet worden verward. Beide aftrekvolgordes blijven geldig. |
| `line_behavior` | Grote grafiek, hellingsgetal of puntenpaar, met ronde antwoordknoppen. Niveau 1 gebruikt een grafiek, niveau 2 het teken van a en niveau 3 punten. De puntenvariant krijgt pas na het antwoord een grafiek: vooraf tonen zou de redenering uit coördinaten omzeilen. |
| `special_lines` | Na classificatie blijven grafiek en gelijke coördinaat zichtbaar. `x = c`, `y = b`, het functiebegrip en geen unieke rechte zijn expliciet verbonden. De afleider “Δy = 1” is verwijderd: die toetste hier geen zinvol alternatief. Identieke punten krijgen na classificatie twee mogelijke rechten ter illustratie. |
| `intercept_from_point`, `equation_from_point_slope`, `equation_from_two_points` | Formules, gegevens en numerieke controls schalen mee. Negatieve getallen in aftrekkingen krijgen haakjes. De juiste a blijft bewaard. De reeks losse substitutie- en invulstappen blijft een P1-verbeterpunt; een doorlopend rekenblad is nog wenselijk. |
| `equation_from_ab`, `graph_from_equation` | Formuletokens en gegevens hebben een passende laptopschaal. Vrije geldige puntenparen, nulhellingen en breuken blijven behouden. Tekenkeuze en het benoemen van het actieve punt verdienen verdere verfijning. |
| `rewrite_linear_equation`, `input_from_output` | De vorige rekenregel en uitgevoerde bewerking blijven zichtbaar. Alternatieve geldige oplossingsroutes, verticale relaties en alle/geen oplossingen blijven behouden. De keuze van bewerking, term en getal verloopt nog via meerdere schermstappen. |
| `point_on_line` | Grafiek, vergelijking en tabel zijn groter. Substitutie gevolgd door vergelijking met de gegeven y blijft het leerdoel. De koppeling van die twee stappen kan nog directer. |
| `graph_from_table`, `equation_from_graph`, `equation_from_table`, `equation_from_context` | Tabellen, context en bediening schalen mee. Eigen puntenkeuze, de derde kolom controleren, eenheden en het geldige domein zijn zinvolle onderdelen en blijven bestaan. De context/grafiek verdwijnt nog tijdens sommige rekenstappen: dit blijft een inhoudelijk UX-verbeterpunt. |

Deze controle maakt onderscheid tussen verbeterde presentatie en een volledig
herontwerp van een vraagvorm. De P1-punten in de catalogus blijven daarom staan
waar losse deelstappen of mechanisch overschrijven nog de leerervaring beperken.
De bestaande skill-IDs, niveaus, toegang en leerlingvoortgang zijn behouden.

Validatie van deze tweede controle: alle 18 unit-testbestanden en negen
browsersuites geslaagd (scherm/leerwaarde, Wave 1, constructie, algebra, transfer,
DEV/UX, antwoordflow, ronde stoppen en volledige leerroute). Screenshots van de
invulbreuk, richting vanuit een grafiek en de verticale functievraag zijn
visueel nagekeken. Geen wijziging aan opgeslagen versies of masteryregels.
