# Interne structuur van vier trainers voor het leraarBob-OS

De vier trainers kunnen dezelfde eenvoudige start- en vensterbediening krijgen. Daarvoor moeten we hun **platformbediening, werkvormstart en werkbord afzonderlijk aanstuurbaar maken**. Alleen kopbalken verbergen is onvoldoende: sommige werkvormwissels vervangen nu de geopende trainerpagina, en drie trainers hebben nog geen navigatie-interface voor het OS.

Dit onderzoek betreft Getallenwereld, Algebrawereld, Rechtenwereld en Vectormissie op main `296e06b7afb84564f7737ba0f790e27ebf6fa800` (10 oktober 2026). Het beschrijft benodigde wijzigingen; er is geen spelcode gewijzigd. De oorspronkelijke lokale werkbranch met ongepubliceerde wijzigingen blijft buiten deze vergelijking.

## Ontwerp waar dit onderzoek van uitgaat

Het bureaublad toont de gekozen **speliconen**. Bij een icoon staan beschikbare werkvormen rechtstreeks of in één compacte uitklapper. Start bevat de volledige appcatalogus, oefenbladcollectie en andere platformbestemmingen. Er komt geen vaste rij met Oefenbladen, Profiel, Instellingen en Toevoegen tussen de speliconen.

Een gekozen werkvorm leidt naar de nog ontbrekende instellingen van die werkvorm. Onderwerp en werkvorm worden niet opnieuw gevraagd wanneer ze al bekend zijn. Een nieuw solo-spel kan nog een inhoudelijke levelkeuze nodig hebben. Een leerling die een bestaande klassessie opent, gaat naar de wachtkamer of lopende ronde; die leerling krijgt geen formulier om zelf een klasbattle te starten.

Binnen een wereld staat bij Oefenblad maken ook de lijst van bestaande reeksen voor die wereld/het onderwerp. Start toont dezelfde documenten als volledige collectie. De blijvende bediening boven de opgave is beperkt tot terugbestemming, noodzakelijke context en Meer; een permanente rij Overzicht / Onderdelen / Werkvormen is geen vereiste. De vorige [interfaceanalyse](ANALYSE.md) bevatte die rij nog als ontwerpvariant.

## Wat werkelijk beschikbaar is

Dit is de huidige registratie en code, geen claim dat iedere multiplayercombinatie opnieuw met productieaccounts getest is. Lokale duo-battle op één toestel en online battle op twee toestellen zijn verschillende werkvormen.

| Wereld | Solo | Samen leren online | Lokale duo-battle | Online duo-battle | Klasbattle | Oefenbladen |
| --- | --- | --- | --- | --- | --- | --- |
| Getallen | Begeleide route en eigen reeks | Duo Learn; ook Klaslearn voor de leraar | Ja | Ja | Ja | Machten, wortels, wetenschappelijke notatie via reeksprovider |
| Algebra | Vergelijkingen en Stelsels | Niet geregistreerd | Niet geregistreerd | Niet geregistreerd | Ja | Vergelijkingen en Stelsels |
| Rechten | Eilanden en onderdelen | Learn met 2–3 leerlingen | Ja | Ja | Ja | Hellingrug, Grenspas, Formulewerf, Signaalstad |
| Vector | Aanbevolen reeks en vrij oefenen | Niet geregistreerd | Ja | Niet geregistreerd | Ja | Geen generator geregistreerd |

Puntenbaai heeft momenteel geen oefenbladgenerator. Ook ontbrekende Algebra- en Vectorwerkvormen mogen niet als werkende shortcuts verschijnen. De bron voor beschikbaarheid blijft [games.json](../../games.json), ontsloten door [game-registry.js](../../shared/game-registry.js) en [play-modes.js](../../shared/play-modes.js). Uniforme bediening betekent dezelfde betekenis en volgorde van beschikbare acties, niet dat alle spellen dezelfde mogelijkheden hebben.

## Getallenwereld: drie componenten onder één bediening

