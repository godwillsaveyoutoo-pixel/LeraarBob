# Uniforme bediening van de vier trainers in het OS

Getallenwereld, Algebrawereld, Rechtenwereld en Vectormissie hebben één gedeelde platformbalk, maar nog geen gemeenschappelijke afspraak voor appnavigatie, werkvormwissels, hervatten en contextacties. De grootste verbetering komt van één compacte bediening die de bestaande trainers aanstuurt. Hun vragen, uitwerkingen, antwoordvormen, leerbewijs, XP en sessieproviders blijven bij de eigen trainer.

Dit voorstel betreft de gepubliceerde versie van 10 oktober 2026, main `296e06b7afb84564f7737ba0f790e27ebf6fa800`. De oorspronkelijke lokale werkbranch bevat afzonderlijk, nog niet gepubliceerd werk. Die werkmap is buiten deze analyse gehouden. Dit is een analyse met bewijs en een implementatievolgorde; de voorgestelde interface is nog niet ingevoerd.

**Vervolgonderzoek:** [Interne structuur van de vier trainers](INTERNE-STRUCTUUR.md) werkt de concrete ingrepen per component uit en verwerkt het inmiddels gekozen ontwerp: een persoonlijk spelgrid, centrale werkvormstart en oefenbladcollectie via Start en de wereld. De permanente rij Overzicht / Onderdelen / Werkvormen hieronder is daarmee een eerdere ontwerpvariant, geen vereiste voor de nieuwe interface. De bestaande metingen en bronanalyse blijven bruikbaar.

## Wat de daadwerkelijke interface laat zien

De vier apps zijn op de publieke site als frisse gast geopend, via echte knoppen naar een opgave gebracht en gemeten op 1366 × 768 bij 100% zoom, 390 × 844 en 640 × 360, telkens met de OS-balk uitgeklapt en ingeklapt. Er zijn 30 schermmetingen en 34 screenshots. Twaalf relevante gepubliceerde bronbestanden zijn bytegelijk aan de onderzochte main. Alle vier behouden hun iframe bij OS-minimaliseren en hervatten. Er zijn geen JavaScriptfouten of ontbrekende bronnen in deze navigatieproef. [Rapport](qa/report.json), [screenshotindex](qa/README.md).

De metingen hieronder gelden voor de daadwerkelijk geopende desktopopgave. Opgavetitels, demonstraties, timers en antwoordbediening zijn inhoud; die tellen niet automatisch als overbodige navigatie.

| Trainer | OS-platformbalk | OS-appbalk | OS-taakbalk | Extra navigatie of lege kopruimte binnen de app | Gevolg |
| --- | ---: | ---: | ---: | --- | --- |
| Getallenwereld | 58 px | 51 px | 68 px | 48 px voor Mijn machtenpad / Onderdelen & werkvormen | Twee afzonderlijke appnavigaties; kruimelpad is wel geïntegreerd |
| Algebrawereld | 58 px | 49 px | 68 px | Geen extra globale navigatierij; native opgavekop is 48 px | Beste bestaande vertrekpunt; appbalk bevat Werelden / Levels / Werkvormen |
| Rechtenwereld | 58 px | 51 px | 68 px | 52 px native kop met opnieuw merk, profiel, fullscreen en Menu | Dubbele platformbediening, twee verschillend gevulde menu’s |
| Vectormissie | 58 px | 51 px | 68 px | 82 px onzichtbare native kop, met verborgen menu | Ruimteverlies én verdwenen appmenu-acties |

Op 390 px breed is de gemeten gast-platformbalk 77 px en de taakbalk 62 px. Algebra gebruikt daar een appbalk van 98 px, de andere drie 51 px. Die extra Algebra-rij is toegankelijk, maar toont waarom secundaire vensteracties moeten wijken naar een compact actiemenu. Dit is geen meting van een ingelogde leraar met extra klas-/liveknoppen.

Op 640 × 360 laten de uitgeklapte OS-balken slechts 183–185 px iframehoogte over. Bij Vectormissie blijft daarbinnen nog 52 px onzichtbare kopruimte staan. In beide balkstanden verschijnt de native draaihulp: het iframe is lager dan de native minimumhoogte. Alleen de buitenste balk inklappen lost dat nog niet op. Rechtenwereld behoudt zijn bestaande draai-/groottebegeleiding op compacte schermen; dit rapport belooft geen nieuwe portretbediening voor grafiekvragen.

