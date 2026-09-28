# Levels, beschikbaarheid en voortgang

De kaarten en het voortgangsoverzicht gebruiken één regel uit `content/area-maps.js`:

- Elk uitgebracht level is meteen vrij te kiezen. Een eerdere oefening is nooit een toegangseis.
- Puntenbaai is voorkennis, herkenbaar aan **Voorkennis · vrij herhalen**. Het eiland telt als gepasseerd voor de leerroute. De oefeningen blijven optioneel beschikbaar; er wordt geen fictief oefenbewijs opgeslagen.
- Nieuwe spelers beginnen bij Hellingrug. Het aanbevolen pad gaat daarna naar Grenspas en Formulewerf. Signaalstad volgt zodra daar oefeningen beschikbaar zijn.
- Een gekozen, onafgewerkte oefening krijgt voorrang bij **Verder**. Anders volgt het eerstvolgende niet-afgeronde beschikbare level in de route. Na alle beschikbare routelevels verschijnt **Vrij oefenen**.
- Het levelnummer blijft altijd staan. Afgerond werk krijgt een groen vinkje én de tekst **Afgerond**. Het vinkje overlapt de rechterbovenrand van het nummerbolletje en schaalt mee met dat bolletje; het cijfer zelf blijft vrij. De voorgestelde stap krijgt een gouden markering; **Bezig** is paars. Andere beschikbare levels blijven blauw en vrij te kiezen.
- Nog niet gebouwde levels tonen **Komt later**, zonder slot of suggestie dat een leerling iets moet vrijspelen. Ze worden nooit aanbevolen.
- De voortgangsteller gebruikt de 19 beschikbare levels; de 9 toekomstige levels blijven als preview in het overzicht staan. Voorkennis en daadwerkelijk afgeronde oefenrondes blijven afzonderlijk herkenbaar.
- Herhalen verwijdert eerder verdiende vinkjes niet. Bestaande lokale en historische voortgang wordt gelezen, niet herschreven door de kaart.

De vaste nummering en bestaande bladwijzers (`/halte/`) blijven behouden. De zichtbare benaming is voortaan overal **level**.

## Controles

- `rechten-v2-route-policy.test.cjs`: voorkennis, open toegang, routevolgorde, hervatten, afgeronde nummers/vinkjes en uitgestelde levels.
- Bestaande tests voor voortgang, gebieden en Formulewerf bewaken het behoud van oefenbewijs, routes en de oorspronkelijke validators/opslag.
- `rechten-v2-area-maps-browser.cjs`: wereldkaart en alle gebiedskaarten op 11 schermformaten en browserzoom 80%, 100% en 125%; inclusief labels, statusvarianten, klikbaarheid en navigatie.
- `rechten-v2-progress-browser.cjs`: nieuwe gast naar Hellingrug, rechtstreeks openen van Formulewerf B, exact hervatten en voortgang op zeven schermformaten.

Laatste controle: **186 unittests**, **241 browser-layoutcontroles** en **11 voortgangs-/navigatiecontroles** geslaagd. De browsercontrole verifieert uitdrukkelijk dat de badge de rechterbovenrand overlapt, proportioneel blijft en het cijfer niet raakt.

De screenshots gebruiken testvoortgang: [smartphone](smartphone-corner-badges.webp) en [afgerond naast bezig](completed-and-active-levels.webp).
