# Rechtentrainer — Wave 3: algebra en puntcontrole

De trainer telt nu 23 vaardigheden: elf historische IDs en twaalf nieuwe. Deze wave bouwt op Wave 2 voort op branch `feat/rechten-wave-3`. Toegevoegd: `rewrite_linear_equation`, `input_from_output` en `point_on_line`. Puntcontrole is meegenomen omdat die de substitutie en eindcontrole uit de eerdere waves zelfstandig meetbaar maakt.

## Leerlijn

De eerder goedgekeurde hoofdroute blijft:

`point → point_plot → delta → slope → slope_from_two_points → line_behavior → special_lines → intercept → ab → equation_from_ab → intercept_from_point → equation_from_point_slope → equation_from_two_points`

Nieuwe zijtakken:

| Skill | Prerequisites |
| --- | --- |
| `rewrite_linear_equation` | `equation_from_ab` |
| `input_from_output` | `fx`, `rewrite_linear_equation` |
| `point_on_line` | `fx`, `point` |

Algemene herleiding blokkeert `intercept_from_point` niet. De bestaande toegang blijft permanent behouden; de elf oude vaardigheden behouden hun betekenis en scores. De introductievolgorde voegt de drie nieuwe vaardigheden na `fx` in. De bestaande toepassingentak blijft toegankelijk volgens zijn eerdere voorwaarden. De bereikbaarheidstest doorloopt alle 23 vaardigheden.

## Werkvormen en voorbeelden

| Skill | Voorbeeld | Handeling en diagnose |
| --- | --- | --- |
| `rewrite_linear_equation` | `2x − 4y = 8 → y = ½x − 2` | Kies optellen/aftrekken met een x-term, y-term of getal, of deel beide volledige leden door een niet-nulle factor. Zowel eerst delen als eerst x wegwerken is geldig. Exacte equivalentie wordt bewaakt. Vroegtijdig afronden en delen door nul worden afgewezen zonder verlies van de geldige regel. Eindig met functie/verticale rechte. |
| `input_from_output` | `f(x)=2x+1`, uitvoer 7 → `x=3`; `f(x)=4`, uitvoer 4 → alle reële x; uitvoer 5 → geen x | Plaats de uitvoer, isoleer x via dezelfde bewerkingscontrols en vul x terug in de oorspronkelijke formule in. Constante functies vragen een conclusie én controle van de constante uitvoer. Een tabelvariant gebruikt dezelfde skill. |
| `point_on_line` | `f(x)=2x−3`: P(4;5) ligt erop, P(4;6) ligt ernaast | Kies de x-coördinaat, bereken de uitvoer en vergelijk die met de gegeven y. Een fout in de conclusie wist de correcte berekening niet. Het resultaat toont bij een fout punt de exacte verticale afstand. |

Herleiden: niveau 1 één eliminatie; niveau 2 delen/mintekens; niveau 3 breuken, termen op beide leden, horizontale en verticale rechten. Ontbrekende x: positief geheel → negatief → fractioneel en constante functies. Puntcontrole: correcte punten → gemengde juiste/foute punten → breuken, constante functies en aanvullende tabel/grafiekweergave. De formule blijft bij die laatste weergaven beschikbaar: zelfstandig voorschrift uit grafiek/tabel hoort bij de volgende transferwave.

De nieuwe algebra-interface gebruikt tikbare bewerkingstokens en de gedeelde 3×5-getalbediening met expliciete teller/noemer. Er zijn geen tekstvelden of native toetsenborden. De oorspronkelijke vergelijking en huidige regel blijven zichtbaar. Undo bewaart maximaal 24 geldige stappen; gekozen bewerking en ingevoerde breuk worden met het concept opgeslagen. Annuleren verandert de vergelijking niet. Er is geen vlotheidstimer of automatische doorgang. Hulp of herstel geeft geen zelfstandig masterybewijs. Eén opgave telt één primaire poging; deelstappen worden alleen diagnostisch geregistreerd.

## Opslag en uitrol

Stateversie **703**, catalogusversie **3**. De huidige lokale slotnaam eindigt op `:wave3`; inlezen valt terug op `:wave2`, `:wave1` en de oudere slots. Dit geldt ook voor accountgebonden caches. Migratie bewaart oude scores, XP, reviews, onbekende skillvelden en onafgewerkte opgaven. Nieuwe skills beginnen leeg. Vóór migratie wordt een backup met suffix `:pre-wave-3` gemaakt. Writes van oude tabbladen kunnen de nieuwe lokale slot niet overschrijven.

