# Rechtenwereld startschermen voor het OS

Samen leren en klasbattle krijgen herkenbare startkaarten met de bestaande eilanden, papiertextuur en handgeschreven koppen van Rechtenwereld. De bestaande werkborden, nakijklogica, accountrollen, voortgang en sessieproviders blijven leidend. Dit is een eerste ontwikkelversie op basis van main `296e06b7afb84564f7737ba0f790e27ebf6fa800`.

## Gedrag

Samen leren begint met eiland, oefening en twee of drie leerlingen. Daarna volgt de bestaande wachtkamer met uitnodigingen op alias. De bestaande beschikbaarheidscontrole bepaalt welke oefeningen een leerling mag gebruiken. Accepteren opent Learn binnen het OS en hergebruikt een vrij Learn-venster; een andere actieve sessie wordt niet overschreven. De centrale aanwezigheidsdienst levert uitnodigingen aan de ingebedde app.

Klasbattle gebruikt dezelfde vormgeving voor leerstof, instellingen en wachtkamer. De leerkracht maakt en start de sessie. Leerlingen gebruiken de centrale code-ingang. Simulaties blijven herkenbaar en apart van echte sessies. In het OS toont de tussenbalk alleen de sessiefase en Overzicht, zonder de wereldnaam nogmaals te herhalen.

Zodra een opgave begint, verdwijnen de startkaarten en gelden de bestaande spelinterfaces. Minimaliseren, Start openen en bewaren behouden het werkbord en de invoer. Een teruglink naar de OS-map houdt het bestaande appvenster beschikbaar. Zelfstandig geopende pagina’s behouden de centrale bovenbalk met inklappen en herstellen.

## Gewijzigde onderdelen

| Bestanden | Verantwoordelijkheid |
| --- | --- |
| `games/rechten/rechtenwereld/start-card.js` en `styles/start-card.css` | Gedeelde eilandpresentatie, compacte wachtkamer, licht en donker |
| `learn.html` en `learn.js` | Eilandkeuze, bestaande uitnodigingen in het OS, gecontroleerde toegang tot een Learn-sessie |
| `classroom.html` en `shared/multiplayer/classroom.js` | Bestaande klasflow ook gebruiken bij zelfstandig openen |
| `shared/axioma-social.js` en `os/desktop.js` | Uitnodigingen binnen het OS afhandelen, met behoud van andere vensters |
| `klasbattle/hub.js` en `hub.css` | Dubbele wereldtitel weglaten in de ingebedde Rechten-sessie |
| Previewscript, lokale fixtures en browsertest | Reproduceerbare controle zonder productieaccounts of productiedata |

## Uitgevoerde controles

De nieuwe browsertest gebruikt 1366 × 768 en 390 × 844, device scale 1 en 100% zoom. Hij controleert de uitgeklapte en ingeklapte bovenbalk, bereikbare antwoord- en startknoppen, terugkeer naar de eigen map, hervatten met dezelfde DOM en invoer, focusherstel na Start, bewaren zonder reset en de directe weergavekeuze.

Alex en Sam maken een Learn-groep, versturen en accepteren een uitnodiging, starten en lossen de eerste Hellingrug-opgave op met de bestaande antwoordknoppen, voorstellen en goedkeuringen. De bestaande serverhandler keurt het gezamenlijke antwoord na. De leerkracht maakt een klasbattle, de leerling sluit aan via de centrale code-ingang en de leerkracht start. De leerling heeft geen startknop. Zelfstandig geopende Learn- en klaspagina’s herstellen de ingeklapte voorkeur na herladen op telefoonformaat.

De bestaande browserregressie `tests/uniform-class-flow-browser.cjs` slaagt met 32 controles en 78 metingen van bedieningsdoelen. Dit omvat Getallenwereld en Rechtenwereld, gemengde onderwerpen, lokale simulaties, herladen, echte lokale sessies en bestaande XP. De nieuwe eilandpresentatie vroeg alleen een aangepaste kop- en vormcontrole in die test. Beide browsertests melden nul JavaScriptfouten en nul ontbrekende bestanden.

Zeven relevante bestaande testbestanden slagen: Learn-route, Learn-engine, Rechten-XP, desktopmodel, desktop-DOM, gedeelde bovenbalk en klasflow. Ook JavaScript-syntaxis en `git diff --check` zijn gecontroleerd. De oorspronkelijke werkdirectory is niet gewijzigd: 1517 eerder vastgelegde bestanden hebben dezelfde hash.

[Testresultaten en screenshots](../../os/qa/rechten-entry/README.md) bevatten de meetgegevens en de precieze grenzen van de fixtures.

## Preview en opnieuw controleren

De lopende lokale preview staat op <http://127.0.0.1:8792/>. Open Alex en Sam in afzonderlijke tabs voor Samen leren. Open leerkracht en leerling afzonderlijk voor klasbattle. Gegevens verdwijnen wanneer deze lokale server opnieuw start.

```sh
NODE_PATH=/tmp/leraarbob-os-deps/node_modules node scripts/serve-rechten-entry-preview.cjs
NODE_PATH=/tmp/leraarbob-os-deps/node_modules node tests/rechten-entry-browser.cjs
NODE_PATH=/tmp/leraarbob-os-deps/node_modules node tests/uniform-class-flow-browser.cjs
NODE_PATH=/tmp/leraarbob-os-deps/node_modules node --test tests/rechten-learn-route.test.cjs tests/rechten-learn.test.cjs tests/rechten-xp.test.cjs tests/desktop-model.test.cjs tests/desktop-dom.test.cjs tests/topbar-desktop.test.cjs tests/class-activity-flow.test.cjs
```

De browsercontrole gebruikt Playwright en PGlite, met Brave via `/opt/brave.com/brave/brave`. De lokale afhankelijkheden zijn bestaande testinstallaties buiten de repository. Op een andere machine moeten deze tools beschikbaar zijn; `LB_CHROMIUM` kan een andere Chromium-binary aanwijzen.

## Grenzen en volgende stap

De accounts zijn fictief. Learn- en klasacties draaien door de bestaande Edge-handlers en migraties in lokale PGlite-databases. Accountauthenticatie en profiel- en voortgangsoverzichten zijn fixtures; echte productielogins en synchronisatie zijn hiermee niet bewezen. Driepersoonsgroepen, een volledige Learn-reeks en het einde van deze nieuwe klasbattle zijn in deze browsertest niet doorlopen. De native Learn-route wordt apart gecontroleerd voor alle 21 onderdelen en zes vraagvarianten.

Oefenbladschermen en lokale en online duo-battle krijgen in deze stap nog geen nieuwe startkaart. De bestaande oefenbladcollectie blijft beschikbaar. De volgende stap is visuele beoordeling van deze twee werkvormen, daarna dezelfde kaartopbouw toepassen op duo-battle en oefenbladen, gevolgd door een controle met echte leerling- en leerkrachtsessies. Deze branch is niet gemerged of naar productie uitgerold.
