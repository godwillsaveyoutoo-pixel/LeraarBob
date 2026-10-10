# Eén OS-navigatiebalk per app

Binnen `/os/` levert het bureaublad de navigatie, accountknop, echte spelvoortgang, volledig scherm, weergavekeuze en het menu. De vensterknoppen staan in de taakbalk. Boven- en onderbalk klappen onafhankelijk in. Kleine herstelhandvatten vervangen de vroegere focusstrook; de iframe wordt daarbij niet vervangen. `edge-bars.js` zoekt vrije ruimte naast tekst en bediening. Gebruik `data-os-protect` voor andere belangrijke randelementen die het handvat moet ontwijken. Alleen bij een volledig bezette rand wordt veiligheidsruimte vrijgehouden.

`native-chrome.js` beschrijft per app welke oorspronkelijke kop bij navigatie hoort. `native-chrome.css` wordt uitsluitend in een door het OS beheerde iframe geladen. Bestaande adapters voor Rechtenwereld, Algebrawereld, Getallenwereld, Logicawereld en Glasraam blijven verantwoordelijk voor hun eigen aansluiting.

## Wat er met de oorspronkelijke bediening gebeurt

- Branding, dubbele schermknoppen en spelnavigatie nemen geen tweede balk meer in.
- Actuele onderdelen verschijnen in het OS-kruimelpad. Klikbare onderdelen bedienen hun oorspronkelijke knop; er wordt geen nieuwe oefening gestart om een menu te openen.
- **Menu → Huidig spel** bevat de beschikbare oorspronkelijke spelacties. De lijst wordt bij openen opnieuw gelezen, inclusief uitgeschakelde knoppen en schakelstanden. Werkvormen blijft de bestaande, rolgebonden OS-keuze.
- Echt gereedschap blijft bij het werkbord. Stelsels behoudt oefening, methode, niveau, ongedaan maken en herstart. Functies & rechten behoudt stapbediening. Verfwinkel behoudt de bestelling. Wortelbouw behoudt doel, tekeninstructie en wortelas. Spelers, timers, rondes en sessiecodes worden niet als dubbele navigatie verwijderd.
- De oorspronkelijke DOM-nodes, eventhandlers, voortgangsbronnen en accountopslag blijven bestaan. De adapter schrijft geen leerlinggegevens.
- Zes spellen starten binnen een iframe niet langer automatisch hun eigen fullscreen. De centrale OS-knop beheert volledig scherm; zelfstandig geopend behouden de spellen hun bestaande startgedrag.

## Een nieuwe app aansluiten

1. Voeg een expliciete adapter toe aan `specs`, ook wanneer de app al een eigen OS-aansluiting heeft. De catalogustest voorkomt dat een nieuwe app ongemerkt buiten deze afspraak valt.
2. Geef alleen de echte navigatiekop op bij `header`. Selecteer geen koppen van vragen, spelers of dialoogvensters.
3. Declareer `crumbs` en `actions` met stabiele selectors. Controleer alle acties na het verbergen van de kop. Menuacties worden uitgevoerd op de actuele originele node, nooit op een gekloonde handler.
4. Gebruik `tools` uitsluitend voor directe oefenbediening. Verberg geen formule, aanname, timer of antwoordactie om een lege kop te krijgen. De aanraakdoelen zijn minstens 44 × 44 px.
5. Controleer vaste gridrijen en absolute offsets. De iframehoogte is de beschikbare werkruimte; een oude schermhoogte voor de platformbalk mag daar niet nogmaals van afgaan.
6. Doorloop de native start, een echte antwoordhandeling, menu, terugkeer, minimaliseren, alle vier combinaties van ingeklapte balken en herladen. Controleer desktop, telefoon en laag landschap. Bekijk apart eventuele lokale duo-, online- en klasroutes; geïsoleerde werkborden krijgen geen tweede platformbalk.

De browsermatrix controleert de beschikbare solo-ingangen. Bestaande tests voor piloten, Algebra en werkvormen vullen dat aan met echte oefeningen en lokale sessies. Zie [uitgevoerde controles en grenzen](qa/uniform-chrome/README.md).
