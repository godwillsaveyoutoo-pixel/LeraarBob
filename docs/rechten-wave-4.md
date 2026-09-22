# Rechtentrainer — Wave 4: grafiek, tabel en context

Wave 4 voegt vier vaardigheden toe op branch `feat/rechten-wave-4`, voortbouwend op Wave 3. De catalogus telt **27 skills**: elf historische en zestien toegevoegde. Alle historische IDs en betekenissen blijven behouden. Deze wave bevat geen `information_sufficiency` en wijzigt de bestaande nulwaarde- en tekenschemavaardigheden niet.

## Leerlijn en toegang

De goedgekeurde hoofdroute blijft ongewijzigd:

`point → point_plot → delta → slope → slope_from_two_points → line_behavior → special_lines → intercept → ab → equation_from_ab → intercept_from_point → equation_from_point_slope → equation_from_two_points`

De vier nieuwe zijtakken worden na `table` in de introductievolgorde opgenomen:

| Skill | Prerequisites |
| --- | --- |
| `graph_from_table` | `point_plot`, `table` |
| `equation_from_graph` | `ab`, `slope_from_two_points`, `equation_from_point_slope` |
| `equation_from_table` | `table`, `equation_from_two_points` |
| `equation_from_context` | `equation_from_ab`, `fx` |

Vrijgave gebruikt de bestaande drempel: introductie, minstens vier pogingen, strength ≥0,42, drie van de laatste vier juist en geen open herstel. Eerder vrijgegeven toegang blijft behouden. Algemene herleiding wordt geen prerequisite voor b uit een punt. De bereikbaarheidstest doorloopt alle 27 skills en controleert dat lagere scores oude toegang niet intrekken.

## Werkvormen en voorbeeldtaken

| Skill | Voorbeeld | Handeling en controle |
| --- | --- | --- |
| `graph_from_table` | (−4;−2), (−2;−1), (2;1) | Kies een kolom, plaats A, kies een andere kolom en plaats B. Trek de rechte. Plaats het derde punt en beslis of alle punten op één rechte liggen. Een foutieve plaatsing krijgt diagnose per as; de andere punten blijven behouden. Niveau 1 gebruikt twee punten. |
| `equation_from_graph` | Grafiek van y=−¼x+1, met x-stap 2 | Kies zelf twee zichtbare roosterpunten, bijvoorbeeld (−8;3) en (4;0). Bereken a met beide consistente aftrekvolgordes. Kies b aflezen of b berekenen met een zelfgekozen punt. Bouw de formule en controleer beide punten. Op niveau 3 kan b buiten het grafiekvenster liggen. |
| `equation_from_table` | x: 1,3,6; y: 5,9,15 → y=2x+3 | Kies twee kolommen, bepaal a en b, bouw een kandidaat-formule en controleer ook de overblijvende kolom. Bij een afwijkende rij volgt «geen passend affine voorschrift». Dit werkt ook wanneer de afwijkende kolom een van de twee gekozen kolommen is. Het voorbeeld uit de audit is apart getest. |
| `equation_from_context` | Een taxirit van 2 km kost 8 €; bij 4 km kost hij 11 € | Zet beide situaties om in punten, bereken a=3/2 €/km en b=5 €, bouw de formule en controleer de punten, x=0 en x=3 km. Kies een invoer binnen het gegeven domein 0≤x≤10 km. Eenvoudiger varianten koppelen startwaarde en verandering rechtstreeks aan b en a. |

Contexten omvatten taxikosten, een leeglopende tank en een vast parkeertarief. Grootheden, eenheden, affine-modelaanname en geldig domein staan expliciet vermeld. Een tank bevat binnen zijn domein nooit een negatieve hoeveelheid. Constante, negatieve en fractionele hellingen zijn opgenomen.

Bij grafiekopgaven worden alle verschillende passende roosterpuntenparen geaccepteerd, niet één vooraf gekozen paar. Niveau 1 markeert handige punten; hogere niveaus laten de keuze vrij. Er zijn verschillende assenschalen. Als het y-snijpunt niet zichtbaar is, leidt de afleeskeuze naar uitleg om b met een punt te berekenen.

Bij tabellen blijven de gekozen kolommen gekoppeld aan A/B. Gelijke x-stappen groter dan één komen voor op niveau 1, ongelijke stappen op hogere niveaus. Niveau 3 bevat expliciet inconsistente tabellen. Vooraf staat dat een passend voorschrift kan ontbreken. Een juiste kandidaat-formule wordt niet als eindantwoord voor alle rijen gepresenteerd voordat de derde rij is gecontroleerd.

## Bediening en diagnose

Het rooster is één snappend aanraakvlak, met tikken/slepen, coördinatenuitlezing, x/y-correctieknoppen en een aparte bevestiging. Een geannuleerd gebaar verandert het werk niet. De knoppen verwerken een afgerond pointergebaar rechtstreeks en voorkomen dat de bijbehorende klik de volgende stap ook activeert.

Alleen de actieve controls verschijnen: kolommen, rooster, coördinatentokens, maximaal 3×5 numerieke toetsen, puntkeuze of conclusie. Breuken blijven verticaal met expliciete teller/noemer. Er zijn geen tekstvelden of native toetsenborden tijdens gameplay. Undo herstelt ook de gekozen gegevens en afhankelijke berekeningen. Hulp, DEV, navigatie en herladen bewaren het deelwerk.

