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
| `point_plot` | P3 | Rasterselectie is al direct. Cursor, gekozen punt en bevestiging duidelijker onderscheiden. |
| `delta` | P2 | De horizontale en verticale verplaatsing rechtstreeks laten markeren. |
| `slope` | P2 | Δy en Δx vanuit de stapdriehoek naar een grote breuk laten plaatsen. |
| `slope_from_two_points` | Aangepast | Coördinaten slepen of aanklikken en in teller/noemer plaatsen. Daarna blijft de losse breukinvoer nog te verbeteren. |
| `line_behavior` | P3 | Richting in de grafiek zichtbaar laten reageren op een gekozen antwoord. |
| `special_lines` | P2 | Gelijke x of y in de punten laten markeren; classificatie, formule en functiebegrip verbinden. |
| `intercept` | P3 | Het snijpunt met de y-as rechtstreeks laten aanwijzen. |
| `ab` | P1 | Afzonderlijke vaste invulplaatsen voor a en b; huidige gemengde antwoordkeuzes zijn moeilijk te overzien. |
| `equation_from_ab` | P2 | Tekens en negatieve coëfficiënten in de formuletokens verduidelijken. |
| `intercept_from_point` | P1 | x en y vanuit het punt naar de substitutie slepen; b in dezelfde grote vergelijking berekenen. |
| `equation_from_point_slope` | P1 | Eén zichtbaar rekenblad voor substitutie, b, formule en controle; minder losse schermstappen. |
| `equation_from_two_points` | P1 | Coördinatenplaatsing is aangepast; puntkeuze, b en beide controles nog in hetzelfde rekenblad samenbrengen. |
| `graph_from_equation` | P2 | Actief punt en bevestiging verduidelijken; fout bij één punt lokaal markeren. |
| `fx` | P1 | x rechtstreeks in de formule plaatsen; berekening verbinden met het punt op de grafiek. |
| `rewrite_linear_equation` | P1 | Bewerking op beide leden naast de vergelijking tonen, met zichtbare vorige regel. |
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
