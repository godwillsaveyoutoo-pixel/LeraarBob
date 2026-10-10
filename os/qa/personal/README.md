# Persoonlijk OS en compacte Rechtenwereld — ontwikkelpilot

Getest op 10 oktober 2026, op branch `codex/os-personal-pilot-20261010`, vanaf `7493e52dc4a5c43830d8291e87a30d659f29e23d` (PR #12). Geen productie-uitrol of databasewijziging. De oorspronkelijke lokale werkmap is gecontroleerd: alle 1517 vastgelegde bestanden hebben dezelfde hash.

## Wat is veranderd

| Bestanden | Gedrag |
| --- | --- |
| `os/personal-home.js`, `os/personal.css`, `os/index.html` | Persoonlijke wereldkaarten met geïntegreerde afbeelding/acties, Toevoegen, online klasgenoten, centrale inbox, ranglijsten, bestaande klas hervatten |
| `os/desktop.js`, `os/desktop-model.js` | Rechten direct naar native Learn/klasstart, leerling via OS-klascode, bestaande pins behouden, nieuw standaard één wereld; Start bevat collecties. Eén Rechten-bovenbalk, vensteracties in taakbalk, focusstand en eigen voorkeur |
| `shared/axioma-social.js` | Bestaande inbox door OS laten openen; intrekken via reeds aanwezige provider; geen extra uitnodigingsopslag |
| `shared/leraarbob-topbar.js` | Actieve appnaam blijft herkenbaar in compacte navigatie, ook met een native oefeningskruimelpad |
| `shared/multiplayer/classroom.js`, Rechten `classroom.html` | De directe OS-klasflow deelt een OS-code-link; overige klaslinks behouden hun bestaande bestemming |
| Previewserver, browser-/DOM-tests en CI | Fictieve accounts en lokale providercontrole, regressie-ingangen volgen Toevoegen/themabibliotheek, nieuwe OS-tests ook in GitHub Actions |

## Werkelijk uitgevoerd

Chromium/Brave met afzonderlijke testprofielen, extern netwerk geblokkeerd. Desktop **1366 × 768**, **100% zoom**, `deviceScaleFactor: 1`; compact **390 × 844** en **640 × 360**. Beide bovenbalkstanden en de focusstand zijn gecontroleerd. De bestaande vierpilotcontrole gebruikt ook 844 × 390 voor de spelborden.

| Rapport | Uitgevoerd |
| --- | --- |
| [Persoonlijk OS](results.json) | 8 interactiegroepen en 57 doelmetingen: pins/herladen, kaartacties ≥44 px en niet bedekt, rechterklik/Meer/Shift+F10, papiermappen, uitnodigen/weigeren/intrekken/accepteren/starten, native invoer en focus, directe klasstart/code/link/hervatten, echte lokale ranglijsten en accountisolatie |
| [Eén bovenbalk en focus](chrome-results.json) | 4 groepen en 13 doelmetingen: native kop nul hoogte, één gedeelde 58px-balk, bestaande vensteracties verplaatst, native antwoord behouden, beide balken verbergen/herstellen, onafhankelijke inklapkeuze, mobiele popover, herstel buiten het iframe en focusvoorkeur na herladen |
| [Vier oorspronkelijke pilots](regressions/four-pilots.json) | 32 groepen / 23 layouts: Pythagoras-tegels en slepen, Rechten-opgave en controle, Zeeslag-plaatsing en echt schot, Glasraam-afronding; eigen terugkeerplek, originele voortgang, Start, bewaren, account en hervatten |
| [Bestaande Rechten-ingangen](regressions/rechten-entry.json) | 11 groepen / 64 metingen: echte lokale Learn-provider met voorstellen, beide goedkeuringen en beoordeling; native klasaanmaken/deelnemen/starten; herladen en beide balkstanden |
| [Startpagina en accountlinks](regressions/home-entry.json) | 16 groepen: standaard OS, oude catalogus, oorspronkelijke aanmelding/terugkeer/herstel en fallback |
| [Algebrawereld](regressions/algebra.json) | 18 groepen / 252 doelen: Vergelijkingen/Stelsels, echte bewerkingen en 30 native XP, onafgemaakte invoer, oefenbladen, klasroutes, beide balkstanden en herladen |
| [Getallenwereld](regressions/getallen.json) | 146 groepen / 1076 layouts: oorspronkelijke machten/wortels/wetenschappelijke ingangen, echte antwoorden, compacte bediening, historische invoer, herladen en providerlobby's; geen gewijzigde engine |
| [Wetenschappelijke notatie](regressions/scientific.json) | 67 groepen / 190 layouts: vier begeleide onderdelen, echte antwoorden en providerselectie; oudere sessiegeneratie blijft intact |
| [Catalogus- en DOM-units](regressions/catalog-and-dom-units.txt) | 76 catalogus/engine-units en 124 DOM/opslag/rolcontroles geslaagd; daarnaast [zeven gerichte testsuites](regressions/focused-units.txt) |

De nieuwe persoonlijke OS-test maakt daadwerkelijk Learn- en klasactiviteiten met de bestaande Edge-handlers en SQL-schema's in tijdelijke PGlite-databases. De vijf klasvragen voor de ranglijst zijn door de test via de echte handler ingediend en beoordeeld met onafhankelijk berekende antwoorden; dit zijn **geen vijf handmatige browserantwoorden**. De afzonderlijke Rechten-entrytest bedient wel de echte Learn-antwoordknoppen, voorstellen, goedkeuring en controle in de browser.

De negen gewijzigde frontendbronnen zijn vastgelegd in [source-hashes.json](source-hashes.json). Alle genoemde browserrapporten melden nul browserexceptions en nul ontbrekende bronnen (voor zover het rapport ontbrekende bronnen meet). `build-catalog --check`, de packagecontrole en `git diff --check` slagen.

## Screenshots

- [Wereldkaarten op het bureaublad](desktop-1366-expanded.png), [donkere weergave](desktop-dark.png)
- [Rechtenwereld met één bovenbalk](rights-one-header.png)
- [Echte opgave in focusstand](rights-question-focus-false.png), [mobiele herstelknop](rights-map-focus-390.png), [mobiele vensteracties](rights-window-menu-390.png)
- [Centrale uitnodigingen](invitation-inbox.png), [Learn-inrichting](learn-direct-setup.png), [native Learn-opgave](learn-native-question.png)
- [Klasinrichting](class-direct-setup.png), [wachtkamer](class-direct-lobby.png), [ranglijst](rankings-class.png)
- [Onderwerpmapjes](worksheet-topics.png), [profiel](profile.png), [Start](start.png)

## Grenzen en volgende stap

Dit is een eerste persoonlijke OS-pilot voor Rechtenwereld. Alleen deze trainer krijgt nu de volledige vereenvoudiging tot één bovenbalk. De focusstand is OS-bediening; andere apps behouden voorlopig hun eigen interne navigatie. Hun oefeningen en providers zijn niet herschreven. Het Getallenwereld-herontwerp met een visuele wereld en drie subwerelden is nog te doen.

De gebruikte accounts zijn fictief. Productieaanmelding, cloudopslag en externe realtimeverbindingen tussen echte toestellen zijn niet uitgevoerd: bruikbare ingelogde testaccounts waren niet beschikbaar. De preview bewaart sessies zolang haar server draait. Persoonlijke pins en oefenbladen blijven per account op dit toestel, volgens de bestaande opslag.

De inbox gebruikt de huidige providerregels. Een nieuwe centrale coördinator voor meerdere gelijktijdige uitnodigingen, kruisende verzoeken, time-outs en keuze tussen sessies is nog niet gebouwd. De bestaande provider kan een gebruiker al bij een openstaande uitnodiging reserveren. Acceptatie van Rechten-Learn blijft binnen het OS; andere bestaande uitnodigingsproviders houden hun eigen route.

De klasbanner hervat alleen een eigen of al bezochte Rechten-klasbattle. Een nieuwe leerkrachtsessie wordt nog niet als klassenbrede uitnodiging uitgezonden. De ranglijst bevat bestaande afgeronde klasbattlepunten per wereld, geen universeel XP-klassement. De eigen profielpagina gebruikt de bestaande profiel- en voortgangsbronnen; een volledig nieuw profielontwerp volgt later.

De oorspronkelijke Rechtenwereld-draaihulp op 390px blijft behouden. De volledige solo-opgave is op 1366px bediend; er wordt geen volledige speelbaarheid in smalle portretstand geclaimd. Minimaliseren pauzeert geen online timers. Herladen bewaart de presentatiekeuze, niet automatisch alle vluchtige spelinvoer.

Volgende stap: deze Rechten-pilot visueel laten beoordelen, daarna dezelfde compacte start- en vensterbediening aansluiten op Getallenwereld. Houd de native oefeningen en voortgangsidentiteiten intact bij de visuele wereld/subwereld-ombouw. Voor productie eerst twee echte testaccounts door de online flows voeren en de afhankelijkheid PR #12 meenemen.

## Herhalen

Benodigd: Node, `playwright`, `jsdom`, `fake-indexeddb` en `@electric-sql/pglite` via `NODE_PATH`; Chromium geïnstalleerd of `LB_CHROMIUM` ingesteld.

```sh
node scripts/serve-personal-os-preview.cjs
node tests/personal-os-browser.cjs
node tests/personal-chrome-browser.cjs
node tests/rechten-entry-browser.cjs
node tests/desktop-pilot-browser.cjs
```

Preview: `http://127.0.0.1:8793/`. De landingspagina opent Alex, Sam en leerkracht afzonderlijk. `LB_SCREENSHOT_DIR` verplaatst de persoonlijke en Rechten-entryrapporten; `OS_SCREENSHOTS` verplaatst de vierpilotrapporten. De volledige bestaande CI-matrix staat in `.github/workflows/catalog.yml`.
