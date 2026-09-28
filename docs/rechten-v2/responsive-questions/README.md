# Schermformaten, herinneringen en asschalen

De oefenruimte reserveert de werkelijke hoogte van de feedbackbalk. Compacte
indelingen houden rekening met zowel hoogte als beeldverhouding. Grafieken
kunnen niet langer door hun intrinsieke SVG-afmetingen onder de knoppen groeien.

Een knop **Herinnering** in de kop opent de volledige uitleg voor de huidige
vraag. Dit werkt ook wanneer het zijpaneel verborgen is of er feedback staat.
Het venster kan verticaal scrollen, houdt de sluitknop bereikbaar en keert bij
sluiten terug naar de opener. Antwoorden, voortgang en het aantal hints veranderen
niet. Toetsenbord, Escape en aanraken zijn gecontroleerd.

Afleesgrafieken passen hun bereik aan de gegeven punten, nulwaarde of rechte aan.
Beide assen gebruiken dezelfde eenheid en de oorsprong blijft zichtbaar. De
bestaande gehele en halve roosterstappen blijven behouden. Tekenopgaven behouden
hun vaste rooster tijdens plaatsen, herstellen en feedback, zodat de coördinaten
niet verspringen. De oorspronkelijke validators en opgeslagen antwoorden blijven
ongewijzigd.

## Verificatie

- `rechten-v2-question-layout.cjs`: 19 speelbare vraagtypes, alle opgaven in de
  eerste reeks en alle tussenstappen; lege, foute en juiste antwoorden, selectie,
  hints en eindschermen. 1.210 toestanden × 22 CSS-schermformaten = **26.620**
  controles zonder fouten. Controleert overloop, bedekte knoppen, aanraakdoelen,
  grafiekgrootte en leesbare, niet-overlappende asgetallen.
- Formaten omvatten 640 × 360 tot 1920 × 1080, het gemelde 1214 × 609 en extra
  controles rond omslagpunten. 1708 × 960 en 1093 × 614 simuleren de beschikbare
  CSS-ruimte bij respectievelijk 80% en 125% browserzoom op 1366 × 768. Dit zijn
  viewportmetingen, geen screenshots van een gewijzigde browserzoominstelling.
- `rechten-v2-reminder-browser.cjs`: **147** controles voor alle vraagfasen,
  formaatwisselingen, focus, Escape, aanraken en behoud van antwoorden/hints.
- `rechten-v2-graph-scale.test.cjs`: passende asbereiken, gelijke eenheden,
  halve roosterstappen en stabiele tekenroosters.
- Alle **181** logica- en regressietests slagen.
- Alle zes bedieningstests slagen: Puntenbaai (26), Hellingrug (35), bijzondere
  rechten (80), Grenspas (102), Formulewerf A (84) en Formulewerf B (378)
  schermcontroles. Ze controleren plaatsen, slepen, toetsen, herstellen, ongedaan
  maken, hervatten en volledige reeksen.

Browsercontroles gebruiken een geïsoleerde Chromium-sessie met een testgast.
Er worden geen externe accountverzoeken gedaan. Zie de JSON-rapporten in deze map.

```sh
node --test tests/rechten-*.test.cjs tests/catalog*.test.cjs
V2_SCREENSHOT_DIR=/tmp/rechten-question-layout node tests/rechten-v2-question-layout.cjs
V2_SCREENSHOT_DIR=/tmp/rechten-reminders node tests/rechten-v2-reminder-browser.cjs
```

Voor browsercontroles: serveer de repository op poort 8775 en gebruik een
geïsoleerde Chromium CDP-sessie op poort 9245. Browsercontroles delen één tabblad
en moeten achtereenvolgens worden uitgevoerd.

## Rustigere Hellingrug-grafieken

Asgetallen zijn op middelgrote en grote schermen kleiner dan de puntletters en
opdrachttekst. Het halve rooster is subtieler dan het hele rooster. Bij het
classificeren van een rechte blijven alleen de belangrijkste asgetallen staan;
bij het plaatsen van punten blijven alle gehele asgetallen beschikbaar.

Bij de punten staan alleen de gekleurde letters A en B. Volledige coördinaten
staan boven de plaatsopgave en blijven als titel bij ieder punt beschikbaar.
Na het plaatsen verdwijnen de niet meer bruikbare plaatsknoppen. Puntletters
blijven uit de tekstzone onder de x-as. De browsercontrole test nu ook expliciet
op overlap tussen puntletters en asgetallen tijdens het classificeren.

De aanpassing is opnieuw gecontroleerd op 1214 × 609, 1366 × 768, 1024 × 600 en
640 × 360: 4.840 vraagtoestanden zonder indelingsfouten. De concrete vraag met
A(−1; −3/2) en B(1; 3/2) is bovendien visueel gecontroleerd op laptop en telefoon.
