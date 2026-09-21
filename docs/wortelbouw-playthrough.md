# Wortelbouw — speelverslag en acceptatie

## Huidige bediening en presentatie

`games/wortelbouw/` is bereikbaar vanuit de catalogus Meetkunde. De geometrie
komt uit het oorspronkelijke v0.4-prototype (`wortelbouw.html`, SHA-256
`e0a5180d0c180b3a3ff4893920dc3b4f7a5d653df1c75028b7c233b281cdcdbf`).
Het [eerste onderzoek](wortelbouw-investigation.md) beschrijft de uitgangspunten;
de huidige bediening en leerlijn volgen de latere gebruikersfeedback.

Handmatig bouwen is de standaard: startvierkant uitrekken, vanaf een vrije
zijde een driehoek trekken, vervolgens beide vierkanten uitbouwen. Maten
klikken vast op gehele eenheden. Beginpunt bepaalt de spiegeling; de gebruiker
kiest of de bestaande zijde een been of de schuine zijde wordt. De camera
blijft tijdens het gebaar stil. Geannuleerde of ongeldige gebaren plaatsen
niets. Vanaf 65% uittrekken klikt een hulp- of resultaatvierkant exact vast.
Undo neemt één fysiek stuk terug. De potloodknop biedt optionele tikbediening,
met toetsenbordbediening van dezelfde knoppen.

Drie verschillende marmerkleuren verduidelijken de huidige bouwstap:
kobaltblauw voor het bestaande vierkant, koraal voor het hulpvierkant en
petroleumgroen voor het resultaat. De driehoek is zandkleurig. Een korte
legenda ondersteunt de kleuren. De gevonden lengte staat op het midden van
de gemeten zijde en draait mee; bij een verschil staat ook de lengte van de
bestaande schuine zijde langs die zijde. Een uitkomst wordt pas onthuld nadat
alle stukken liggen en het koord de nieuwe zijde heeft overgenomen.

Bij het bereiken van het doel blijft een grote kaart met **Doel bereikt!**, de
gevonden lengte, de oppervlakteberekening en een kort leermoment zichtbaar.
Het resultaatvierkant krijgt een gouden omlijsting. De kaart staat naast de
mozaïek, met ruimte gereserveerd door de camera. Undo verwijdert de beloning
weer; de volgende opgave begint pas na een bewuste klik. De korte entreeanimatie
respecteert de voorkeur voor minder beweging.

## Leerlijn en gespeelde routes

Elke route plaatst daadwerkelijk een driehoek en beide bijbehorende vierkanten.
Een beginvierkant met de gevraagde gehele lengte is op zichzelf geen voltooide
constructie. De spelhint vraagt bij 5 en 10 om een schuine zijde te bouwen.

| Volgorde | Doel | Gespeelde constructie in oppervlakten | Bouwstappen | Leermoment |
| --- | --- | --- | --- | --- |
| 1 | √2 | 1 + 1 = 2 | 1 | Twee gelijke benen |
| 2 | 3√2 | 9 + 9 = 18 | 1 | Driemaal lengte geeft negenmaal oppervlakte; √18 = 3√2 |
| 3 | √5 | 1 + 4 = 5 | 1 | Ongelijke benen |
| 4 | 5 | 9 + 16 = 25 | 1 | 3–4–5; een wortel kan geheel zijn |
| 5 | 10 | 36 + 64 = 100 | 1 | 6–8–10; lengtes ×2, oppervlakten ×4 |
| 6 | √13 | 9 + 4 = 13 | 1 | Twee kwadraten optellen |
| 7 | √12 | 16 − 4 = 12 | 1 | De bestaande zijde als schuine zijde gebruiken |
| 8 | √11 | 36 − 25 = 11 | 1 | Een kleine wortel uit grotere vierkanten |
| 9 | A = 7 | 16 − 9 = 7 | 1 | Verband tussen oppervlakte en zijde |
| 10 | √15 | 16 − 1 = 15 | 1 | Net onder een geheel kwadraat |
| 11 | √21 | 25 − 4 = 21 | 1 | Zelf een passend verschil kiezen |
| 12 | √14 | 9 + 4 = 13; 13 + 1 = 14 | 2 | Verder bouwen op een gedraaide, irrationale zijde |
| 13 | √6, twee manieren | 4 + 1 = 5; 5 + 1 = 6 én 9 + 1 = 10; 10 − 4 = 6 | 2 per route | Dezelfde wortel met een som of een verschil |
| 14 | √104 | 100 + 4 = 104 | 1 | Een groot getal hoeft geen moeilijke constructie te zijn |

