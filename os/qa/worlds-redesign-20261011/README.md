# Getallenwereld en Vergelijkingen · 11 oktober 2026

## Gedrag en vormgeving

- Getallenwereld heeft drie geïllustreerde hoofdstukken, een overzicht met leerdoelen en een vaste verdeling tussen opgave, uitwerking en antwoord. De bestaande illustraties worden hergebruikt. De eerdere opgestapelde werkplaatsstijlen zijn vervangen.
- Vergelijkingen heeft zeven overzichtelijke levelkaarten, een kaart voor het gekozen onderdeel en twee duidelijke werkvlakken. Voortgangstekst blijft binnen de kaarten zichtbaar. De extra navigatierij vervalt; Levels en Werkvormen blijven bereikbaar via de gedeelde balk.
- Beide spellen delen papier-, tekst- en feedbackkleuren met afzonderlijke licht/donkerparen. Ook hulp, eigen bewerkingen, stappen, reeksinstellingen en het battlewerkbord gebruiken leesbare kleuren.
- Vragen, antwoordmechanieken, opgeslagen oefenreeksen, identificaties en XP-berekening zijn behouden. Minimaliseren behoudt dezelfde iframe en invoer.
- Vergelijkingen biedt leerlingen **Duo Battle op twee toestellen**: kies een van zeven onderdelen of een mix, nodig een online klasgenoot uit en zet allebei klaar. Vijf rondes, maximaal twee extra bij gelijkspel; 180 seconden per ronde. De oorspronkelijke exacte antwoordcontrole draait op de server. De gekozen soloreeks gaat mee naar de Duo-start. Leraren blijven de bestaande Klasbattle gebruiken.
- Uitnodigingen gebruiken de bestaande centrale OS-inbox en reservering. Kruisende of overlappende uitnodigingen maken geen tweede actief duel. Antwoorden en uitslagen worden niet door de browser beslist.

## Werkelijk uitgevoerd

| Controle | Resultaat |
|---|---|
| Bestaande reken-, keuze-, generator-, voortgangs- en catalogustests | 79 geslaagd; `core-tests.txt` |
| Integratie, catalogus/model, originele Getallenreeksen en nieuwe SQL/Edge-dueltests | 95 geslaagd; `integration-tests.txt` |
| Gedeelde OS-balken, desktopbediening, klasflow, Logicabattle en rapportdatabase | 45 geslaagd; `regression-tests.txt` |
| Getallen guided layout | 106 uitwerkingsstappen werkelijk aangeklikt; ook 390 × 844 en 640 × 360 |
| Nieuwe visuele/contrastcontrole | 36 schermen; tekst minimaal 4,5:1, grote tekst 3:1; licht/donker, hulp, instellingen, wortels en wetenschappelijke schrijfwijze |
| Vergelijkingen navigatie | 13 groepen, 103 gemeten bedieningsdoelen; drie schermformaten, beide balkstanden, herstel, bewaren, focus, 6 echte antwoorden en eigen 30 XP, gast/leerling/leraar |
| Vergelijkingen expert | Eigen bewerkingen en getypte antwoorden, foutcontrole, hervatten en herladen; drie schermformaten |
| Duo tussen twee browsers | Uitnodiging via de centrale inbox, gekozen onderdeel, beide-klaar-barrière, 5 echte rondes en uitslag 5–0; dark mode, mobiel, invoer behouden bij minimaliseren/herladen |
| Bestaande klasbattle-PDF | Eindscherm, download en herladen voor alle 8 aangesloten rapportproviders |
| Catalogus, lokale bestanden en diff | Gelijk, routes aanwezig, geen whitespacefouten |

Desktopcontrole: 1366 × 768, deviceScaleFactor 1, 100% zoom. Compact: 390 × 844 en 640 × 360. Ook de hoofdstukstart is op compacte schermen binnen en buiten de OS gecontroleerd. De startknop van Eigen reeks blijft in beeld; selectievakjes overlappen geen formule. De contrastmeting betreft de werkelijk geopende schermen en actieve tekst/knoppen, niet elke denkbare toekomstige toestand. Screenshots zijn bovendien visueel bekeken; zo werd afgesneden voortgangstekst ontdekt en hersteld.

## Backend en publicatie

De migratie `20261011192023_algebra_duo_battle.sql` en Edge Function `algebra-duo` versie 1 zijn op project `lgfxgtyxwijqozjyaogh` uitgerold. De nieuwe private tabellen hebben RLS en geen directe rechten voor bezoekers of leerlingen. Publieke functies zijn security invoker; de beoordelingsworker is alleen toegankelijk voor service_role. De Edge Function valideert de sessie via Auth vóór elke aanroep. Productieproeven zonder sessie en met een ongeldig token geven beide HTTP 401.

De Supabase-controle voegt uitsluitend twee verwachte [RLS-zonder-policy-informaties](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) toe: de private dueltabellen weigeren bewust directe toegang, en gecontroleerde functies verzorgen de acties. De bestaande waarschuwingen zijn niet toegenomen. Er zijn geen leerlingrecords aangepast voor deze controle.

De complete partijen zijn uitgevoerd met synthetische lokale accounts en de echte SQL/Edge-logica. Een partij tussen twee echte productieaccounts is **niet uitgevoerd**. De publieke frontendcontrole en het bijbehorende commitadres worden na de Pages-uitrol toegevoegd.

## Screenshots

- [Getallenwereld: hoofdstukken](getallen-home.png), [opgave in donker](getallen-dark.png), [wortels](wortels-dark.png), [wetenschappelijke schrijfwijze](wetenschappelijk-dark.png).
- [Vergelijkingen: levels](vergelijkingen-home.png), [werkbord](vergelijkingen-dark.png).
- [Duo: uitnodigen](duo-invite.png), [ronde](duo-work.png), [uitslag](duo-result.png).

Tests: `tests/worlds-visual-browser.cjs`, `tests/algebra-duo-browser.cjs`, `tests/algebra-duo.test.cjs`, bestaande Algebra/Getallen- en klasrapportcontroles. De nieuwe controles draaien ook in GitHub Actions. Bouw de exact dezelfde beoordelaar met `scripts/build-algebra-duo-worker.cjs` en esbuild 0.28.2.

Compacte voorbeelden: [hoofdstukken op telefoon](getallen-phone.png), [liggende oefening](getallen-landscape.png), [Eigen reeks in donker](eigen-reeks-dark.png).