**Huidige structuur.** De begeleide werkplaats heeft home → hoofdstuk → onderdeel → opgave/hulp/resultaat. “Oefenen & samen” opent vervolgens de aparte nummersomgeving met opnieuw “Wat wil je doen?”. Die stuurt weer door naar een eigen reeks of online Learn/Battle. Elk component heeft eigen terug- en hervatbediening. De browserproef bevestigt dat de link vanuit het hoofdstuk de begeleide pagina vervangt. OS-minimaliseren behoudt daarentegen dezelfde pagina en exact dezelfde begeleide toestand.

**Benodigde wijzigingen:**

1. Geef de begeleide app, eigen-reeksapp en online nummersomgeving een gezamenlijke navigatieadapter. `GetallenWorld` biedt nu alleen `snapshot` en `task`; `NumbersSpace` alleen een snapshot en gereedheidsstatus. Het OS kan hun bestaande functies nog niet betrouwbaar aanroepen.
2. Verplaats de algemene keuzes Solo / Learn / Battle / Bord / Papier naar de OS-startflow. `numbers-space.js:home()` blijft bruikbaar als zelfstandige fallback. Na een OS-keuze gaat de provider direct naar de passende selectie, wachtkamer of bestaande sessie.
3. Laat “Onderdelen & werkvormen” en de brede `world-actions` in OS-modus vervallen zodra de acties elders bereikbaar zijn. Behoud het hoofdstukpad als leerinhoud en bereik het via een benoemde terugactie of Meer → Onderdelen.
4. Open een andere component in een afzonderlijke levende werkruimte. Bewaar het begeleide werkbord, de gekozen antwoorddelen en het hulpvoorbeeld; ga bij terugkeer naar datzelfde scherm. Een opgeslagen ronde opnieuw tekenen is niet hetzelfde als een bewaard document hervatten.
5. Geef onderwerp, gekozen doel, provider-vraagvormen, niveau, aantal en terugbestemming expliciet mee. Houd gekozen onderdeel en actieve ronde gescheiden. Leid deze instellingen niet uitsluitend af uit een URL die tijdens navigatie wordt herschreven.

**Behouden:** alle 19 begeleide doelen, regelkeuze, klikantwoorden, zes opgaven, hulp met een ander voorbeeld en historische seed/edition. De begeleide voortgang `getallenwereld` en de 16 vraagvormen met eigen XP onder `bewerkingen-trainer` blijven afzonderlijk. Betekenis van machten, wortelregels controleren, terugschrijven en normaliseren hebben geen exacte providerkoppeling in `practiceSkills`; toon daarvoor expliciet aanvullend hoofdstukoefenen, geen identiek leerdoel.

**Specifieke aansluiting:** Rechten Learn kan al beschikbare klasgenoten op alias uitnodigen. De huidige `numbers-space.js` gebruikt sessiecodes en deelnamelinks. De gedeelde modustekst noemt ook daar aliasuitnodigingen, maar die bediening ontbreekt in deze component. Eén centrale uitnodigflow vraagt dus een afzonderlijke providerkoppeling; voor Getallen moet de code/linkflow beschikbaar blijven totdat aliasuitnodigingen echt zijn aangesloten.

Bronnen: [begeleide controller](../../games/getallenwereld/app.js), [werkplaatsweergaven](../../games/getallenwereld/workshop.js), [doelkoppeling](../../games/getallenwereld/lessons.js), [reekscontroller](../../games/bewerkingen-trainer/app.js), [online nummersomgeving](../../games/bewerkingen-trainer/numbers-space.js).

## Algebrawereld: bestaande OS-aansluiting veralgemenen

**Huidige structuur.** Algebra heeft al `AlgebraShell` met context, navigatie, abonnementen en embedded presentatie. Het OS bewaart Vergelijkingen en Stelsels in aparte vensters. Het onderscheid tussen gekozen level en actieve ronde is al aanwezig in `AlgebraNavigation`. Daarom is een volledige vervanging van deze navigatie onnodig.

**Benodigde wijzigingen:**

