# Proefvluchten in Stuwkrachtlab

Bij het openen staan de schepen al stil aan het begin van de gegeven vector en in P. Het schip in P staat neutraal gericht, zodat het de oplossing niet verklapt. Bij keuzevragen staat vooraf alleen het schip bij de gegeven vector.

Na een juist antwoord bij tegengestelde vectoren, nulvectoren en scalaire veelvouden vliegen twee getekende ruimteschepen over de bestaande pijlen. Cyaan hoort bij a, goud bij de antwoordvector. Beide schepen volgen gedurende 3,6 seconden een eenparige beweging; de verplaatsingen blijven precies de gegeven en berekende vectoren. Bij −a zijn de snelheden even groot en de bewegingszinnen tegengesteld. Bij k·a is de snelheid |k| keer zo groot; bij de nulvector blijft het tweede schip staan. De tekst benoemt de gelijke vliegtijd: een verplaatsingsvector op zichzelf bepaalt geen snelheid. Dit is geen simulatie van kracht of versnelling.

De proefvlucht verschijnt alleen na een juist antwoord, ook bij keuzevragen en na verbetering. Bij keuzevragen verbleken de afleiders. Pauzeren, hervatten en opnieuw afspelen wijzigen geen antwoord, XP of opgeslagen voortgang. Navigeren stopt de animatie; een volgende oefening toont de schepen opnieuw stil bij hun beginpositie. De bestaande liggende oefenmodus blijft gelden. De uitleg staat ook op compacte liggende schermen naast het bord, zonder het af te dekken. Bij `prefers-reduced-motion` verschijnen alleen de eindposities. Verlaten van het browsertabblad pauzeert een lopende vlucht.

Bron: `games/vectoren/vector-flight.js`. De gedeelde SVG-renderer tekent de vectorlabels, inclusief verticale breuken; de animatie voegt schepen en sporen toe. Battle gebruikt de gedeelde renderer zonder proefvluchten tijdens de wedstrijd.

Controles:

- `node --test tests/vector-flight.test.cjs`: alle factoren, richtingen, nulvectoren en keuzevarianten over 960 gegenereerde oefeningen.
- `node tests/vector-flight-browser.cjs`: fout antwoord zonder oplossing, echte beweging, stationair nulpunt, correcte eindpunten, pauzeren/hervatten/herhalen, ongewijzigde voortgang, compacte schermen, minder beweging en opruimen bij een volgende vraag.
- Bestaande missie-, trainer- en battlebrowsertests.

Bij één-vectorvragen vervangt een nieuwe pijl de vorige poging. Na ‘Pas mijn antwoord aan’ wordt de afgekeurde pijl verwijderd, zodat hij niet achterblijft tijdens de juiste proefvlucht. Dit herstel wordt bewaard bij herladen. Kop-staart en andere constructies behouden hun bruikbare tussenstappen; een verkeerd geplaatste pijl wordt opgeruimd. Regressiecontrole: `tests/vector-retry-browser.cjs`.
