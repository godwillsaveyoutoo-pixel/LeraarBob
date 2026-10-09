# Review · OS-ontwikkelpilot · 9 oktober 2026

De ontwikkelpilot staat op `/os/`, naast de bestaande startpagina. Preview: <http://127.0.0.1:8787/os/>; zelfstandig <http://127.0.0.1:8787/games/getallenwereld/>. Branch: `codex/os-pilot-20261009`. [Draft PR #7](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/pull/7).

## Getallenwereld-uitbreiding

De volledige Getallenwereld is aangesloten: acht machtenonderdelen en zeven wortelonderdelen hebben dezelfde hoofdstukpaden, werkbank, hulp en resultaatpagina. Hun oorspronkelijke rekenregels en aanklikbare antwoorddelen blijven de leerflow bepalen. Wetenschappelijke notatie en solo-, duo-, klas-, bord- en papiermodi gebruiken de oorspronkelijke reeks-/sessieproviders met hun eigen stijl en voortgang.

Het OS leest het actuele native kruimelpad en geeft klikken door aan de bestaande handlers. Bewaren gebruikt de actuele onderdeel-URL/titel. De directe licht/donkerknop wijzigt bij apps met een gedeelde siteweergave alleen de presentatie; het antwoorddocument wordt niet vervangen. Hulpvoorbeeld/hulpstap, menuterugkeer, invoer en correcte tussenvragen blijven bewaard. Een oude resultaatlink stelt een onafgewerkte reeks niet meer als voltooid voor.

`leraarbob-bureaublad (1).zip` heeft SHA-256 `6d65e33249ee1376bd708ce1d2fbf19a0a32e4828472e541b8ece48baf442a02`; alle 21 geleverde bestandshashes kloppen. De nieuwe module is gericht samengevoegd. De OS-/topbarbronnen uit dat pakket zijn ouder dan de geteste pilotfixes en zijn niet overgenomen. De tijdelijke uitbreiding is na verlies van de werkkopie hersteld, opnieuw gecontroleerd en duurzaam op de lokale ontwikkelbranch vastgelegd.

Nieuwe/verder gewijzigde bestanden: `games/getallenwereld/{app.js,index.html,workshop.js,workshop.css,assets/machtenwerkplaats.png,README.md,WORKSHOP.md}`, `os/desktop.js`, drie nieuwe/uitgebreide DOM-/integratietests, `tests/getallen-os-browser.cjs`, twee bestaande browserselectorupdates en de catalogusworkflow. De oorspronkelijke `lessons.js`, `guided-answer.js`, `bewerkingen-trainer/core.js`, account-/voortgangsbronnen en provider-/databasebronnen zijn bytegelijk aan de gepubliceerde pilotbasis.

Uitgevoerd: 17 modulecontroles, 50 onafhankelijke integratiecontroles (90 echte klikopgaven, 30 historische runs, 15 opgeloste tussenvragen), 25 OS/model/topbarcontroles, 92 native browserformulecontroles, beide bestaande Getallenwereldbrowsers en de Numbers Space-browser. De vier OS-pilots en volledige klas/live-runs zijn opnieuw geslaagd met Chromium 156. De nieuwe OS-matrix telt 128 interactiegroepen en 876 layouts, met 30 echte compacte OS-antwoordflows, 25 interne scrollacties, nul browserfouten/404 en 17 screenshots. De brede units tellen 544/546: alleen de twee hieronder beschreven oorspronkelijke fouten blijven. Rapporten en screenshots staan in [qa/getallen/](qa/getallen/) en [qa/verification.json](qa/verification.json). De CI draait de nieuwe DOM-/browsercontroles naast de oorspronkelijke pilots.

Wetenschappelijke notatie heeft nog geen eigen begeleid zestiende onderdeel; de generator onderscheidt niveau 0 van 1/2, terwijl 1 en 2 gelijk zijn. Duo Learn behoudt eigen antwoorden en gezamenlijke bespreking. Betekenis/nulmacht en het beoordelen van geldige wortelregels hebben expliciete hoofdstukselectie-links wegens ontbrekende equivalente providerdoelen. Echte productieauthenticatie en externe multiplayer zijn nog niet gecontroleerd met twee ingelogde accounts.

## Basis en behoud van huidig werk

De zip is eerst geïnspecteerd: `LEESMIJ.md`, `verificatie.json`, `os/README.md` en `os/PILOT.md`. Alle 13 geleverde SHA-256-bestandshashes kloppen. Instructies uit de zip zijn als pakketdocumentatie beoordeeld; de gebruikersopdracht en AGENTS.md blijven leidend.

