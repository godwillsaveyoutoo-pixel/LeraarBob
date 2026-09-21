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

## Zeeslag en platformuitnodigingen

Met dezelfde lokale server en geïsoleerde Chromium:

```sh
node tests/social-browser.cjs
node --test tests/catalog-progress.test.cjs
```

De social-browsertest gebruikt twee gescheiden browsercontexten, fictieve
leerlingen en een transport in het geheugen. Er worden geen echte accounts of
cloudresultaten aangemaakt. Hij doorloopt uitnodigen vanaf Home, ontvangen in
Pythagoras, weigeren, navigeren naar Verfwinkel met een open uitnodiging,
accepteren, gezamenlijk Zeeslag openen, schepen plaatsen via muisklikken,
missen/raken, beurtwisseling, dubbele schotpakketten, vernieuwen, opgeven,
verbindingsherstel, uitloggen en 320/390/768/1440px-schermen.

`social-database.sql` controleert de echte RPC-regels met tijdelijke gegevens:
zelfuitnodigingen, dubbele uitnodigingen, onbevoegd accepteren, privacy,
bezet/offline, vervaldatums, tabbladbinding en privékanalen. Voer het uitsluitend
uit tussen `BEGIN` en `ROLLBACK`, op een database waar de social-definities zijn
geïnstalleerd. De controle maakt synthetische authgebruikers binnen die transactie;
na de rollback blijven er geen testaccounts, uitnodigingen of resultaten over.

De browsertest vervangt Supabase-transport. Een volledige test met twee echte
authsessies en echte WebSockets is daarmee niet afgedekt. De uitgerolde RPC's,
rollen en beleidsfuncties zijn afzonderlijk op het gekoppelde project gecontroleerd.

## Groepswedstrijden Kleiduifschieten

```sh
node tests/clay-game.test.cjs
node tests/clay-service.test.cjs
node tests/catalog-progress.test.cjs
```

De groepsspeltest gebruikt de echte spellogica met een minimale DOM en een
bestuurbare klok: gezamenlijke start, misser/reset, timeout, zeven op rij,
een andere winnaar en annuleren van oude starttimers. De servicetest controleert
tabbladidentiteit, antwoordcodes en het verwerpen van late antwoorden na uitloggen.
De social-browsertest is uitgebreid met sessie openen, vanuit Pythagoras deelnemen,
samen starten, reeks resetten na een fout, winnaar en ranglijst. Hij is met twee
fictieve leerlingen doorlopen. Het Supabase-transport wordt daarbij vervangen;
de echte backend wordt afzonderlijk met teruggedraaide transacties getest.

`clay-groups-database.sql` wordt alleen tussen `BEGIN` en `ROLLBACK` uitgevoerd.
Hij controleert startrechten, minstens twee spelers, lidmaatschap en tabblad,
gedeelde starttijd, foute/te late antwoorden, idempotentie, één winnaar,
ranglijsten per tempo en de eerste Zeeslag-overwinning. Synthetische accounts
en uitslagen verdwijnen bij de rollback. Deze test is ook op de uitgerolde
database uitgevoerd.
