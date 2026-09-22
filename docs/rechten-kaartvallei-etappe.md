# Kaartvallei — eerste echte reisetappe

Actuele implementatie: [eerste leerlingversie met de kaart als start](rechten-leerlingenstart.md). Die vervangt de beperkte Kaartvallei-ingang door de vijf deelkaarten en letterlijke leerdoelen.

Open `games/rechten/trainer/?reis=kaartvallei`, of kies **Kaart** in de trainer.
De eerdere vormproef linkt met **Speel de Kaartvallei** naar deze ingang.
Dit werk staat op `feat/rechten-world-prototype`; publiceren is een aparte stap.

## Speelbare inhoud

- Uitkijktoren: `point`, `point_plot`.
- Meetpad: `delta`, `slope`.
- Verbindingsbrug: `slope_from_two_points`.
- Kamp: een gemengde ronde, met dezelfde wereldwijde herstel- en herhaalbehoefte.
- Routeplan: een kleine cumulatieve einduitdaging met vijf afzonderlijke doelen.

Selectie opent details; pas de startknop begint de etappe. Een nog gesloten plek
blijft inspecteerbaar. De toegang komt uit de bestaande skillvoorwaarden en
blijft behouden als kennis later extra oefening nodig heeft. Een gewone lopende
ronde wordt eerst hervat; de kaart vervangt haar niet stilzwijgend.

De stijl gebruikt papierkleur, sobere lijntekeningen, groen voor selectie en een
kleine gouden voltooiingsster. Eén ster betekent alleen **etappe afgerond**.
We kennen nog geen tweede/derde ster toe. Historische kennis krijgt geen
verzonnen zelfstandigheidsbewijs en een fout neemt geen voltooiingsster weg.

## Etappe en planner

Een etappe blijft twaalf primaire opgaven. Op maximaal vijf momenten krijgt de
gekozen plek voorrang; ontbrekende introducties verschijnen vóór de oefening.
Een eerder begrip keert expliciet onderweg terug. De gewone planner vult de
overige momenten, ook met vaardigheden van buiten de Kaartvallei.

Op posities 1, 4, 7 en 9 (vanaf nul) krijgt het oudste beschikbare herstel-,
vlotheids- of opfrisitem gegarandeerd voorrang. In de einduitdaging zijn posities
4 en 7 gereserveerd voor doelen; posities 1 en 9 blijven voor wereldwijde
herhaling beschikbaar. De gewone planner kan daarnaast zelf herstel kiezen.
Het kamp is dus een vrijwillige ingang; herhaling hangt niet van een kampbezoek af.
Herhaalafstanden blijven aantallen opgaven, niet kalenderdagen.

De bestaande generators, constructiecontrols, exacte breuken, diagnostiek,
moeilijkheidskeuze en scoring blijven verantwoordelijk voor de leerinhoud.
De wereld voegt geen XP of mastery toe. In een etappe staat de automatische
vlotheidstimer uit. Ook de oorspronkelijke meerkeuzevragen houden hun feedback
zichtbaar tot **Verder**, zodat kaartbezoek en hervatten niet doorlopen tijdens
het lezen. Hulpgebruik wordt voor deze vragen eveneens opgeslagen en vraagt
een latere zelfstandige controle, zoals bij de constructievragen.

## Einduitdaging

Voorbereiding gebruikt dezelfde `ready`-regel als de prerequisites, voor alle vijf
skills: geïntroduceerd, minstens vier waarnemingen, voldoende sterkte, minstens
drie van de laatste vier correct en geen open herstelvraag voor die skill.

De eerste poging heeft vijf verplichte doelen op posities 0, 2, 4, 7 en 10:
punt lezen, punt plaatsen, verschil lezen, helling lezen/berekenen en helling
uit twee punten. Deze gebruiken niveau 2; de laatste opgave gebruikt bewust
een negatieve fractionele helling en verbindt de eerdere begrippen.

