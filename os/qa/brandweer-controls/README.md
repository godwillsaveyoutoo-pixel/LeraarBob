# Brandweer: formule en regelaars

Gecontroleerd op 10 oktober 2026 in Chromium/Brave, bij 100% zoom en met geïsoleerde lokale testaccounts.

De formule `y = ax + b` staat apart van twee compacte regelaars: **Helling a** en **Starthoogte b**. De bediening volgt Zeeslag. De breuk- of decimaalweergave van iedere redding blijft behouden; in de b-regelaar staat ook bij negatieve waarden het juiste teken. De bestaande gedelegeerde klik-, veeg-, wiel- en toetsenbordhandlers blijven actief. Oefeningen, toegestane waarden, accountopslag en voortgangsidentiteiten zijn niet gewijzigd.

De gevel tekende nog altijd tien rijen ramen, ook als het dak lager stond. Ramen en verdiepingslijnen stoppen nu bij de werkelijk getekende dakrand; het doelraam blijft op zijn oorspronkelijke coördinaten.

## Uitgevoerd

- [Gerichte browsertest](report.json): zeven geslaagde groepen en twaalf schermmetingen. Alle acht straatgebouwen zijn op 1366 en 640 px gecontroleerd: de daadwerkelijke SVG-raamcontouren liggen binnen de gevel, met precies één doelraam. Verder echte klikken, Enter/Spatie/pijltjestoetsen, wiel en slepen; grenswaarden en focusherstel; positieve/negatieve waarden, breuken en decimalen; minimaliseren/hervatten in dezelfde iframe.
- 1366 × 768, 844 × 390, 640 × 360 en 568 × 320: bovenbalk open, ingeklapt en beide OS-balken verborgen. Alle formuleknoppen en Uitvoeren zijn minstens 44 × 44 px, bereikbaar en buiten de formuleweergave. De onderste bediening staat buiten het speelveld.
- Werkelijke redding met `a = −0,5`, `b = −6`: juiste eindhoogte −9, uitleg openen, volgende redding en resultaatregistratie.
- Zelfstandige Brandweer met lokaal leraartestaccount: formule bedienen, bovenbalk inklappen zonder gewijzigd plan, herladen en weer uitklappen. De bestaande inklapvoorkeur blijft behouden. Dit controleert geen hervatten van een gedeeltelijk plan na documentherladen.
- Bestaande `rechten-arcade-browser.cjs`: alle zestien reddingen met exacte geometrie, kleiduiven, Zeeslag, twee duo-flows, CSV en balkherstel geslaagd. Tijdens de eerste controle nam de duo-bediening op 780 px te veel hoogte in; de indeling is gecorrigeerd en de volledige test is daarna geslaagd.
- `rechten-arcade.test.cjs`, cataloguscontrole, pakketcontrole (75 bedieningselementen, 19 lokale afhankelijkheden), scriptsyntax en `git diff --check`: geslaagd. De gerichte Brandweer-test is toegevoegd aan CI.

Brandweer behoudt zijn bestaande liggende spelstand. Bij 568 × 320 met beide balken zichtbaar is het speelveld erg klein en valt het onderste deel van de instructie buiten beeld; **Balken verbergen** maakt de volledige instructie bereikbaar. Portretbediening is geen onderdeel van deze wijziging. Productiesessies en externe accounts zijn niet getest.

## Bekijken

- [Brandweer op 1366 × 768](os-brandweer.png)
- [Negatieve waarden, ingeklapte bovenbalk op 640 px](os-640-collapsed.png)
- [Compacte telefoon, beide balken verborgen](os-568-focus.png)

[Lokale OS-preview](http://127.0.0.1:8795/os/?previewUser=alex): **Start → zoek Brandweer → Brandweer**. Een reeds geopende app eerst sluiten en opnieuw openen om de nieuwe HTML te laden.

```sh
NODE_PATH=/tmp/leraarbob-os-deps/node_modules node tests/brandweer-controls-browser.cjs
NODE_PATH=/tmp/leraarbob-os-deps/node_modules CHROME_EXECUTABLE=/opt/brave.com/brave/brave ARCADE_SCREENSHOTS=/tmp/brandweer-arcade node tests/rechten-arcade-browser.cjs
node --test tests/rechten-arcade.test.cjs
node scripts/build-catalog.cjs --check
node tests/desktop-package-check.cjs
```

Gewijzigde productbestanden: `games/rechten/brandweer/index.html` (formuleweergave en regelaars) en uitsluitend de Brandweerregels in `games/rechten/arcade/theme.css`. Verder: browsertest, CI, pilotverslag en dit bewijs. [Bronhashes](source-hashes.json).
