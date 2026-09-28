# Wortelbouw Pro v0.3.2 — levende succesfase

Deze iteratie bouwt verder op v0.3.1 en verandert geen wiskundige regels in `geometry.js` of opslag/replay in `progress.js`.

## Wat is veranderd

- De succesfeedback is nu een expliciete presentatietijdlijn in `pro/celebration.js`.
- De camera bewaart exact het speel-kader van vóór de oplossing en doet daarna slechts een zachte zoom van ongeveer 3%.
- Op korte schermen verdwijnt de compacte opdrachtstrook pas wanneer de Wortel-as werkelijk aan de beurt is; daardoor veroorzaakt de successtatus geen camerajump.
- De gevonden zijde licht eerst goud op.
- Het resultaatveld groeit iets trager en met een organische, onregelmatige grasrand in plaats van een rechte wipe.
- Een konijn springt tijdens de succesfase vanuit het vorige veld naar een veilige landingsplek in het nieuwe veld.
- Het doelveld maakt tijdens die migratie geen tweede konijn aan; na de landing gaat het normale rondhuppelgedrag verder.
- De Wortel-as start pas na de konijnsprong. Op smartphone wisselt de onderste dock pas op dat moment naar Wortel-as + volgende stap.
- Poster, instructieregel en spraakballon volgen nu dezelfde fases: zijde → veld → konijn → wortel.
- De diagnostische `Wortelbouw.inspect()` meldt nu ook `successSequence`, `rabbitMigration`, `celebrationStage` en `rootVisible`.

## Succesvolgorde (normale animatie)

1. 0–760 ms: gevonden zijde licht op.
2. 220–900 ms: subtiele camera-ease naar ongeveer 97% van de bestaande zoom.
3. Het gras van het resultaatveld groeit ondertussen volledig af.
4. 980–1740 ms: konijn springt naar het nieuwe veld.
5. Vanaf 1920 ms: Wortel-as wordt zichtbaar en de wortel groeit uit de juiste numerieke positie.
6. Rond 2700 ms: presentatie is volledig rustig en de vervolgstap is beschikbaar.

Met `prefers-reduced-motion` wordt dezelfde semantische volgorde vrijwel onmiddellijk afgehandeld zonder bewegingsanimatie.

## Belangrijk architectuurpunt

De wiskundige state kent alleen `start`, `choose`, `helper`, `result`, `reveal`, `won` en `routeDone`. De nieuwe fases (`signal`, `field`, `rabbit`, `settle`, `root`, `done`) zijn puur presentation state. Daardoor blijft de geometrische engine onafhankelijk van art, timing en camera.

## Basischecks uitgevoerd

- JavaScript syntaxcheck voor `wortelbouw.js`, `pro/celebration.js` en `pro/presentation-data.js`.
- Level 1 (`1² + 1² = 2`) door de geometry-engine tot `won` gespeeld.
- Dezelfde actiegeschiedenis via `progress.js` gereplayed en opnieuw als `won` gevalideerd.
- Tijdlijnfases van de celebration-module afzonderlijk gecontroleerd.