`supabase_rechten_wave3.sql` omvat alle drie waves. Het behoudt accountautorisatie, payloadlimieten, de lock per account en revisieconflicten; het valideert de extra skills bij versie 703 en weigert downgrade-writes. De kandidaat is uitsluitend als tijdelijke functie op tijdelijke tabellen getest binnen BEGIN/ROLLBACK. Geen echte leerlinggegevens of blijvende databaseobjecten zijn gewijzigd. De beveiligingsinstellingen zijn vergeleken met de [Supabase-documentatie voor databasefuncties](https://supabase.com/docs/guides/database/functions).

**Nog niet uitgerold.** Pas vóór frontendpublicatie het Wave 3-SQL-script toe en controleer daarna online bewaren en hervatten. Wave 1/2 hoeven niet afzonderlijk als tussentijdse serverupdate te worden toegepast.

## Uitgevoerde verificatie

- `node tests/rechten-algebra.test.cjs`: zes tests; 1.800 taken over drie skills en drie niveaus, beide bewerkingsvolgordes, onafhankelijke BigInt-controle van de relaties, volledige variantdekking, auditvoorbeelden, ongeldige bewerkingen, pure migratie en undo na JSON-herladen.
- `node tests/rechten-algebra-browser.cjs`: alle drie skills en niveaus op 640×360 en 780×360, muis/touch, pointercancel, undo, negatieve/fractionele waarden, verticale en constante gevallen, tabel/grafiekweergave, deelherstel, hulp/DEV/navigatie, herladen, eenmalige scoring en de echte lokale v702→703-laadroute. Een duurtest van 450 algebraopgaven blijft rond 159 kB, onder 256 KiB. Geen overlap, te kleine knoppen, gameplay-scroll of native invoervelden.
- Wave 1-generatorregressies: 3.600 taken; Wave 2-generatorregressies: 1.800 taken. Beide bestaande mobiele suites slagen; de Wave 1-suite omvat ook 6.600 historische taken en 33 oude skill/niveau-rendercombinaties, oude lokale versies, fictieve accountcaches, offline writes en revisieconflicten.
- `node tests/trainer-teacher-browser.cjs`: leerkrachttoegang, oefenen en terugkeer slagen.
- `node tests/account-progress-browser.cjs`: bestaande account-, offline-, conflict- en hervatregressies met fictieve accounts slagen.
- `node --test tests/*.test.cjs`: alle 16 testbestanden slagen. Cataloguscheck en `git diff --check` slagen.
- `node scripts/build-rechten-db-test.cjs --wave3`: kandidaat getest op 700→701→702→703, verplichte skills, revisies, oude clients met actuele revisie en accountbinding. Alles slaagt op tijdelijke fixtures.

## Gewijzigde bestanden

Productiecode: `games/rechten/trainer/index.html`, `wave-core.js`, `wave-ui.js`, `wave.css`; nieuw `algebra-ui.js`.

Opslag/testharnas: nieuw `supabase_rechten_wave3.sql` en `tests/rechten-algebra-database.sql`; aangepast `scripts/build-rechten-db-test.cjs`.

Tests: nieuw `tests/rechten-algebra.test.cjs`, `tests/rechten-algebra-helpers.cjs`, `tests/rechten-algebra-browser.cjs`; bestaande Wave 1/2-unit- en browsertests aangepast voor de huidige schema-/catalogusversie en hun oorspronkelijke testscope. Documentatie: dit verslag en `tests/README.md`.

## Open punten en vervolg

Fysieke Samsung A20-check en didactische kalibratie met leerlingen blijven open. Migratie is getest met synthetische snapshots; een toegestane geanonimiseerde echte snapshot blijft een aanvullende praktijkcheck. Online rooktest volgt pas na uitrol.

Nog vijf nieuwe skills tot de voorgestelde 28: `graph_from_table`, `equation_from_graph`, `equation_from_table`, `equation_from_context` en `information_sufficiency`. Die laatste blijft een latere, niet-blokkerende transfer/mastery-skill. Daarna volgen de audituitbreidingen van bestaande delta/fx/tabel/nulwaarde/tekenschema-oefeningen en minder ondersteuning bij gevorderde reconstructie.
