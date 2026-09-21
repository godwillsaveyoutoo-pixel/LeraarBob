# Axioma Vectorentrainer v0.2

Open **Axioma_Vectorentrainer_v0.2.html** rechtstreeks in een browser. Het bestand
bevat alle code en vormgeving, werkt zonder server of internet en bewaart
voortgang en de lopende oefening in deze browser.

## Platformflow

De trainer opent direct in een nieuwe of hervatte oefensessie. Het logo
leraarBob linksboven verwijst naar de website. Oefenen, Uitleg en Voortgang zijn
aparte bestemmingen; uitleg bekijken bewaart de lopende tekening. Een antwoord
na raadplegen van uitleg telt als ondersteunde oefening en krijgt later een
zelfstandige herhaling. Goede antwoorden in een leersessie gaan na korte
feedback door; uitleg, voortgang of een verborgen tabblad pauzeren dit.
De onderwerplijst is nu een secundair scherm voor vrij oefenen.

Navigatie komt uit `shared/axioma-platform.js`, dat ook door de andere spellen
wordt gebruikt. De build neemt dezelfde module op in het losse HTML-bestand.

## Constructie en beoordeling

- De vectorbank is vervangen door vrij tekenen: slepen of beginpunt → eindpunt
  aantikken. Alle roosterpunten snappen op dezelfde manier. Ook een nulvector
  kan met twee tikken op hetzelfde punt worden gemaakt. Undo herstelt een stap.
- Elke pijl bewaart beginpunt, eindpunt, dx en dy. Beoordeling gebeurt met
  roostercoördinaten; pixels bepalen uitsluitend de weergave.
- De validator scheidt `RESULT_OK` en `METHOD_OK`. Een juiste diagonaal zonder
  parallellogramconstructie krijgt specifieke feedback en blijft bewerkbaar.
- Kop-staart wordt als een geometrische ketting onderzocht, onafhankelijk van
  de volgorde waarin de leerling de pijlen tekende. Een expliciet gevraagde
  volgorde hoort wél bij de methode.
- Vrije lineaire combinaties accepteren zowel een directe resultaatvector als
  equivalente routes met veelvouden van de referentievectoren, zoals
  a + a − b, 2a − b en −b + 2a. Ontbindingen mogen vanuit hetzelfde beginpunt,
  kop-staart of op andere plaatsen liggen: richting en som zijn doorslaggevend.
- De knoppen Pijl/Resultante helpen de leerling zijn werk te onderscheiden;
  een verkeerd gekozen tekentool maakt een wiskundig correcte pijl niet fout.
- Geen beoordeling tijdens het tekenen. Uitgewerkte voorbeelden mogen het
  antwoord tonen; daarna volgt een nieuw gegenereerde opgave.

## Coördinaten en rekenen

Eerst construeert de leerling de horizontale en verticale component. Bij het
voorbeeld en na een juiste constructie verschijnt de koppeling
Δx, Δy → (x, y). Later volgen twee vaste x/y-antwoordslots.

Dezelfde compacte getallenpad wordt gebruikt voor alle rekenvragen: cijfers,
tekenwisseling, breukstreep, decimaalteken, wissen en wisselen van component.
Er is geen volledig schermtoetsenbord nodig. Gewone cijfertoetsen werken ook.
Vroege vragen gebruiken pijlen als steun; latere vragen tonen uitsluitend
coördinaten, ook wanneer het antwoord buiten een gebruikelijk rooster ligt.

## Trainer en inhoud

Sessies bevatten 12 opgaven. De scheduler gebruikt afhankelijkheden, beheersing,
recente fouten, eerdere voorstellingen, afstand in oefeningen en verstreken tijd.
Nieuwe vaardigheden krijgen een voorbeeld en begeleide toepassingen. Herstel
volgt na enkele andere opgaven; een tweede latere controle blijft ingepland.
Herstelde antwoorden op dezelfde vraag tellen niet als zelfstandig juist.
‘Stevig’ vereist meerdere verschillende zelfstandige toepassingen, recente
juiste antwoorden en, waar de familie wisselt tussen geometrie en symbolen,
bewijs uit beide voorstellingen. Vrij verkennen telt niet mee voor beheersing.

