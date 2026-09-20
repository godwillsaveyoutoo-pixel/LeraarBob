# Browsercontrole Pythagoras

Benodigd: Node.js 22+ (ingebouwde WebSocket), Python 3 en Chromium.
Start vanuit de projectmap een lokale server en een **apart, tijdelijk browserprofiel**:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
chromium --headless --remote-debugging-port=9235 --user-data-dir=/tmp/leraarbob-interaction-test about:blank
node tests/pythagoras-interactions.cjs
```

Voer de drie opdrachten in aparte terminals uit. Sluit de server en testbrowser daarna.
Gebruik dit profiel niet voor een echte leerlinglogin: de test doorloopt oefeningen en slaat testvoortgang lokaal op.

De controle gebruikt echte muis-, toetsenbord- en touchgebeurtenissen: getaltegels,
schaalfactor, formuletegels, klikken, verkeerde plaatsingen, dubbele rechthoekszijden,
annuleren, Escape, herstarten, wisselen van stap en liggende/staande weergave.
