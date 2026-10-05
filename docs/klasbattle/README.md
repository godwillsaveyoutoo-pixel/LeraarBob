# Centrale Klasbattle en Algebrawereld 0.5.0

`klasbattle/` is de gezamenlijke ingang voor Rechtenwereld, Vectorwereld,
Algebrawereld, Bewerkingentrainer en Wortelbouw. De gedeelde spelmenu's geven
de wereld mee via `?game=…`. De leerkracht kiest een echte groepsbattle of
**Simulatie**; een leerling kan rechtstreeks de sessiecode invoeren.

## Navigatie en behoud van werk

De centrale pagina bevat Overzicht en Ranglijsten. Een geopende battle blijft
in een iframe bestaan wanneer de gebruiker deze twee schermen bekijkt. De
platformbalk, het account, de weergavekeuze en volledig scherm zijn van de
buitenste pagina. Een ingebedde `classroom.html?hub=1` toont geen tweede balk.
Gewone rechtstreekse classroom- en deelnamelinks blijven werken.

De iframecontroller en de oorspronkelijke werkborden behouden hun bestaande
sessie- en antwoordopslag. Een expliciet ingevoerde nieuwe code start de
bijbehorende deelname; dezelfde code hervat een bestaande deelname. Bij een
accountwissel verdwijnen alle oude frames. Inklappen en herladen volgen de
gedeelde platformvoorkeur zonder oefeningen of XP te resetten.

Algebrawereld gebruikt Werelden → Levels → Spelen. Een kaart selecteert alleen
het level. **Spelen** of **Verder spelen** opent de oefeningen. **Oefenblad**
maakt een afzonderlijke papieren reeks bij dat level, met een verbetersleutel;
dit begint geen spelpoging en wijzigt geen lopende oefening. De oude vrije
reeksen zijn nog hervatbaar via Bewaard werk en bestaande links.

Iedere volledig gespeelde levelronde levert 30 XP op, ook een nieuwe ronde
van een eerder afgerond level. Nieuwe rondes gebruiken nieuwe opgaven. Een
beloningsboek per ronde voorkomt dubbel tellen bij herladen of opnieuw
nakijken. Historische XP, levelvoltooiingen en onvoltooide stappen blijven
behouden; de catalogus telt de extra XP mee zonder extra levels te verzinnen.

## Resultaten en gegevensbron

De nieuwe RPC `axioma_class_battle_hub` leest uitsluitend bestaande kamers,
deelnames, profielen en nagekeken antwoorden. De openbare functie is
`SECURITY INVOKER`; de interne functie controleert `auth.uid()` en de bestaande
leerkrachtregistratie. Gasten hebben geen execute-recht. Leerlingen zien de
ranglijsten van hun eigen klas; een meegegeven andere klas wordt genegeerd.
Leerkrachten kunnen een bestaande klas kiezen. Het overzicht van recente
kamers is beperkt tot eigen kamers en eigen deelnames.

Ranglijsten zijn per spel en tellen alleen nagekeken punten van afgeronde of
gesloten sessies. Gelijke punten geven een gedeelde plaats. Top 20 en de
eigen rij worden getoond, met punten en het percentage juiste nagekeken
inzendingen. Er worden geen gebruikers-UUID's in de ranglijsten teruggegeven.
De API schrijft geen voortgang, antwoord of ranglijstrecord.

## Leerkrachtsimulatie

De simulatie gebruikt de echte opgavegenerator en het echte werkbord, met zes
virtuele leerlingen. Antwoordgedrag en snelheid kunnen worden gewijzigd.
Wachtkamer, timer, uitslag, volgende ronde, eindranglijst en Zelf proberen
werken lokaal. Deze demo doet geen classroom-RPC of Edge Function-aanroepen
en verdient geen XP of echte ranglijstpunten. Opslag is apart in sessionStorage,
gebonden aan account en spel. De gewone sessie- en antwoordkeys blijven intact.

## Controle

- `class-battle-hub-db.test.cjs`: geïsoleerde PostgreSQL-test van klasgrenzen,
  gedeelde plaatsen, codeherkenning, rollen en uitsluitend nagekeken resultaten.
- `class-battle-hub-browser.cjs`: centrale pagina, aanmelden, ranglijsten,
  ingebedde simulatie en behoud bij overzicht, inklappen en herladen op vijf maten.
- `central-classroom-navigation-browser.cjs`: alle spelmenu's, behoud van een
  echte vectoroefening en één platformbalk in ingebedde sessies.
- `classroom-simulation*.cjs` en `classroom-portal-join-browser.cjs`: vijf echte
  werkborden, demoafscherming, codewissel, hervatten en accountwissel.
- `algebra-v050-flow*.cjs` en Stelsels-tests: selectie vóór starten, aparte
  oefenbladen, nieuwe opgaven, XP bij herhaling, migratie en compacte bediening.

De tests gebruiken fictieve accounts en geïsoleerde data; ze maken geen echte
productiebattle of fictieve leerlingen aan.
