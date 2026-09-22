# RechtenTrainer — herziene volgorde en Wave 1

De expliciete gebruikerswijzigingen van 22 september 2026 vervangen de voorgestelde volgorde en bouwgolven uit `Axioma_RechtenTrainer_Audit_Skillmap_UX_v1.md`.

Doelvolgorde:

`point → point_plot → delta → slope → slope_from_two_points → line_behavior → special_lines → intercept → ab`

Daarna: `equation_from_ab → intercept_from_point → equation_from_point_slope → equation_from_two_points`.

`rewrite_linear_equation` is later een zelfstandige representatieroute naar `y=ax+b`, geen prerequisite voor b uit a en een punt. `information_sufficiency` is later transfer/mastery en blokkeert de hoofdroute niet.

Wave 1 implementeert uitsluitend de zes aangevraagde nieuwe skills. `point_plot` en `equation_from_ab` blijven ontwerpitems. Tot hun implementatie gaat de uitvoerbare route rechtstreeks van point naar delta, en van ab naar intercept_from_point. De elf bestaande IDs en hun historische handelingen blijven behouden. De bestaande toepassingsroute fx → table → zeroRead → zero → sign → signchart blijft beschikbaar naast de nieuwe keten.

Nieuwe prerequisite-relaties vragen introductie, vier pogingen, strength ≥0,42, minstens drie juiste antwoorden bij de laatste vier en geen open herstel. Vrijgegeven toegang wordt blijvend bewaard. Migratie bewaart ook de toegang volgens de oude regels en elke reeds geoefende/geïntroduceerde skill.

Algemene herleiding, nieuwe tabel-/grafiek-/contextreconstructie, grafiekconstructie en information_sufficiency vallen buiten deze wijziging.

## Uitgevoerde implementatie

Branch: `feat/rechten-wave-1`. Elf bestaande skills plus zes nieuwe: 17 actieve IDs. `slope` blijft helling uit gegeven verschillen; `ab` blijft gezamenlijke herkenning van a en b. Geen historische score wordt aan een nieuwe skill toegekend.

Uitvoerbare nieuwe route: `point → delta → slope → slope_from_two_points → line_behavior → special_lines → intercept → ab → intercept_from_point → equation_from_point_slope → equation_from_two_points`. De laatste skill vereist ook `slope_from_two_points`. Vanaf `ab` blijft daarnaast de oude toepassingenroute beschikbaar. Reeds bestaande toegang en elke eenmaal verleende nieuwe toegang blijven behouden, ook bij dalende strength.

De zes nieuwe skills gebruiken eigen state, exacte gereduceerde breuken, gecontroleerde variantcycli, stappenfeedback, poging-ID, variant/representatie/hulpregistratie en onafhankelijke dekkingsbewijzen. Fouten tellen pas bij afronding één primaire poging; correcties tellen niet opnieuw. Een b-fout in de tweepuntenopgave plant bovendien gericht herstel voor `intercept_from_point`, zonder de correcte a te wissen of de onderliggende slope-skill af te waarderen. Uitleg, voortgang, DEV-terugkeer en herladen bewaren het werk. De vlotheidstimer staat uit voor nieuwe taken; eindfeedback blijft staan tot Verder.

Invoer gebruikt maximaal drie rijen van vijf knoppen, aparte teller/noemerkeuze en geen invoervelden. Vergelijkingen worden exact als coëfficiënten beoordeeld; equivalente breuken worden geaccepteerd. Ook bestaande formules/antwoordkeuzes gebruiken nu de gedeelde breukrenderer, inclusief derden. Landscape wordt afgedwongen met minimum 640×360.

## Voorbeeldopgaven

Deze voorbeelden zijn reproduceerbaar met `seed:4`, niveau 3, variant 3 (bij special_lines variant 1).

| Skill | Gegevens en verwachte handeling |
| --- | --- |
| `slope_from_two_points` | A(1; 1/2), B(−1; 7/2): (7/2−1/2)/(−1−1) = −3/2. Ook de beide omgekeerde aftrekkingen zijn geldig. |
| `line_behavior` | Dezelfde punten, in deze volgorde aangeboden: dalend, want y daalt wanneer x toeneemt. |
| `special_lines` | A(2; −2), B(2; 3): verticaal → Δx=0 → x=2 → geen functie. Andere geplande varianten: gelijke y → a=0 → y=b → functie; identieke punten → geen unieke rechte. |
| `intercept_from_point` | a=−3/2 en A(1; 1/2): substitueer, ax=−3/2, b=2; controleer A. |
| `equation_from_point_slope` | Dezelfde a en A: bereken b=2, bouw y=−3/2 x+2, controleer A. |
| `equation_from_two_points` | A(1; 1/2), B(−1; 7/2): bepaal a=−3/2, kies A of B, bereken b=2, bouw de formule; controleer achtereenvolgens beide oorspronkelijke punten. |

## Opslag en uitrol

De gespecialiseerde RPC, accountbinding en revisies blijven behouden. Stateversie wordt 701; catalogusversie 1. Migratie bewaart onbekende skillvelden en historische events/reviews. De bestaande versiekeys blijven leesbaar. De nieuwe lokale opslag gebruikt een `:wave1`-suffix (ook achter de backend/accountgebonden cachekey), zodat een nog geopende v700-client geen niet-gesynchroniseerd nieuw werk kan overschrijven. Vóór de eerste migratiesave wordt de oorspronkelijke state onder `:pre-wave-1` bewaard. Nieuwe toegang blijft opgeslagen; oude toegang wordt uit oude voorwaarden plus bestaande introducties/pogingen overgenomen.

