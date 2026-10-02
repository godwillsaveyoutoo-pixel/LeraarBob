# Algebrawereld — leerlingenroute en werkvormen

De leerling begint op de leerroute. De bestaande 17 vergelijkingstypes zijn
verdeeld over zes leergebieden. Machtenberg, Wortelwoud en Getallensterren uit
de bestaande lokale implementatie blijven afzonderlijk bereikbaar. De route
bevat 39 haltes: 17 vergelijkingen, 6 stelsels en 16 bewerkingen.

| Leergebied | Haltes, in volgorde | Wat de leerling oefent |
| --- | --- | --- |
| Inverse bewerkingen — Balansbaai | A2, A3, A1, A4 | Optellen, aftrekken, vermenigvuldigen en delen ongedaan maken op beide leden. |
| Twee stappen plannen — Vergelijkingenstad | B1, B2 | Losse term en factor onderscheiden, een volgorde kiezen en de volgende regel produceren. |
| Tekens begrijpen — Tekenatelier | B3 | Een negatieve x-term herkennen in b − ax = c; het teken van de factor behouden. |
| Haakjes en groepen — Haakjeswerkplaats | C1, C2, D1, D3 | Een groep delen, distributiviteit uitvoeren, en binnen- en buitenfactoren onderscheiden. |
| Breuken en delingsstructuur — Breukenbrug | B4, B5, D2 | Onderscheid tussen x/a + b en (ax+b)/c; de juiste termen met de noemer vermenigvuldigen. |
| x aan beide leden — Overkant | E3, E2, E1 | x-termen verzamelen en verschillende geldige routes vergelijken. |
| Stelsels — Kruispunt | Grafisch, substitutie, combinatie; één, geen en oneindig veel oplossingen | Twee vergelijkingen als één geheel behandelen en het gezamenlijke resultaat controleren. |

Elke vergelijkinghalte heeft vijf opdrachten: ontdekken met ondersteuning,
begeleid kiezen of herstellen, zelf de volgende regel schrijven, zelfstandig
oplossen en toepassen in een bouw-, distributie- of invulcontrole. Bij B1
wordt na −6 op beide leden van 3x + 6 = 18 de regel 3x = 12 geproduceerd.
Bij x aan beide leden is het strategische doel breuken vermijden. Beide
voorgestelde bewerkingen blijven wiskundig geldig.

C1 kan worden opgelost door de buitenfactor weg te delen. Dat is geen bewijs
van uitgevoerde distributiviteit: de herstelopdracht en de transferopdracht
vragen afzonderlijk om het uitwerken van elke term. De controle vergelijkt
exacte lineaire coëfficiënten en constante termen, per lid. Een vergelijking
met dezelfde oplossing alleen volstaat niet als antwoord op een voorspelling.
Een nog gegroepeerd antwoord volstaat niet bij distributiviteit.

De route begint met gehele getallen. B3 introduceert negatieve termen en
factoren; de breukenroute introduceert rationale getallen. De laatste B5-
opdracht controleert een kommagetal door invullen. Vrij oefenen behoudt alle
bestaande getalinstellingen en moeilijkheden.

## Werkbord en ondersteuning

Tijdens actief oefenen passen opgave, opdracht, huidige toestand, bediening,
hulp, stap terug en missiepositie in de viewport. De vorige stap staat erbij
als de ruimte en de uitdrukking dat toelaten. Lange vergelijkingen kunnen met
behoud van leesbaarheid over twee regels worden gezet. Het volledige werk
staat in **Stappen**, als aparte schermtoestand met stapnavigatie.

Begeleide vergelijkingen bieden contextuele bewerkingen zonder ze op een
juiste route te rangschikken. Bij zelfstandig oplossen kiest de leerling eerst
een bewerking en daarna een waarde. Waardelijsten hebben paginering. Hulp
begint klein en kan worden uitgebreid; gebruikte hulp wordt geregistreerd.
Productievelden beginnen leeg. Een fout antwoord blijft herstelbaar.

