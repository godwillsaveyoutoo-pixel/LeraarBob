# Algebrawereld v0.5.1

De platformversie uit `Axioma-Algebrawereld-v0.4.5.zip` vervangt het eerdere
algebraspel op dezelfde ingang: `games/algebra-trainer/`. De spel-id
`algebra-trainer`, het centrale account en de bestaande opslagsleutels blijven
behouden. De catalogus toont één hoofdkaart voor Algebrawereld.

## Leesbare bewerkingen

Stelsels gebruikt één bewerkingsveld: `−y`, `+3x`, `÷2` of `×−2`.
De leerling hoeft een losse letter niet als coëfficiënt `1` in een getalveld
te vertalen. De knoppen benoemen de bewerking, de geselecteerde vergelijking
heeft een eigen kleur en een korte vooruitblik toont wat aan beide leden
gebeurt. Enter opent de vooruitblik; een aparte actie voert de stap uit.
Een oude opgeslagen keuze van teken/getal/letter wordt exact naar deze
invoer vertaald. De bestaande uitwerking en beloningen blijven staan.

De handelingen volgen de huidige uitwerking: bewerken, invullen wanneer een
onbekende vrijstaat, combineren bij die methode, en de oplossing controleren.
Getallen, letters en tekens hebben directe toetsen. Combinatie en aantal
oplossingen gebruiken zichtbare keuzeknoppen.

Vergelijkingen toont herkenbare complete acties met naam en formule. Een
eigen bewerking wordt in twee stappen gekozen: de bewerking, dan een passende
waarde. Termen en breuken laten de actieve invoer en het effect van het teken
zien. Leesbare labels blijven aanwezig op een telefoon; op korte schermen
scrollt de bediening binnen haar eigen paneel.

## Startmenu en hervatten

Een nieuw bezoek opent het formele kaartjesmenu van Vergelijkingen. Dezelfde
navigatie heeft drie bestemmingen: Werelden, Levels en Klasbattle. Er is geen
aparte sectie Vrij oefenen. Oefenblad is een actie bij het geselecteerde level.
Algebrawereld in het gedeelde kruimelpad opent altijd het wereldenoverzicht;
de wereldnaam brengt je naar zijn levels. Werelden gebruikt formele kaarten,
zonder de vroegere eilanden. Stelsels heeft hetzelfde levelmenu met zes kaarten.

Een kaart aanklikken selecteert uitsluitend: er worden geen opgaven of pogingen
aangemaakt. De oranje selectie staat los van de status van een bewaarde reeks.
**Spelen**, **Verder spelen** of **Opnieuw spelen** opent pas het gekozen level.
De selectie is presentatie-informatie in sessionStorage. Oude leervoortgang,
tussenstappen en XP blijven in de bestaande opslag. Vrije reeksen kunnen bij
Vergelijkingen én Stelsels worden hervat nadat je een level hebt gespeeld.
Herladen tijdens oefenen bewaart het werkbord; een nieuw bezoek opent het menu.

Op korte liggende werkborden staan dezelfde bestemmingen in het gedeelde menu,
zodat alle wiskundige bediening ruimte houdt. De bovenste platformbalk blijft
inklappen, heropenen, echte voortgang, account, licht/donker en volledig scherm
bieden. Klasbattle opent het centrale leraarBob-overzicht voor alle spellen; sessie-
en werkbordhandlers blijven behouden. Het iframe krijgt geen tweede bovenbalk.

De platformversie gebruikt de gedeelde leraarBob-balk voor het centrale
account, echte XP, volledig scherm, licht/donker, menu en inklappen. De losse
account- en volledig-schermknoppen uit de offline-menubodem blijven als
DOM-nodes aanwezig, maar worden in de platformversie niet getoond. De vaste
platformknoppen blijven rechtstreeks bereikbaar. Het kaartjesmenu verdeelt
zijn ruimte over kop, opgaven en hervatten binnen de resterende viewport.

## Oefenbladen

De knop Oefenblad hoort bij het geselecteerde level. Een onafgeronde reeks kan
met precies dezelfde opgaven worden afgedrukt; anders wordt een losse
papierreeks gemaakt. Die wordt apart opgeslagen en verandert geen lopende
speelronde, invoer of XP. Nieuwe opgaven regenereert alleen het blad. Op een
verticaal telefoonscherm staan Oefenblad en Spelen naast elkaar onder de
selectie; de drie bestemmingen blijven op één rij.

## Speelbare route

Via Werelden staan twee speelbare werelden en drie werelden in voorbereiding. **Vergelijkingen** bevat zeven speelbare haltes;
**Stelsels** bevat de bestaande zes haltes. Letters begrijpen, Rekenen met
letters en Formules zijn zichtbaar als **Binnenkort** en tellen niet mee in
de voortgang. Alle speelbare haltes zijn direct toegankelijk.

| Vergelijkingenhalte | Oefenvormen |
| --- | --- |
| Eén bewerking | A2, A3, A1, A4 |
| Twee stappen | B1, B2 |
| Negatieve x-term | B3 |
| x aan beide leden | E3, E2 |
| Haakjes | C1, C2, D1, D3 |
| Breuken | B4, B5, D2 |
| Routes en controle | E1 |