De lokale checkout stond op `cbbbf6d6663aac9ac51ee5cb7b29b2ffbe48c99f`, met 93 gewijzigde/nieuwe bestanden buiten een oudere uitgepakte repositorykopie. De rechtstreekse patchcontrole faalde op de gedeelde bovenbalk. De actuele GitHub-main is daarna opgehaald: `6056ac4e7445f6bb15fa1b15dce43df32a6e17e6`, tevens de opgegeven pakketbasis. Daarop slaagde `git apply --check` en is de volledige patch toegepast.

De oorspronkelijke lokale werkmap is ongewijzigd en alle 93 bestandshashes zijn na het werk opnieuw gecontroleerd. Een volledige lokale snapshot staat apart op `codex/local-work-preserved-20261009`, commit `2793263`. Die lokale experimenten zijn niet over de latere GitHub-platformversie heen geschreven. De OS-reviewbranch bevat de actuele gepubliceerde providers en de gerichte pilotwijzigingen.

Bestaande accountopslag, voortgangsidentiteiten, XP-logica, sessieproviders en oorspronkelijke vragen/antwoordbeoordeling zijn behouden. De eerste pilot wijzigde native alleen Zeeslag-CSS; de Getallenwereld-uitbreiding wijzigt daarnaast presentatie en hervatting zoals hierboven beschreven. Auth, voortgangscode, rekenmotoren en databasebestanden blijven gelijk aan main.

## Gewijzigde bestanden en gedrag

| Bestanden | Gedrag |
| --- | --- |
| `os/index.html`, `os/desktop.css`, `os/assets/*` | Apart bureaublad, themamappen, taakbalk, Start, appvensters, compacte layouts en bereikbare bediening |
| `os/desktop-model.js` | Catalogusgestuurde routes/rollen, accountgebonden voorkeuren, echte werkvormen; Solo Zeeslag direct naar computer |
| `os/desktop.js` | Levende appframes, eigen terugkeerplek/filter/zoekwoord, pins/taken, centraal account, native voortgang en weergave, focusherstel, Start in geneste frames, opruimen bij accountwissel, oorspronkelijke Home/inloglinks en live-lesaanmelding via de gedeelde bediening |
| `shared/leraarbob-topbar.js` | Optionele OS-home, native voortgangseenheid, bureaubladplaatsen zonder herladen, actuele app/mapnaam op mobiel; bestaande Live-ingangen behouden |
| `games/rechten/arcade/theme.css` | Alleen Zeeslag onder 600 px: geen afsnijding door min-content, bestaande VUUR/formulebediening bereikbaar |
| `scripts/serve-os-preview.cjs` | Alleen frontendbestanden via localhost, zonder repository- of database-exposure |
| `tests/desktop-*`, `tests/topbar-desktop.test.cjs` | Unit/DOM-regressies plus daadwerkelijke vier-app- en klas/live-browsercontrole |
| `tests/social-browser.cjs` | 1 px geometrie-tolerantie voor fractionele scrollafronding, met controle dat het knopcentrum onbedekt is |
| `.github/workflows/catalog.yml` | DOM- en Chromium-pilots met tijdelijke testafhankelijkheden en QA-artifacts |
| `os/README.md`, `os/PILOT.md`, `os/qa/*` | Werking, grenzen, uitgevoerde checklist, screenshots en bewijs |

## Werkelijk uitgevoerd