De OS-menuknop toont tijdens alle vier opgaven hetzelfde platformmenu: bureaublad, apps, taken, oefenbladen, samen/live, profiel en instellingen. Dit menu projecteert geen native traineracties. Getallen heeft daarnaast zijn eigen Onderdelen & werkvormen. Rechten heeft daarnaast zijn eigen Menu. Algebra projecteert zijn native bestemmingen rechtstreeks in de appbalk. Bij Vector ontbreekt die projectie.

## Analyse per trainer

| Trainer | Huidige verschillen | Benodigde aansluiting | Wat behouden moet blijven |
| --- | --- | --- | --- |
| Getallenwereld | Drie bedieningssystemen: begeleide werkplaats, eigen-reeksprovider en online provider. Eigen terugknoppen, hervatknoppen en werkvormkeuzes. Alleen kruimels worden in het OS overgenomen. Providerlinks kunnen de huidige iframepagina vervangen. | Eén navigatieadapter voor alle drie componenten; afzonderlijke levende werkruimten; dezelfde appbalk en werkvormkeuze. Native navigatie pas verbergen wanneer alle acties elders bereikbaar zijn. | 19 begeleide doelen zonder XP; provider met 16 vraagvormen en eigen XP; regelkeuze, uitwerkingsdelen, hulpvoorbeeld, historische seeds/versies, Learn-bespreking en Battle-inzending |
| Algebrawereld | Expliciete AlgebraShell en aparte Vergelijkingen/Stelsels-vensters. Uniforme appbalk bestaat, maar is speciaal voor Algebra geprogrammeerd. Eigen klasinstellingen en wisselende namen Spelen / Verder spelen / Opnieuw spelen. | Maak het shellcontract geschikt voor alle trainers; uniforme namen en indeling; sluit native klasinstellingen aan op de bestaande gezamenlijke startpresentatie. | Bewerking kiezen en uitvoeren, breukbouw, hulpdemo, stappen/ongedaan, Stelsels-methodes en onafgemaakte invoer; gekozen level en lopende ronde zijn verschillende zaken |
| Rechtenwereld | Native merk/profiel/fullscreen/menu boven op OS-bediening. Vorige betekent soms terug naar een eiland. Herinnering en hint zijn verschillende functies. Sommige native werkvormlinks geven het huidige eiland niet mee. | Projecteer native wereld/gebied/onderdeel en acties in het OS; vervang dubbele globale kop; benoem de terugbestemming; geef onderwerp/niveau/terugroute mee aan werkvormen. | Grafiek, tokens, slepen, formulebouw, meerfasige controle, hinttelling, herinneringen en bestaande automatische-vervolgstapvoorkeur |
| Vectormissie | Native kop is onzichtbaar, maar houdt ruimte bezet. Menu-ingangen voor Vrij oefenen, algemene Uitleg en Mijn voortgang worden niet naar het OS gebracht. Canvas/duo/klaslinks vervangen de huidige trainerpagina. | Eerst native acties bereikbaar maken en kopruimte herstellen; daarna gedeelde adapter en afzonderlijke vensters; uniforme klasstart. De bronshell/modules wijzigen en de gebundelde HTML opnieuw bouwen. | Tekenen, begin/eindtaps, coördinatenkeypad, route versus vrij oefenen, eigen coach, suspendedSeries, geschiedenis en bestaand voortgangsbewijs |

Vectormissie heeft nog alternatieve ingangen: een stationkaart kan een losse vrije oefening starten, de OS-appkaart biedt bestaande duo-/klaswerkvormen en Vectoratelier staat als aparte app in het OS. De algemene Vrij oefenen-menustand, native uitleg- en voortgangschermen zijn daarmee nog niet gelijkwaardig bereikbaar. De coach binnen een opgave werkt wel.

De Vector-oorzaak is concreet: `styles/platform-ui.css:6` verbergt `.trainer-header:not(.lb-header)`, terwijl de gedeelde topbar binnen een iframe vóór montage stopt. Daardoor wordt `.lb-header` niet toegevoegd. De gereserveerde hoogte is daadwerkelijk gemeten: 82 px desktop, 62 px portret en 52 px kort liggend. [Aanvullend publiek rapport](qa/vector-header-report.json). Alleen CSS terugzetten zou de dubbele platformbediening weer tonen; de duurzame oplossing is de ontbrekende actieprojectie toevoegen en de layout daarop aansluiten.

