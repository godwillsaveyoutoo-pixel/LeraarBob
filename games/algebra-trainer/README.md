# Algebrawereld v0.4.5

De platformversie uit `Axioma-Algebrawereld-v0.4.5.zip` vervangt het eerdere
algebraspel op dezelfde ingang: `games/algebra-trainer/`. De spel-id
`algebra-trainer`, het centrale account en de bestaande opslagsleutels blijven
behouden. De catalogus toont één hoofdkaart voor Algebrawereld.

## Startmenu en hervatten

Een nieuw bezoek opent rechtstreeks het kaartjesmenu uit v0.4.5: een donkere
actierij, een afzonderlijke wereldkop, zeven haltes met voorbeeldvergelijkingen
en status, en een oranje knop **Verder spelen**. De huidige halte is oranje
omlijnd. **Werelden** opent de geïllustreerde kaart. Herladen tijdens oefenen
behoudt het werkbord; opnieuw bezoeken opent het menu met hetzelfde werk
beschikbaar via Verder spelen. Stelsels krijgt hetzelfde menu met zes haltes.

De platformversie gebruikt de gedeelde leraarBob-balk voor het centrale
account, echte XP, volledig scherm, licht/donker, menu en inklappen. De losse
account- en volledig-schermknoppen uit de offline-menubodem blijven als
DOM-nodes aanwezig, maar worden in de platformversie niet getoond. De vaste
platformknoppen blijven rechtstreeks bereikbaar. Het kaartjesmenu verdeelt
zijn ruimte over kop, opgaven en hervatten binnen de resterende viewport.

## Speelbare route

Via Werelden toont de kaart vijf werelden. **Vergelijkingen** bevat zeven speelbare haltes;
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

Het kaartjesmenu biedt Vrij oefenen, Oefenblad en Klasbattle.
**Werkvormen** in het gedeelde menu biedt ook vrije reeksen, oefenbladen met
verbetersleutel, stelsels, machten en wortels en de bestaande klasbattles.
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

Een nieuwe halte levert eenmaal 30 XP op. Herhalen verdubbelt geen beloning.
Een nieuwe halte waarvoor al een oude deelhalte is beloond geeft geen tweede
beloning; de oude XP blijven behouden. Geoefend en zelfstandig gelukt blijven
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
node --test tests/algebra-v04-journey.test.cjs tests/algebra-v04-motion.test.cjs tests/algebra-v04-choices.test.cjs tests/algebra-v045-fractions.test.cjs tests/algebra-trainer.test.cjs tests/algebra-learning.test.cjs tests/algebra-world.test.cjs tests/algebra-class.test.cjs tests/bewerkingen-trainer.test.cjs tests/stelsels-workshop.test.cjs tests/catalog.test.cjs tests/catalog-progress.test.cjs
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
```

De proeven controleren alle zeven haltes via echte bediening, correcte en
foute antwoorden, herladen, oude voortgang, eenmalige XP, nieuwe vragen,
oefenbladen en live voorbeelden. De platformproef controleert ook de
startpagina, de toegang tot Stelsels en beide standen van de bovenbalk op
1280×800, 780×360, 640×360, 390×844 en 320×700.

Alleen de productiebron en vereiste spelassets zijn geïmporteerd. De losse
offline-HTML, screenshots en vervangingspagina's voor andere spellen uit de
zip horen niet bij deze publicatie. Er zijn geen nieuwe backendfuncties of
databasemigraties nodig.
