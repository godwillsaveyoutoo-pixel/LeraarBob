# Wortelbouw Pro v0.5.0 — Battle Split Screen

Deze build voegt een eerste lokale smartboard-battle toe zonder de solo-engine te vervangen.

## Battlecontract

- aparte `battle.html` naast de gewone solo-modus;
- twee echte canvas-arena's, dus geen iframes;
- beide spelers hebben hun eigen `WortelbouwGeometry.Game`, camera, pointer capture, undo en state;
- gelijktijdige pointer/touch-input links en rechts is mogelijk;
- actieve interface is verticaal compact en heeft geen kaders rond de spelers;
- centraal boven de scheidingslijn staat steeds `RONDE x/y · MAAK √n`;
- spelersnaam + scorepunten staan links en rechts op dezelfde dunne regel;
- globale navigatie blijft `leraarBob › Wortelbouw › Battle`, met fullscreen direct beschikbaar;
- battle gebruikt voorlopig een curate pool van éénstaps somdoelen: √2, √5, √13, 3√2, 5, 10 en √104;
- geen tikmodus en geen permanent gereedschapspaneel: dezelfde directe dragtaal als de huidige Wortelbouw;
- eerste veld vrij plaatsen, daarna vanaf een gouden vrije zijde bouwen;
- na driehoek worden de twee vierkanten nog steeds fysiek opengevouwen zoals in solo;
- per speler is alleen een compacte undo-knop zichtbaar;
- eerste correcte constructie krijgt het punt; oplossingen binnen 150 ms worden als gelijk beschouwd;
- countdown en puntsignaal hebben korte WebAudio-clues, met mute-knop;
- 3 of 5 rondes en namen zijn instelbaar in het battlemenu.

## Bewuste beperking van deze eerste battle

Battle v0.1 gebruikt alleen somconstructies. Verschil- en ketenbattles horen pas in een volgende stap, nadat gelijktijdige smartboard-input en de split-screen camera in echte klasopstelling goed voelen.