## De voorgestelde gemeenschappelijke bediening

Er komen maximaal twee globale navigatielagen boven de app. De taakbalk blijft de vaste ingang voor Start en open vensters. Opgavespecifieke gereedschappen blijven op het werkbord.

```text
Platform   leraarBob › thema › trainer › onderwerp    echte voortgang · account · fullscreen · weergave · OS-menu · inklappen
App        ← Naar mijn map     Overzicht · Onderdelen · Werkvormen     Hervatten* · minimaliseren · Meer…
Werkbord   oorspronkelijke opgave, invoer, tekenvlak, hulp en antwoordacties
Taakbalk   Start · open vensters · bestaande account-/instellingstoegang
```

`Hervatten` verschijnt alleen buiten het actieve werkbord en alleen wanneer de app daadwerkelijk werk heeft om te hervatten. De naam van de ronde of het onderdeel staat erbij. De actuele trainernaam/het onderwerp staat in het kruimelpad; een tweede permanente titel, badge en modusomschrijving hoeft dezelfde informatie niet te herhalen.

| Gemeenschappelijke actie | Vast gedrag |
| --- | --- |
| Naar mijn map | Terug naar de eigen bewaarde OS-map, inclusief filter/zoekwoord. Venster blijft open. |
| Overzicht | Eigen traineroverzicht: Getallen-hoofdstukken, Algebra-werelden, Rechten-eilanden of Vector-stations. Geen nieuwe ronde. |
| Onderdelen | Onderdelen binnen het huidige onderwerp/station tonen. Kiezen verandert de selectie; Start oefening start expliciet. Zonder gekozen onderwerp eerst de onderwerpkeuze tonen. |
| Werkvormen | Dezelfde indeling en volgorde, gevuld met werkelijk ondersteunde werkvormen voor dit onderwerp en account. Geen tweede keuze van dezelfde leerstof als die al bekend is. |
| Meer voor deze trainer | Secundaire toegang, snelkoppeling, apart openen, eigen voortgang en venster sluiten. Dezelfde context en handlers als andere ingangen. |
| OS-menu | Platformbestemmingen. Toegankelijke naam OS-menu; het appmenu heet Meer voor [trainer]. |
| Start | OS-startpaneel, ook via de bestaande Ctrl/Cmd K. Eigen input blijft bestaan; sluiten brengt de focus terug. |
| Minimaliseren | Verbergt het venster, behoudt DOM en invoer. Geen reset of sessieafsluiting. |
| Venster sluiten | Sluit het gekozen venster via het bestaande bevestigingspad. Geen automatische opdracht om de gezamenlijke sessie af te sluiten. |
| Sessie verlaten / Sessie afsluiten | Expliciete native acties. Verlaten hoort bij een deelnemer; afsluiten bij de bevoegde leraar/eigenaar en raakt de sessie. |

Hetzelfde viewportprofiel gebruikt bij alle vier dezelfde actievolgorde. Op desktop blijven de drie bestemmingen rechtstreeks zichtbaar. Op mobiel blijven Terug, actuele bestemming en Meer bereikbaar; onderdelen/werkvormen kunnen in één gedeeld appmenu komen wanneer de breedte niet volstaat. Een tweede 44 px rij is toegestaan als de gemeten bediening die nodig heeft. Fullscreen, de ondersteunde weergavekeuze, account en inklappen blijven volgens AGENTS rechtstreeks in de platformbalk.

Als ontwerpbegroting geldt op desktop ongeveer 56 px platform, 48–52 px appbediening en 52 px taakbalk: circa 156–160 px in totaal. De besparing komt vooral van de dubbele of lege native koppen, daarna van secundaire vensteracties. Dit zijn ontwerptargets, geen al behaalde metingen. Knoppen blijven minstens 44 × 44 px. De expliciete inklapkeuze blijft behouden; resize of een volgende oefening mag die niet automatisch overschrijven. De herstelknop krijgt eigen ruimte en bedekt geen opgave of actie.

## Uniforme leerbediening zonder verlies van leerflow