Bij stelsels selecteert de leerling de actieve vergelijking door op haar
regel te tikken. Bewerkingen, substitutie, combinatie en resultaatcontrole
hebben aparte bedieningsfasen. Het oorspronkelijke stelsel blijft staan;
beide actuele vergelijkingen blijven samen zichtbaar. Combinatie bewaart ook
de geschaalde tussenberekening in de volledige uitwerking. Het grafiekvak is
vierkant; I en II corresponderen met kleur, lijnpatroon en vergelijkinglabels.
Coördinaten kunnen exact worden ingevoerd via één gekozen punt tegelijk;
stap terug herstelt ook grafiekpunten. Een methodehalte registreert pas
afronding na een daadwerkelijke grafische, substitutie- of combinatiestap.

De gedeelde platformbalk behoudt account, XP, volledig scherm, weergave,
menu en inklappen. De herstelknop heeft gereserveerde ruimte en de gekozen
stand blijft behouden. Vrije reeksen, oefenbladen en klasbattles staan bij
**Werkvormen**. De stelselbouwer en het huidige stelseloefenblad staan ook in
het gedeelde menu.

## Voortgang en opslag

Bestaande sleutels en de accountbinding via `AxiomaGame.storage` blijven:

- `leraarbob.algebra.v1`: oude selectie, getalinstellingen, uitwerking,
  `solvedTypes`, `worldLegacy`, `journey`, nieuwe `runs` en `freeSession`.
- `leraarbob.stelsels.workshop.v1`: oude reeks en papierinstellingen,
  `journey`, nieuwe `systemRuns`, actieve rij, bedieningsfase en invoer.
- `leraarbob.bewerkingen.v1`: ongewijzigde bewerkingenengine en haar voortgang.

Nieuwe missies hebben vijf bewijsregistraties met opdrachtvorm, leerdoel,
afronding, fouten en hulp. Het eindscherm onderscheidt zelfstandig werk van
ondersteund werk en beveelt herhalen of de volgende halte aan. Afronding wordt
niet als beheersing aangeduid. Tijd en aantallen klikken spelen geen rol.

Een halte geeft eenmaal de bestaande 30 XP. Een oude beloning blijft behouden
en wordt bij een nieuwe missie niet verdubbeld. Oude geoefende vormen en
oudere reeksen van drie oefeningen blijven toegankelijk, maar krijgen geen
nieuw bewijslabel. Oude registraties worden niet tot beheersing gepromoveerd.
De platformcatalogus en het gedeelde spelrecord tellen 23 vergelijking- en
stelselhaltes alleen na vijf afgeronde opdrachten. De 16 bewerkingenhaltes
blijven in hun bestaande afzonderlijke spelrecord. De XP-lezer behoudt ook de
eerder verdiende beloningen.

Een begonnen missie wordt rechtstreeks hervat bij de eerste onafgewerkte
opdracht. Meerdere begonnen haltes blijven bewaard. Een bestaande vrije
vergelijkingenreeks wordt apart geparkeerd wanneer de leerling een missie
begint; **Hervat mijn vrije reeks** herstelt ook haar stappen en papierkeuzes.

## Controle

```sh
node --test tests/algebra-learning.test.cjs tests/algebra-trainer.test.cjs tests/algebra-world.test.cjs tests/algebra-class.test.cjs tests/bewerkingen-trainer.test.cjs tests/stelsels-workshop.test.cjs tests/catalog-progress.test.cjs tests/catalog.test.cjs
node scripts/build-catalog.cjs --check
```

De browserproeven starten zelf een tijdelijke lokale server en gebruiken
geïsoleerde fictieve accounts. Stel `NODE_PATH` in op de map met Playwright en
`CHROMIUM_PATH` op de Chromium-binary:

```sh
node tests/algebra-learning-browser.cjs
node tests/algebra-workbench-browser.cjs
node tests/algebra-world-browser.cjs
node tests/stelsels-workshop-browser.cjs
```

De laatste ingang voert `stelsels-layout-browser.cjs` uit. Die controleert de
fasebediening, drie methodes, bijzondere oplossingen, tussenberekeningen,
herladen, oefenbladen en PDF. De nieuwe schermcontrole controleert ook
scrollende deelvakken, afgeknipte wiskunde, overlappende bediening, 44px-
aanraakdoelen en de herstelknop. Zie het [opleververslag](../../docs/algebra-leerroute/README.md).
