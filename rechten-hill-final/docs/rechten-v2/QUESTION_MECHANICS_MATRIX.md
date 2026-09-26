# Question mechanics matrix — alle 27 behouden skill-ID’s

Auditdatum: 25 september 2026. Dit is het ontwerpcontract; alleen de drie slices worden in deze ronde geïmplementeerd. 27 data-ID’s, 26 actieve v1-routes. `equation_from_context` blijft gepauzeerd. Elk record heeft exact de 21 gevraagde ontwerpvelden; de afzonderlijke bronregels maken onderscheid tussen huidige mogelijkheden en nog te bouwen inhoud.

Bronbasis: user masterprompt v2/v2.1 hoofdstukken 8–14 en 17–20; huidige bestanden onder `games/rechten/trainer/`. `W` betekent ongewijzigde `RechtenWave`. Oudere transferdocumentatie is niet gelijk aan de actieve workbench v2. Legacy numerieke validators gebruiken tolerantie; de gedeelde W-kern rekent exact.

## point

**Actuele generator:** index.html: generate(point), integer pool ±4, origin excluded; pointGraphMarkup.
**Actuele validator / UI:** renderPoint: pair-string comparison; point.xySwap/xSign/ySign/other.
**Nog niet ondersteund / migratiegrens:** Geen veranderde asschaal, vrije coördinaatrespons of exacte componentvalidator in deze legacy skill.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `point` |
| family_id | F1 |
| leerclaim | De leerling decodeert een zichtbaar roosterpunt correct als geordend paar (x, y), inclusief teken en asschaal. |
| primaire cognitieve handeling | Positie coderen of decoderen met geordende assen en schaal. |
| introductiemechaniek | Laat eerst één punt een horizontale schaduw naar de x-as en daarna een verticale schaduw naar de y-as werpen. De leerling tikt de twee aswaarden in volgorde aan; het paar wordt pas daarna opgebouwd. |
| oefenmechaniek | Toon een punt zonder blijvende hulplijnen. Onderaan staan twee grote slots `( , )`; tikken op een slot activeert de overeenkomstige as. De leerling kiest een aslabel of gebruikt ±-steppers. Een korte `Controleer`-commit voorkomt live raden. |
| bewijsmechaniek | Constructed response zonder antwoordopties, nieuwe kwadrant-/asschaalvariant en minstens één punt op een as. Geen x/y-kleuren die met antwoordslots overeenkomen. Eén verborgen schaal- of tekenvariant controleert transfer. |
| intuïtieve antwoordvorm | Twee semantische waardevelden met tap-aslabel, stepper en toetsenbordalternatief; geen vrije tekst nodig. |
| wat vóór commit verborgen blijft | Juiste projecties en eindcoördinaten; neutrale kandidaat blijft zichtbaar. |
| causale feedback | Teken na commit twee dunne projectielijnen en leg het gekozen paar naast de werkelijke projecties. Bij één fout blijft de andere coördinaat staan. |
| misconceptiehypotheses | x/y omwisselen; teken negeren; rasterstappen als 1 lezen terwijl de schaal anders is; coördinaat van aslabel in plaats van punt nemen. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Welke aswaarde lees je eerst?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Projecteer eerst naar x, daarna y.” H4 parallel completion: P(−2,3): x is ingevuld, vul alleen y. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Een juiste coördinaat. |
| near-transfer | Punt op een as op schaal 2; hetzelfde punt in kaartcoördinaten. |
| far-transfer | Zelfde positie op een kaart/constellatie met minder expliciete aslabels of een andere schaal. |
| hidden-case | Punt op y-as met negatieve y en schaal 2. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Twee semantische waardevelden met tap-aslabel, stepper en toetsenbordalternatief; geen vrije tekst nodig. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(point, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Geen veranderde asschaal, vrije coördinaatrespons of exacte componentvalidator in deze legacy skill. |

## point_plot

**Actuele generator:** wave-core.js: constructionGenerate(point_plot); scaleX/scaleY onafhankelijk 1,2,1/2.
**Actuele validator / UI:** constructionCheck(point_plot); construction-ui.js grid + point state.
**Nog niet ondersteund / migratiegrens:** Geen authored hidden/transfercase; juiste assen wel door validator teruggegeven.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `point_plot` |
| family_id | F1 |
| leerclaim | De leerling encodeert een gegeven geordend paar als de juiste positie in een assenstelsel. |
| primaire cognitieve handeling | Positie coderen of decoderen met geordende assen en schaal. |
| introductiemechaniek | Animeer één keer de route: eerst x langs de horizontale as, daarna y parallel aan de verticale as. Laat daarna de leerling zelf de route afmaken. |
| oefenmechaniek | Tik op een roosterintersectie; een grote gesnapte crosshair toont de kandidaat. Alternatief: stel x en y met steppers in en tik `Plaats`. De puntpositie blijft voorlopig neutraal tot commit. |
| bewijsmechaniek | Een nieuwe schaal, negatieve waarden en punten op assen. De leerling plaatst direct zonder x-dan-y-hulp. Een hidden check projecteert de gekozen positie terug naar beide assen. |
| intuïtieve antwoordvorm | Gesnapte tapplaatsing met royale hitbox, crosshair, steppers en pijltjestoetsen; drag is optioneel en nooit verplicht. |
| wat vóór commit verborgen blijft | Juiste projecties en eindcoördinaten; neutrale kandidaat blijft zichtbaar. |
| causale feedback | Ghostpad scheidt horizontale en verticale fout. Bij een fout kan alleen de verkeerde component worden aangepast; geen volledige reset. |
| misconceptiehypotheses | assen verwisselen; verkeerde richting voor negatief; schaal verkeerd tellen; één component juist en de andere gokken. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Welke as gebruik je eerst?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Ga x horizontaal en y verticaal volgens tickwaarde.” H4 parallel completion: Q(2,−1): x ligt vast; plaats alleen y. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | correctAxes.x / correctAxes.y uit constructionCheck. |
| near-transfer | Nieuw kwadrant met ongelijke x/y-schalen, terugprojectie. |
| far-transfer | Een baken plaatsen in een contextkaart of een punt plaatsen wanneer slechts referentielijnen 0 en 5 gelabeld zijn. |
| hidden-case | Nieuw punt op x-as; controleer beide terugprojecties. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Gesnapte tapplaatsing met royale hitbox, crosshair, steppers en pijltjestoetsen; drag is optioneel en nooit verplicht. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(point_plot, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Geen authored hidden/transfercase; juiste assen wel door validator teruggegeven. |

## delta

**Actuele generator:** index.html: generate(delta), dx positive bounded pools, ask dx/dy.
**Actuele validator / UI:** renderDelta/numericChoices/deltaError: tolerant numeric compare.
**Nog niet ondersteund / migratiegrens:** Δx-richting wordt niet vrij gekozen; vooraf gelabelde trap verraadt waarde; geen beide-delta commit.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `delta` |
| family_id | F2 |
| leerclaim | De leerling bepaalt gerichte Δx en Δy tussen twee punten met één consistente oriëntatie. |
| primaire cognitieve handeling | Gerichte covariatie en rate construeren; constante coördinaat onderscheiden. |
| introductiemechaniek | Markeer A→B expliciet. De leerling bouwt eerst een horizontale pijl en daarna een verticale pijl; lengte én richting worden gekoppeld aan teken. |
| oefenmechaniek | Twee grote componentstroken `Δx` en `Δy` met plus/minus en discrete stappen. De leerling kan de trap ook rechtstreeks op het rooster plaatsen; beide bedieningen blijven synchroon. |
| bewijsmechaniek | A en B wisselen soms van volgorde; negatieve componenten en niet-eenheidsschalen. Geen vooraf getekende trap. De gekozen oriëntatie moet voor beide componenten dezelfde zijn. |
| intuïtieve antwoordvorm | Twee gekoppelde steppers of twee gesnapte pijlen; commit na beide waarden. |
| wat vóór commit verborgen blijft | Rate-uitvoering, juiste componenten en derde-puntuitkomst; gegeven punten blijven zichtbaar. |
| causale feedback | De game beweegt een ghost van A naar het door de leerling berekende tussen- en eindpunt. Eerste divergentie wordt apart gemarkeerd. |
| misconceptiehypotheses | absolute afstand nemen; A−B voor de ene component en B−A voor de andere; assen verwisselen; rasterstappen verkeerd lezen. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Waar begint je pijl?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Trek voor beide assen begin af van eind.” H4 parallel completion: Van (1,2) naar (4,0): Δx=3; vul Δy. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Juiste component en gekozen oriëntatie. |
| near-transfer | B→A met beide verschillen negatief; routekaart met schaal 2. |
| far-transfer | Dezelfde componenten gebruiken in een route- of hellingscontext en bij omgekeerde A/B-volgorde. |
| hidden-case | Dezelfde route omkeren: beide tekens veranderen. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Twee gekoppelde steppers of twee gesnapte pijlen; commit na beide waarden. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(delta, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Δx-richting wordt niet vrij gekozen; vooraf gelabelde trap verraadt waarde; geen beide-delta commit. |

## slope

**Actuele generator:** index.html: generate(slope), signed dy/dx bounded pools.
**Actuele validator / UI:** renderSlope/numericChoices/slopeError.
**Nog niet ondersteund / migratiegrens:** MC kan reciprocal herkennen; dx/dy getoond; geen hidden punt of onafhankelijke rateclaim.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `slope` |
| family_id | F2 |
| leerclaim | De leerling interpreteert helling als één gerichte veranderingsratio a = Δy/Δx en herkent equivalente hellingsdriehoeken. |
| primaire cognitieve handeling | Gerichte covariatie en rate construeren; constante coördinaat onderscheiden. |
| introductiemechaniek | Laat een bewegend punt één horizontale eenheid doorlopen terwijl de verticale verandering zichtbaar wordt. Koppel daarna de volledige driehoek aan de breuk, niet twee losse antwoordballen. |
| oefenmechaniek | De leerling bouwt of kiest een hellingsdriehoek en vult een verticale breuk met Δy boven Δx. Een unit-rate-marker toont na commit hoeveel y verandert per 1 x. |
| bewijsmechaniek | Breukhellingen, negatieve helling en een alternatieve grotere driehoek op dezelfde lijn. De leerling moet dezelfde rate herkennen op verborgen derde punt. |
| intuïtieve antwoordvorm | Verticale breukbuilder met exact rationale tokens; gesnapte driehoek; geen decimale benadering wanneer een breuk exact is. |
| wat vóór commit verborgen blijft | Rate-uitvoering, juiste componenten en derde-puntuitkomst; gegeven punten blijven zichtbaar. |
| causale feedback | Na commit schuift een marker volgens de gekozen rate. Reciproque of tekenfout produceert een zichtbaar andere lijn; correcte componenten blijven behouden. |
| misconceptiehypotheses | Δx/Δy nemen; alleen absolute waarden; 'hoger is steiler'; twee getallen zien in plaats van één ratio; minteken aan verkeerde plaats. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Hoeveel verandert y per één x?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Deel gerichte Δy door gerichte Δx.” H4 parallel completion: Δy=6 en Δx=4: vul equivalente rate. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Juiste Δx en Δy; herschrijven van breuk mag equivalent zijn. |
| near-transfer | Een grotere driehoek op dezelfde lijn met verborgen derde punt. |
| far-transfer | Dezelfde helling herkennen in tabel, formule of een andere driehoek; rate als eenheid in context. |
| hidden-case | Derde punt met grotere horizontale afstand. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Verticale breukbuilder met exact rationale tokens; gesnapte driehoek; geen decimale benadering wanneer een breuk exact is. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(slope, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: MC kan reciprocal herkennen; dx/dy getoond; geen hidden punt of onafhankelijke rateclaim. |

## slope_from_two_points

**Actuele generator:** wave-core.js: generate; affine/fraction/horizontal/vertical/identical.
**Actuele validator / UI:** stages ys,xs,a; expected/check/submit; coordinate-builder.js.
**Nog niet ondersteund / migratiegrens:** Geen directe delta-entry in huidige route; stageOverride niet publiek door transfer wrappers; hidden derde punt ontbreekt.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `slope_from_two_points` |
| family_id | F2 |
| leerclaim | De leerling berekent de helling uit twee punten door een consistente aftrekvolgorde te gebruiken en de ratio te vereenvoudigen. |
| primaire cognitieve handeling | Gerichte covariatie en rate construeren; constante coördinaat onderscheiden. |
| introductiemechaniek | Laat de leerling A→B of B→A kiezen; de gekozen richting kleurt/markeert beide aftrekkingen identiek. Beide routes moeten dezelfde helling opleveren. |
| oefenmechaniek | Bouw `(y₂−y₁)/(x₂−x₁)` met coördinaatchips; het systeem staat ook de volledig omgekeerde volgorde toe. Daarna vereenvoudigt de leerling de breuk. |
| bewijsmechaniek | Punten niet in leesvolgorde, negatieve coördinaten, niet-unit Δx en breukhelling. Een hidden derde punt controleert collineariteit. |
| intuïtieve antwoordvorm | Chipgebaseerde aftrekvelden, verticale breuk en één route-toggle; toetsenbordlabels voor alle chips. |
| wat vóór commit verborgen blijft | Rate-uitvoering, juiste componenten en derde-puntuitkomst; gegeven punten blijven zichtbaar. |
| causale feedback | Toon de twee componenten en de resulterende ghostlijn. Bij gemengde aftrekvolgorde pulseert enkel de inconsistentie; niet meteen de oplossing. |
| misconceptiehypotheses | aftrekvolgorde mengen; x/y verwisselen; reciprocal; verschil van punten als één scalar; niet vereenvoudigen of teken verliezen. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Volgen beide verschillen dezelfde richting?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Bouw eind-y min begin-y boven eind-x min begin-x.” H4 parallel completion: A(0,1), B(4,3): Δx=4; vul Δy. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Gekozen consistente route en elke correcte delta, ook bij verkeerde rate. |
| near-transfer | Omgekeerde A/B-richting, fractionele rate, derde x buiten gegeven punten. |
| far-transfer | Dezelfde twee punten in omgekeerde volgorde of in een tabel; valideer een derde punt. |
| hidden-case | Derde x buiten gegeven segment; voorspel y zonder uitgevoerde rail. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Chipgebaseerde aftrekvelden, verticale breuk en één route-toggle; toetsenbordlabels voor alle chips. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(slope_from_two_points, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Geen directe delta-entry in huidige route; stageOverride niet publiek door transfer wrappers; hidden derde punt ontbreekt. |

## line_behavior

**Actuele generator:** wave-core.js: generate; representation graph/slope/points per niveau.
**Actuele validator / UI:** stages behavior; check string; concept-ui.js.
**Nog niet ondersteund / migratiegrens:** Actuele generator voor deze skill geen verticale variant of tabel; viertegelsontwerp vereist nieuwe inhoud.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `line_behavior` |
| family_id | F2 |
| leerclaim | De leerling koppelt het teken van de helling aan stijgend, dalend of constant gedrag en onderscheidt een verticale relatie. |
| primaire cognitieve handeling | Gerichte covariatie en rate construeren; constante coördinaat onderscheiden. |
| introductiemechaniek | Een tracer beweegt van links naar rechts. Vóór de run voorspelt de leerling met een richtingglyph wat y doet. |
| oefenmechaniek | Classificatie mag hier compact zijn: vier grote visuele keuzes stijgend/dalend/horizontaal/verticaal. Daarna moet de leerling één redenpin plaatsen: `a>0`, `a<0`, `a=0` of `x=constant`. |
| bewijsmechaniek | Wissel grafiek, tabel en voorschrift af. Gebruik lijnen die hoog maar dalend zijn, laag maar stijgend, horizontaal en verticaal. |
| intuïtieve antwoordvorm | Vier grote richtingstegels plus één causale redenchip; geen tekstzware meerkeuze. |
| wat vóór commit verborgen blijft | Rate-uitvoering, juiste componenten en derde-puntuitkomst; gegeven punten blijven zichtbaar. |
| causale feedback | Tracer en mini-tabel tonen de verandering bij toenemende x. De gekozen reden blijft zichtbaar. |
| misconceptiehypotheses | hoogte verwarren met helling; alleen rechterkant bekijken; horizontaal en verticaal verwarren; verticale rechte als gewone functie met a=0 zien. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Wat doet y als x toeneemt?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Vergelijk outputs in volgorde van toenemende x.” H4 parallel completion: y=−2x+7: voorspel omhoog/omlaag voor x→x+1. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Voorspelde richting en onderbouwende parameter. |
| near-transfer | Hoge dalende versus lage stijgende lijn; formule zonder grafiek. |
| far-transfer | Classificeer uit formule of tabel zonder grafiek en vergelijk twee lijnen met dezelfde richting maar verschillende b. |
| hidden-case | Hooggelegen dalende lijn als tabel zonder grafiek. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Vier grote richtingstegels plus één causale redenchip; geen tekstzware meerkeuze. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(line_behavior, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Actuele generator voor deze skill geen verticale variant of tabel; viertegelsontwerp vereist nieuwe inhoud. |

## special_lines

**Actuele generator:** wave-core.js: generate(special_lines), variant%3 horizontal/vertical/identical.
**Actuele validator / UI:** classify/property/axis/constant/function; concept-ui.js.
**Nog niet ondersteund / migratiegrens:** Geen constructierespons of hidden verticaal-lijntest; classificatie is wel legitiem MC.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `special_lines` |
| family_id | F2 |
| leerclaim | De leerling herkent en construeert horizontale en verticale rechten en begrijpt welke coördinaat constant blijft. |
| primaire cognitieve handeling | Gerichte covariatie en rate construeren; constante coördinaat onderscheiden. |
| introductiemechaniek | Laat punten langs een lijn bewegen en vraag vóór beweging welke coördinaat onveranderd blijft. |
| oefenmechaniek | De leerling kiest `x blijft ...` of `y blijft ...`, stelt de constante waarde in en ziet pas na commit de volledige lijn. |
| bewijsmechaniek | Formules `y=c`, `x=c`, twee punten met gelijke x of gelijke y, en het degeneratieve geval van twee identieke punten. Verticale lijn wordt expliciet onderscheiden van een functie y=f(x). |
| intuïtieve antwoordvorm | Constante-coördinaatcontract met waardechip en lijnpreview na commit. |
| wat vóór commit verborgen blijft | Rate-uitvoering, juiste componenten en derde-puntuitkomst; gegeven punten blijven zichtbaar. |
| causale feedback | Een componentmeter blijft stil terwijl de andere beweegt. Bij identieke punten meldt het systeem dat één punt geen unieke lijn bepaalt. |
| misconceptiehypotheses | horizontaal/verticaal omwisselen; a=0 aan verticale lijn koppelen; twee identieke punten als lijn zien; x=c als y-functie behandelen. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Welke coördinaat blijft gelijk?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Vergelijk x en y; controleer of punten verschillend zijn.” H4 parallel completion: (3,−1) en (3,2): vul constante coördinaat. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Correcte soort en constante as; alleen waarde/function claim herstellen. |
| near-transfer | x=c versus y=c met dezelfde c; identieke punten tegenover twee verschillende. |
| far-transfer | Bouw de lijn uit twee punten, formule of een routeconstraint. |
| hidden-case | Identieke punten: toets of één unieke rechte volgt. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Constante-coördinaatcontract met waardechip en lijnpreview na commit. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(special_lines, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Geen constructierespons of hidden verticaal-lijntest; classificatie is wel legitiem MC. |

## intercept

**Actuele generator:** index.html: generate(intercept); signed slope/b pools.
**Actuele validator / UI:** renderIntercept/numericChoices/interceptError.
**Nog niet ondersteund / migratiegrens:** Snijpunt permanent gemarkeerd; geen exact anker of offscreen-variant.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `intercept` |
| family_id | F3 |
| leerclaim | De leerling interpreteert b als de y-waarde bij x=0 en leest het y-snijpunt onafhankelijk van helling of eerste zichtbare punt. |
| primaire cognitieve handeling | Rate en uitvoer bij x=0 afzonderlijk isoleren. |
| introductiemechaniek | Plaats een expliciete probe op x=0; de grafiek antwoordt met het bijbehorende punt op de y-as. |
| oefenmechaniek | De leerling tikt het snijpunt met de y-as of stelt b in een slot in. De grafiek blijft ongekleurd; x-snijpunt en andere punten zijn neutraal. |
| bewijsmechaniek | Negatieve b, b=0, steile en dalende lijnen, plus een grafiek waarvan het eerste zichtbare lijnpunt niet het intercept is. Een tabelrij x=0 kan als alternatieve representatie dienen. |
| intuïtieve antwoordvorm | Semantische y-as-anchor of exact waardeveld; geen reeks antwoordopties. |
| wat vóór commit verborgen blijft | Effect van gekozen parameter/repair, probe-uitkomst en correcte parameterlabels. |
| causale feedback | Na commit verschijnt alleen de verticale asprojectie `x=0 → y=b`. Bij verwarring met nulwaarde worden beide snijpunten kort naast elkaar benoemd. |
| misconceptiehypotheses | rico en hoogte verwarren; x-intercept kiezen; b als eerste punt of constante toevoeging per stap lezen. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Waar is x nul?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Volg de rechte naar de y-as en lees y.” H4 parallel completion: y=−x+4: vul output bij x=0. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | De correcte x=0-keuze; alleen y-waarde aanpassen. |
| near-transfer | Tabel met x=0 niet in eerste kolom, tweede lijn met zelfde a. |
| far-transfer | Bepaal b uit een tabelrij, context-startwaarde of een lijnpaar met dezelfde a. |
| hidden-case | Tabel met x=0 in middelste kolom. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Semantische y-as-anchor of exact waardeveld; geen reeks antwoordopties. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(intercept, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Snijpunt permanent gemarkeerd; geen exact anker of offscreen-variant. |

## ab

**Actuele generator:** index.html: generate(ab); a incl ±1/2, b bounded by visible step.
**Actuele validator / UI:** renderAB/abChoices; swapped/intercept/slope/both.
**Nog niet ondersteund / migratiegrens:** Geen fault/probe/hidden-case engine; twee parameters direct herkennen is nog geen diagnose.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `ab` |
| family_id | F3 |
| leerclaim | De leerling bepaalt en onderscheidt de parameters a en b en voorspelt hun afzonderlijke effect op de grafiek. |
| primaire cognitieve handeling | Rate en uitvoer bij x=0 afzonderlijk isoleren. |
| introductiemechaniek | Gebruik twee discrete schakelaars. Eerst wordt slechts b gewijzigd en voorspelt de leerling wat gelijk blijft; daarna slechts a. |
| oefenmechaniek | Bij een vaste grafiek bouwt de leerling een hellingsdriehoek voor a en gebruikt x=0 voor b. Beide waarden komen in duidelijk verschillende semantische slots, niet alleen verschillende kleuren. |
| bewijsmechaniek | Lijnparen met dezelfde a/andere b en dezelfde b/andere a; negatieve en fractionele a; b=0. Een hidden parameterwijziging vraagt vooraf welk kenmerk verandert. |
| intuïtieve antwoordvorm | Twee parameterkaarten met iconen `rate` en `start bij x=0`, exact value controls en commit. |
| wat vóór commit verborgen blijft | Effect van gekozen parameter/repair, probe-uitkomst en correcte parameterlabels. |
| causale feedback | Ghost van oude en nieuwe lijn toont rotatie versus verschuiving. Alleen het foutieve parameterbewijs wordt heropend. |
| misconceptiehypotheses | a en b omwisselen; b als horizontale verschuiving; a als lijnhoogte; minteken verliezen. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Wat beschrijft de uitvoer bij x=0?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Gebruik x=0 voor b en een eenheidsstap voor a.” H4 parallel completion: y=3x−2: b=−2; voorspel verandering 0→1. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Elke juiste parameter, gekozen probe en reeds correcte tabel. |
| near-transfer | Verwisselde a/b in grafiek; x=0-probe en hidden x=10. |
| far-transfer | Van grafiek naar formule, tabel of context; voorspel effect voordat de lijn verandert. |
| hidden-case | Hidden x10 na herstel van verwisselde koppeling. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Twee parameterkaarten met iconen `rate` en `start bij x=0`, exact value controls en commit. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(ab, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Geen fault/probe/hidden-case engine; twee parameters direct herkennen is nog geen diagnose. |

## fx

**Actuele generator:** index.html: generate(fx); bounded x, nonzero slopes, optional visual probe.
**Actuele validator / UI:** renderFx/numericChoices/fxError.
**Nog niet ondersteund / migratiegrens:** Geen constante a=0 in pool; MC; basisgrafiek kan output tonen.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `fx` |
| family_id | F4 |
| leerclaim | De leerling berekent of voorspelt de functiewaarde bij een gegeven input en begrijpt f(x) als output/y-waarde. |
| primaire cognitieve handeling | Input-outputrelatie uitvoeren, omkeren of controleren. |
| introductiemechaniek | Een inputchip loopt door zichtbare modules `×a` en `+b`; de leerling voorspelt het eindvak vóór de run. |
| oefenmechaniek | Bij gekende structuur wordt de module-animatie compacter. De leerling bouwt tussenstappen in twee slots of voert de exacte output in. |
| bewijsmechaniek | Negatieve x, negatieve/fractionele a, b=0, en representatiewissel naar tabel of grafiek. Geen module-uitwerking tijdens zelfstandige bewijsmodus. |
| intuïtieve antwoordvorm | Exacte numerieke composer met teken, breuk en eenvoudige steppers; optionele moduleketen. |
| wat vóór commit verborgen blijft | Berekende output, inverse oplossing of membership verdict. |
| causale feedback | Toon de eerste stap waar de voorspelde en werkelijke waarde verschillen. Behoud correcte tussenstap. |
| misconceptiehypotheses | b vergeten; b ook vermenigvuldigen; x als antwoord teruggeven; bewerkingsvolgorde; f(x) als f·x lezen. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Wat is de input?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Bereken eerst ax, tel dan b erbij.” H4 parallel completion: y=2x−1 bij x=3: product 6; vul uitvoer. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Correct product ax en gekozen input. |
| near-transfer | Output uit een tabel of grafiek bij een niet-getoonde negatieve input. |
| far-transfer | Lees dezelfde output uit grafiek of tabel en verklaar dat het dezelfde koppeling is. |
| hidden-case | Niet-getoonde negatieve input via tabel. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Exacte numerieke composer met teken, breuk en eenvoudige steppers; optionele moduleketen. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(fx, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Geen constante a=0 in pool; MC; basisgrafiek kan output tonen. |

## table

**Actuele generator:** index.html: generate(table); fixed xs [0,1,2]/[-1,0,1]/[-2,0,2].
**Actuele validator / UI:** renderTable/numericChoices/tableError.
**Nog niet ondersteund / migratiegrens:** Geen onregelmatige afstanden of inverse cel; slechts één outputgat.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `table` |
| family_id | F4 |
| leerclaim | De leerling gebruikt één functie-invariant om tabelwaarden systematisch aan te vullen, inclusief niet-opeenvolgende inputs. |
| primaire cognitieve handeling | Input-outputrelatie uitvoeren, omkeren of controleren. |
| introductiemechaniek | Eén rij tegelijk: inputchip, voorspel output, run. Laat daarna drie rijen samen zien zodat het patroon zichtbaar wordt. |
| oefenmechaniek | Activeer één ontbrekende cel per beslismoment. De hele tabel blijft zichtbaar maar alleen de relevante rij en formule zijn interactief. Voor meerdere gaten wordt een rij na commit vastgezet. |
| bewijsmechaniek | Gemengde negatieve/niet-opeenvolgende x-waarden, één ontbrekende input uit output, of een hidden rij. Geen regelmatige kolomafstand als onbedoelde hint. |
| intuïtieve antwoordvorm | Grote actieve tabelcel met exact-value tray; één rij per schermfase; keyboard- en screenreaderlabels. |
| wat vóór commit verborgen blijft | Berekende output, inverse oplossing of membership verdict. |
| causale feedback | Verbind de actieve rij met de formulemodules of grafiekpunt. Bij een fout wordt de eerste verkeerde bewerkingsstap getoond. |
| misconceptiehypotheses | x als y overschrijven; alleen b gebruiken; kolompatroon extrapoleren zonder regel; verschil in y verwarren met a wanneer Δx≠1. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Welke input hoort bij deze lege cel?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Gebruik dezelfde formule voor juist deze kolom.” H4 parallel completion: y=2x+1 bij x=4: product 8; vul cel. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Reeds correcte cellen en functievoorschrift. |
| near-transfer | Onregelmatige x-reeks met verborgen vierde rij. |
| far-transfer | Bouw een grafiekpunt uit een rij of voorspel een hidden rij in een andere eenheid/context. |
| hidden-case | Extra rij met onregelmatige x-afstand. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Grote actieve tabelcel met exact-value tray; één rij per schermfase; keyboard- en screenreaderlabels. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(table, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Geen onregelmatige afstanden of inverse cel; slechts één outputgat. |

## graph_from_equation

**Actuele generator:** wave-core.js: constructionGenerate; fractional/horizontal model.
**Actuele validator / UI:** constructionCheck with exact onLine for two distinct arbitrary points; construction-ui.js.
**Nog niet ondersteund / migratiegrens:** Geen hidden derde punt; asschalen voor deze generator 1; formula slot parser geen willekeurige expressies.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `graph_from_equation` |
| family_id | F5 |
| leerclaim | De leerling construeert de grafiek van een eerstegraadsfunctie als de unieke rechte door meerdere geldige punten. |
| primaire cognitieve handeling | Semantisch geldige punten naar één lijn generaliseren. |
| introductiemechaniek | Laat twee routes zien zonder één te verplichten: start bij b en gebruik a, of kies twee inputs en bereken outputs. |
| oefenmechaniek | De leerling plaatst twee gesnapte punten. Na commit verschijnt de lijnpreview en een derde proefinput. Elk geldig niet-identiek puntenpaar wordt geaccepteerd. |
| bewijsmechaniek | Negatieve/fractionele helling, horizontale lijn, b buiten het meest opvallende deel van het scherm en verschillende asschalen. Geen live groen tijdens slepen. |
| intuïtieve antwoordvorm | Gesnapte point placer, exact coordinate stepper en `Teken/Test`-commit; geen freehand lijn. |
| wat vóór commit verborgen blijft | Correctheidskleur, referentieghost en derde-puntuitkomst. |
| causale feedback | Verbind elk gekozen punt met zijn input-outputberekening. Bij één verkeerd punt blijft het juiste staan; identieke punten krijgen een specifieke melding. |
| misconceptiehypotheses | b als x-snijpunt; helling reciprocal; identieke punten; lijn alleen tussen punten tekenen; schaal negeren. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Voldoet elk punt aan de formule?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Kies twee verschillende x en bereken hun y.” H4 parallel completion: y=x+2, A(0,2): kies een ander geldig punt. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Correct punt A of B, ook wanneer andere fout is. |
| near-transfer | Andere twee geldige punten, derde input en ongelijke asschaal. |
| far-transfer | Hidden derde punt, andere asschaal of formule in equivalente vorm. |
| hidden-case | Derde input buiten het constructiesegment. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Gesnapte point placer, exact coordinate stepper en `Teken/Test`-commit; geen freehand lijn. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(graph_from_equation, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Geen hidden derde punt; asschalen voor deze generator 1; formula slot parser geen willekeurige expressies. |

## graph_from_table

**Actuele generator:** transfer-workbench-core.js: generate transferVersion=2; consistent rows.
**Actuele validator / UI:** drawTable exact model(...points), all rows onLine; transfer-workbench-ui.js.
**Nog niet ondersteund / migratiegrens:** Nieuwe route verwijdert inconsistent-table cases; oude drafts behouden legacy. Geen table verdict in huidige variant.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `graph_from_table` |
| family_id | F5 |
| leerclaim | De leerling vertaalt tabelparen naar punten en construeert een lijn die alle gegevens representeert. |
| primaire cognitieve handeling | Semantisch geldige punten naar één lijn generaliseren. |
| introductiemechaniek | Eén rij licht op en projecteert naar één punt; daarna kiest de leerling zelf welke twee rijen voldoende zijn. |
| oefenmechaniek | Tik een tabelrij en plaats/confirm het corresponderende punt. Na minstens twee punten commit de leerling de lijn; overige rijen worden tests. |
| bewijsmechaniek | Niet-opeenvolgende x, negatieve waarden, een rij die buiten het zichtvenster vraagt om schaalkeuze, en eventueel één inconsistente rij als diagnosechallenge. |
| intuïtieve antwoordvorm | Pinned tabel + rooster, maximaal twee kaarten tegelijk, tap-row/tap-point alternatief voor drag. |
| wat vóór commit verborgen blijft | Correctheidskleur, referentieghost en derde-puntuitkomst. |
| causale feedback | Causale lijnen koppelen rij en punt. Een verkeerde kolomvolgorde of één defecte rij wordt afzonderlijk gemarkeerd. |
| misconceptiehypotheses | x/y wisselen; tabel als twee losse reeksen lezen; alleen eerste en laatste getal koppelen; rechte aannemen ondanks inconsistente rij. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Welke x en y horen samen?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Neem beide coördinaten uit dezelfde tabelkolom.” H4 parallel completion: Kolom (2,5): x=2 ligt vast; plaats y. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Een geldig geplaatst punt; oorspronkelijke tabel blijft intact. |
| near-transfer | Derde rij wordt hidden test; inconsistente rij pas na nieuw authoringcontract. |
| far-transfer | Leid daarna formule of verborgen rij af zonder dezelfde visuele koppellijnen. |
| hidden-case | Een extra rij moet exact op de geconstrueerde rechte liggen. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Pinned tabel + rooster, maximaal twee kaarten tegelijk, tap-row/tap-point alternatief voor drag. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(graph_from_table, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Nieuwe route verwijdert inconsistent-table cases; oude drafts behouden legacy. Geen table verdict in huidige variant. |

## rewrite_linear_equation

**Actuele generator:** wave-core.js: algebraGenerate including horizontal/vertical expressions.
**Actuele validator / UI:** operate/equivalent/isolated/algebraCheck; algebra-ui/equation-editor.
**Nog niet ondersteund / migratiegrens:** Typed linear coefficients, geen algemene parser voor haakjes of vermenigvuldigen; geen inequations.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `rewrite_linear_equation` |
| family_id | F8 |
| leerclaim | De leerling herschrijft een lineaire vergelijking naar een doelvorm via lokaal geldige equivalente transformaties. |
| primaire cognitieve handeling | Equivalentie bewaren terwijl een doelvorm wordt opgebouwd. |
| introductiemechaniek | Een balansmodus toont één keer waarom dezelfde bewerking op beide leden nodig is. Daarna verschuift de nadruk naar de symbolische structuur. |
| oefenmechaniek | Tik een term/chunk om maximaal vier contextueel geldige moves te zien. Kies een move, voorspel de volgende vorm en commit. Stapgeschiedenis/undo blijft zichtbaar. |
| bewijsmechaniek | Meerdere oplossingsroutes, negatieve coëfficiënten, haakjes en breuken. Hidden waardentest of oplossingsset-test bevestigt equivalentie. Geen 'term naar andere kant slepen' zonder expliciete bewerking. |
| intuïtieve antwoordvorm | Eén expressieregel per scherm, typed AST, contextuele move tray, vertical fractions, math speech labels en undo. |
| wat vóór commit verborgen blijft | Geldigheid van leerlingstap tot commit; geen suggestie die eindvorm invult. |
| causale feedback | Toon de eerste divergentie tussen oude en nieuwe uitdrukking op een testwaarde of balans. Alleen de ongeldige stap wordt teruggedraaid. |
| misconceptiehypotheses | teken magisch veranderen; bewerking op één lid; distributiviteit vergeten; door nul delen; dubbele breuknotatie; doelvorm volgen zonder equivalentie. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Blijft dezelfde gelijkheid waar?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Voer dezelfde geldige bewerking op beide leden uit.” H4 parallel completion: 2y=4x+6: deel beide leden door 2; vul constante. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Alle equivalente voorafgaande toestanden plus undo history. |
| near-transfer | Andere eliminatievolgorde, verticale x=c en hidden waardetest. |
| far-transfer | Zelfde structuur in andere vergelijking of gebruik de herleide vorm om een grafiek/snijpunt te bepalen. |
| hidden-case | Onafhankelijke oplossingsrelatiecheck na andere eliminatievolgorde. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Eén expressieregel per scherm, typed AST, contextuele move tray, vertical fractions, math speech labels en undo. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(rewrite_linear_equation, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Typed linear coefficients, geen algemene parser voor haakjes of vermenigvuldigen; geen inequations. |

## input_from_output

**Actuele generator:** wave-core.js: algebraGenerate; negative/fraction/all/none.
**Actuele validator / UI:** subOutput/algebra/verifyInput or constantSolutions/constantVerify.
**Nog niet ondersteund / migratiegrens:** Geen domeingebonden context; parser lineair beperkt; all/none ondersteund.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `input_from_output` |
| family_id | F4 |
| leerclaim | De leerling vindt een input die een gegeven output oplevert en gebruikt inverse bewerkingen of een equivalent model. |
| primaire cognitieve handeling | Input-outputrelatie uitvoeren, omkeren of controleren. |
| introductiemechaniek | Toon de functieketen vooruit, maar bedek de input. De leerling plant de inverse volgorde en stelt een input voor; daarna loopt de chip vooruit als verificatie. |
| oefenmechaniek | Constructed response met exact-value composer. Een optionele `keer om`-weergave toont inverse modules pas na een eerste poging of hint. |
| bewijsmechaniek | Geen meerkeuze. Negatieve/fractionele oplossingen, output die geen integer input geeft en contextuele domeinbeperking. Forward hidden run verifieert. |
| intuïtieve antwoordvorm | Exact inputslot plus optionele geordende inverse-operatiechips; commit en forward test. |
| wat vóór commit verborgen blijft | Berekende output, inverse oplossing of membership verdict. |
| causale feedback | Vergelijk doeloutput met berekende output en markeer de eerste inverse stap die verkeerd was. Laat de kandidaatinput staan. |
| misconceptiehypotheses | bewerkingen in dezelfde volgorde ongedaan maken; tekenfout; b delen in plaats van aftrekken; oplossing buiten contextdomein negeren. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Is input of output gegeven?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Maak optelling en vermenigvuldiging in inverse volgorde ongedaan.” H4 parallel completion: 2x+3=11: 2x=8; vul x. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Correcte substitutie en equivalente herleidingsprefix. |
| near-transfer | a=0 met bereikbare/onbereikbare uitvoer; inverse input in tabel. |
| far-transfer | Dezelfde inverse vraag via tabel, grafiek of context, zonder aangeboden kandidaten. |
| hidden-case | Constante functie met onbereikbare doeloutput. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Exact inputslot plus optionele geordende inverse-operatiechips; commit en forward test. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(input_from_output, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Geen domeingebonden context; parser lineair beperkt; all/none ondersteund. |

## point_on_line

**Actuele generator:** wave-core.js: algebraGenerate; on/off/constant and representation variants.
**Actuele validator / UI:** subPoint/pointValue/pointVerdict via algebraCheck.
**Nog niet ondersteund / migratiegrens:** Geen vrije keuze reparatiecoördinaat; dichtbij liggend verkeerd punt wel exact beoordeeld.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `point_on_line` |
| family_id | F4 |
| leerclaim | De leerling controleert of een punt voldoet aan het voorschrift door input en output consistent te vergelijken. |
| primaire cognitieve handeling | Input-outputrelatie uitvoeren, omkeren of controleren. |
| introductiemechaniek | Plaats x van het punt in de functie en zet berekende y naast de gegeven y-coördinaat. Laat de leerling de vergelijking interpreteren. |
| oefenmechaniek | De leerling kiest een testmethode (substitutie of grafiekprobe), voert de relevante waarde in en commit daarna `ligt erop`/`ligt er niet op`. |
| bewijsmechaniek | Geen kale ja/nee-gok: een berekende output of gemarkeerde mismatch is verplicht. Gebruik punten met juiste x maar nabije verkeerde y en schaalvarianten. |
| intuïtieve antwoordvorm | Twee-resultatenbank met equality toggle en semantische ja/nee-uitspraak. |
| wat vóór commit verborgen blijft | Berekende output, inverse oplossing of membership verdict. |
| causale feedback | Een verticale proeflijn laat berekend punt en gegeven punt naast elkaar zien; afstand/mismatch krijgt een label. |
| misconceptiehypotheses | alleen x of y controleren; puntcoördinaten omwisselen; bijna-op-de-lijn als juist; formulewaarde verkeerd berekenen. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Welke coördinaat voer je in?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Bereken f(x) en vergelijk met de gegeven y.” H4 parallel completion: y=2x+1, P(3,8): berekend 7; vergelijk. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Correct berekende uitvoer; alleen verdict of verkeerde coördinaat herstellen. |
| near-transfer | Repareer y en controleer tweede punt met dezelfde x. |
| far-transfer | Repareer minimaal één coördinaat zodat het punt wel op de lijn ligt, of controleer via een andere representatie. |
| hidden-case | Punt dat visueel bijna maar exact niet op de rechte ligt. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Twee-resultatenbank met equality toggle en semantische ja/nee-uitspraak. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(point_on_line, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Geen vrije keuze reparatiecoördinaat; dichtbij liggend verkeerd punt wel exact beoordeeld. |

## zeroRead

**Actuele generator:** index.html: generate(zeroRead); nonzero slope, integer root, value/point.
**Actuele validator / UI:** renderZeroRead / zeroReadError / pair equality.
**Nog niet ondersteund / migratiegrens:** Root voorgemarkeerd; geen horizontale all/none of asschaalvarianten.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `zeroRead` |
| family_id | F6 |
| leerclaim | De leerling leest de nulwaarde als de x-waarde waarvoor de grafiek de x-as snijdt en onderscheidt waarde van puntnotatie. |
| primaire cognitieve handeling | Grens en x-regio verbinden met nul en teken van uitvoer. |
| introductiemechaniek | Vraag eerst waar y=0 is; een horizontale lichtlijn op de x-as helpt één keer. Laat de leerling de crossing pinnen. |
| oefenmechaniek | Tik het x-asanker; kies daarna of de gevraagde vorm `x=r` of `(r,0)` is. Geen vooraf aangebrachte groene nulmarkering. |
| bewijsmechaniek | Dalende rechte, negatieve/0-nulwaarde, andere asschaal en horizontale lijnen met geen of alle nulpunten als grensgeval. |
| intuïtieve antwoordvorm | X-as-pin plus symbolisch slot; open response, geen opties. |
| wat vóór commit verborgen blijft | Nulwaardelabel, tekenkleur/patroon, juiste zijde en proefuitkomsten; ontdekking onthult grens pas na eigen rootcommit. |
| causale feedback | Na commit projecteert het kruispunt naar de x-as en toont `f(r)=0`. Bij punt/value-verwarring blijft locatie juist maar notatie wordt hersteld. |
| misconceptiehypotheses | y-waarde 0 als volledig antwoord geven; x/y-intercept verwarren; teken verliezen; elke lijn heeft precies één nulwaarde. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Op welke as is y nul?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Lees de x-waarde van het kruispunt met de x-as.” H4 parallel completion: Nulpunt (−4,0): vul alleen nulwaarde. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Juist x-anker; notatie los herstellen. |
| near-transfer | Dalende lijn met negatieve grens; horizontaal zonder/alle nulwaarden. |
| far-transfer | Lees nulwaarde uit tabel, formule of contextgrens. |
| hidden-case | Dalende lijn met root 0; horizontale lijn zonder kruising. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | X-as-pin plus symbolisch slot; open response, geen opties. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(zeroRead, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Root voorgemarkeerd; geen horizontale all/none of asschaalvarianten. |

## zero

**Actuele generator:** index.html: generate(zero); integer root, nonzero slope; random graph visibility.
**Actuele validator / UI:** renderZero/numericChoices/zeroError.
**Nog niet ondersteund / migratiegrens:** Geen fractionele nulwaarden; MC; geen herleidingsroute voor deze skill.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `zero` |
| family_id | F6 |
| leerclaim | De leerling berekent de nulwaarde door f(x)=0 op te lossen en verifieert de oplossing. |
| primaire cognitieve handeling | Grens en x-regio verbinden met nul en teken van uitvoer. |
| introductiemechaniek | Een doelpoort vraagt output 0. De leerling bouwt de vergelijking en draait de functieketen om; grafiek is achteraf controle. |
| oefenmechaniek | Stapeditor `0=ax+b` → lokale geldige transformaties → `x=r`. De leerling kan ook een kandidaatinput testen, maar slechts na een gecommitte redenering. |
| bewijsmechaniek | Grafiek niet standaard zichtbaar; negatieve/fractionele wortels, a≠1 en b=0. Forward hidden verification f(r)=0. |
| intuïtieve antwoordvorm | Compacte rewrite-editor en exact-value slot; optionele grafiekcheck. |
| wat vóór commit verborgen blijft | Nulwaardelabel, tekenkleur/patroon, juiste zijde en proefuitkomsten; ontdekking onthult grens pas na eigen rootcommit. |
| causale feedback | Toon welke algebraïsche stap of tekenkeuze de output niet nul maakte. Behoud correcte herleidingsstappen. |
| misconceptiehypotheses | r=b; minteken vergeten; delen door b; nulwaarde als y=0 zonder x-oplossing; grafische nabijheid als exact. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Welke uitvoer moet nul worden?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Stel ax+b=0, maak x vrij en controleer vooruit.” H4 parallel completion: 0=2x−5: 2x=5; vul x. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Correcte equivalente stappen en doeloutput 0. |
| near-transfer | Fractionele wortel zonder grafiek; hetzelfde grensgetal in intervaltaak. |
| far-transfer | Zelfde grens in tekenvraag of context zoals break-even. |
| hidden-case | Fractionele wortel zonder grafiek, exact forward test. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Compacte rewrite-editor en exact-value slot; optionele grafiekcheck. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(zero, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Geen fractionele nulwaarden; MC; geen herleidingsroute voor deze skill. |

## sign

**Actuele generator:** index.html: generate(sign); nonzero slope, positive/negative ask.
**Actuele validator / UI:** renderSign: lt/gt/eq choice; sign.wrongSide/zeroOnly.
**Nog niet ondersteund / migratiegrens:** Difficulty 0 lekt root, kleuren, +/−; geen intervalconstructie, gesloten grens, horizontale variant.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `sign` |
| family_id | F6 |
| leerclaim | De leerling bepaalt voor welke x-waarden f(x)>0 of f(x)<0 door grafiekhoogte aan domeinintervallen te koppelen. |
| primaire cognitieve handeling | Grens en x-regio verbinden met nul en teken van uitvoer. |
| introductiemechaniek | Nadat de nulwaarde gevonden is, kiest de leerling een x-gebied op een intervalstrook. Twee verticale proeflijnen tonen na commit de bijbehorende y-hoogtes. |
| oefenmechaniek | Ongekleurde grafiek + x-as-intervalselector met open grenspunt. De leerling selecteert links/rechts/alles/geen en bouwt vervolgens de ongelijkheid. |
| bewijsmechaniek | Dalende rechte, negatieve grens, horizontale altijd-positief/negatief/nul, en een vraag met `<0` versus `>0`. Geen plus/mintekens of rood/blauw vóór antwoord. |
| intuïtieve antwoordvorm | Semantische intervalstrip met open/gesloten grensstate, regio-tap en symbolische chips `x`, `<`/`>`, `r`. |
| wat vóór commit verborgen blijft | Nulwaardelabel, tekenkleur/patroon, juiste zijde en proefuitkomsten; ontdekking onthult grens pas na eigen rootcommit. |
| causale feedback | Verticale probes maken zichtbaar waarom gekozen x-waarden boven/onder de x-as landen. Bij `x=r` wordt uitgelegd dat de waarde daar 0 is. |
| misconceptiehypotheses | positief is altijd rechts; nulwaarde als positief interval; strikte en niet-strikte grens verwarren; grafieksegment selecteren in plaats van x-waarden. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Zoek je één x of een heel gebied?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Test één x links en één rechts van de grens.” H4 parallel completion: y=−x+1: bij x=0 is y=1; kies die zijde. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Juiste grens, zelfstandige voorspelling; alleen zijde/openheid/symbool herstellen. |
| near-transfer | Dalende negatieve grens met omgekeerde vraag; constant all/none. |
| far-transfer | Andere oriëntatie of formule/tabel zonder vooraf getekende tekenzones. |
| hidden-case | Constante negatieve functie bij f(x)>0: geen x. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Semantische intervalstrip met open/gesloten grensstate, regio-tap en symbolische chips `x`, `<`/`>`, `r`. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(sign, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Difficulty 0 lekt root, kleuren, +/−; geen intervalconstructie, gesloten grens, horizontale variant. |

## signchart

**Actuele generator:** index.html: generate(signchart); root/sign mode, optional graph.
**Actuele validator / UI:** renderSignChart: bijective −,0,+ selection; root numericChoices.
**Nog niet ondersteund / migratiegrens:** Dwingt elk teken eenmaal; horizontale functies onmogelijk. Geen losse correct-slot repair.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `signchart` |
| family_id | F6 |
| leerclaim | De leerling construeert een tekenschema dat nulwaarde en tekens per interval correct combineert. |
| primaire cognitieve handeling | Grens en x-regio verbinden met nul en teken van uitvoer. |
| introductiemechaniek | Gebruik één sampleprobe in elk interval en laat de leerling de uitkomsten in drie zones plaatsen. |
| oefenmechaniek | Een lege horizontale signstrip met linkerinterval, grens en rechterinterval. De leerling plaatst `+`, `0`, `−`; de grafiek kan op verzoek gepind worden, niet automatisch. |
| bewijsmechaniek | Dalende/horizontale functies, negatieve grens en schema uit formule zonder grafiek. Geen kleur als enige betekenis. |
| intuïtieve antwoordvorm | Drie grote semantische slots met tekenchips, grenswaarde-editor en screenreader-tekst. |
| wat vóór commit verborgen blijft | Nulwaardelabel, tekenkleur/patroon, juiste zijde en proefuitkomsten; ontdekking onthult grens pas na eigen rootcommit. |
| causale feedback | Bij commit lopen drie proefinputs door de functie; foutieve zone krijgt de eerste contrasterende waarde. |
| misconceptiehypotheses | tekens omkeren; nul in interval plaatsen; grens vergeten; altijd `− 0 +` aannemen; horizontale lijn als één-nulpuntgeval. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Waar kan het teken veranderen?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Test één waarde in elke zone en de grens zelf.” H4 parallel completion: y=−x+2: links +, midden 0; vul rechts. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Correcte tekens per zone en juist grensgetal. |
| near-transfer | Schema uit formule, dalend en constante lijn; verborgen proefinput. |
| far-transfer | Van schema naar ongelijkheid of omgekeerd; hidden proefwaarde. |
| hidden-case | Constante nulfunctie: alle inputs nul, geen geïsoleerde grens. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Drie grote semantische slots met tekenchips, grenswaarde-editor en screenreader-tekst. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(signchart, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Dwingt elk teken eenmaal; horizontale functies onmogelijk. Geen losse correct-slot repair. |

## equation_from_ab

**Actuele generator:** wave-core.js: constructionGenerate; signed/fraction/horizontal.
**Actuele validator / UI:** constructionCheck formula a/variable/sign/b; construction-ui formulaBuilder.
**Nog niet ondersteund / migratiegrens:** Accepteert equivalent rationale en signed constant, geen vrije algebra-syntax of hidden input.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `equation_from_ab` |
| family_id | F7 |
| leerclaim | De leerling bouwt een correct en conventioneel functievoorschrift uit gegeven a en b. |
| primaire cognitieve handeling | Een model afleiden en op niet-gegeven input controleren. |
| introductiemechaniek | Parameterkaarten klikken in semantische slots `a·x + b`; het systeem toont equivalenten zoals a=1 of b=0 pas na de eerste bouw. |
| oefenmechaniek | Formula composer met exact rationale a/b, tekenbeheer en automatische maar uitlegbare normalisatie. De leerling commit en test één input. |
| bewijsmechaniek | a=−1, a=0, fractionele a, negatieve b en meerdere equivalente notaties. Hidden input certificeert de regel. |
| intuïtieve antwoordvorm | Typed formula slots en chips, geen vrij toetsenbord als standaard; accepteer wiskundig equivalente syntax. |
| wat vóór commit verborgen blijft | Juiste a/b-kaarten, gegenereerde referentielijn en hidden input-output. |
| causale feedback | De moduleketen toont of rate of startwaarde verkeerd werd geplaatst. Correcte parameter blijft vast. |
| misconceptiehypotheses | a/b wisselen; plus negatieve b; 1x/0 verkeerd vereenvoudigen; x vergeten. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Waar hoort verandering per x?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Plaats a vóór x en b als constante.” H4 parallel completion: a=−1,b=3: vul coefficient vóór x. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Juiste coefficient / teken-constantpaar. |
| near-transfer | a=−1, b=0, horizontaal; hidden input buiten voorbeeld. |
| far-transfer | Voorspel grafiekkenmerken of vul een tabel met het gebouwde voorschrift. |
| hidden-case | Hidden input met a=0 en negatieve b. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Typed formula slots en chips, geen vrij toetsenbord als standaard; accepteer wiskundig equivalente syntax. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(equation_from_ab, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Accepteert equivalent rationale en signed constant, geen vrije algebra-syntax of hidden input. |

## intercept_from_point

**Actuele generator:** wave-core.js: generate; model from bounded points.
**Actuele validator / UI:** subA/subPoint/ax/b/formulaA/formulaB; pointEquation + check/operate.
**Nog niet ondersteund / migratiegrens:** Naam claimt b maar route eindigt hele formule; arithmetic moveConstant is shortcut; geen hidden tweede input.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `intercept_from_point` |
| family_id | F7 |
| leerclaim | De leerling bepaalt b uit een gegeven helling en één punt door geldige substitutie en herleiding. |
| primaire cognitieve handeling | Een model afleiden en op niet-gegeven input controleren. |
| introductiemechaniek | Plaats de puntcoördinaten expliciet in `y=ax+b`; b blijft het enige onbekende object. |
| oefenmechaniek | Substitutiechips → compacte balance/rewrite-stap → b-slot. De leerling kiest eventueel welk deel eerst wordt berekend. |
| bewijsmechaniek | Negatieve coördinaten, fractionele a en b, en punten waarvoor tussenstappen niet integer zijn. Hidden puntcontrole. |
| intuïtieve antwoordvorm | Semantisch substitution board en lokale operatiekeuzes, verticale breuken. |
| wat vóór commit verborgen blijft | Juiste a/b-kaarten, gegenereerde referentielijn en hidden input-output. |
| causale feedback | Markeer of x/y verkeerd ingevuld, product ax fout, of inverse stap fout was. Correcte substitutie blijft behouden. |
| misconceptiehypotheses | x en y wisselen; b=y−a in plaats van y−ax; tekenfout; punt als (b,a) lezen. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Welke gegevens vul je in y=ax+b in?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Gebruik x en y van hetzelfde punt; bereken y−ax.” H4 parallel completion: a=2,P(3,7): ax=6; vul b. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | a, geselecteerd punt, juist ax en equivalente b-stappen. |
| near-transfer | Punt met negatieve x en breukhelling; tweede input. |
| far-transfer | Gebruik het gevonden b om formule/grafiek te bouwen en een tweede punt te voorspellen. |
| hidden-case | Nieuwe input na substitutie met negatieve punt-x. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Semantisch substitution board en lokale operatiekeuzes, verticale breuken. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(intercept_from_point, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Naam claimt b maar route eindigt hele formule; arithmetic moveConstant is shortcut; geen hidden tweede input. |

## equation_from_point_slope

**Actuele generator:** wave-core.js: generate; exact affine models.
**Actuele validator / UI:** same subA/subPoint/ax/b/formulaA/formulaB; wave-ui/equation-editor.
**Nog niet ondersteund / migratiegrens:** subPoint is in actuele task verplicht A; geen puntslope-inputparser of units.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `equation_from_point_slope` |
| family_id | F7 |
| leerclaim | De leerling stelt y=ax+b op uit helling en een punt en controleert het model. |
| primaire cognitieve handeling | Een model afleiden en op niet-gegeven input controleren. |
| introductiemechaniek | Maak de route zichtbaar: a is gegeven → gebruik punt om b te vinden → bouw formule → test hetzelfde punt. |
| oefenmechaniek | Geïntegreerde tweefasewerkbank, geen vier losse quizscreens. Correct berekende a-kaart blijft aanwezig terwijl b wordt afgeleid. |
| bewijsmechaniek | Punt met x≠0, negatieve/fractionele waarden en een contextunit. Hidden tweede input. |
| intuïtieve antwoordvorm | Routekaart + substitution board + typed formula composer. |
| wat vóór commit verborgen blijft | Juiste a/b-kaarten, gegenereerde referentielijn en hidden input-output. |
| causale feedback | De formule runt op het gegeven punt; eerste afwijkende module wordt getoond. |
| misconceptiehypotheses | punt rechtstreeks als b nemen; a/b wisselen; y−a·x verkeerd; alleen puntslopevorm half afwerken. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Welke parameter is al bekend?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Behoud a en leid b met het punt af.” H4 parallel completion: a=1/2,P(2,4): ax=1; vul b. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Gegeven a, punt en juiste b-afleiding. |
| near-transfer | Zelfde gegevens als tabelrij; hidden niet-gegeven input. |
| far-transfer | Zelfde gegevens in puntslopevorm of grafiek, en een hidden punt. |
| hidden-case | Niet-gegeven input met fractionele uitvoer. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Routekaart + substitution board + typed formula composer. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(equation_from_point_slope, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: subPoint is in actuele task verplicht A; geen puntslope-inputparser of units. |

## equation_from_two_points

**Actuele generator:** wave-core.js: generate; all affine + vertical/identical at d2.
**Actuele validator / UI:** ys/xs/a/point/ax/b/formulaA/formulaB/verifyA/verifyB.
**Nog niet ondersteund / migratiegrens:** Controleert twee reeds gegeven punten, geen hidden derde punt; verticale/identieke classificatie bestaat.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `equation_from_two_points` |
| family_id | F7 |
| leerclaim | De leerling leidt een lineair voorschrift af uit twee punten via een consistente en controleerbare route. |
| primaire cognitieve handeling | Een model afleiden en op niet-gegeven input controleren. |
| introductiemechaniek | Laat twee geldige routes toe: helling en b via punt 1 of punt 2. Beide moeten hetzelfde model opleveren. |
| oefenmechaniek | Bouw Δy/Δx, vereenvoudig a, kies één punt voor b, composeer formule. Een progressieve spine toont maximaal de huidige en vorige stap. |
| bewijsmechaniek | Niet-opeenvolgende/negatieve x, fractionele a, horizontale lijn en omgekeerde puntvolgorde. Hidden derde punt. |
| intuïtieve antwoordvorm | Slope builder + point-choice + substitution + formula composer, met undo. |
| wat vóór commit verborgen blijft | Juiste a/b-kaarten, gegenereerde referentielijn en hidden input-output. |
| causale feedback | Bij fout blijft de correcte prefix van de route staan; het systeem lokaliseert component, b-afleiding of formulecompositie. |
| misconceptiehypotheses | gemengde aftrekvolgorde; Δx/Δy; één coördinaat als b; beide punten niet controleren; verticale punten als lineaire functie behandelen. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Volgen beide punten dezelfde regel?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Vind rate; kies A of B voor b.” H4 parallel completion: A(0,1),B(2,5): a=2; vul b. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Consistente richting, a, gekozen A of B en juiste substitutieprefix. |
| near-transfer | Gebruik B voor b, omgekeerde puntvolgorde, hidden derde punt. |
| far-transfer | Zelfde twee punten als tabel of grafiek; valideer derde punt. |
| hidden-case | Derde punt dat niet één van de gegeven punten is. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Slope builder + point-choice + substitution + formula composer, met undo. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(equation_from_two_points, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Controleert twee reeds gegeven punten, geen hidden derde punt; verticale/identieke classificatie bestaat. |

## equation_from_graph

**Actuele generator:** transfer-workbench-core.js generate transferVersion=2; fractional/offscreen.
**Actuele validator / UI:** matchGraph validates a then b exactly; parameter swipes in workbench-ui.
**Nog niet ondersteund / migratiegrens:** Actuele route is a/b tunen; geen routekeuze of graph-point derivation zoals oude transfer drafts.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `equation_from_graph` |
| family_id | F7 |
| leerclaim | De leerling kiest bruikbare informatie uit een grafiek en bouwt het bijbehorende voorschrift. |
| primaire cognitieve handeling | Een model afleiden en op niet-gegeven input controleren. |
| introductiemechaniek | Bied twee strategieën: lees b en één stap, of kies twee duidelijke roosterpunten. Laat de leerling zelf de route kiezen. |
| oefenmechaniek | Pin maximaal twee meetpunten of één intercept plus slope triangle; daarna a/b-afleiding en formulecomposer. |
| bewijsmechaniek | Offscreen of niet-integer b waar twee-puntenroute beter is; andere schaal; horizontale lijn. Hidden input uit semantisch model. |
| intuïtieve antwoordvorm | Routekeuzeknop, semantische point pins en formula composer. |
| wat vóór commit verborgen blijft | Juiste a/b-kaarten, gegenereerde referentielijn en hidden input-output. |
| causale feedback | De gebouwde formule tekent een ghostlijn; afwijking wordt aan slope of intercept gekoppeld, niet alleen als pixelafstand. |
| misconceptiehypotheses | visuele hoek gebruiken zonder schaal; x-intercept als b; twee niet-collineaire punten; lijnhoogte als a. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Welke exacte roosterpunten helpen?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Lees b/rate, of gebruik twee punten als b buiten beeld ligt.” H4 parallel completion: (1,3),(3,7): a=2; vul b. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Juiste coefficient; oorspronkelijke grafiek en gebruikte meetpunten. |
| near-transfer | Offscreen b: twee-puntenroute; hidden input zonder grafiek. |
| far-transfer | Voorspel tabel/contextwaarde zonder grafiek en herstel een defecte formulekaart. |
| hidden-case | Input buiten de meetpunten, met offscreen b. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Routekeuzeknop, semantische point pins en formula composer. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(equation_from_graph, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Actuele route is a/b tunen; geen routekeuze of graph-point derivation zoals oude transfer drafts. |

## equation_from_table

**Actuele generator:** transfer-workbench-core.js consistent rows; some x=0, some not.
**Actuele validator / UI:** tableB/slopeFraction/tableA/installA/pointX/Y/product/solveB/installB.
**Nog niet ondersteund / migratiegrens:** Inconsistent tables removed from active generator; geen hidden fourth row.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `equation_from_table` |
| family_id | F7 |
| leerclaim | De leerling gebruikt tabelparen om constante verandering, a en b af te leiden en een regel te generaliseren. |
| primaire cognitieve handeling | Een model afleiden en op niet-gegeven input controleren. |
| introductiemechaniek | Laat de leerling twee rijen kiezen die informatie leveren; maak expliciet dat a=Δy/Δx, ook wanneer Δx≠1. |
| oefenmechaniek | Rij-pin → slope builder → b via één rij → formula composer. Niet alle tussenstappen worden als aparte vraag beoordeeld. |
| bewijsmechaniek | Onregelmatige x-afstanden, negatieve waarden, meerdere geldige rijparen en hidden rij. Een niet-lineaire tabel kan later als modelselectiechallenge voorkomen. |
| intuïtieve antwoordvorm | Tabel met pinbare rijen, compact derivation tray en exact formula slots. |
| wat vóór commit verborgen blijft | Juiste a/b-kaarten, gegenereerde referentielijn en hidden input-output. |
| causale feedback | Geef aan bij welk rijpaar of welke voorspelde hidden rij de regel faalt. |
| misconceptiehypotheses | verschil in y als a nemen; b als eerste y; kolompatroon zonder verhouding; slechts één rij gebruiken. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Zijn x-afstanden even groot?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Deel Δy door bijbehorende Δx en gebruik een rij voor b.” H4 parallel completion: (1,4),(3,8): a=2; vul b. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Correcte a, gekozen rij en equivalente b-stappen; consistente column identity. |
| near-transfer | Onregelmatige x-afstand zonder x=0; derde/vierde onafhankelijke rij. |
| far-transfer | Maak grafiek of contextvoorspelling met de regel. |
| hidden-case | Vierde rij met onregelmatige afstand, geen x=0. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Tabel met pinbare rijen, compact derivation tray en exact formula slots. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Definitie op verzoek, niet als permanente uitleg. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(equation_from_table, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Inconsistent tables removed from active generator; geen hidden fourth row. |

## equation_from_context

**Actuele generator:** transfer-core.js legacy taxi/tank/parking; units/domain/two-situations.
**Actuele validator / UI:** transfer check contextZero/Test/Domain; DISABLED in workbench-core.
**Nog niet ondersteund / migratiegrens:** Niet actief: C.disabledSkills, C.order/requirements removed. Geen stille reactivering; units/taallast eerst leerlingtoetsen.

| Veld | Ontwerp en toetsbare claim |
|---|---|
| skill_id | `equation_from_context` |
| family_id | F7 |
| leerclaim | De leerling vertaalt een betekenisvolle startwaarde en verandering per eenheid naar een lineair model, met correct domein en eenheden. |
| primaire cognitieve handeling | Een model afleiden en op niet-gegeven input controleren. |
| introductiemechaniek | Gebruik een `contractstrip`: wat is x, wat is y, welke unit hoort bij elke grootheid? Laat daarna starttoestand en verandering afzonderlijk aanwijzen. |
| oefenmechaniek | Plaats contextkaarten in `start` en `per x`-slots, bouw formule en commit een voorspelling voor één concrete situatie. |
| bewijsmechaniek | Context blijft gedurende de hele taak functioneel; vaste kost versus rate, negatieve/afnemende context, gehele domeinbeperking en hidden nieuw scenario. Deze skill pas activeren nadat de huidige disabled/paused status en contentkwaliteit zijn geaudit. |
| intuïtieve antwoordvorm | Korte context, contractstrip, semantische unitcards en formula composer; lage taallast. |
| wat vóór commit verborgen blijft | Juiste a/b-kaarten, gegenereerde referentielijn en hidden input-output. |
| causale feedback | De formule bestuurt een concrete simulatie/tabel. Unit mismatch, herhaald optellen van startkost of verkeerd domein wordt apart benoemd. |
| misconceptiehypotheses | startwaarde per eenheid toevoegen; rate en totaal verwarren; x/y niet definiëren; lineair model buiten geldig domein toepassen. Zie MISCONCEPTION_CATALOG; patronen zijn hypotheses, geen leerlinglabels. |
| hintladder | H1 “Wat is start en wat is per eenheid?” H2 omrand de betrokken as/relatie zonder antwoord. H3 “Definieer x/y met units; scheid vaste kost en rate.” H4 parallel completion: 4 euro start plus 2 euro/km: bij 3km is ratebijdrage 6; vul totaal. H5 volledig ander-getallenvoorbeeld, daarna nieuwe zelfstandige variant. |
| wat na fout behouden blijft | Historische state/data, unitdefinities en correcte start/rate mapping. |
| near-transfer | Afname met domeingrens; andere eenheid en hidden binnen-domein input. |
| far-transfer | Zelfde model in grafiek/tabel of gewijzigde eenheid/context. |
| hidden-case | Nieuwe input binnen domein met andere units; blijft gepauzeerd. Uitkomst verborgen tot eigen commit. |
| toegankelijk alternatief | Korte context, contractstrip, semantische unitcards en formula composer; lage taallast. Native gelabelde controls, 44–48 px targets; tap/stepper en toetsenbord zijn volledig; geen drag vereist; antwoord kan zonder kleur. |
| taallast | Laag: één korte nl-BE opdrachtzin; exacte wiskunde met verticale breuken, spreeklabel en komma. Contextunits en domein blijven zichtbaar; taalbelasting nog valideren. |
| UI-ruis die evidence niet mag beïnvloeden | Tikmisser, ongeldige syntax, afgekapt label, annulering, viewport/rotatie of assistieve bediening → interaction_error; geen foutcode of masteryverlies. Geen tijd/click/pointertracking als begrip. |
| events/evidence | commit(equation_from_context, taskFeature, semanticResponse), test(result), repair(component), hint(level), hidden_commit, transfer_result; task/commit-idempotent; zelfstandig alleen eerste niet-ondersteunde nieuwe variant; production planner ongewijzigd. |
| kill criteria | Herontwerp bij >30% blind tunen, >10% accidental actions, geen betere transfer dan eenvoudige controle, antwoordlekkage, scroll op 640×360, of verlies van correct deelwerk. Specifieke auditkloof: Niet actief: C.disabledSkills, C.order/requirements removed. Geen stille reactivering; units/taallast eerst leerlingtoetsen. |

## Bestaande regressiebronnen

- `tests/rechten-wave.test.cjs`: 3.600 taken; exacte modellen, beide aftrekvolgorden, bijzondere lijnen, migratie en behouden deelwerk.
- `tests/rechten-construction.test.cjs`: 1.800 taken, alle zichtbare geldige puntenparen, schaal, formuletekens en migratie.
- `tests/rechten-algebra.test.cjs`: 1.800 taken, equivalente bewerkingsvolgorden, constante inverse problemen, membership en geen dataverlies.
- `tests/rechten-transfer.test.cjs` en `rechten-transfer-workbench.test.cjs`: legacy drafts versus actuele routes, 1.800 moderne taken, rijidentiteit, behouden a/b en gepauzeerde context.
- Browserbestanden met dezelfde prefixes: touch, keyboard, compact layout, hervatten en antwoordflow. Geen huidige test bewijst de nieuwe faultcase, verborgen intervals, begrip of leerlingusability.