De primaire antwoordactie krijgt overal een voorspelbare plaats en visuele rang. De betekenis blijft zichtbaar in de naam. Controleer is een verbeterbare controle; Indienen is een definitieve Battle-inzending. Voer uit bij Algebra voert een gekozen bewerking uit en mag niet worden vervangen door een algemene eindantwoordcontrole. Vorige stap, Ongedaan en Vorige opgave blijven verschillende opdrachten.

Hulp staat op dezelfde herkenbare plek, maar de inhoud blijft bij de trainer. Getallen kan een ander voorbeeld tonen; Rechten kent Herinnering en Volgende hint; Algebra heeft een demonstratie of aanwijzing; Vector heeft coach/uitleg en eigen ondersteuningsbewijs. Hulp kan de oorspronkelijke hinttelling of XP beïnvloeden. Alleen een menu openen, focussen of erover bewegen mag dat nooit doen. Controleer/Indienen, Volgende en de noodzakelijke teken-/bewerkingsacties blijven rechtstreeks zichtbaar.

Escape sluit de bovenste actieve overlay of het menu en herstelt focus naar de opener. Een actieve tekenbeweging kan eerst worden geannuleerd volgens de eigen controller. Escape brengt niet zonder waarschuwing naar een andere wereld. Ctrl/Cmd K blijft de OS-ingang; gewone Enter, pijlen, cijfers, breuktekens en native undo blijven bij het actuele invoerveld of werkbord.

Lokale animaties en online deadlines krijgen verschillende zichtbaarheidsregels. Een hulpdemo kan op de huidige stap worden vastgehouden wanneer haar venster verborgen is; een bewust gepauzeerde demo gaat niet vanzelf verder. Een servertimer van een Battle loopt door. Algebra heeft een native `visibilitychange`-hook, maar de OS-minimaliseeractie geeft nog geen expliciete appzichtbaarheidsmelding. Dat gedrag verdient een gerichte regressie bij implementatie.

## Werkvormen en klasstart

Gebruik één compact werkvormoverzicht met vaste groepen: Zelf oefenen, Samen, Met de klas en Op papier. Per tegel staat kort met hoeveel mensen en op hoeveel toestellen de werkvorm werkt. Bordduo op één toestel is verschillend van Duo Learn/Battle met twee accounts. Leraaracties verschijnen op basis van het vertrouwde centrale account; leerlingen krijgen deelnemen, geen klasstart. Gast of onopgeloste accountstatus krijgt geen hostactie. Lokale borduitleg is afzonderlijk van een klas beheren: de Getallen-provider kan historisch zonder leraarlogin demonstreren, terwijl de OS-ingang daarvoor nu leraargericht is. Het capabilitycontract moet dat onderscheid expliciet vastleggen.

Onderwerp, geselecteerd onderdeel en veilige terugroute gaan mee. Als een provider het leerdoel niet kan aanbieden, vermeldt de ingang dat het om aanvullende hoofdstukoefeningen gaat. Niet alle vier werelden hebben alle werkvormen:

- Getallen heeft vier begeleide doelen zonder equivalente reeksprovider: betekenis/nulmacht, wortelregels toetsen, wetenschappelijk terugschrijven en normaliseren.
- Algebra heeft geen volledige Battle-dekking van alle zes Stelsels-sololevels. De klasprovider ondersteunt eenvoudige unieke stelsels met gehele getallen. Een menu mag geen inhoud suggereren die de provider niet levert.
- Vector heeft bestaande solo-, lokale duo- en klasbattle-capabilities; online-duo, Learn en een oefenbladgenerator zijn niet geregistreerd. Vectoratelier is een afzonderlijke app.

Rechten en Getallen gebruiken al dezelfde Klasbattle-startpresentatie, maar die aansluiting geldt niet automatisch voor Duo/Learn. Algebra en Vector gebruiken nog native klasinstellingen. Breid de bestaande `class-activity-flow` uit met hun eigen velden en opties. Die component verplaatst originele nodes met hun handlers en kan ze herstellen: dit is een passend patroon om de bestaande providerwerking te beschermen.

De leraar volgt dezelfde volgorde: Leerstof en instellingen → Maak klasbattle → Wachtkamer met code/deelnemers → Start → Ronde/resultaten. De leerling volgt Code → Wachtkamer → Ronde/resultaat. De eigen vraagborden, beoordeling en serverrechten blijven native. Ondersteun ook geselecteerde Stelsels-inhoud, Vector-station/vaardigheid, gemengde Rechten-leerstof en de drie Getallen-niveaus zonder de native validatie te omzeilen.