1. Maak de bestaande aansluiting geschikt voor het gedeelde appcontract. Verplaats de Algebra-specifieke afhandeling in `os/desktop.js` naar algemene component- en actieafhandeling. Neem gekozen level, actieve ronde en oefenbladselectie afzonderlijk op; `AlgebraShell.context()` presenteert nu één level afhankelijk van het scherm.
2. Behoud Werelden en Levels als inhoudelijke selectiepagina’s. Verwijder de herhaalde Klasbattle-ingangen en brede Werkvormenpagina uit de OS-route wanneer de werkvorm al gekozen is. Eigen reeks samenstellen blijft een gerichte instelling, bereikbaar via Meer of de solo-startkeuze.
3. Ondersteun direct Oefenblad maken met gekozen wereld/level, zonder eerst een oefenronde te starten. Gebruik de bestaande `levelWorksheet` en aparte papierselectie; maak geen tweede generatormodel.
4. Sluit Algebra-klasinstellingen en wachtkamer aan op de gezamenlijke startpresentatie. Behoud het eigen sessieprotocol en de bestaande beperking van klasbattle-vragen voor Stelsels.
5. Laat de compacte OS-bediening bestaande controllerfuncties oproepen. Herschik geen werkbord tijdens het openen van Start, Meer, fullscreen of de weergavekeuze.

**Behouden:** zeven Vergelijkingen-levels, zes Stelsels-levels, bewerking kiezen/uitvoeren, breukbouw, grafische/substitutie/combinatiemethode, tussenstappen, ongedaan maken, hulpdemo, geschiedenis en rondes. De oplossingsmethode is leerinhoud; die hoort bij het werkbord. Nieuwe Duo-onderdelen in de ongepubliceerde lokale werkbranch zijn geen bewijs voor beschikbare Duo-modi op main.

Bronnen: [AlgebraShell](../../games/algebra-trainer/shell.js), [native navigatie](../../games/algebra-trainer/navigation.js), [Vergelijkingen](../../games/algebra-trainer/trainer.js), [Stelsels](../../games/algebra-trainer/stelsels/app.js), [huidige OS-controller](../../os/desktop.js).

## Rechtenwereld: platformmenu losmaken van het werkbord

**Huidige structuur.** Wereldkaart → eiland → zone/onderdeel → missie is een inhoudelijke route met voortgangsvoorwaarden. Daarboven staan native merk-, profiel-, fullscreen- en menubediening naast de OS-bediening. “Leren, spelen of papier” opent een extra werkvormpagina. Een klikproef vanuit Hellingrug bevestigt die herhaalde keuze.

**Benodigde wijzigingen:**

1. Voeg een navigatieadapter toe rond de bestaande `goto`, selectie en runtime. `RechtenV2App` biedt nu alleen `snapshot` en `sync`. Publiceer werkelijke wereld, gebied, onderdeel, actieve missie, toegestane acties en terugbestemming. Bewaak daarbij dezelfde ontgrendelvoorwaarden als de native route.
2. Haal de dubbele globale kop weg in OS-modus, pas nadat alle functies elders bereikbaar zijn. Breng wereldkaart/onderdelen naar Terug en Meer; account/fullscreen/weergave naar de gedeelde platformbalk.
3. Sla `play.html` over na een expliciete OS-werkvormkeuze. Open direct de juiste Learn-, lokale battle-, online battle-, klas- of papierprovider met eiland, vaardigheid en oorsprong. Behoud de pagina als zelfstandige ingang.
4. Maak menu openen/sluiten onafhankelijk van `app.innerHTML` vernieuwen. Nu roept de menuwissel `render()` aan, dat ook het werkbord opnieuw opbouwt en antwoordflow/drag afbreekt. Een menu moet de bestaande invoernodes bewaren; herstel focus bij sluiten. Onderbreek hoogstens een actieve sleepbeweging, zonder het antwoord te wijzigen.
5. Benoem terugacties naar hun bestemming: bijvoorbeeld Naar Hellingrug of Naar mijn opgave. “Vorige” kan nu zowel navigatie als een leerstap suggereren. Houd Herinnering, Hint en vorige Learn-stap als afzonderlijke inhoudelijke acties.

**Behouden:** eilandstijl, zonekaarten, tokens, grafieken, formulebouw, meerfasige controle, hints, automatische vervolgstapvoorkeur en native Learn-samenwerking. Het spelprofiel bevat ook opslagconflicten, herstel en back-up; deze functies mogen niet verdwijnen met de dubbele accountknop. Ze krijgen een herkenbare plek onder Meer → Voortgang en opslag.

