# Getallenwereld als werkplaats

De wereldingang, drie leerpaden en alle negentien begeleide onderdelen vormen
één werkplaats. De acht machten- en zeven wortelonderdelen behouden hun
oorspronkelijke regelkeuze, formule, aanklikbare antwoorddelen, exacte controle
en leerstappen. Vier wetenschappelijke onderdelen voegen dezelfde werkwijze
toe voor grote en kleine getallen, terugschrijven en normaliseren. Het OS verzorgt de
accountbediening, vensteracties en gezamenlijke navigatie. De app blijft eigenaar
van de eigen werkruimte en voortgang.

## Hoofdstukken en leerdoelen

Machten, Vierkantswortels en Wetenschappelijke schrijfwijze openen hun eigen pad. Een onderdeel aanklikken
selecteert het; starten is een aparte handeling. De gekozen opgave blijft bewaard
bij teruggaan, minimaliseren, Start en hervatten. Het pad adviseert een volgorde,
maar sluit geen onderdelen af.

| Pad | Groep | Bewaarde leerdoel-ids |
| --- | --- | --- |
| Machten | Begrijpen | `machten-betekenis` |
| Machten | Bewerken | `machten-product`, `machten-quotient`, `machten-negatief` |
| Machten | Haakjes | `machten-macht`, `machten-factoren`, `machten-haakjes` |
| Machten | Zelf kiezen | `machten-mix` |
| Vierkantswortels | Begrijpen | `wortels-factor` |
| Vierkantswortels | Bewerken | `wortels-product`, `wortels-quotient` |
| Vierkantswortels | Vereenvoudigen | `wortels-macht`, `wortels-vereenvoudigen` |
| Vierkantswortels | Zelf kiezen | `wortels-som`, `wortels-regels` |
| Wetenschappelijke schrijfwijze | Grote getallen | `wetenschappelijk-groot` |
| Wetenschappelijke schrijfwijze | Kleine getallen | `wetenschappelijk-klein` |
| Wetenschappelijke schrijfwijze | Terugschrijven | `wetenschappelijk-terug` |
| Wetenschappelijke schrijfwijze | Normaliseren | `wetenschappelijk-normaliseren` |

De oorspronkelijke vijftien doel-ids blijven behouden; de vier nieuwe ids
worden toegevoegd. Er zijn geen automatische voltooiingen of omgerekende XP.
De wetenschappelijke werkbank vraagt een rekenregel, cijfers van de factor en
de exponent, of de cijfers van het teruggeschreven getal. Ze beoordeelt exact
of de waarde behouden blijft. Bij normaliseren veranderen factor en exponent
samen. Bij terugschrijven wordt zowel naar links als naar rechts gerekend.
De leerling kiest antwoorddelen; er is geen antwoordtekstveld of cijferkeyboard.

Aanvullende reeksen en speelvormen blijven bij de bestaande provider, met diens
eigen antwoordstijl, opslag en voortgang. Nieuwe wetenschappelijke reeksen
hebben drie verschillende niveaus: grote gehele getallen met één significant
cijfer, grote en kleine getallen met twee of drie significante cijfers, en
interne nullen bij exponenten tot ±20. Historische provider-taken zonder
versiemetadata blijven exact de oude generatie gebruiken. De werkplaatsstijl
geldt voor de wereldingang en alle negentien begeleide onderdelen; de
reeksprovider behoudt zijn eigen stijl.

## Motor en bewaren

`lessons.js` is uitgebreid met de vier wetenschappelijke doelen en
`guided-answer.js` met keuzes voor afzonderlijke cijfers. De oorspronkelijke
machten- en wortelgeneratie en antwoordcontrole blijven gelijk. De exacte
`../bewerkingen-trainer/core.js` ondersteunt daarnaast expliciete
wetenschappelijke generatorversie 2; de standaard blijft versie 1 voor oude
opgaven, sessies en bladen. `workshop.js` rendert de leerpaden, werkbank, hulp en resultaten;
`workshop.css` geeft deze schermen hun warme werkplaatsstijl. De bestaande
native kopbalknodes en handlers blijven bestaan, zodat het gedeelde kruimelpad
ook in het OS de wereld, het hoofdstuk en het onderdeel kan volgen.

Machten vermenigvuldigen begint met de bestaande editie 1: zes verschillende
vragen met positieve exponenten. Verdieping gebruikt editie 2, inclusief de
bestaande negatieve varianten. Nieuwe productreeksen bewaren aanvullend
`pathVersion: machtenwerkplaats-v1` en `track: basis` of `verdieping`. Deze
velden worden alleen hersteld als de editie klopt. De andere oorspronkelijke
onderdelen gebruiken hun bestaande generatie en exacte antwoordcontrole.
De nieuwe wetenschappelijke onderdelen hebben eigen seeds, regelkeuzen en
antwoorddelen. Hun tweede editie kan ook negatieve getallen gebruiken; het
vaste minteken blijft behouden bij het verplaatsen van de komma.

