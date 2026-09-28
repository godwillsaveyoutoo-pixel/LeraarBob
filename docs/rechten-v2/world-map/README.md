# Wereldkaart en voortgang — 27 september 2026

Actieve route: `games/rechten/rechtenwereld/#wereld`.

De vijf eilanden blijven afzonderlijke, toegankelijke knoppen. De zee loopt door
achter de kaart en de vaste navigatie. De eilanden zijn versprongen geplaatst;
een aparte portretindeling houdt de route bereikbaar op telefoons.

De laagvolgorde geldt voor alle eilanden samen: schaduwen (1), illustraties (2),
accentstralen (3), labels (20), nummerbolletjes (30). De eilandknoppen hebben geen
eigen stacking context, zodat een label nooit achter een ander eiland verdwijnt.

`#voortgang` toont alle vijf eilanden en 28 haltes, met dezelfde voltooiingsstatus
als de gebiedskaarten. De eilanden klappen open naar afzonderlijke oefeningen;
lange lijsten scrollen binnen het dagboek. Lopende rondes tonen afgeronde opgaven,
terwijl de losse goede deelstappen afzonderlijk worden samengevat. Opnieuw oefenen
verwijdert geen eerdere voltooiing. De knoppen gebruiken de bestaande hervatroute.

Het profiel toont ook als gast de totalen en een directe knop naar Mijn voortgang.
Gastwerk blijft in dezelfde browser op hetzelfde toestel; de bestaande opslag,
accountscheiding en synchronisatie zijn niet gewijzigd.

## Illustratie

Nieuw bestand: [world-ocean.webp](../../../games/rechten/rechtenwereld/assets/world-ocean.webp).
Gemaakt met de ingebouwde imagegen-tool; daarna als WebP opgeslagen (circa 352 KB).
De bestaande eilandillustraties blijven in gebruik. De achtergrond bevat geen
tekst, labels, route of navigatie. Zonder de afbeelding blijft een blauwe zee
als fallback zichtbaar.

De gebruikte generatieprompt staat in [ocean-prompt.txt](ocean-prompt.txt).

## Controle

- `node --test tests/rechten-*.test.cjs tests/catalog*.test.cjs`
- `node tests/rechten-v2-world-shell-browser.cjs`: kaart, routes, touch,
  toetsenbord, hervatten, kleine schermen en hoog contrast.
- `node tests/rechten-v2-progress-browser.cjs`: echte runtime-antwoorden als
  gastfixture, alle eilanden, uitklappen/scrollen, profiel, herladen en hervatten
  met ongewijzigde antwoorden en bewijs.

De browsercontroles gebruiken een geïsoleerd gastprofiel en blokkeren externe
verzoeken. Screenshots tonen testgegevens, geen echte leerlingresultaten.

Resultaat: 176 unittests geslaagd; 63 kaart-/navigatiecontroles; 30 extra combinaties
van kaartformaat en voortgang; 9 browsercontrolegroepen voor het gastoverzicht.

Voorbeelden: [wereldkaart](screenshots/world-desktop.webp),
[telefoon](screenshots/world-phone.webp),
[voortgang](screenshots/progress-desktop.webp),
[afzonderlijke oefeningen](screenshots/progress-details.webp).

## Herstel van het assenstelsel

De compacte tekenoefening in Formulewerf erfde `grid-row: 2` van de Hellingrug-
knoppen. De knoppen namen daardoor 142 pixels in een tweede rij in, zodat het
rooster soms maar 48 pixels hoog werd. De grafiek en de knoppen gebruiken nu
expliciet dezelfde volledige rij. De asgetallen blijven ook bij lage schermen
leesbaar. De schaalcontrole gebruikt de werkelijke SVG-transformatie, niet
alleen de omvang van het omringende tekenvak.

De uitgebreide Formulewerf A-browsertest slaagt op 84 weergaven, met volledige
rondes, slepen, toetsenbord, herstel en herladen. Zie het
[herstelde assenstelsel](screenshots/formula-graph-fixed.webp).