De bestaande server-RPC is op 22 september 2026 alleen gelezen. Hij accepteert uitsluitend versie 700. `supabase_rechten_wave1.sql` is daarom een noodzakelijk, afzonderlijk uitrolscript: accepteer 700/701, valideer de zes extra skills bij 701, en weiger een downgrade naar 700 zodra een account 701 heeft opgeslagen. De controle gebeurt onder het bestaande accountslot, ook bij een actuele revisie. Accountcontrole, bestaande veldenvalidatie en revisieconflicten blijven intact. Het script is **niet uitgerold**; de branch is niet gepubliceerd. Eerst dit script uitrollen, daarna de frontend. Oude clients moeten vervolgens vernieuwd worden.

De Supabase CLI is hier niet geïnstalleerd; het SQL-bestand volgt de bestaande zelfstandige deploymentscripts van deze repository en claimt geen toegepaste CLI-migratiegeschiedenis. De SQL-controle gebruikt een tijdelijke kopie van de kandidaatfunctie, tijdelijke tabellen en verzonnen accounts, alles binnen BEGIN/ROLLBACK. Productiefuncties en leerlinggegevens blijven ongewijzigd. De aanpak sluit aan op de [Supabase-documentatie over databasefuncties](https://supabase.com/docs/guides/database/functions).

Gedetailleerde deelstappen blijven bij de laatste 24 resultaten; oudere nieuwe resultaten bewaren hun samenvatting. Onafhankelijke bewijsvoorbeelden en foutpogingen zijn begrensd. De duurtest met 400 opgaven blijft onder de bestaande serverlimiet van 256 KiB.

## Testresultaten

- `node tests/rechten-wave.test.cjs`: 8 tests geslaagd. 3.600 nieuwe opgaven, exacte onafhankelijke kruisvermenigvuldiging, alle stappen in beide aftrekvolgordes, positieve/negatieve/gehele/fractionele/nulhelling, verticale/identieke punten, b-herstel, undo, zuivere migratie, alle 17 skills bereikbaar, blijvende unlocks en zelfstandige mastery.
- `node tests/rechten-wave-browser.cjs`: alle zes skills met echte muis-/touchgebeurtenissen op 640×360 en 780×360. Geen control-overlap, te kleine antwoordknoppen, gameplay-scroll, clipping buiten de viewport of native invoervelden. Navigatie en herladen behouden deelantwoorden; één poging telt eenmaal; DEV verandert geen leerlingresultaten. 6.600 oude opgaven gegenereerd en 33 skill/niveaucombinaties gerenderd. Oude versies 66–700, backup, nieuwe lokale sleutel, fictieve accountcache, offline schrijfherstel, dirty cache, accountwissel en revisieconflict gecontroleerd.
- `node tests/trainer-teacher-browser.cjs`: leerkrachttoegang, oefenen en terugkeer vanuit Opvolging geslaagd.
- `node tests/account-progress-browser.cjs`: bestaande account-, offline-, conflict-, tweede-toestel- en leerkrachtregressies geslaagd, uitsluitend met fictieve accounts.
- `node --test tests/*.test.cjs`: alle 14 testbestanden geslaagd. Cataloguscontrole en `git diff --check` geslaagd.
- Database: kandidaatfunctie getest op tijdelijke tabellen; v700, upgrade naar 701, behoud van XP, revisieconflict, ontbrekende skill, onbekende leerling en geweigerde oude-clientwrite geslaagd. Reproduceerbare testtransactie: `node scripts/build-rechten-db-test.cjs`.

## Open punten

- De serveraanpassing moet vóór publicatie worden uitgerold. Zonder deze aanpassing blijft v701 alleen lokaal bewaard en meldt online opslaan een fout.
- Een fysieke Samsung A20-test is niet uitgevoerd; 640×360 en 780×360 zijn Chromium-emulaties.
- De automatische goedkeuringscontrole weigerde het lezen van een echte leerling-snapshot wegens privé-leerlingvoortgang. Migratie is daarom met synthetische fixtures getest, niet met een echte geanonimiseerde snapshot.
- De drie niveaus werken; op niveau 3 blijven de berekeningsfasen expliciet geordend. Vrij kiezen van de eerstvolgende reconstructiehandeling en verdere afbouw van steun vragen nog gebruikerstests. Dit introduceert geen uitgestelde skills.
- Nieuwe prerequisites en masterydekking zijn nog niet didactisch met leerlingen gekalibreerd.

## Gewijzigde bestanden

- `games/rechten/trainer/index.html`: catalogus, routering, scheduler, opslag, migratie, scoring, uitleg, DEV en leraaraantallen.
- `games/rechten/trainer/wave-core.js`: exacte getallen, generators, validatie, variantdekking en unlocks.
- `games/rechten/trainer/wave-ui.js`: contextuele stappen en touchbediening.
- `games/rechten/trainer/wave.css`: mobiele werkruimte en landscapegrens.
- `supabase_rechten_wave1.sql`: afzonderlijk, niet uitgerold servervoorstel.
- `tests/rechten-wave.test.cjs`, `tests/rechten-wave-browser.cjs`, `tests/rechten-wave-database.sql`: nieuwe controles.
- `scripts/build-rechten-db-test.cjs`: veilige tijdelijke database-testtransactie.
- `tests/README.md`: testinstructies.
- `docs/rechten-wave-1.md`: herziene volgorde, implementatie- en acceptatieverslag.
