# Wortelbouw — speelverslag en acceptatie

## Uitvoering

De huidige versie staat in `games/wortelbouw/` en is vanuit de catalogus onder
Meetkunde bereikbaar. Ze is gestart vanuit het gevonden v0.4-prototype
`wortelbouw.html` (SHA-256
`e0a5180d0c180b3a3ff4893920dc3b4f7a5d653df1c75028b7c233b281cdcdbf`).
De nieuwe versie scheidt geometrie, toestanden en de mobiele weergave.
Het [onderzoek vóór de implementatie](wortelbouw-investigation.md) onderbouwt
de routes en de oorspronkelijke bedieningskeuzes. Na feedback van de gebruiker
is handmatig bouwen weer de standaard: de verplichte tikken op voorgestelde
stukken namen het plezier van zelf construeren weg.

Alle zes puzzels worden met muissleepbewegingen bij **780×360** en met
aanraaksleepbewegingen bij **640×360 CSS px** gecontroleerd. De optionele
tikbediening wordt daarnaast op beide formaten doorlopen. De browserproef
verandert geen speltoestand via een test-API: `Wortelbouw.inspect()` is alleen
een kopie om de actuele toestand te lezen. Screenshots zijn apart visueel
gecontroleerd; de geteste artefacten staan in `/tmp/wortelbouw-*.png`.

Dit is een diagnostisch prototype: geen accountopslag, XP of verzonnen
competitieranglijst. De catalogus vermeldt zes bouwpuzzels en `tracking: none`.

## Kortste gespeelde routes

Een stap telt pas als driehoek en beide vierkanten zijn geplaatst. De liniaal
kiest de zijde, niet de oppervlakte. De zijdenummers hieronder horen bij de
zijdevolgorde in de optionele tikbediening; de starttegel heeft zijde 1 onderaan, 2 rechts, 3 bovenaan.
Alle genoemde plaatsingen gebruiken de eerste spiegeling.

| Puzzel | Handelingen | Oppervlakten | Stappen | Voetafdruk in wereldeenheden |
| --- | --- | --- | --- | --- |
| √13 | Startzijde 3; rechthoekszijde, maat 2, zijde 1 | 9 + 4 = 13 | **1** | 7,000 × 8,000 |
| √12 | Startzijde 4; schuine zijde, maat 2, zijde 3 | 16 − 4 = 12 | **1** | 7,464 × 8,732 |
| √14 | Startzijde 3; rechthoekszijde, maat 2, zijde 1; daarna op resultaattegel maat 1, zijde 4 | 9 + 4 = 13; 13 + 1 = 14 | **2** | 10,277 × 8,000 |
| A = 7 | Startzijde 4; schuine zijde, maat 3, zijde 1 | 16 − 9 = 7 | **1** | 7,969 × 8,234 |
| √15 | Startzijde 4; schuine zijde, maat 1, zijde 2 | 16 − 1 = 15 | **1** | 8,718 × 5,936 |
| √21 | Startzijde 5; schuine zijde, maat 2, zijde 2 | 25 − 4 = 21 | **1** | 11,033 × 8,666 |

De voetafdruk is de breedte × hoogte van de omhullende rechthoek, geen bewezen
minimum. De stappenaantallen zijn wel minimaal: de doelen zijn geen
startkwadraten, en 14 is geen som of verschil van twee beschikbare kwadraten.
Een onafhankelijke breedte-eerst zoekcontrole bevestigt deze ondergrenzen.
Alleen optellen vraagt voor √15 drie stappen, tegenover één verschilconstructie.
Ook die langere route is geometrisch gecontroleerd: 9 → 13 → 14 → 15,
met zijden 1, 4 en 2 (de laatste gespiegeld). Een tweede minimale route voor
√14 is 16 → 15 → 14: tweemaal verschil met maat 1, eerst zijde 2, daarna
zijde 4 gespiegeld. De laatste stap gebruikt √15 als echte hypotenuse.

## Wat het spelen leert

- **√13:** de drie gekleurde vierkanten maken de som begrijpelijk. De keuze
  tussen beginzijden verandert vooral de oriëntatie, niet de moeilijkheid.
- **√12:** de bestaande zijde blijft de hypotenuse. Het rechthoektekentje staat
  aan de nieuwe derde hoek. Dat onderscheid is essentieel; alleen een +/−-knop
  maakte dit in het oude prototype onvoldoende zichtbaar.
- **√14:** de tweede stap bouwt daadwerkelijk op een gedraaide zijde. Dit is
  de sterkste proef voor het koordidee en voor lokaal meten zonder globaal raster.
- **Oppervlakte 7:** één verschilconstructie volstaat. De oude referentie van
  drie stappen zou een leerling met de juiste korte oplossing verkeerd belonen.
  Als spelroute is dit verder weinig anders dan √12; het verschil zit in de
  oppervlaktemissie en de verhouding van de benen.
- **√15:** het verschil is duidelijk eleganter dan de som. De driehoek is
  smal; een sleepgebaar mag binnen 24 pixels van de bedoelde zijde beginnen.
  De gekozen beginhoek bepaalt de spiegeling.
- **√21:** opnieuw een verschilpuzzel. Kleinere maatverhouding en andere vorm,
  maar geen wezenlijk nieuw oplossingsprincipe.

