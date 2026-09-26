# Integratie in LeraarBob — 26 september 2026

Het aangeleverde pakket `rechten-hill-final/` is geïntegreerd in
`games/rechten/trainer-v2/`, met de bijbehorende documentatie en tests.
De startpagina heeft een eigen tegel **Rechtenwereld** en een directe link
zonder JavaScript. `js/catalog.js` is opnieuw gegenereerd uit `games.json`.

De bestaande Rechtentrainer blijft bereikbaar. De nieuwe wereld bevat ook
haltes die nog een voorvertoning zijn. De nieuwe tegel toont daarom geen
voltooiingspercentage of oude trainerstatistieken. Voortgang en hervatten
worden door de bestaande opslagadapter binnen Rechtenwereld afgehandeld.
Het catalogusveld `local` onderdrukt alleen de centrale voortgangsbalk;
het verandert niets aan de bestaande accountsynchronisatie van de trainer.

Alle 105 bestanden die zowel in het pakket als in de website bestonden zijn
ongewijzigd behouden. Vier daarvan weken al af van de aangeleverde kopie:
`games/rechten/trainer/index.html`, `games/rechten/trainer/journey-ui.js`,
`shared/axioma-game.js` en `tests/README.md`.
De hashcontroles in `V1_BASELINE_SHA256.json` en
`formulewerf/PRESERVED.json` gebruiken voor deze bestanden de vastgelegde
inhoud van vóór de integratie. De oorspronkelijke manifesten blijven in
`rechten-hill-final/` bewaard. Validators en opslagmodules zijn niet aangepast.

## Openen

Start vanuit de projectmap:

```sh
python3 -m http.server 8775 --bind 127.0.0.1
```

- [Startpagina](http://127.0.0.1:8775/)
- [Rechtenwereld](http://127.0.0.1:8775/games/rechten/trainer-v2/#wereld)
- [Hellingrug](http://127.0.0.1:8775/games/rechten/trainer-v2/#hellingrug)

## Validatie na integratie

- 149 unittests geslaagd: `node --test tests/rechten-*.test.cjs tests/catalog*.test.cjs`.
- Cataloguscontrole geslaagd: `node scripts/build-catalog.cjs --check`.
- Hellingrug: 35 browserlayoutcontroles; drie volledige reeksen, native drag,
  touch, toetsenbord, herstel en herladen.
- Laatste twee haltes: 66 browserlayoutcontroles; beide volledige reeksen,
  halve roosterstappen, optioneel plaatsen en hervatten.
- Wereldnavigatie: 65 browsercontroles/groepen geslaagd.
- Klikroute startpagina → Rechtenwereld → Hellingrug → oefening geslaagd;
  cover geladen en geen JavaScript-fouten.
- 75 lokale HTML- en CSS-verwijzingen gecontroleerd; geen ontbrekende bestanden.
- Alle 105 bestaande pakketbestanden vergeleken met hun inhoud vóór integratie.

Browserproeven gebruiken een geïsoleerd profiel en een fictieve gast;
externe verzoeken worden onderschept. Rapporten en screenshots staan lokaal
in `/tmp/rechten-integration-validation/`. Er is niet gepubliceerd of gepusht.