Er zijn 24 oefenfamilies: eigenschappen; gelijke vectoren; tegengestelde en
nulvector; vrij namaken; scalaire veelvouden; som; kop-staart; commutativiteit;
parallellogram; verschil; lineaire combinatie; ontbinden; coördinaten lezen;
coördinaat naar pijl; AB = B − A; punten en plaatsvectoren inclusief beginpunt
terugvinden; coördinatensom en -verschil; scalair rekenen; samengestelde
uitdrukkingen; onbekende vector; eₓ/eᵧ; figuurvectoren; routes/eindpunten; en het
vierde hoekpunt bij expliciet opgegeven opeenvolgende hoekpunten.

Diagnoses onderscheiden onder meer beginpunt, zin, schaal, verwisselde x/y,
A − B in plaats van B − A, één geschaalde component, losse kop-staartdelen,
een verkeerde resultante, verkeerde ontbindingsrichtingen en een onvolledige
methode. Bij enkele reken- en constructiefamilies keert herstel bewust terug
naar visuele ondersteuning of een begeleide constructie met nieuwe gegevens.

## Controle en ontwerpkeuzes

- Acht modeltests omvatten acceptatiegevallen A–N en 2.448 gegenereerde
  combinaties van familie, moeilijkheid en variant, inclusief roosterbereik.
- Chromium: echte muis- en aanraakgebeurtenissen, drag/tap-tap, nulvector,
  alternatieve tekenvolgorde, methodefeedback, getallenpad, breuken, herladen,
  begeleide constructie en een volledige sessie van twaalf vragen.
- Alle 24 families en aanvullende introducties/begeleide schermen gecontroleerd
  op 780 × 360 CSS-pixels: geen paginascroll, controls binnen het scherm,
  bruikbare roosterhoogte. Ook lichte/donkere modus, portretstartscherm,
  desktop en rechtstreeks openen als lokaal HTML-bestand zijn gecontroleerd.
  Geen JavaScript-excepties in deze browsertests. Dit is schermemulatie,
  geen test op een fysieke Samsung A20.
- MOBILE_LAYOUT_CONTRACT.md kon niet worden gevonden. De expliciete mobiele
  eisen uit de opdracht zijn als contract gebruikt. De opgegeven v0.1,
  vectoren_v2.html en rechtenTrainer.html zijn inhoudelijk geraadpleegd.
- De bediening is opnieuw opgebouwd in plaats van boven op de oude vectorbank
  te worden gezet. Een compacte getallenpad met vijftien toetsen bespaart
  hoogte. Herkenningsvragen met meerkeuze wisselen nu af met constructie en rekenen; alle pijlen in een vergelijkingsvraag staan op hetzelfde rooster.
- Voortgang uit v0.1 wordt niet automatisch als beheersing overgenomen: de
  constructie- en beoordelingsregels zijn gewijzigd. Deze versie gebruikt
  lokale opslag; gedeelde platformaccounts vragen een aparte integratie.
- De kernfamilies zijn speelbaar. Uitgebreidere figuurnetwerken, vragen met
  één ontbrekende letter/component en een routewereld met pan/zoom zijn
  mogelijke vervolgstappen. Geometrische opgaven gebruiken gehele roosterpunten;
  breukfactoren zijn zo gekozen dat de constructie daarop past. Rekenantwoorden
  ondersteunen ook breuken.

## Bronnen en reproduceerbare build

`vector-core.js`: VectorMath, TaskValidator, TaskGenerator, TrainerScheduler en
MisconceptionModel. `vector-app.js`: Sketch Engine, Coordinate Input en schermen.
`vector-style.css` en `vector-shell.html`: opmaak en documentstructuur.
Het gebouwde HTML-bestand heeft deze losse bestanden niet nodig.

Vanuit de repository:

```sh
node scripts/build-vector-trainer.cjs
node tests/vector-trainer.test.cjs
node tests/vector-trainer-browser.cjs
```

De browsertest gebruikt dezelfde lokale server (8765) en geïsoleerde Chromium
met remote debugging (9235) als de bestaande browsertests; zie tests/README.md.