Op de onbeperkte vloer zijn veel botsingen te omzeilen door naar buiten te
bouwen. De twee spiegelingen en het kiezen van een ander bestaand vierkant
leveren echte plaatsingskeuzes op, maar dit bewijst **nog geen rijke ruimtelijke
campagne**. Voor vervolgonderzoek zijn gerichte opdrachten met een beperkt
aantal stappen of een expliciet ontworpen vloercontour kansrijker dan veel
extra getallen. Zo'n vloercontour is hier bewust geen verborgen cameragrens.

Een volledig tekstloze introductie is evenmin bewezen. Kleuren, rechthoekmarkering,
maataanduiding, het meegroeiende stuk tijdens het slepen en het koord dragen de uitleg;
korte contextzinnen blijven als steun. Begrippen als hypotenuse of schuine zijde
vragen nog een proef met echte leerlingen. Er is geen leerlinggebruikersonderzoek
uitgevoerd.

## Acceptatiebewijs

| Eis | Controle in de huidige versie |
| --- | --- |
| Alleen correcte rechte driehoeken | 840 combinaties van liniaalmaten, zijden, spiegelingen en rotaties; inproduct bij de rechte hoek = 0, alle exacte kwadratische lengtes gecontroleerd |
| Verschil gebruikt bestaande hypotenuse | De basislengte voldoet aan basis² = bekend² + resultaat²; derde hoek is recht |
| Grenscontact mag, overlap niet | SAT onderscheidt gedeelde zijde/hoek van positieve doorsnede; elke geplaatste vorm blijft verbonden; gereserveerde hele stap voorkomt een onplaatsbaar verplicht vierkant |
| Werkelijke stukken plaatsen | Browser trekt startvierkant, driehoek, hulpvierkant en resultaatvierkant uit met muis en aanraking; aparte controle van optionele tikbediening |
| Uitkomst verborgen | Werkelijk naar canvas geschreven tekst wordt gecontroleerd; resultaat blijft `?` tot alle stukken liggen en de koordanimatie klaar is. De doelwaarde in de kop is de opdracht, geen voortijdige uitkomst |
| Duidelijke onthulling | Gouden lijn wordt langs de zijde getekend; daarna apart √n-label en resultaattegel A = n; screenshots van alle zes eindbeelden |
| Gedraaide constructies | √14 krijgt een tweede stap op een niet-horizontale/niet-verticale zijde; aanvullende willekeurig gedraaide geometriegevallen |
| Herstel per stap | Elke fysieke plaatsing heeft een eigen momentopname. Alle fasen teruggedraaid, daarna een andere route; undo tijdens animatie annuleert de onthulling |
| Alle doelen haalbaar | 24 complete speelroutes: zes doelen met beide bedieningen op beide schermformaten |
| Mobiele bediening | Knoppen minimaal 44×44; zijden hebben 24 px hittolerantie; bediening binnen scherm; geen gameplay-scroll of normale modals; footerknoppen raken elkaar niet; portret draait terug zonder toestandsverlies |
| Camera beperkt de wiskunde niet | Geometriekern kent geen schermgrenzen. Camera omvat ook de komende tegels en heeft geen vaste minimumzoom |
| Lage renderkosten | Geen doorlopende tekenlus in rust, DPR maximaal 2, enkele vectoraders per tegel, geen blur/noise of beeldbestanden in het spel; interactie getest met 6× CPU-vertraging |
| Website-ingang | Nieuwe tegel en illustratie in beide catalogi; werkelijke klik op de tegel opent het spel, merklink keert terug naar het menu |

De throttlingproef is een proxy, geen meting op een echte Samsung A20. Een
fysieke toestelproef blijft nuttig; de referentieafmetingen zijn wel daadwerkelijk
gecontroleerd. De eerste volledige 6× CPU-proef mat 32 ms voor driehoek plaatsen
inclusief CDP-communicatie; dit is een waarneming, geen prestatiegarantie.

## Herhaalbare controles

Met de lokale server en aparte Chromium uit `tests/README.md`:

```sh
node tests/wortelbouw.test.cjs
node tests/wortelbouw-browser.cjs
node --test tests/catalog-progress.test.cjs
```

Het spel is lokaal bereikbaar via `http://127.0.0.1:8765/games/wortelbouw/`.
Publiceren gebeurt pas wanneer deze bestanden naar de website worden gepusht.

## Handmatig bouwen na gebruikersfeedback

- Trek op de stippellijn een startvierkant uit. De zijde klikt vast op 1–5.
- Kies rechthoekszijde of schuine zijde. Trek vanaf een vrije gouden zijde
  naar buiten: afstand bepaalt de gehele maat, het beginpunt de spiegeling.
- Trek de volgende gouden zijde naar buiten om het hulpvierkant en daarna
  het resultaatvierkant uit te bouwen. Ze groeien met de beweging mee;
  vanaf 65% trekken klikt het volledige, meetkundig exacte vierkant vast.
- Geen extra controle- of bevestigingsklik. Loslaten plaatst het stuk;
  onvoldoende trekken, naar binnen trekken of een geannuleerd gebaar
  plaatst niets. Undo neemt één geplaatst stuk terug.
- De camera blijft tijdens trekken stil en kadreert na plaatsing opnieuw.
  De volgende vierkanten krijgen ruimte zonder hun vorm vooraf te tonen.
- Het potlood schakelt naar de optionele tik- en toetsenbordbediening.
  De meetkundige kern, overlapcontrole en onthulling zijn ongewijzigd.