Een volledige opgave levert één primaire poging op. Deelstappen zijn diagnostiek; hulp of herstel levert geen zelfstandig bewijs. Een fout in b laat a staan en plant aanvullend gericht herstel voor `intercept_from_point`. De nieuwe werkvormen hebben geen timer of automatische doorgang.

## Opslag en uitrol

Stateversie **704**, catalogusversie **4**. Gast- en accountcaches schrijven naar `:wave4`; lezen valt terug op `:wave3`, `:wave2`, `:wave1` en oudere slots. Migratie bewaart scores, XP, reviews, onbekende skillvelden, bestaande toegang en onafgewerkte opgaven. Nieuwe skills beginnen leeg. Vooraf wordt een oorspronkelijke snapshot met suffix `:pre-wave-4` bewaard.

De gemengde duurtest vond dat volledige opgavesignatures in de beheersingshistoriek de serverlimiet konden overschrijden. Die signatures gebruiken nu een compacte, versiegebonden identificatie met twee 32-bits hashes en bronlengte. Migratie bewaart bewijsdatums, dekking, scores en overige bewijsvelden; reeds aanwezig bewijs blijft herkenbaar en telt niet opnieuw. Volledige actuele opgaven en recente deelstappen blijven beschikbaar in concepten en telemetrie. Ook de oorspronkelijke snapshot blijft behouden.

De duurtest toetst de grootte inclusief de scheidingstekens van PostgreSQLs JSONB-tekstweergave, omdat de RPC daarop de 256 KiB-grens toepast. Een sessie met 640 opgaven over alle zestien toegevoegde skills blijft na de aanpassing rond 193 kB.

`supabase_rechten_wave4.sql` omvat alle eerdere waves. Het valideert versies 700–704 en de bijbehorende skillsets, behoudt accountbinding, payloadlimieten, lock en revisiecontrole en weigert terugschrijven naar oudere versies. Alleen een tijdelijke kopie van de kandidaatfunctie is op fictieve voortgang getest binnen BEGIN/ROLLBACK. Er is geen blijvende databasewijziging uitgevoerd.

Pas vóór frontenduitrol het Wave 4-script toe; afzonderlijke tussenupdates voor Waves 1–3 zijn niet nodig. Controleer na uitrol online bewaren en hervatten. Deze implementatie voert geen merge of frontenduitrol uit.

## Verificatie

- `node tests/rechten-transfer.test.cjs`: zeven tests, 2.400 gecontroleerde taken (vier skills × drie niveaus × 200), alle varianten, onafhankelijke BigInt-collineariteitscontrole, alle kolomparen inclusief afwijkende gekozen rij, alle zichtbare geordende grafiekpuntenparen in twaalf modellen, beide aftrekvolgordes, beide b-routes, behoud van a, undo, contextdomeinen en pure migratie. De compactere bewijsidentificatie is apart getest op behoud en dubbeltelling.
- `node tests/rechten-transfer-browser.cjs`: alle vier skills/niveaus op 640×360 en 780×360; echte touch en muis, tik/sleep/cancel, eigen punten/kolommen, schalen, breuken, constanten, derde-rijcontrole, eenheden/domein, b-herstel, undo, hulp/voortgang/DEV, herladen, eenmalige scoring en het echte v703-laadpad. Controle op knopgrootte, overlap, schermgrenzen, scroll en native invoer. Duurtests met 450 transferopgaven en 640 gemengde opgaven toetsen de JSONB-payloadlimiet.
- Bestaande Wave 1-, Wave 2- en Wave 3-browsertests slagen. De Wave 1-suite controleert ook 6.600 historische taken, 33 rendercombinaties, oudere lokale versies, accountcaches, offline opslag en revisieconflicten.
- `node tests/trainer-teacher-browser.cjs` en `node tests/account-progress-browser.cjs`: leerkrachttoegang en bestaande account-/hervatregressies slagen met fictieve accounts.
- `node --test tests/*.test.cjs`: alle 17 testbestanden slagen. Cataloguscheck en whitespacecontrole slagen.
- `node scripts/build-rechten-db-test.cjs --wave4`: SQL-kandidaat getest op 700→701→702→703→704, verplichte skills, revisieconflicten, downgrade-writes met actuele revisie en accountbinding. Alle controles slagen met tijdelijke fixtures.

## Bestanden

Nieuw: `games/rechten/trainer/transfer-core.js`, `transfer-ui.js`; `supabase_rechten_wave4.sql`; `tests/rechten-transfer.test.cjs`, `rechten-transfer-helpers.cjs`, `rechten-transfer-browser.cjs`, `rechten-transfer-database.sql`; dit verslag.

Aangepast: `games/rechten/trainer/index.html`, `wave-core.js`, `wave-ui.js`, `wave.css`; `scripts/build-rechten-db-test.cjs`; de zes bestaande Wave 1/2/3-unit- en browsertestbestanden voor hun oorspronkelijke scope tegen schema 704; `tests/README.md`.

## Open punten

Fysieke Samsung A20-check, didactische kalibratie met leerlingen en de online rooktest na uitrol blijven open. Migraties zijn met synthetische snapshots getest; een toegestane geanonimiseerde echte snapshot blijft een aanvullende praktijkcheck.

Tot de voorgestelde 28 skills ontbreekt nu alleen `information_sufficiency`, als latere niet-blokkerende transfer/mastery-skill. Ook de eerder afgesproken uitbreidingen van bestaande delta/fx/tabel/nulwaarde/tekenschema-oefeningen en minder ondersteuning bij gevorderde reconstructie blijven voor de afrondingswave.
