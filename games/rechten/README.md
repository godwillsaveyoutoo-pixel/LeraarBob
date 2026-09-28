# Rechten — repositorystructuur

## Productie

- `rechtenwereld/` — huidige Rechtenwereld (wereldkaart + gebiedskaarten + oefeningen).
- `core/` — gedeelde exacte wiskunde-, transfer- en journey-engines.
- `trainer/` — eerdere Rechtentrainer die nog als afzonderlijk reserveproduct beschikbaar is; gebruikt `core/`.
- `brandweer/`, `kleiduiven/`, `zeeslag/` — zelfstandige spellen.
- `leerpad/` — afzonderlijk, ouder leerpad dat nog bewust in de reserve staat.

## Compatibiliteit

`trainer-v2/` bevat alleen een redirect naar `rechtenwereld/`, zodat bestaande links niet breken.
Nieuwe code en documentatie moeten `games/rechten/rechtenwereld/` gebruiken.

## Geen versies in mapnamen

Nieuwe iteraties horen in Git-commits/tags. Maak geen `trainer-v3`, `final`, `final2`, enzovoort.

## Gegenereerde bestanden

Browser-/device-screenshots en validatielogs horen niet in productie-Git. Bewaar ze lokaal of als CI-artifact.