Bronnen: [controller en render](../../games/rechten/rechtenwereld/app-shell.js), [shell en kaarten](../../games/rechten/rechtenwereld/components/shell-view.js), [werkvormpagina](../../games/rechten/rechtenwereld/play.js), [Learn-uitnodigingen](../../games/rechten/rechtenwereld/learn.js).

## Vectormissie: eerst bereikbaarheid en context herstellen

**Huidige structuur.** De trainer bevat wereldkaart, stations, aanbevolen reeks, vrij oefenen, opgave, coach, algemene uitleg, voortgang en resultaat. De native kop wordt in het iframe onzichtbaar gemaakt maar houdt ruimte bezet. Een deel van de bediening verdwijnt daarmee. Een solo-URL met een station en `screen=stationScreen` opent nog steeds home: er is geen native stationrouter. De geregistreerde stationroutes zijn voor klasbattle, niet voor solo.

**Benodigde wijzigingen:**

1. Voeg eerst een adapter toe en projecteer native acties. `AxiomaVectorTrainer` heeft alleen leesbare inspectie en geometrieprojectie. Herstel bereikbare ingangen voor vrij oefenen, algemene uitleg en voortgang. Verwijder daarna de gereserveerde koprij in embedded layout.
2. Maak wereld/station/vaardigheid/scherm expliciet navigeerbaar. Bewaar ook aanbevolen reeks versus vrij oefenen. `showWorld()` kiest nu opnieuw een aanbevolen station; een echte terugkeerplek moet daarnaast het bezochte station onthouden.
3. Open lokale battle, klasbattle en Vectoratelier als afzonderlijke componenten, zodat hun links de trainerpagina niet vervangen. Atelier blijft zijn eigen app; een atelier is geen vervanging voor een niet-bestaande oefenbladgenerator.
4. Sluit de native klasinstellingen en wachtkamer aan op de gezamenlijke presentatie. Houd `axioma_vector_class`, `vector-class`, deadlines, inzendingen en serverrollen intact. De huidige hostcontroller beoordeelt antwoorden tijdens de gradingfase; minimaliseren mag die coördinator niet stilleggen of verwijderen.
5. Houd context uitlezen en menu openen vrij van antwoordacties. `resume()` kan bij een reeds juiste begeleide stap `commit()` aanroepen. Gebruik het daarom niet als algemene methode voor focusherstel of het openen van Meer.

**Behouden:** tekenen, begin/eindpunten, coördinatenkeypad, guided stages, coach, geschiedenis, scheduler, herstelvragen, `suspendedSeries`, echte XP en stevigheidsbewijs. De bestaande hoogcontrastknop blijft rechtstreeks bereikbaar; algemene OS-kleuren vervangen die ondersteuning niet.

Wijzig de Vector-bronmodules en shell, en bouw de gebundelde HTML opnieuw. Alleen het gegenereerde ingangbestand aanpassen zou de wijziging bij een volgende build verliezen.

Bronnen: [trainercontroller](../../games/vectoren/vector-app.js), [bronshell](../../games/vectoren/vector-shell.html), [platformlayout](../../games/vectoren/styles/platform-ui.css), [klascoördinator](../../games/vectoren/vector-classroom.js), [battleconfiguratie](../../games/vectoren/battle-config.js).

## Gemeenschappelijke aansluiting die hiervoor nodig is

Een dunne adapter rond elke bestaande controller is voldoende als start. Geen nieuw centraal vraag-/antwoordmodel. Onderstaande interface is een voorstel, geen al beschikbare API:

```text
OS: spelicoon + werkvorm → ontbrekende instellingen → native werkruimte
Adapter: context() · actions() · execute(action) · subscribe(listener)
         openIntent(intent) · setEmbedded(value) · setVisible(value) · dispose()
Werkbord: bestaande opgave, antwoordbediening, hulp, beoordeling en voortgang
```