Elke nieuwe vergelijkinghalte bevat zes opdrachten: eerst ondersteuning,
daarna zelf bouwen, oplossen, herstellen of controleren. De zeventien
bestaande vergelijkingstypes blijven beschikbaar. Antwoorden worden exact
gecontroleerd: dezelfde oplossing hebben volstaat niet als gevraagde
tussenstap of uitwerking van haakjes.

Leerlingen bouwen tussenstappen met contextuele bouwstenen. Bij controle
vervangen ze x door een voorgestelde waarde, berekenen beide leden en
vergelijken de uitkomsten. **Hulp** toont een bewegend voorbeeld met
andere getallen; pauzeren, herhalen en terugkeren bewaren de eigen opgave.
Een nieuwe ronde vermijdt de getoonde vragen van de vorige ronde. Bij het
bouwen kiest de leerling expliciet + of − tussen termen. Vermenigvuldigen
wordt met de maalpunt · aangeduid. De breukenhalte biedt Gelijknamig maken,
Noemers wegwerken en eigen opbouw van de volledige volgende regel.

Het kaartjesmenu biedt een levelselectie met Spelen en Oefenblad. Klasbattle
staat naast Werelden en Levels in de vaste navigatie.
De stelselsmodule behoudt grafisch oplossen, substitutie en combinatie.
De oudere wereldkaart blijft beschikbaar via `legacy.html`.

## Account, voortgang en navigatie

De ongewijzigde platformlaag laadt en bewaart spelgegevens via
`AxiomaGame.storage`. Vergelijkingen gebruiken `leraarbob.algebra.v1`;
stelsels gebruiken `leraarbob.stelsels.workshop.v1`.

`chapterJourney` bewaart de nieuwe zeven haltes. Oude `journey`-records,
missies met vijf opdrachten, tussenstappen en eerder verdiende XP blijven
leesbaar. Begonnen oude missies worden hervat met hun eigen opdrachten.
Vrije reeksen worden geparkeerd wanneer een leerling een missie begint en
kunnen met hun uitwerking worden hervat.

Elke volledig afgeronde, nieuw gegenereerde speelronde levert 30 XP op, ook
bij herhalen. `chapterJourney.roundRewards` en `roundJourney.roundRewards` bij
Stelsels bewaren de beloning per stabiele ronde-id. Herladen of een afgeronde
ronde opnieuw bekijken levert geen extra XP. Oude levelbeloningen blijven
behouden; de rondetelling voegt alleen nieuwe werkelijk gespeelde beloningen toe. Geoefend en zelfstandig gelukt blijven
verschillende statussen. De catalogus telt 13 speelbare haltes zodra het
nieuwe voortgangsrecord bestaat; oude records behouden hun eerdere telling
tot de leerling de nieuwe versie opent.

De gedeelde `leraarbob-topbar` toont het account en echte XP, met directe
knoppen voor volledig scherm, licht/donker, menu en inklappen. Inklappen en
opnieuw openen bewaren de oefening; de keuze blijft bij herladen behouden.
De herstelknop heeft eigen ruimte op de wereldkaart, ook in een korte
liggende viewport.

## Verificatie

```sh
node --test tests/algebra-v050-flow.test.cjs tests/algebra-v04-journey.test.cjs tests/algebra-v04-motion.test.cjs tests/algebra-v04-choices.test.cjs tests/algebra-v045-fractions.test.cjs tests/algebra-trainer.test.cjs tests/algebra-learning.test.cjs tests/algebra-world.test.cjs tests/algebra-class.test.cjs tests/bewerkingen-trainer.test.cjs tests/stelsels-workshop.test.cjs tests/catalog.test.cjs tests/catalog-progress.test.cjs
node scripts/build-catalog.cjs --check
```

Browserproeven starten een tijdelijke lokale server en blokkeren externe
verzoeken. Installeer Playwright of stel `NODE_PATH` in op de map waarin het
beschikbaar is. `ALGEBRA_CHROMIUM_PATH` kan een bestaande Chromium-binary
aanwijzen; `ALGEBRA_SCREENSHOTS` kiest de uitvoermap onder `/tmp`.

```sh
node tests/algebra-v04-browser.cjs
node tests/algebra-v04-touch-browser.cjs
node tests/algebra-v04-lesson-browser.cjs
node tests/algebra-v04-platform-browser.cjs
node tests/algebra-v045-entry-browser.cjs
node tests/algebra-v045-navigation-browser.cjs
node tests/algebra-v045-fractions-browser.cjs
node tests/algebra-v045-signs-browser.cjs
node tests/algebra-v050-flow-browser.cjs
```

De proeven controleren alle zeven haltes via echte bediening, correcte en
foute antwoorden, herladen, oude voortgang, XP per afgeronde ronde, unieke leveltotalen, nieuwe vragen,
oefenbladen en live voorbeelden. De platformproef controleert ook de
startpagina, de toegang tot Stelsels en beide standen van de bovenbalk op
1280×800, 780×360, 640×360, 390×844 en 320×700.

Alleen de productiebron en vereiste spelassets zijn geïmporteerd. De losse
offline-HTML, screenshots en vervangingspagina's voor andere spellen uit de
zip horen niet bij deze publicatie. Deze algebraflow heeft geen nieuwe backendfuncties of
databasemigraties nodig.
