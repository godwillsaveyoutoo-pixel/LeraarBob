# Pilot: oorspronkelijke bouwsels in het bureaublad

Doel: overgang tussen bureaublad, themamap, werkvorm en app, met behoud van oorspronkelijke vragen, antwoordbediening, stijl en leerflow. `/os/` blijft naast de bestaande startpagina staan.

## Vier pilots

| Bouwsel | Werkvorm | Behouden |
| --- | --- | --- |
| Pythagoras | Les | Oorspronkelijke opbouw, vierkanten, tegels, slepen en antwoordstappen |
| Rechtenwereld | Trainer | Wereldkaart, vraagvormen, hints, controle en bestaande voortgang |
| Rechten Zeeslag | Spel | Bord, regels, animaties, solo/online-bediening en beurtstatus |
| Glasraam | Atelier | Werkvlak, kleur, rechten, ontwerpbediening en afgeronde ramen |

Terug, minimaliseren, Start, bewaren, account, weergave en sluiten zijn bureaubladbediening. Minimaliseren houdt het oorspronkelijke scherm levend en pauzeert geen timer of online sessie. Bewaren maakt een snelkoppeling. Na browserherladen geldt de oorspronkelijke apphervatting.

## Automatische integratiecontrole

Uitgevoerd met Node/jsdom: eigen map/filter/zoekwoord per app; hervatten via taakbalk en vastgepinde ingang; blijvende DOM/invoer/handlers; Start en ESC in normale én geneste antwoordvelden; focus na Bewaren; centraal account; oorspronkelijke voortgangseenheden; rolgebonden klasacties; Learn-codeformulier en leraarinstellingen; opruimen/isolerende voorkeuren bij accountwisseling; verwerpen van verouderde voortgangsreacties; maximaal zes levende apps. Catalogus, providers en 114 routes zijn gecontroleerd.

## Daadwerkelijke browsercontrole · 9 oktober 2026

1366 × 768, 100% zoom, `deviceScaleFactor: 1`, geïsoleerde Chromium-profielen. Compact: 390 × 844; Zeeslag en Glasraam ook 844 × 390. Authenticatie is fictief, niet een bewijs voor productieaanmelding. Klas/live-tests gebruiken bestaande Edge-handlers en SQL-migraties in een tijdelijke lokale PostgreSQL/PGlite-database.

| Controle | Uitgevoerd en verwacht gedrag | Resultaat |
| --- | --- | --- |
| Bureaublad | Start/zoeken, thema’s, profiel, instellingen, bewaarde taken, centrale accountbediening | Browsercontrole geslaagd; screenshots/rapport in `qa/` |
| Appruimte | Vier pilots uitgeklapt/ingeklapt, herstelknop ≥44 px, extra inhoudsruimte, vraag/antwoordactie bereikbaar | Geslaagd op laptop en compact; originele Pythagoras/Rechtenwereld-draaibegeleiding in staande stand behouden |
| Les | Pythagoras onthullen, slepen, getaltegel, volgend level, gedeeltelijke formule, Start/ESC en hervatten | Geslaagd; zelfde iframe, fase, input, handlers en focus |
| Trainer | Rechtenwereldkaart, echte coördinatenopgave, hint, controle, feedback en Volgende; map/hervatten | Geslaagd; één geregistreerde poging en dezelfde vraag/status bij hervatten |
| Spel | Zeeslag echte plaatsing/formule/schot, minimaliseren/hervatten, Solo direct, online lobbyfixture | Geslaagd; compacte borden/VUUR hersteld. Bestaande socialtest speelt ook volledige online- en solopartijen |
| Atelier | Glasraam fout punt, verbeteren, raam afronden, kleur wijzigen, gedeeltelijke invoer, native weergave, taakbalk | Geslaagd; ontwerp/invoer/focus behouden en echte `1/8 ramen` zichtbaar |
| Terugkeerplek | Vier appmaps met eigen filter/zoekwoord, Start boven andere app, opgeslagen ingang via Mijn taken | Geslaagd; vastgepinde hervatting behoudt de oorspronkelijke terugkeerplek |
| Learn met klas | Leraarinstellingen, leerlingcode, 5 vragen, fout verbeteren, bespreken, afronden en verslag | Geslaagd met lokale Edge/SQL en fictieve auth; 45 bestaande XP. Productieaccounts nog open |
| Battle met klas | Getallen en Rechten, leraarstart, leerlingcode, 5 vragen elk, timer/keuzes, eindresultaat | Geslaagd met lokale Edge/SQL en fictieve auth; Getallen 50 XP. Productieaccounts nog open |
| Live les | Leraarsessie/code, leerling volgen, stemmen, uitslag, minimaliseren, afsluiten en aliasverslag | Geslaagd met lokale Edge/SQL en fictieve auth. Productieaccounts nog open |
| Start/focus | Ctrl/Cmd K uit een antwoordveld en genest Rechten-Battle-werkbord, ESC terug, gewone Enter bij app | Geslaagd; originele antwoordfocus en input behouden |
| Herladen | Inklapkeuze, bewaarde ingangen, oorspronkelijke Learn-draft/resume en bestaande spelhervatting | Geslaagd binnen de oorspronkelijke appbeloften; geen kopie van vluchtig spelgeheugen |
| Accounts/rollen | Leerling krijgt deelname, geen klasstart; leraar krijgt bestaande startacties; centraal accountvenster | UI/DOM/SQL-rolchecks en native inloglink → centrale dialoog geslaagd. Echte productieaanmelding niet uitgevoerd |

De actuele bewijsbestanden staan in [qa/pilot-browser-report.json](qa/pilot-browser-report.json), [qa/live/results.json](qa/live/results.json) en [qa/verification.json](qa/verification.json). Screenshots staan naast de rapporten. [REVIEW.md](REVIEW.md) bevat de bestandswijzigingen, alle testgrenzen en bestaande regressiefouten.

## Nog open vóór vervanging van de hoofdstartpagina

- Twee daadwerkelijke ingelogde testaccounts gebruiken voor productieauthenticatie, cloudhervatting en externe live/WebSocketverbindingen. Er is geen bruikbare loginconfiguratie of actieve browsersessie beschikbaar gesteld.
- GitHub-schrijftoegang herstellen en de lokale reviewbranch/commit als PR publiceren; de koppeling weigert branchcreatie met HTTP 403.
- Afzonderlijke bestaande fouten opvolgen: verouderde voortgangshash in de Rechten-regressietest, Signaalstad-oefenbladdekking en de Kleiduif-lobby op 320 × 568. Zij zijn ook op de oorspronkelijke main gereproduceerd. De vier OS-pilots en hun volledige klasruns slagen.

Na acceptatie kunnen de overige bouwsels op dezelfde aansluiting aansluiten. Centrale door leraren uitgedeelde taken en nieuwe profiel-/werkvormfuncties zijn vervolgstappen.