| Afspraak | Vereiste |
| --- | --- |
| Context | Spel, component/provider, werkvorm, geselecteerd onderwerp/level, actieve ronde, papierselectie, sessie en eigen terugkeerplek zijn onderscheiden. Context lezen start of bewaart geen ronde. |
| Acties | Een whitelist van echte controlleracties. OS-knop, Meer, rechterklik en toetsenbord gebruiken dezelfde actie en rolcontrole. Geen afhankelijkheid van DOM-selector-kliks als permanente koppeling. |
| Start | Valideer de gekozen vaardigheid, provider en rol. Toon alleen ontbrekende instellingen. Een menu openen of level bekijken maakt geen sessie en vervangt geen actieve ronde. |
| Vensters | Sleutel op eigenaar, component, werkvorm en waar nodig sessie. Hervat dezelfde levende pagina. Respecteer de huidige limiet van zes vensters; verwijder geen oude werkruimte stilzwijgend. |
| Zichtbaarheid | OS-minimaliseren is geen `document.hidden` voor het iframe. Geef zichtbaarheid expliciet door om lokale animatie/autovervolg te onderbreken. Live deadlines en noodzakelijke polling/coördinatie blijven lopen. |
| Opslag | Bestaande accountopslag, historische progress-ID’s, XP, seeds en generatorversies blijven de bron. Accountwissel maakt oude werkruimten ontoegankelijk en verwerpt late antwoorden. |
| Sluiten | Venster sluiten, deelnemer verlaat sessie en eigenaar sluit sessie af zijn aparte acties. Houd bestaand bevestigen; benoem extra gevolgen wanneer een actieve coördinator wordt gesloten. |
| Standalone | Zonder OS blijft een compacte native launcher/menu bereikbaar. Hide native chrome pas na bevestigde montage van de OS-aansluiting. |

De bestaande [platform-routes](../../shared/platform-routes.js), AlgebraShell, [class-activity-flow](../../shared/multiplayer/class-activity-flow.js) en [OS-controller](../../os/desktop.js) bieden delen hiervan. De gezamenlijke klasstart verplaatst nu oorspronkelijke controls met hun handlers bij Rechten en Getallen; dat patroon kan naar Algebra en Vector worden uitgebreid. Dat maakt de presentatie gelijk zonder sessieproviders te vervangen.

Een centrale melding “Je klas is gestart” vraagt daarnaast een provideroverschrijdende sessie-/uitnodigingenbron. Die volgt niet vanzelf uit dezelfde menuknoppen. Controleer bij openen de echte sessie, deelname en fase; gebruik account-ID’s en vertrouwde rollen, geen alias als bevoegdheid. Begin met de bestaande uitnodigingen en code-/deelnamelinks; bouw de centrale ontdekking als een afzonderlijke stap.

## Oefenbladen en rechterklik

De echte documentenbibliotheek en de wereld-/onderwerpmappen in het huidige OS bestaan al. [worksheet-library.js](../../shared/worksheet-library.js) bewaart opgaven, gekoppelde sleutel, instellingen en data per account/gast op dit toestel. Sluit de lijst binnen elke trainer aan op dezelfde `list()/get()` als de centrale collectie, gefilterd op wereld en onderwerp. Heropen een document op zijn ID; opnieuw genereren levert mogelijk andere opgaven op. Een lege onderwerpmap kan de maker aanbieden zonder een fictief document te tonen.

Laat de maker na succesvolle generatie én opslag de actuele lijst bijwerken via `leraarbob:worksheets-change`. Meld een mislukte opslag expliciet; “gemaakt” betekent niet automatisch “bewaard”. Handhaaf bestaande bron-ID’s, export/import en quota-afhandeling. Dit is lokale opslag; toegankelijkheid op een ander toestel vraagt een aparte synchronisatievoorziening.

Rechterklik is een extra toegang tot dezelfde acties: openen/hervatten, ondersteunde werkvorm, aan bureaublad toevoegen, van bureaublad verwijderen of oefenbladen bekijken. Op het werkbord blijven alleen passende spelacties staan. Geen opdracht, inzending, hintverbruik of nieuwe reeks uitvoeren door enkel rechts te klikken. Gebruik dezelfde acties ook via zichtbare Meer, toetsenbord en aanraking.