Een doel telt alleen bij een correcte, zelfstandige poging zonder hulp of
scaffold. Het routeplan toont 0–5 doelen; dit is geen nieuw masterypercentage.
Correct bewijs blijft behouden. Een volgende poging verdeelt de vijf doelplekken
over de nog ontbrekende doelen, met nieuwe gegevens en gemengde vragen ertussen.
Gericht herstel blijft door de trainer gepland; voorbereiding moet vóór een
nieuwe poging weer voldoende zijn. Andere skills blijven toegankelijk.

Dit is een eerste, beperkte einduitdaging. Eén zelfstandig bewijs per doel is
nog geen gekalibreerd examencriterium of volledige variantdekking. Een reeks
samenhangende opdrachten met één gedeelde dataset is nog niet toegevoegd.

## State en navigatie

Optioneel `state.journey`, met eigen kleine versie 1, bevat geselecteerde plek,
afgeronde bezoeken, vijf bewijsmarkeringen, laatste uitslag en actieve etappe.
De actieve etappe bewaart maximaal twaalf resultaten met poging-ID en een
concept voor een klassieke vraag of introductie. Constructiedeelantwoorden
blijven in de bestaande `waveDraft`, zonder tweede kopie in de wereldstate.

De normale accountgebonden opslag en revisiecontrole bewaren dit veld mee.
Stateversie 704 en de 27 skill-IDs blijven behouden. De bestaande
`mergeState`/`W.migrate` bewaren aanvullende velden; een ontbrekende wereldstate
ontstaat pas bij kaartgebruik. Het bestaande Wave 4-opslagcontract accepteert
de aanvullende JSON-velden; deze uitbreiding vereist geen extra SQL-script.

Een resultaat telt eenmaal per primaire poging. Afgeronde rondes hebben een
opgeslagen voltooiingsmarkering, zodat herladen de rondebonus niet herhaalt.
Uitleg, kaart, voortgang en DEV behouden de lopende opgave. Accountwisseling
stopt de oude oefening en laadt de state van het nieuwe account.

## Bestanden

- `journey-core.js`: plaatsen, missievoorkeur, herhaalmomenten en einddoelen.
- `journey-ui.js`, `journey.css`: kaart, selectie, voorbereiding en uitslag.
- `index.html`: verbinding met schermen, planner, feedback en bestaande opslag.
- `wave-core.js`: stelt de bestaande `ready`-regel beschikbaar; inhoudelijke regel ongewijzigd.
- `wereld-prototype/index.html`: link naar de echte etappe.
- `tests/rechten-journey.test.cjs`, `tests/rechten-journey-browser.cjs`: beleid en integratie.

## Validatie en resterende gebruikstest

De geautomatiseerde controles omvatten:

- Zuivere policytests: toegang, globale herhaling, vijf doelen, negatieve breuk,
  hulp, ontbrekend bewijs, herkansen en resultaat slechts eenmaal verwerken.
- Chromium op 1100×700, 780×360 en 640×360: kaart, gesloten plek, echte
  puntantwoorden en touchconstructie, volledige ronde, einduitdaging en herkansing.
- Herladen vóór/na scoring en tijdens een constructie of introductie; geen dubbele
  XP of rondebonus; navigatie, hulp en hervatten na DEV.
- Een fictieve server en twee fictieve accounts: wereldstate laden/opslaan via
  de bestaande RPC en geen voortgang meenemen bij accountwisseling.
- Bestaande generator-, constructie-, legacy- en accountregressies.

Uitkomst: vier nieuwe policytests en alle achttien `*.test.cjs`-bestanden slagen.
De nieuwe journey-browsertest, de vier Wave-browsersuites en
`trainer-teacher-browser.cjs` slagen. De Wave 1-suite controleert ook 6.600
oorspronkelijke generatoropgaven. Cataloguscontrole en `git diff --check` slagen.
De browsers gebruikten fictieve accounts; er zijn geen echte leerlinggegevens
opgevraagd of databasewijzigingen uitgevoerd.

Nog met leerlingen te beoordelen: begrijpelijkheid van de aanbeveling en
voltooiingsster, duur van een ronde met meerdere constructies, bruikbaarheid van
de einduitdaging en het gevoel dat herhaling bij de reis hoort. Mobiel blijft
liggend gebruik vanaf 640×360, zoals de trainer. De overige vier gebieden en
een uitgebreider sterrensysteem zijn nog niet gebouwd.
