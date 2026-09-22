# RechtenTrainer — Wave 2: zelf construeren

Wave 2 volgt de constructiegolf uit de audit: `point_plot`, `equation_from_ab` en `graph_from_equation`. De gebruikerswijzigingen aan de conceptuele volgorde blijven leidend. Branch `feat/rechten-wave-2` bouwt voort op de twee Wave 1-commits.

## Skills en vrijgave

De catalogus telt nu 20 skills: de elf oorspronkelijke, zes uit Wave 1 en drie uit Wave 2. Geen ID of historische betekenis is vervangen.

Hoofdroute:

`point → point_plot → delta → slope → slope_from_two_points → line_behavior → special_lines → intercept → ab → equation_from_ab → intercept_from_point → equation_from_point_slope → equation_from_two_points`

`graph_from_equation` is een zijtak met prerequisites `point_plot`, `slope`, `intercept` en `equation_from_ab`. De hoofdroute hoeft niet op grafiekconstructie te wachten. De bestaande toepassingenroute blijft bestaan. De drempels blijven: introductie, vier pogingen, strength ≥0,42, drie juiste van de laatste vier en geen open herstel. Alle ooit vrijgegeven toegang blijft behouden. Bij migratie worden ook de oude Wave 1-voorwaarden doorgerekend, zodat toegang niet verloren gaat als het access-veld nog niet was opgeslagen.

## Nieuwe werkvormen en voorbeelden

| Skill | Voorbeeld | Bediening en beoordeling |
| --- | --- | --- |
| `point_plot` | Plaats P(−6; 0), met x-stap 2 en y-stap ½. | Eén snappend roosteroppervlak; tik of sleep, corrigeer met x/y-knoppen, bevestig. Coördinaten staan naast het rooster. Foutfeedback onderscheidt verwisselde assen, alleen x, alleen y of beide. Projecties verschijnen pas na controle. |
| `equation_from_ab` | a=−3/2, b=2 → y=−3/2 x+2. | Kies een token en tik zijn formulevak, of sleep naar het vak. Getal vóór x, x-token, verbindingsteken en constante worden samen gecontroleerd. Ook + met negatieve constante, − met positieve constante en equivalente breuken zijn geldig. Normalisatie naar bijvoorbeeld −x of y=b gebeurt na beoordeling. |
| `graph_from_equation` | y=−½x+3: (0;3) en (2;2), of (−2;4) en (0;3). | Plaats A en B, kies eventueel een punt opnieuw, trek en controleer de rechte. Alle verschillende passende puntenparen worden geaccepteerd op niveau 2/3. Niveau 1 vraagt expliciet eerst (0;b). Identieke punten worden afgewezen; bij een fout in B blijft A staan. Na een fout verschijnt de gevraagde rechte gestreept en wordt het eerste afwijkende punt gemarkeerd. |

Alle werkvormen bieden undo. Slepen heeft een tikalternatief. Pointercancel registreert geen plaatsing of antwoord. Een roostergebaar kiest alleen een kandidaat; bevestigen is apart. Een pointerbevestiging kan niet met hetzelfde gebaar de nieuw verschenen Verder-knop activeren. De knoppen zijn minimaal 48×48 en er zijn geen tekstinvoervelden of native toetsenborden tijdens oefeningen.

Niveaus: positief/eenvoudig → negatieve waarden en assen → schaallezen of fractionele hellingen. Horizontale functies, b=0, b<0 en a=±1 zijn opgenomen. De vlotheidstimer blijft uit bij constructietaken. Uitleg, voortgang, DEV-terugkeer en herladen bewaren de constructie. Eén taak blijft één primaire poging; verbeteringen geven geen tweede zelfstandig masterybewijs.

## State en uitrol

Stateversie 702, catalogusversie 2. Nieuwe skills beginnen leeg. Historische scores, reviews, telemetrie, onbekende velden en onafgewerkte Wave 1-taken worden behouden. De nieuwe lokale slotnaam eindigt op `:wave2`; `:wave1` en oudere opslag worden bij eerste gebruik ingelezen. Backups eindigen op `:pre-wave-2`. Backend/accountgebonden sleutels en de bestaande RPC/revisiecontrole blijven behouden.

`supabase_rechten_wave2.sql` bevat zowel de Wave 1- als Wave 2-serveraanpassing. Het accepteert 700/701/702, valideert de bijbehorende skillsets en voorkomt downgrade-writes onder het bestaande accountslot. Het is een afzonderlijk deploymentscript, **niet uitgerold**. Publiceer de frontend pas nadat dit script is toegepast. De SQL-test draaide uitsluitend op tijdelijke tabellen en een tijdelijke kopie van de functie, binnen BEGIN/ROLLBACK. Er zijn geen echte leerlinggegevens gelezen of gewijzigd.

## Acceptatie

- `node tests/rechten-construction.test.cjs`: 6 tests; 1.800 taken over drie skills/niveaus, exact berekende targets, variantdekking en constructeerbaarheid binnen het rooster. Alle zichtbare passende puntenparen uit 60 modellen in beide richtingen gecontroleerd. Equivalentie, horizontaal, identieke punten, diagnose per as/term/punt, v701-migratie en b-start op niveau 1 slagen.
- `node tests/rechten-construction-browser.cjs`: drie skills × drie niveaus × 640×360/780×360; echte muis/touch, tik/sleep, pointercancel, undo, negatieve/fractionele/nulcoëfficiënten, alternatieve punten, geen overlap/scroll/native invoer, deelherstel, navigatie, DEV, herladen, eenmalige scoring en v701-migratie. Een gemengde duurtest met 450 opgaven over alle negen toegevoegde skills blijft onder de bestaande opslaglimiet van 256 KiB.
- `node tests/rechten-wave.test.cjs`: bestaande 8 controles met 3.600 Wave 1-taken; bereikbaarheid is uitgebreid naar alle 20 skills.
- `node tests/rechten-wave-browser.cjs`: Wave 1-mobiel en state blijven werken; 6.600 historische taken en 33 rendercombinaties; accountcache, offline writes, dirty cache, accountwissels, revisieconflicten en opslaglimiet.
- `node tests/trainer-teacher-browser.cjs` en `node tests/account-progress-browser.cjs`: bestaande regressies met fictieve accounts.
- `node --test tests/*.test.cjs`: alle 15 testbestanden.
- `node scripts/build-rechten-db-test.cjs --wave2`: produceert de geteste transactie voor 700→701→702, nieuwe skillvalidatie, revisieconflicten, oudere-clientwrites en accountbinding.

Een fysieke Samsung A20-check en didactische kalibratie met leerlingen blijven open. Migratiefixtures zijn synthetisch; de beperking uit Wave 1 rond echte leerling-snapshots blijft gelden.

## Bestanden

Aangepast: `games/rechten/trainer/index.html`, `wave-core.js`, `wave-ui.js`, `wave.css`; `scripts/build-rechten-db-test.cjs`; `tests/rechten-wave.test.cjs`, `tests/rechten-wave-browser.cjs`, `tests/README.md`.

Nieuw: `games/rechten/trainer/construction-ui.js`; `supabase_rechten_wave2.sql`; `tests/rechten-construction.test.cjs`, `tests/rechten-construction-browser.cjs`, `tests/rechten-construction-database.sql`; dit verslag.

Algemene herleiding, voorschrift uit tabel/grafiek/context, grafiek uit tabel en `information_sufficiency` zijn niet geïmplementeerd in deze wave.
