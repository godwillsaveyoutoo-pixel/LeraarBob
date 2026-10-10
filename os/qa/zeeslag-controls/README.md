# Rechten Zeeslag · rustige formulebediening

10 oktober 2026. Vervolg op `28ace0a`, branch `codex/os-personal-pilot-20261010`, PR #13.

De formule `y = ax + b` wordt niet langer door plus-/minknoppen onderbroken. De gekozen rechte staat volledig links; daarnaast staan twee gelabelde regelaars voor helling a en startwaarde b. De kleuren verbinden elke regelaar met zijn coëfficiënt. De regelaar van b toont de getekende waarde, bijvoorbeeld −2, terwijl de formule `y = ½x − 2` toont. Op smalle schermen staan de regelaars onder de formule en VUUR. Alle vijf knoppen zijn minimaal 44 × 44 pixels.

De bestaande knoppen-ID’s en handlers blijven behouden. Alleen de presentatie verandert: de toegelaten waarden, plaatsing, schoten, beurtvergrendeling, multiplayerberichten, opslag en scoreberekening zijn ongewijzigd. Een schermlezer krijgt de formule als één tekst; er staan geen bedieningsknoppen in de formule. Voor gewijzigde assets gebruikt de Zeeslag-ingang een nieuw versieadres.

## Werkelijk gecontroleerd

- [Gerichte browsercontrole](report.json): alle **63 combinaties** van zeven hellingen en negen startwaarden, inclusief negatieve breuken, juiste grensknoppen en geen voortijdige schoten. Echte vlootplaatsing en VUUR met `a = ½`, `b = −2`, gevolgd door de computerbeurt. Toetsenbord, minimaliseren/hervatten en dezelfde native handler/frame.
- **11 gemeten layouts**: 1366 × 768 bij 100% zoom, 844 × 390, 640 × 360, 390 × 844 en 320 × 568 met beide OS-balkstanden en herstel. De formule blijft apart, de knoppen zijn onbedekt en de bediening overlapt de borden niet. Een extra layout controleert het scherm na het echte schot.
- Zelfstandige Zeeslag: dezelfde bediening, inklappen zonder gewijzigde richtinstelling, inklapvoorkeur behouden na herladen. Dit is geen claim dat een solopartij door documentherladen hervat wordt.
- [Bestaande OS-pilots](pilot-browser-report.json): **32 groepen / 23 layouts**, inclusief oorspronkelijke vloot, echt schot, bewaren, terugkeerplek, minimaliseren/hervatten, accountbediening en compacte VUUR terwijl een bewaarmelding zichtbaar is. Geen integratieproblemen of browserfouten in dit rapport.
- [Bestaande arcade-browser](arcade-browser.txt): alle 16 reddingen, kleiduiven, Zeeslag, twee duo-flows, CSV, inklappen/herladen en 640/780/1600px zonder interne scroll. Dit controleert ook de twee andere spellen die dezelfde stylesheet en bridge laden.
- Arcade-coretest, catalogusgeneratie, pakketcontrole (73 bedieningselementen / 18 afhankelijkheden), JavaScript-syntax en `git diff --check`: geslaagd. De gerichte Zeeslag-browsercontrole is opgenomen in CI.

Browser: Chromium/Brave, `deviceScaleFactor: 1`, geïsoleerde lokale accounts. Extern verkeer is in de gerichte controle geblokkeerd. Productieauthenticatie en een nieuwe multiplayerpartij met twee externe accounts zijn niet getest. Geen productie-uitrol in deze wijziging.

## Bekijken

- [Laptop, uitgeklapt](os-1366-expanded.png) en [ingeklapt](os-1366-collapsed.png)
- [Telefoon](os-390-expanded.png) en [compact liggend](os-640-expanded.png)
- [Na het echte schot](os-after-shot.png)

Preview: `http://127.0.0.1:8794/os/?previewUser=alex`. Kies **Start**, zoek **Zeeslag**, open **Rechten Zeeslag** en plaats je vloot. De nieuwe bediening verschijnt na **VLOOT KLAAR**.

```sh
NODE_PATH=/tmp/leraarbob-os-deps/node_modules LB_CHROMIUM=/opt/brave.com/brave/brave node tests/zeeslag-controls-browser.cjs
NODE_PATH=/tmp/leraarbob-os-deps/node_modules OS_SCREENSHOTS=/tmp/zeeslag-pilots node tests/desktop-pilot-browser.cjs
NODE_PATH=/tmp/leraarbob-os-deps/node_modules CHROME_EXECUTABLE=/opt/brave.com/brave/brave ARCADE_SCREENSHOTS=/tmp/zeeslag-arcade node tests/rechten-arcade-browser.cjs
node --test tests/rechten-arcade.test.cjs
```

Bestanden: `games/rechten/zeeslag/index.html` en `zeeslag.js` (scheiding formule/regelaars en bijgewerkte waarden), `games/rechten/arcade/theme.css` (gerichte Zeeslagopmaak), `bridge.js` (verplaatsen van bestaande console behouden, overbodige symboolherschrijving weg), gerichte browsertest, CI en dit bewijs. [Bronhashes](source-hashes.json) identificeren de gecontroleerde versie.
