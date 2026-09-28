# Wortelbouw Pro v0.4.7 — Navigation & Menu

## Wat veranderde

- De bovenbalk volgt nu de Axioma/leraarBob-navigatie: `leraarBob › Wortelbouw › Konijnengrond`.
- `leraarBob` is altijd een echte home-link naar het platform.
- `Wortelbouw` in de breadcrumb opent het spelmenu; de compacte menuknop rechts blijft ook beschikbaar.
- De wiskundige opgave blijft apart en leesbaar naast de breadcrumb.
- Het oude lange, generieke dialoogmenu is vervangen door een echte game-pauzesurface:
  - huidige opgave groot en onmiddellijk zichtbaar;
  - één primaire actie `Verder bouwen`;
  - compacte acties `Alles in beeld` en `Herstart`;
  - voortgangsbalk;
  - compacte levelkaarten met huidige/completed-status.
- Op korte landscape-schermen gebruikt het menu vrijwel de volledige viewport en verdeelt het die horizontaal: huidige opgave/acties links, scrollbare levels rechts.
- Geen grote tekstblokken of verloren verticale marges in smartphone landscape.
- De levellijst scrollt automatisch naar de huidige opgave wanneer het menu opent.

## Niet veranderd

- Geometry, chain logic, camera-drag contract, wortel-as en levelinhoud zijn inhoudelijk niet gewijzigd.