## Bewaren moet één duidelijke betekenis per actie krijgen

OS Bewaren is meestal een URL-snelkoppeling naar Mijn taken. In een oefenbladgenerator kan dezelfde knop de exacte opgaven en sleutel archiveren in Mijn oefenbladen. Dat zijn verschillende producten en beloften.

Gebruik Bewaar snelkoppeling voor de app/route en Reeks bewaren voor een exact oefenbladdocument. Reeksen hebben de bestaande indeling thema → onderwerp en behouden hun oorspronkelijke vragen/sleutel bij opnieuw openen. Geef de bestaande opslaggrens eerlijk weer: per account op dit toestel, met export, zonder huidige cloudsync. Alleen via een URL een app opnieuw openen is geen kopie van haar tekeningen of volledige geheugen.

Vectoratelier bewaart momenteel een globale lokale shape-array en heeft geen eigen accountopslag zoals de trainers. Persoonlijke atelierbestanden in een OS-map vragen daarom een expliciete snapshot/schema/eigenaar-aansluiting. Naam wijzigen en verplaatsen van bestanden zijn nuttige vervolgfuncties, maar moeten een echte document-id gebruiken en zijn niet al beschikbaar door een contextmenu te tekenen.

## Rechterklik als compacte toegang tot objectacties

Er is in de onderzochte OS- en trainerbronnen geen gedeeld appcontextmenu. In de publieke proef laat een echte rechterklik het browsermenu ongemoeid. Rechterklik is vooral nuttig voor acties op een duidelijk object: een map, tegel, open venster of bewaard document. Het kan vaste knoppen uitsparen en het OS herkenbaarder maken.

| Object | Eerste zinvolle acties | Voordeel en grens |
| --- | --- | --- |
| Themamap | Openen, bijbehorende oefenbladen | Handig bij de inhoud, zonder algemene menu’s te doorzoeken |
| Apptegel | Openen/hervatten, Werkvormen…, Vastmaken/losmaken, Apart openen | Dezelfde bestaande acties; alleen beschikbare werkvormen |
| Taakbalkvenster | Hervatten, Naar eigen map, Minimaliseren, Bewaar snelkoppeling, Apart openen, Venster sluiten… | Bedient het aangeklikte venster, ook als een ander actief is |
| Onderdeelkaart | Selecteren, Hervatten, Start oefening…, Werkvormen bij dit onderdeel, Oefenblad maken waar ondersteund | Openen van het menu start geen ronde en genereert geen vragen |
| Bewaarde oefenbladreeks | Openen, Afdrukken/PDF, Download kopie, Verwijderen… | Werkt op exact document en sleutel; genereert geen nieuwe willekeurige reeks |
| Getekend object in atelier | Later: selecteren, kleur/naam, verwijderen/export | Vereist eerst stabiele object-id, selectie/hit-testing en eigen opslag |

Begin met OS-objecten, daarna pas onderdeelkaarten. Contextmenu’s op trainingsgrafieken en antwoordvelden komen pas wanneer de native controller expliciet een object en veilige acties aanbiedt. Gegeven vectoren, beoordelingsdoelen en antwoordopties krijgen geen algemene bewerkingsacties.

Iedere contextactie is ook bereikbaar via een zichtbare Meer-knop (⋯). Touch gebruikt die knop; lang indrukken is hoogstens een extra ingang op een tegel. Tekstselectie, kopiëren/plakken, scrollen en tekenen mogen er niet door worden gekaapt. Een globaal `contextmenu.preventDefault()` op alle documenten is hiervoor ongeschikt.

Voor een echt actiemenu: Enter/Spatie opent de Meer-knop; Shift+F10/contextmenutoets opent bij het gefocuste object; pijlen, Home/End en Enter bedienen het menu; Escape sluit en brengt de focus terug. De opener geeft naam, `aria-haspopup` en juiste `aria-expanded`. Het menu blijft binnen het scherm en heeft maximaal ongeveer zes relevante acties; extra groepering is mogelijk, geen hele OS-boom. Dit sluit aan op de [W3C-menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) en [menu-interactiepatronen](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).

