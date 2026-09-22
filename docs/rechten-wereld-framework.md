# Rechtenreis — eerste framework en proefkaart

Dit is een ontwerpvoorstel met een geïsoleerd klikbaar prototype, geen wijziging van de leerlijn of leerlingvoortgang. Visuele richting: sober getekend, lichte papierkleur, dunne lijnen; gerichte highlights voor selectie, aanbevolen missie en sterren.

## Eerste speelbare lus

Wereldkaart → kies een plek → lees de missie → speel een korte wiskundige opdracht → zie wat veranderd is → keer terug naar de kaart. Selecteren start nooit meteen een oefening. Een plek die nog niet beschikbaar is blijft inspecteerbaar en vertelt concreet wat voorafgaat.

De prototypekaart bevat vier gebieden en enkele voorbeeldlocaties per gebied. De proefmissies demonstreren selectie, fouten herstellen, een eerste ster verdienen en de volgende plek openen. Ze vervangen niet de bestaande constructiecontrols. Alle voorbeeldvoortgang bestaat alleen in het geheugen en verdwijnt bij herladen; accounts en traineropslag worden niet gebruikt.

## Vier onderdelen van het framework

1. **Wereldgegevens:** gebieden, locaties, verbindingen, illustraties en korte teksten. Een missie verwijst naar bestaande skill-IDs. De kaart is geen tweede kopie van de volledige skillcatalogus.
2. **Kaartinterface:** gebied kiezen, plek selecteren, opdracht tonen, toegangsreden uitleggen, reactie op resultaat. Eén geselecteerde plek en hoogstens één aanbevolen volgende plek tegelijk.
3. **Missieverbinding met de trainer:** start/hervat een bestaande reeks; bewaar kaart en opgave bij navigatie. Ontvang een afgerond resultaat met poging-ID, skill, hulpgebruik en eindstatus. De trainer blijft verantwoordelijk voor rekenen, feedback, herstel en mastery.
4. **Presentatie van voortgang:** vertaal bestaande bewijzen naar kaartstatus. Sla alleen nieuwe wereldinformatie op, zoals gekozen locatie en ontdekte decoratie. Geen dubbele XP of afzonderlijke masteryberekening.

Voorgestelde code-indeling bij echte integratie:

- `world-data.js`: gebieden en missies.
- `world-progress.js`: zuivere omzetting van trainerstate naar kaartstatus.
- `world-ui.js` en `world.css`: tekenen, selecteren en toegankelijke bediening.
- `trainer-bridge.js`: starten/hervatten en eenmaal verwerken van een resultaat.

Dit zijn verantwoordelijkheden, geen noodzaak om nu al een grote generieke spelmotor te bouwen.

## Visuele taal

| Status | Weergave | Reactie op selectie |
| --- | --- | --- |
| Later beschikbaar | Grijze pentekening, gestippelde omlijning, ruitje | Toon doel en ontbrekende voorbereiding |
| Beschikbaar | Duidelijke inktlijn | Toon missie en startknop |
| Aanbevolen | Kleine groene markering | Dezelfde bediening als elke beschikbare missie |
| Geselecteerd | Groene omlijning en licht vlak | Details veranderen direct; start is een aparte actie |
| Voltooid | Eerste ster | Opnieuw oefenen blijft mogelijk |
| Zelfstandig aangetoond | Tweede ster | Toon wat al lukt |
| Later opnieuw/transfer aangetoond | Derde ster | Toon het aanvullende bewijs |

Deze sterrenbetekenissen zijn een voorstel. Een fout haalt geen ster weg. Snelheid geeft geen ster. Hulp is beschikbaar; voltooiing met hulp kan de eerste ster verdienen, zelfstandig bewijs vraagt een latere eigen prestatie. Bevries stercriteria voordat ze aan echte data worden gekoppeld. Historische voortgang met onbekende hulpstatus mag geen verzonnen zelfstandigheidsbewijs worden.

Sober betekent: gebouwen als lijnillustraties, zachte kaartstructuur, weinig decoratieve tekst, geen permanente glitter of bonzende knoppen. Goud blijft voor sterren; groen voor actieve navigatie. Letters, vormen en tekst dragen dezelfde betekenis als kleur. Respecteer verminderde beweging.

## Kaart en leerroute

De gebieden geven overzicht; ze vervangen de goedgekeurde prerequisites niet. De definitieve missielijst moet alle relevante vaardigheden en alternatieve routes afbeelden. Het proefscherm toont slechts een selectie en gebruikt een vereenvoudigde voorbeeldroute. Bestaande toegang moet bij integratie behouden blijven. Een leraar en een leerling moeten ook rechtstreeks kunnen oefenen.

Gebieden: Coördinaten → Helling → Voorschriften → Toepassingen. Eén gebied kan later meerdere hoofdstukken bevatten. Ontgrendel nieuwe routes op aangetoonde voorbereiding, niet op een willekeurig aantal verzamelde sterren. Een eerdere regio blijft bezoekbaar.

## Concrete volgende bouwstap

Valideer eerst deze kaart op mobiel en laat enkele leerlingen zonder uitleg een missie kiezen en terugkeren. Bouw daarna alleen het gebied Coördinaten met echte `point`, `point_plot` en `delta`-opgaven. Bewijs eerst dat kaart → oefening → kaart, pauzeren/herladen en éénmalige beloning goed werken. Pas daarna dezelfde structuur toe op de andere gebieden en ontwerp veranderingen in de wereld die inhoudelijk bij de opdrachten passen.

Prototype: `games/rechten/wereld-prototype/index.html`. Het staat bewust nog niet in de leerlingcatalogus. Dit ontwerp omvat geen publicatie of databasewijziging.

## Controle van het prototype

Kaartselectie, proefmissie, voltooiing, volgende locatie en het bekijken van een gesloten plek zijn in Chromium gecontroleerd op 1100×700, 780×360 en 640×360. Bediening blijft binnen de viewport en knoppen zijn minstens 48 px. Desktop- en mobiele screenshots zijn visueel nagekeken. De proefmissies zijn illustraties van de navigatielus; echte constructie-opgaven en accountopslag moeten nog via de bestaande trainer worden aangesloten.