Nieuwe reeksen kiezen zes verschillende opgaven. Als 500
willekeurige seeds daarvoor niet volstaan, zoekt de startactie langs een
afzonderlijke, vaste reeks seeds. Dit voorkomt de zeldzame terugval op dubbele
vragen bij negatieve machten. De rekenmotor en historische seeds veranderen
hierdoor niet. De nieuwe wetenschappelijke doelen gebruiken dezelfde begrensde
start- en hervatlogica; hun afwerking verandert geen oude reeks.

De opslag blijft `leraarbob.getallenwereld.v1` via `AxiomaGame.storage`.
Historische reeksen bewaren hun seed, index, editie, waarden, hulpmarkering,
pogingen en oplossingsbewijzen. De bestaande editieovergang naar editie 2 blijft
bij oude reeksen behouden. Een opgeloste opgave vóór het einde blijft hervatbaar
zolang de leerling nog niet op Volgende opgave heeft geklikt. Het hulpvoorbeeld
bewaart aanvullend zijn eigen seed en huidige stap; een uitstap via het menu of
herladen verandert dat voorbeeld niet. De eigen invoer blijft staan.

Alleen een werkelijk afgeronde reeks krijgt de resultaatpagina. Een oude
resultaatlink naar onafgemaakt werk opent de echte opgave. Het zelfstandige
aantal op de resultaatpagina beschrijft bewijs binnen dit onderdeel; eerdere
reeksen tellen mee. Een onderdeel is afgerond na zes verschillende uitgewerkte
opgaven. Dat is geen automatische uitspraak over beheersing.

Er is geen nieuwe accountlaag of opslagnaam. De begeleide route rapporteert
het echte aantal afgeronde onderdelen op 19 en kent geen XP toe. Historische
voltooiingen blijven voltooiingen van hun oorspronkelijke doel. De bestaande
reeksprovider en online sessies gebruiken hun eigen echte XP.

## Samen oefenen en papier

Oefenen & samen, Oefenblad en Ranglijsten blijven bereikbaar vanaf de wereld,
het gekozen onderdeel en het menu. Gerichte links geven het bestaande leerdoel
of de passende vraagvorm door, met een terugkeerlink naar de eigen plek.
Betekenis/nulmacht en de controle van geldige wortelregels hebben nog geen
exact overeenkomstige reeksprovider; daar opent zichtbaar een hoofdstukselectie.
Ook terugschrijven en normaliseren openen een hoofdstukselectie. De provider
oefent daar aanvullend de voorwaartse omzetting van decimale getallen naar
wetenschappelijke schrijfwijze; hij biedt geen gelijkwaardige vraagvorm voor
deze twee begeleide doelen. De interface maakt deze grens zichtbaar.

De bestaande provider verzorgt solo, Duo Learn, Duo Battle, Bordduo en voor
leraren Klaslearn, Klasbattle en Borduitleg. Leraren krijgen daarnaast de bestaande
leerlingresultaten. Leerlingen oefenen, kiezen duo of nemen deel. Een link
start geen sessie of oefening en verandert geen lopend leerlingwerk.
Oefenbladen en verbetersleutels blijven bij de bestaande papiergenerator.

De nieuwe wetenschappelijke provider-taken bewaren `generatorVersion: 2` naast
skill, seed, level en variant en krijgen een taak-ID met `:v2`. Herladen behoudt
dus dezelfde vragen, antwoordkeuzes en conceptinvoer. Taken zonder versie
blijven versie 1. De provider houdt zijn zestien vraagvormen en eigen
`bewerkingen-trainer`-voortgang; die worden niet opgeteld bij de negentien
begeleide onderdelen.

