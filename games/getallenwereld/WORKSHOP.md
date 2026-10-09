# Getallenwereld als werkplaats

De wereldingang, beide leerpaden en alle vijftien begeleide onderdelen vormen
één werkplaats. Elke vraag behoudt haar oorspronkelijke regelkeuze, formule,
aanklikbare antwoorddelen, exacte controle en leerstappen. Het OS verzorgt de
accountbediening, vensteracties en gezamenlijke navigatie. De app blijft eigenaar
van de eigen werkruimte en voortgang.

## Hoofdstukken en leerdoelen

Machten en Vierkantswortels openen hun eigen pad. Een onderdeel aanklikken
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

Dit zijn dezelfde vijftien bestaande doelen. Het pad voegt geen fictieve levels
of automatische voltooiingen toe. Wetenschappelijke schrijfwijze opent de
bestaande provider voor instelbare oefenreeksen; de eigen vragen,
antwoordbediening, speelvormen en voortgang van die provider blijven behouden.
Bij wetenschappelijke schrijfwijze verschillen de bestaande niveaus 1 en 2
inhoudelijk nog niet; deze uitbreiding verandert die generator niet. De
wereldingang belooft daarom instelbare reeksen en geen drie verschillende
moeilijkheidsgraden.
De werkplaatsvormgeving geldt voor de wereldingang en de vijftien begeleide
machten- en wortelonderdelen; de reeksprovider behoudt zijn eigen stijl.

## Motor en bewaren

`lessons.js`, `guided-answer.js` en `../bewerkingen-trainer/core.js` blijven
ongewijzigd. `workshop.js` rendert de leerpaden, werkbank, hulp en resultaten;
`workshop.css` geeft deze schermen hun warme werkplaatsstijl. De bestaande
native kopbalknodes en handlers blijven bestaan, zodat het gedeelde kruimelpad
ook in het OS de wereld, het hoofdstuk en het onderdeel kan volgen.

Machten vermenigvuldigen begint met de bestaande editie 1: zes verschillende
vragen met positieve exponenten. Verdieping gebruikt editie 2, inclusief de
bestaande negatieve varianten. Nieuwe productreeksen bewaren aanvullend
`pathVersion: machtenwerkplaats-v1` en `track: basis` of `verdieping`. Deze
velden worden alleen hersteld als de editie klopt. Alle andere onderdelen
gebruiken hun bestaande generatie en exacte antwoordcontrole.

Nieuwe reeksen kiezen zes verschillende oorspronkelijke opgaven. Als 500
willekeurige seeds daarvoor niet volstaan, zoekt de startactie langs een
afzonderlijke, vaste reeks seeds. Dit voorkomt de zeldzame terugval op dubbele
vragen bij negatieve machten. De rekenmotor en historische seeds veranderen
hierdoor niet.

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
het echte aantal afgeronde onderdelen op 15 en kent geen XP toe. De bestaande
reeksprovider en online sessies gebruiken hun eigen echte XP.

## Samen oefenen en papier

Oefenen & samen, Oefenblad en Ranglijsten blijven bereikbaar vanaf de wereld,
het gekozen onderdeel en het menu. Gerichte links geven het bestaande leerdoel
of de passende vraagvorm door, met een terugkeerlink naar de eigen plek.
Betekenis/nulmacht en de controle van geldige wortelregels hebben nog geen
exact overeenkomstige reeksprovider; daar opent zichtbaar een hoofdstukselectie.

De bestaande provider verzorgt solo, Duo Learn, Duo Battle, Bordduo en voor
leraren Klaslearn, Klasbattle en Borduitleg. Leraren krijgen daarnaast de bestaande
leerlingresultaten. Leerlingen oefenen, kiezen duo of nemen deel. Een link
start geen sessie of oefening en verandert geen lopend leerlingwerk.
Oefenbladen en verbetersleutels blijven bij de bestaande papiergenerator.

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

`tests/getallen-workshop-dom.test.cjs` controleert beide paden en alle vijftien
native antwoordflows, de volledige basisreeks en een wortelreeks, fouten,
hulpseed/stap, reload/menu, historische negatieve vragen, verdieping, geparkeerde
reeksen, resultaatlinks, vaste kopbalknodes en gerichte providerlinks.
De bestaande kern- en keuzetests blijven gelden. De daadwerkelijke browser-
controle van het OS en de native route, waaronder 1366 × 768 op 100% zoom,
staat met de uitgevoerde resultaten en eventuele grenzen in
[os/PILOT.md](../../os/PILOT.md).

Lokale testaccounts en sessiefixtures schrijven geen echte leerlinggegevens.
Zij vervangen geen volledige controle met echte productieaccounts en realtime
sessies. Die grens wordt afzonderlijk in het pilotverslag gemeld.

## Illustratie

`assets/machtenwerkplaats.png` is het meegeleverde decoratieve panorama. Vier
CSS-achtergrondposities tonen de paviljoenen. De werkplaats gebruikt echte HTML
voor alle vragen, formules, doelen, voortgang, knoppen en antwoorden; het
panorama bevat geen bediening. Er is voor deze uitbreiding geen nieuwe
illustratie of UI-screenshot gegenereerd.
