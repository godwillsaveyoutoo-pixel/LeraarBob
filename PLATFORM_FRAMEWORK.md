# Gedeelde platformafspraken

LeraarBob heeft een gedeelde platformlaag en verschillende vakinhoudelijke
spel- en trainermotoren. Nieuwe functies komen in de laag die verantwoordelijk
is voor dat gedrag, zodat spellen geen kopieën van platformcode nodig hebben.

## Navigatie: één bestemming per bediening

- **leraarBob-logo**: de startpagina van de website, ook op GitHub Pages onder
  een repositorypad. Een echte link ondersteunt toetsenbord en nieuw tabblad.
- **Oefenen**: de lopende oefening hervatten; alleen zonder lopende oefening
  een nieuwe sessie starten.
- **Uitleg**: een apart scherm; vraag en deelantwoorden blijven bestaan.
- **Voortgang**: beheersing en gepland herstel, zonder de sessie te vervangen.
- **Vrij oefenen**: bewust buiten de persoonlijke leersessie; geen mastery bijschrijven.
- **DEV**: een ontwikkelhulpmiddel, niet de gewone leerling- of leerkrachtinterface.
  In de Rechtentrainer is het expliciet op te roepen met `?dev=1`; de bestaande
  beperkingen voor leerlingaccounts blijven gelden.

`shared/axioma-platform.js` beheert dit contract met `wireHome`, `homeURL`,
`goHome`, `bindTrainer` en `trainerScreen`. Alle 15 catalogusspellen gebruiken
nu dezelfde terugnavigatie. De gekopieerde home-urlfuncties zijn verwijderd uit
de geïmporteerde spellen. Spellen melden hun bestaande logo expliciet aan;
algemene knoppen zoals een kamerkeuze of een spelmenu worden niet omgebogen.

Een spel kan via `beforeLeave` eerst afsluiten. Zeeslag behoudt daardoor de
bestaande afhandeling van opgeven en uitslag voordat de speler vertrekt.

Voor een nieuw spel:

```html
<script src="../../shared/axioma-platform.js"></script>
<a href="../../index.html" data-platform-home>leraarBob</a>
```

De paden worden aangepast aan de diepte van de spelmap. De module bepaalt de
websitebasis vanuit haar eigen scriptlocatie. Voor een portable build kan
exact dezelfde bron inline worden opgenomen met `data-platform-root`.

## Trainers: dezelfde bediening, eigen vakinhoud

Rechten en Vectoren gebruiken dezelfde navigatiebindingen. Vectoren opent nu
meteen een sessie of hervat de opgeslagen oefening. Constructie, herkennen via
meerkeuze en coördinatenrekenen wisselen af. Beoordeling blijft vakinhoudelijk:
een correcte resultante is iets anders dan een complete constructiemethode.

De oefenmotor bewaart taak en deelantwoorden bij hulp/voortgang. Automatisch
doorgaan na feedback wacht terwijl een ander scherm of browser-tab actief is.
Uitleg raadplegen telt als ondersteund oefenen; later volgt een zelfstandige
controle. Ook fouten krijgen gerichte herhaling met nieuwe gegevens.

De schedulers zijn nog afzonderlijk. Rechten heeft al eigen telemetrie en
herstelregels; Vectoren voegt geometrische methodebeoordeling toe. Die motoren
nu samenvoegen zou hun verschillen verbergen. Een volgende gedeelde trainerlaag
moet eerst hetzelfde expliciete resultaatformaat kunnen dragen: skill,
representatie, zelfstandig/ondersteund, resultaat, methode, foutcode en herhaling.

## Bestaande gedeelde diensten en huidige grens

`axioma-auth.js` verzorgt platformaccounts. `axioma-progress.js` verzorgt de
bestaande online voortgang; `axioma-social.js` en `axioma-groups.js` verzorgen
online aanwezigheid en samenspelen. Een oefenmotor hoort geen kopie van deze
diensten te krijgen.

Vectoren bewaart zijn volledige leermodel momenteel lokaal in de browser.
De catalogus vermeldt dat en neemt dit niet op als centrale leerlingopvolging.
Voor een accountkoppeling hoort een adapter boven op de bestaande voortgangsdienst
te komen, met accountgebonden opslag, conflictafhandeling en een expliciete
keuze over het overnemen van eerder lokaal oefenen. De navigatiewijziging doet
geen stilzwijgende migratie van voortgang naar een leerlingaccount.

## Controle

- `tests/platform-navigation-browser.cjs`: alle 15 spellen hebben een native
  platformlink met de juiste bestemming; de link navigeert naar de website.
- `tests/vector-trainer-browser.cjs`: direct starten, antwoorden behouden bij
  uitleg/voortgang, meerkeuze en foutfeedback, constructie en volledige sessie,
  780 × 360, thema's en portable HTML.
- `tests/vector-trainer.test.cjs`: wiskundige validatie en herstelplanning.
- `tests/trainer-teacher-browser.cjs`: Rechten blijft toegankelijk voor
  leerkrachten en DEV is standaard verborgen.
- `tests/social-browser.cjs`: uitnodigingen, Zeeslag en groepswedstrijden.