De online versie-2-niveaus zijn lokaal getest met echte SQL-migraties en de
Edge-handler. Op **10 oktober 2026** zijn de gerichte migratie en
`numbers-session` versie 2 naar productie uitgerold; bestaande voortgang en
sessiegegevens bleven ongewijzigd. De frontend wordt via GitHub Pages vanaf
`main` gepubliceerd; publieke ingangen zijn [het bureaublad](https://godwillsaveyoutoo-pixel.github.io/LeraarBob/os/)
en [Getallenwereld](https://godwillsaveyoutoo-pixel.github.io/LeraarBob/games/getallenwereld/).
Actuele releasecontroles staan in [PR #7](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/pull/7)
en [het verificatierapport](../../os/qa/verification.json). De backend controleert de
ondersteunde generator vóór inschrijving of beoordeling, bewaart actieve
versie-1-ruimtes en valt veilig terug als database of arithmetic-bundle nog oud
is. Een nieuwe client gebruikt steeds de ontvangen generatie; een oude server
krijgt een expliciete melding over de historische vraagmix. De afzonderlijke
uitrolvolgorde staat in
[de providerdocumentatie](../bewerkingen-trainer/README.md).

## Schermen en controles

De gedeelde bovenbalk heeft direct bereikbare account-, schermvullende-,
weergave-, menu- en inklapbediening. Het OS toont één platformbalk. Ingeklapt
blijft een herstelknop met eigen ruimte beschikbaar. Inklappen en weergavekeuze
veranderen alleen de presentatie en resetten geen vraag, invoer of voortgang.

De werkbank reserveert ruimte voor de opgave en Controleer/Volgende opgave.
Keuzen kunnen in hun eigen paneel scrollen wanneer de schermruimte dat vraagt.
Een compact liggend scherm zet formule en keuzen naast elkaar. Decoratieve
illustraties nemen daar geen ruimte van de antwoordbediening in. Aanraakdoelen
zijn minstens 44 × 44 pixels.

`tests/getallen-workshop-dom.test.cjs` controleert de leerpaden en alle negentien
native antwoordflows, de volledige basisreeks en een wortelreeks, fouten,
hulpseed/stap, reload/menu, historische negatieve vragen, verdieping, geparkeerde
reeksen, resultaatlinks, vaste kopbalknodes en gerichte providerlinks.
De nieuwe `tests/getallen-scientific-lessons.test.cjs` controleert de vier
wetenschappelijke doelen, exacte waarden en tussenstappen, komma- en
tekenrichtingen, normaliseren, digitkeuzes en reproduceerbare seeds.
`tests/scientific-provider.test.cjs` bevriest 3600 historische provider-taken en
controleert 3600 nieuwe taken onafhankelijk. De bestaande kern- en keuzetests
blijven gelden. De native browser controleert alle 19 routes op vijf schermmaten;
de compacte werkbankcontrole speelt 106 formulevarianten op 640 × 360 en
390 × 844 met zichtbare aanraakdoelen en echte antwoordcontrole.
De eerdere OS-matrix van 128 interactiegroepen en 876 layouts
blijft bewijs voor de oorspronkelijke vijftien werkbanken.

De aanvullende `tests/getallen-scientific-browser.cjs` slaagt met 67
interactiegroepen en 190 gemeten layouts: volledige reeksen in de vier nieuwe
onderdelen, zelfstandig en binnen het OS, beide balkstanden met echte compacte
antwoorden, fout/hulp/terugkeer, Start/ESC/focus, minimaliseren, Bewaren, herladen,
historische voortgang, drie provider-niveaus, papier en klas-/duokeuzes. Zijn
sessieresponses zijn lokale fixtures. `tests/scientific-session-version.test.cjs`
controleert afzonderlijk echte lokale SQL/Edge: alle vier online werkvormen op
drie niveaus, historische sessies en XP, afwijzing vóór deelname, veilig
terugvallen en gelijke browser-/servergeneratie.

De daadwerkelijke browser-
controle van het OS en de native route, waaronder 1366 × 768 op 100% zoom,
staat met de uitgevoerde resultaten en eventuele grenzen in
[os/PILOT.md](../../os/PILOT.md).

Lokale testaccounts en sessiefixtures schrijven geen echte leerlinggegevens.
Zij vervangen geen volledige controle met twee echt ingelogde productieaccounts,
cloudhervatting en externe realtimeverbindingen. Die controles blijven open.
De backenduitrol is gecontroleerd op bronbestanden, toegangsrechten en behoud
van bestaande gegevens; daarbij zijn geen oefensessies of leerlingantwoorden
aangemaakt. De releasecontroles en de nog open accountproef worden afzonderlijk
in het pilotverslag gemeld.

## Illustratie

`assets/machtenwerkplaats.png` is het meegeleverde decoratieve panorama. Vier
CSS-achtergrondposities tonen de paviljoenen. De werkplaats gebruikt echte HTML
voor alle vragen, formules, doelen, voortgang, knoppen en antwoorden; het
panorama bevat geen bediening. Er is voor deze uitbreiding geen nieuwe
illustratie gegenereerd. UI-screenshots komen uit de werkelijk bediende
browsercontroles; het zijn geen gegenereerde mock-ups.