De eerdere proef vond al een concreet rechterknopdefect in de oude Grenspas-route: invoer en geschiedenis veranderen. Dat hoort vóór globale contextmenu’s te worden hersteld. Pas het centrale menu niet overal op grafieken en invoervelden toe; geef native besturing en het browsermenu daar de passende ruimte. [Eerdere rechterklikproef](qa/rightclick/report.json).

## Uitvoerbare volgorde en acceptatie

| Stap | Werkpakket | Resultaat om te beoordelen |
| --- | --- | --- |
| 1 | Gedeeld appcontract en algemene OS-componentroutes, eerst op bestaande AlgebraShell | Eén bewezen aansluiting; geen Algebra-specialcase nodig voor elk volgend spel. |
| 2 | Getallen: adapters voor drie componenten en directe workmode/paper intents | Icoon → gekozen werkvorm → juiste instellingen; eigen begeleide opgave blijft open. |
| 3 | Rechten: adapter, menu-overlay los van render, directe providers | Eilandcontext blijft behouden; geen tweede globale kop of werkvormkeuze. |
| 4 | Vector: adapter + lege koprij samen herstellen, stationrouter en componentvensters | Verborgen functies bereikbaar, meer werkbordruimte, station en reeks blijven behouden. |
| 5 | Algebra/Vector-klasstart aansluiten; gedeelde wereld-/onderwerplijst voor documenten | Zelfde startpresentatie en dezelfde bewaarde reeksen via wereld en Start. |
| 6 | Centrale sessiemeldingen en uitnodigingen; vervolgens contextmenu’s | Direct deelnemen met echte providerfase, ondersteunde uitnodigingen en native rechterknopguards. |

Vector-bereikbaarheid kan als kleine parallelle reparatie eerder worden opgepakt zodra het actiecontract bestaat. Leerinhoud, graders of storage-schema’s hoeven niet te wachten op een volledige herbouw.

Per component is de acceptatie: echte opgave openen en gedeeltelijk invullen; Start/Meer openen en sluiten; kop inklappen/terug openen; minimaliseren/hervatten; andere component openen/terug; gekozen level naast andere actieve ronde bekijken; papier maken zonder die ronde te veranderen; juiste rol voor starten/deelnemen; terug naar de eigen oorsprong. Vergelijk vraag, seed, invoer, stap, hulp en voortgang vóór/na. Controleer herladen via native herstel afzonderlijk van behoud van een levende pagina. Test 1366 × 768 bij 100% zoom en compacte schermen, met 44 × 44 aanraakdoelen en een vrije herstelknop volgens [AGENTS.md](../../AGENTS.md).

## Uitgevoerde controles en grenzen

- Nieuwe lokale browserproef op 1366 × 768: vier native interfaces geïnventariseerd; Getallen echte start en exact hervatten gecontroleerd; Getallen providerwissel en herhaalde keuze bevestigd; Rechten via Hellingrug naar de extra werkvormpagina geklikt; Vector-stationroute als ontbrekende aansluiting aangetoond. Geen JavaScriptfouten. Externe verbindingen en alle niet-GET-verzoeken geblokkeerd. [Script](qa/internal-structure-browser.cjs), [resultaat en bronhashes](qa/internal-structure-report.json).
- Vijf relevante bestaande testbestanden opnieuw geslaagd: register, routes, desktopmodel, Getallen-integratie en documentenbibliotheek. Getallen gebruikt native opgaven en grader met fictieve accountopslag; bibliotheektests gebruiken fictieve accounts en IndexedDB. [Testresultaat en command](qa/internal-structure-tests.txt).
- De eerdere publieke schermmetingen en screenshots blijven apart bewijs voor bestaande lay-out en rechterklik. Ze zijn niet opnieuw gemaakt voor dit interne onderzoek. [Bewijsindex](qa/README.md).
- Geen nieuwe productiecontrole met een echte leraar én leerling: er is geen bruikbare combinatie van beide ingelogde testsessies beschikbaar. Multiplayercorrectheid, uitnodigingen tussen twee accounts en nieuwe centrale klassessiemeldingen zijn hiermee niet bewezen. De voorstellen hierboven zijn nog niet geïmplementeerd.