Interceptie is alleen nodig op expliciet aangesloten objecten. Bij een ontbrekende adapter of een gewoon tekst-/invoerveld blijft het browsermenu behouden. Firefox kan bij Shift + rechterklik het browsermenu direct tonen; daarom kan rechterklik nooit de enige toegang zijn. [MDN contextmenu](https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event).

## Aangetoond rechterklikprobleem

Een afzonderlijke lokale proef op dezelfde main gebruikte echte Brave/Playwright-rechtsklikken, verse opslag en een fictief leraaraccount; extern netwerk was geblokkeerd. Op de behouden compatibiliteitsroute `?slice=grenspas` veranderde rechtsklikken op de getallenas het antwoord: van leeg naar `root="2"`, geschiedenis van 0 naar 1. Er was geen indiening of XP-event. De normale actuele Puntenbaai-vraag Coördinaten plaatsen bleef bij rechterklik geheel ongewijzigd. [Bewijs en screenshot](qa/rightclick/report.json).

De oude axis-picker-handler mist een primaire-muisknopcontrole; andere actuele pickers hebben die al. De bevinding geldt voor deze compatibiliteitsroute, niet voor alle Rechten-oefeningen. Herstel dit vóór contextmenu’s op werkborden. Alleen het browsermenu onderdrukken bij `contextmenu` voorkomt niet een eerder uitgevoerde antwoordmutatie via `pointerup`. Rechter- en middelknop, lang indrukken en afgebroken gestures moeten state-neutraal zijn.

## Technische aansluiting

Gebruik AlgebraShell als vertrekpunt, maar vervang app-specifieke branches niet door nog meer DOM-tekstherkenning. Eén gedeeld adaptercontract levert aan het OS:

- Context: app, component/module, onderwerp, scherm, werkvorm, actuele terugkeerplek en native voortgangseenheid.
- Afzonderlijke `selectedLevelId`, `activeRunLevelId` en doel van een oefenblad. Een ander level selecteren mag het lopende werk niet vervangen.
- Pure reads voor bestemmingen en beschikbare acties; uitvoering via de bestaande native controller.
- Meldingen voor contextwijziging, accountscope, focus en appzichtbaarheid; cleanup voor subscriptions bij echt sluiten.
- Routes naar bestaande werkvormen die het OS als eigen levende vensters kan openen, met dezelfde zes-vensterlimiet en veilige terugroute.

Eén actieregister voedt appbalk, Meer, rechterklik en toetsenbord. De lijst verschilt per object/scope, terwijl betekenis, naam en uitvoering gelijk blijven. Leg bij menu-opening eigenaar, venstersleutel, component, doelobject en versie vast; controleer ze opnieuw bij uitvoering en na wachten op een async-actie. Accountwissel of een verdwenen venster/document invalideert het menu. Een contextmenu op een inactief taakbalkitem mag nooit per ongeluk `activeKey` gebruiken om de verkeerde app te bewaren of sluiten.

De adapter verandert geen accountopslag, voortgangsidentiteit, XP-formule, oorspronkelijke vragen, sessieprovider of SQL/Edge. Minimaliseren doet geen cleanup, nieuwe oefening of serverpause. Cleanup is uitsluitend het opruimen van de aansluiting en beëindigt geen gezamenlijke klas.

## Aanbevolen implementatievolgorde

| Prioriteit | Afgebakende wijziging | Klaar wanneer |
| --- | --- | --- |
| 1 | Vector-menuprojectie en lege kopruimte; oude Rechten-axis-picker primaire-knopguard | Native acties bereikbaar in OS; gemeten lege kop weg; rechtsklik verandert geen antwoord |
| 2 | Gedeelde shell/context/acties voor vier trainers en afzonderlijke provider-/modulevensters | Dezelfde appbalk, betekenis van Terug/Hervatten en exacte live invoer bij wisselen |
| 3 | Compacte lay-outs, vaste labels en onderscheid snelkoppeling/document | Twee globale lagen; metingen op alle drie schermformaten; duidelijke bewaarbestemming |
| 4 | Eén werkvormoverzicht en dezelfde Algebra/Vector-klasstartpresentatie | Capability/rol/topiccorrect; native instellingen, lobby, vragen en terugkeer blijven intact |
| 5 | Gedeeld objectmenu voor tegels, mappen, taakbalk en documenten | Rechterklik, ⋯ en toetsenbord bedienen exact dezelfde acties met correct focusherstel |
| 6 | Optionele native objectacties en persoonlijke Vectoratelier-bestanden | Alleen expliciet selecteerbare objecten; schema/eigenaar/export; geen effect op trainingsantwoorden |