- Catalogus/offlinekopie gelijk; 114 actieve routes, aliases, echte providers, rollen en voortgangsidentiteiten gecontroleerd. Desktoppakket: 61 bedieningselementen en 15 lokale frontendafhankelijkheden aanwezig. Syntax en whitespace gecontroleerd.
- Vereiste catalogus/model/DOM/topbar/routetests: 47/47 geslaagd; de browserpilot telt 32 controlegroepen en 23 layouts. Exacte resultaten staan in `qa/verification.json`.
- Bestaande relevante native tests: 41/41 geslaagd voor accounts, numbers-session, Glasraam, Rechten-runtime/shell/voortgang/XP. Beide bestaande lesdatabaseproeven geslaagd: rollen, native beoordeling, privacy, dubbele antwoorden, historie, live volgen en verslagen.
- Volledige unitverzameling: 476/478 geslaagd. De twee fouten zijn ook op een losse, ongewijzigde export van main gereproduceerd: een verouderde hashverwachting voor `shared/axioma-progress.js` en ontbrekende Signaalstad-oefenbladdekking. Zie `qa/baseline-unit-failures.txt` en `qa/all-unit-tests.txt`.
- Vier echte native pilotapps binnen OS op 1366 × 768, 100% zoom; ook 390 × 844 en compact landschap. Pythagoras: originele onthulling, slepen, getaltegel, gedeeltelijke formule en voltooid level. Rechtenwereld: kaart, echte opgave, hint, correct antwoord, één poging en expliciet Volgende. Zeeslag: originele schipplaatsing, formulebediening en schot. Glasraam: fout punt, verbeteren, volledig raam, kleur en echte `1/8 ramen`.
- Appframes, invoer en bestaande status blijven bij terug/minimaliseren/hervatten gelijk. Iedere pilot keert terug naar haar eigen filter en zoekwoord. Start/ESC, antwoordfocus na Bewaren, taken/snelkoppelingen, accountvenster, native weergave, balkstanden en herstel na herladen gecontroleerd. Zie `qa/pilot-browser-report.json`. Dezelfde 32 controles en 23 layouts slagen ook met exact de CI-browser (Chromium 156 / Playwright 1.64); de test wacht op echte native voltooiing en stabiele iframe-afmetingen. Zie `qa/chromium-ci-browser-report.json`.
- Volledige klasruns met twee gescheiden fictieve authaccounts en bestaande Edge/SQL-providers: 5 Learn-vragen (verbeteren, 45 bestaande XP, leraarreview/verslag), 5 Getallen Battle-vragen (50 XP en eindranglijst), 5 Rechten Battle-vragen (native keuzes, eindresultaat), live les (code, volgen, stemmen, 100%-uitslag, sluiten en opgeslagen aliasverslag). Start en focus werken ook in het geneste Rechten-werkbord. Geen browserexceptions of 404. Zie `qa/live/results.json`.
- Bestaande platform-live-browser: geslaagd op home en spel voor gast/leerling/leraar, 320/390/844/1440 px en inklappen/herladen/heropenen.
- Bestaande social-browser: volledige online- én solopartij Zeeslag, uitnodigen/accepteren, beurten, herladen, dubbele-pakketbescherming, bewaarretry, rematch, afsluiten en resultaatisolatie geslaagd. De bredere suite stopt daarna op een reeds bestaande Kleiduif-lobbyfout bij 320 × 568. Groepsrondes na die blokkade zijn niet uitgevoerd. Ook die fout is met de ongewijzigde main-bovenbalk gereproduceerd. Zie `qa/existing-social-browser.txt`.

## Screenshots

De map `qa/` bevat uitgeklapte/ingeklapte pilots, compacte layouts, het centrale accountvenster en desktopherlaad. `qa/live/` bevat zeven screenshots van echte lokale providerinteracties. Voorbeelden: [Pythagoras](qa/pythagoras-expanded.png), [Rechtenwereld ingeklapt](qa/rechtenwereld-collapsed.png), [Zeeslag compact](qa/rechten-zeeslag-390-expanded.png), [Glasraam](qa/glasraam-expanded.png), [Learn-antwoord](qa/live/learn-answer-student.png), [live lesuitslag](qa/live/live-poll-results-student.png).

## Beperkingen en volgende stap

Productieaanmelding en twee echte externe auth-/WebSocket-sessies blijven open. Er zijn geen bruikbare testlogins of reeds aangemelde browserprofielen beschikbaar gesteld; alleen de naam `bob` en het getoonde leraarlabel `Leerkracht`. De browserauth, social/groups-grenzen en voortgangstransporten gebruiken expliciete fixtures; klasvragen en lesverslagen gebruiken de echte bestaande serverlogica op een lokale database.

De GitHub-connector weigerde branchcreatie met HTTP 403 `Resource not accessible by integration`. Met netwerktoegang werkte de bestaande Git/CLI-aanmelding wel: `codex/os-pilot-20261009` staat remote en [draft PR #7](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/pull/7) is aangemaakt. Beide definitieve catalogusworkflows zijn geslaagd: [push-run](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/actions/runs/37970415172) en [PR-run](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/actions/runs/37970421658), voor codecommit `324dc33`. Zij voeren ook beide browserpilots uit. De complete reviewpatch is op toepasbaarheid tegen main gecontroleerd. De oorspronkelijke productiestartpagina is niet vervangen; dit blijft een ontwikkelbranch met lokale preview.

Aanbevolen vervolg: de ontwikkelbranch reviewen en twee echte testaccounts gebruiken voor de nog open productiechecks. De twee bestaande unitfouten en Kleiduif-lobby worden afzonderlijk opgevolgd voordat de hoofdstartpagina wordt vervangen. Centrale leraaropdrachten en nieuwe appvormen volgen na acceptatie van deze pilot.