De liniaal gaat normaal tot 5, bij √11 tot 6 en bij 10 en √104 tot 10. Deze
limieten worden ook in de geometriekern afgedwongen. Bij de uitgebreide
liniaal biedt de optionele tikbediening een compacte keuzelijst.
De constructies staan onafhankelijk van de leveldefinities in
`tests/fixtures/wortelbouw-routes.cjs`.

De reeks is bedoeld om te leren. Er is geen straf voor een langere geldige
route. De kortste aantallen zijn rekenkundig gecontroleerd én ruimtelijk
uitgevoerd. De vele verschilopgaven zijn variaties van hetzelfde principe;
het is geen bewijs van een uitgebreide ruimtelijke campagne. De onbeperkte
vloer en de twee spiegelingen laten veel botsingen omzeilen. Een proef met
echte leerlingen moet de moeilijkheidsvolgorde verder onderbouwen.

## Controles

- Meetkundig: 840 combinaties van maten, zijden, spiegelingen en rotaties;
  rechte hoeken, exacte kwadratische lengtes, gedeelde grenzen zonder overlap,
  verbondenheid en herstel per stuk. Aanvullend alle grotere nieuwe routes.
- Browser: alle veertien opgaven handmatig met muis op 780×360 en aanraking op
  640×360; daarnaast tikbediening op beide formaten: 60 volledige routes (twee routes bij √6).
- Uitkomsten blijven verborgen tot de onthulling. Het doel verschijnt daarna
  in de beloningskaart; het lengtelabel ligt op het midden van zijn eigen zijde.
- Undo, annuleren, opnieuw tekenen, toetsenbord, schermrotatie, alle knoppen
  binnen het venster, beloningskaart binnen de vloer en geen scroll in gameplay.
- Canvas staat stil in rust, DPR maximaal 2, geen bitmap/noise-lus. De 6× CPU-proef
  is een browserproxy, geen meting op een echt mobiel toestel.
- Screenshots worden bewaard in `/tmp/wortelbouw-*.png` en visueel nagekeken.

```sh
node --test tests/wortelbouw.test.cjs
node tests/wortelbouw-browser.cjs
```

Het prototype bewaart geen voortgang, accountgegevens of XP. De catalogus
vermeldt veertien bouwpuzzels en `tracking: none`.

## Twee manieren voor √6

Deze opgave staat na het leren doorbouwen bij √14. De eerste bereikte √6
wordt gevierd als een eerste manier. De leerling bouwt daarna opnieuw;
de voltooide berekeningen blijven in de huidige puzzel bewaard. Een route
met optellen als laatste bewerking en een route met aftrekken als laatste
bewerking zijn samen het einddoel. Alleen spiegelen of dezelfde eindbewerking
opnieuw gebruiken telt niet als een tweede manier. Beide volgordes mogen.

De vergelijking toont de werkelijk gebouwde ketens van oppervlakten, niet
een vooraf ingevuld voorbeeld. Ook andere geldige routes naar √6 worden
aangenomen. De verwijzingen volgen de gebruikte vierkanten: ongebruikte
zijtakken komen niet in de berekening. Undo neemt ook de laatst verworven
route terug; de knop om de puzzel opnieuw te starten wist beide routes.
Dit is sessiestaat, geen nieuwe opslag op het account.