Elke stap is een eigen reviewbare wijziging. Eerst de bereikbaarheid en het gedrag vastleggen, daarna compacte presentatie en versnellers. Zo komt er één bedieningssysteem dat de bestaande trainers betrouwbaar bestuurt.

## Controlelijst voor de implementatie

- Vier trainers, kaart → onderwerp → onderdeel → oefening → hulp/menu → werkvorm → exact terug. 1366 × 768 bij 100%, 390 × 844 en 640 × 360; beide balkstanden, herstel ≥44 px, herladen, geen overlap en geen horizontale overflow.
- Werkelijke onafgemaakte state: Getallen-regel/antwoorddeel/hulpstap; Algebra-breuk/voorgestelde bewerking; Rechten-token/getallen/grafiekfase; Vector-stroke/coördinaten/coach. Start, focus, terug, minimaliseren en wisselen houden dezelfde native state.
- Alleen openen/sluiten van een menu, rechterklik, focus of weergavewissel wijzigt geen antwoord, hintcount, geschiedenis, seed, poging, XP, document of sessie.
- Gekozen ander onderdeel versus lopende ronde; oefenblad van ander level; menu op inactief venster; zes-vensterlimiet; accountwissel terwijl een menu/async-actie openstaat.
- Rechtsklik, middelklik, ⋯, Shift+F10, Enter/Spatie, Escape/focus, schermrand, touchscroll/lang indrukken en native kopiëren/plakken. Alleen eigen objecten onderscheppen.
- Leraar: configuratie/code/start/volgende/afsluiten. Leerling: code/deelnemen/antwoord/verlaten. Gast/accountpending: geen hostactie. Lokale demo-pauze apart van doorlopende serverdeadline.
- Bestaande daadwerkelijke DOM-, trainer-, klas-, worksheet- en SQL/Edge-regressies hergebruiken en op statebehoud uitbreiden. Productieaanmelding en twee echte externe accounts apart verifiëren; de nieuwe gastproef bewijst die niet.

## Bronankers en bewijsgrenzen

De belangrijkste bronankers op de onderzochte versie:

| Onderwerp | Bron |
| --- | --- |
| Ingebedde topbar, platformmenu | `shared/leraarbob-topbar.js:7,175–240` |
| Algebra-only appprojectie; context/routing | `os/desktop.js:242–295,358–419` |
| Levende vensters, focus en bewaren | `os/desktop.js:323–356,423–431,456–476,489–491` |
| Getallen native menu en hulp/links | `games/getallenwereld/app.js:13–18,152–164,198–221`; `workshop.js:30` |
| Getallen provider en gedeelde klasflow | `games/bewerkingen-trainer/numbers-space.js:11–13,27–38,95–117,167–191` |
| Algebra context en gekozen versus lopend level | `games/algebra-trainer/shell.js:5–46`; `navigation.js:22–59` |
| Algebra native hulp en klasdekking | `games/algebra-trainer/trainer.js:227–261`; `battle-config.js:2–5` |
| Rechten native kop/menu; terug/hulp/pointers | `games/rechten/rechtenwereld/components/shell-view.js:34–38`; `app-shell.js:123–197` |
| Vector verborgen kop en native routes | `games/vectoren/styles/platform-ui.css:6`; `styles/mission-shell.css:3`; `vector-app.js:537–623` |
| Bestaande gemeenschappelijke klascomponent | `shared/multiplayer/class-activity-flow.js:7–27`; `classroom.js:10,206–217` |
| Vectoratelier lokale bestanden | `games/vectoren/vector-canvas.js:3–8,27–29,66–70` |

De bronanalyse omvat de vier trainers en hun bestaande providers. De nieuwe publieke browserproef is een navigatie-/layoutproef als gast: geen antwoordreeks beoordeeld, geen productie-login, klascreatie of multiplayer uitgevoerd. De gerichte rechterklikproef gebruikt lokale mainbron en een fictief account. Eerdere uitgebreidere functionele regressies staan in `os/PILOT.md`; die zijn voor deze analyse niet opnieuw gedraaid. Het rapport scheidt de gemeten huidige toestand van de voorgestelde verandering.
