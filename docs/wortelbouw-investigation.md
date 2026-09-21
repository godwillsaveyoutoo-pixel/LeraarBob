# Wortelbouw — onderzoek vóór de implementatie

Bron: `/home/johan/Bureaublad/Voor de website/wortelbouw.html`, documenttitel
`Axioma · Wortelbouw · v0.4`. Het in de opdracht genoemde bestand
`axioma_wortelbouw_thinslice_v0_4.html` is niet onder die naam aangetroffen.
Dit aanwezige v0.4-prototype bevat precies de zes gevraagde puzzels en beide
constructies. Het origineel blijft behouden.

## Wiskundige routes

Een stap verandert de oppervlakte N in N ± k², met k ∈ {1,2,3,4,5},
N − k² > 0. Startoppervlakten zijn 1, 4, 9, 16 en 25. Breedte-eerst
onderzoek van deze toestanden geeft de onderstaande minima. De ruimtelijke
uitvoerbaarheid moet daarna afzonderlijk bewezen worden met echte tegels.

| Doel | Kortste route, in oppervlakten | Stappen | Alleen som |
| --- | --- | --- | --- |
| √13 | 9 + 4 = 13 | 1 | 1 |
| √12 | 16 − 4 = 12 | 1 | 4 + 4 + 4 = 12: 2 |
| √14 | 9 + 4 + 1 = 14 | 2 | 2 |
| A = 7 | 16 − 9 = 7 | 1 | 4 + 1 + 1 + 1 = 7: 3 |
| √15 | 16 − 1 = 15 | 1 | 9 + 4 + 1 + 1 = 15: 3 |
| √21 | 25 − 4 = 21 | 1 | 16 + 4 + 1 = 21: 2 |

Geen doel is een startvierkant. 14 is geen som of positief verschil van
twee beschikbare kwadraten: daar zijn minstens twee stappen nodig. De andere
vijf routes zijn dus minimaal zodra een legale geometrische plaatsing bestaat.
De v0.4-referentie van drie stappen voor oppervlakte 7 is onjuist.

Vier verschilpuzzels zijn structureel hetzelfde, met andere verhoudingen.
√15 maakt het voordeel ten opzichte van alleen optellen het duidelijkst.
√14 is het diagnostische geval voor doorgaan in een gedraaide lokale basis.
De oppervlaktemissie 7 is vooral een andere representatie van hetzelfde concept.

## Ruimtelijke beslissingen

Een onbegrensde vloer levert geen bewezen moeilijk ruimtelijk puzzelspel op.
Veel botsingen zijn te vermijden door op een buitenzijde verder te bouwen.
Botsingen zijn wel relevant bij terugbouwen, het kiezen van een bestaand
vierkant en de twee gespiegelde plaatsingen van de driehoek. Een klein
cameravenster mag nooit als verborgen geometrische spelregel dienen.

Voor deze diagnostische versie: onbeperkte vloer, zichtbare toekomstige
hulp- en resultaattegel en vooraf controle van de hele stap. Daardoor komt de
speler niet vast te zitten na een driehoek waarvan het verplichte vierkant
niet meer past. Bij blokkering kan men spiegelen, een andere zijde, maat of
vierkant kiezen. Geen kunstmatige obstakels of extra campagne toevoegen.
Toon de gebruikte stappen; vergelijk de voetafdruk in het speelverslag, zonder
te beweren dat een gevonden lay-out een globaal minimaal oppervlak heeft.

## Bediening en visuele logica

- Expliciete keuze tussen een driehoek **aan een rechthoekszijde** en **aan
  de schuine zijde**, met geometrische pictogrammen. Uit dezelfde geselecteerde
  zijde kan men beide interpretaties construeren; afleiden uit een sleepgebaar
  zou de wiskundige bedoeling onzichtbaar en foutgevoelig maken.
- Liniaal met alleen 1–5. Geen vrije invoer en geen precisiesleepbewegingen.
  Kies de maat en tik het startvierkant onderaan neer.
- Kies een bestaand vierkant, tik een vrije zijde, spiegel zo nodig de
  driehoek en tik de voorgestelde driehoek neer. Vervolgens legt de speler
  afzonderlijk het hulpvierkant en het resultaatvierkant op hun fysieke plek.
- Constrained geometry genereert rechte hoeken en loodrechte vierkanten.
  Noch driehoek noch vierkant kan vervormen door een onnauwkeurige aanraking.
- Grote semantische aanraakknoppen bij de vorm, minimaal 44 CSS px; dezelfde
  acties met toetsenbord. De wereld wordt opnieuw gekadreerd; tekst/knoppen
  worden niet met de tegels meegeschaald.
- Rechthoekmarkering, kleurvaste tegels, expliciete bekende maten en de drie
  bijbehorende vierkanten laten het verband zien. De onbekende zijde krijgt
  nog geen getal; de resultaattegel draagt een vraagteken. Geen oplossingsformule
  als knop. Bij kleine driehoeken staat de grote aanraakzone naast het stuk,
  met een dun lijntje ernaartoe, zodat de knop de bekende maat niet bedekt.
- Na de laatste tegel wordt een gouden koord langs de gevonden zijde gelegd.
  Pas daarna verschijnen √N en A = N, plus de voltooide oppervlaktevergelijking.
  Het vooraf bekende missiedoel in de kop is uiteraard al zichtbaar.
- Elke fysieke plaatsing is één herstelbare toestand. Ongedaan maken na de
  onthulling verbergt de uitkomst opnieuw en laat de constructie verder afmaken.

## Architectuur en verificatieplan

Scheid zuivere geometrie/toestand, canvasweergave en DOM-bediening. Hergebruik
de vectorconstructies en SAT-grenscontactregel uit v0.4; vervang de sleepinterface,
cameraminimumschaal en fragiele herstelheuristiek. Bewaar oppervlakten als gehele
getallen; alleen coördinaten gebruiken floating point. Canvas tekent alleen bij
wijzigingen en tijdens de korte koordanimatie, DPR maximaal 2, geen zware filters.

Verifieer alle zes routes met echte vormplaatsingen en raakvlakken, beide
spiegelingen, gedraaide basis, helper/resultaat apart, verborgen uitkomsten,
herstellen van iedere fase en schermrotatie. Speel alle puzzels via de zichtbare
interface bij 780×360 én 640×360; inspecteer screenshots. CPU-vertraging is een
proxy voor goedkope hardware, geen vervanging voor een fysieke Samsung A20.
Leg bevindingen en concrete gespeelde routes vast in het eindverslag.
