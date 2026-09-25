# Rechten — hoofdkaart, deelkaarten en stopplaatsen

Actuele implementatie: [eerste leerlingversie met de kaart als start](rechten-leerlingenstart.md). Die vervangt de beperkte Kaartvallei-ingang door de vijf deelkaarten en letterlijke leerdoelen.

Herzien structuurvoorstel · 22 september 2026. Dit document legt de voorgestelde inhoudsindeling vast voor het [spelraamwerk](rechten-spelraamwerk.md) en [klikbare schermmodel](rechten-gameframe/index.html). De indeling is bespreekbaar; dit is geen wijziging van de bestaande leerengine of opgeslagen voortgang.

Het vervangt de eerdere indeling met namen zoals Kaartvallei, Meetpad en Markt. De [eerdere Kaartvallei-integratie](rechten-kaartvallei-etappe.md) is een technische proef en gebruikt nog die oude namen.

## 1. Eén duidelijke hiërarchie

**Hoofdkaart Rechten → deelkaart van een onderwerp → stopplaats met een leerdoel → activiteit.**

| Niveau | Wat staat erop? | Voorbeeld | Wat doet selecteren? |
| --- | --- | --- | --- |
| Hoofdkaart | Vijf onderwerpen, aanbeveling en persoonlijke voortgang | Punten en helling | Toont de inhoud; **Open deelkaart** opent het onderwerp |
| Deelkaart | Twee tot vier stopplaatsen met letterlijke leerdoelen | Helling uit twee punten | Toont het doel en passende activiteiten in een detailpaneel |
| Stopplaats | Eén samenhangend leerdoel, soms met meerdere skills | Voorschrift uit punten | **Oefenen**, **Extra variatie** of een beschikbare uitleg; geen derde kaartniveau |
| Activiteit | De concrete oefenreeks met uitleg, feedback en herhaling | Oefenen: helling uit twee punten | **Start** opent het werkvlak; pauzeren behoudt de deelstappen |

**Gemengd herhalen** en **Onderwerptoets** zijn activiteiten met een ruimer bereik. Ze staan bij de deelkaart, maar gemengd herhalen gebruikt alle geschikte eerdere onderwerpen. De onderwerptoets combineert doelen van de deelkaart met eerdere kennis. Ze krijgen geen extra gebouw dat de leerling moet bezoeken om noodzakelijke herhaling te krijgen. In het schermmodel staan deze keuzes naast de stopplaatsactiviteiten; hun toelichting benoemt hun bereik.

De hoofdkaart is het vertrekpunt. Een lopende opdracht heeft overal een directe hervatknop. Na afronding keer je terug naar dezelfde deelkaart; niet na elke afzonderlijke vraag terug naar de hoofdkaart.

**Kaart · Voortgang · Groep · Profiel** zijn de vaste navigatieknoppen. Ranglijsten staan onder **Groep**. Voortgang en ranglijsten zijn schermen, geen gebieden op de leerkaart. Een toekomstige keuze tussen wiskundethema's komt buiten deze hoofdkaart; voorlopig bouwen we geen extra wereldniveau erboven.

## 2. Vijf deelkaarten, veertien stopplaatsen

De namen zeggen wat je leert. Landschappen en illustraties mogen verschillen zonder een tweede naam te krijgen die leerlingen moeten onthouden.

| Deelkaart | Stopplaats | Bestaande skill-IDs |
| --- | --- | --- |
| **1. Punten en helling** | Coördinaten lezen en plaatsen | `point`, `point_plot` |
| | Verschillen en helling | `delta`, `slope` |
| | Helling uit twee punten | `slope_from_two_points` |
| **2. Eigenschappen van rechten** | Stijgen, dalen en bijzondere rechten | `line_behavior`, `special_lines` |
| | a en b herkennen | `intercept`, `ab` |
| **3. Voorschriften opstellen** | Voorschrift uit a en b | `equation_from_ab` |
| | Voorschrift uit punten | `intercept_from_point`, `equation_from_point_slope`, `equation_from_two_points` |
| | Vergelijking herleiden | `rewrite_linear_equation` |
| **4. Tabellen, grafieken en toepassingen** | Waarden berekenen en tabellen invullen | `fx`, `table`, `input_from_output` |
| | Grafieken tekenen en punten controleren | `graph_from_equation`, `graph_from_table`, `point_on_line` |
| | Voorschrift uit tabel of grafiek | `equation_from_table`, `equation_from_graph` |
| | Voorschrift uit een situatie | `equation_from_context` |
| **5. Nulwaarden en tekens** | Nulwaarde bepalen | `zeroRead`, `zero` |
| | Teken en tekenschema | `sign`, `signchart` |

Alle 27 huidige skills hebben precies één inhoudelijke thuisplek. Dat is geen whitelist voor de oefeningen op die plek. De elf oorspronkelijke IDs en hun historische betekenis blijven ongewijzigd.

De vierde deelkaart heeft vier stopplaatsen omdat berekenen, tekenen, reconstrueren en context interpreteren verschillende handelingen zijn. In het vorige voorstel zaten te veel van die handelingen bij één Kaartbureau. Grafiekconstructie staat nu bij de andere grafiekactiviteiten. Voorschrift uit punten blijft één stopplaats met een opbouw in drie bestaande skills; die drie skills worden niet in één keer als beheerst aangemerkt.

Dit is een concreet voorstel om te beoordelen, geen bewezen optimale groepering. Vooral de breedte van deelkaart 4 en de duidelijkheid van de twee samengevoegde stopplaatsen in deelkaart 2 moeten met leerlingen worden getoetst. Bij onduidelijkheid eerst de labels of deeldoelen verbeteren; niet automatisch extra kaartniveaus toevoegen.

## 3. Een inhoudsindeling is geen nieuwe blokkade

De nummers ordenen het overzicht; ze zijn geen sloten. Je hoeft deelkaart 3 niet af te maken om een beschikbare tabelvraag op deelkaart 4 te krijgen. Toegang volgt bestaande voorbereiding en eerder verkregen toegang. Op de kaart kan daarom meer dan één onderwerp tegelijk beschikbaar zijn.

De goedgekeurde introductieketen blijft:

`point → point_plot → delta → slope → slope_from_two_points → line_behavior → special_lines → intercept → ab`

Daarna volgt de voorschriftketen:

`equation_from_ab → intercept_from_point → equation_from_point_slope → equation_from_two_points`

`rewrite_linear_equation` is een aparte representatieroute, nooit een prerequisite voor `intercept_from_point`. Binnen de deelkaart mag de tekening dus niet suggereren dat de leerling eerst langs Vergelijking herleiden moet. `information_sufficiency` blijft een latere, niet-blokkerende transfer/mastery-skill en staat niet tussen de 27 huidige skills.

Slechts enkele passende vervolgstappen worden nadrukkelijk aanbevolen. Overige doelen blijven inspecteerbaar. Een ontbrekende voorbereiding wordt letterlijk benoemd, bijvoorbeeld ‘Oefen eerst helling uit twee punten’. Bij bestaande leerlingen blijft eerder verkregen toegang bestaan.

## 4. Activiteiten en herhaling

| Activiteit | Bereik en functie | Wanneer nodig? |
| --- | --- | --- |
| Uitleg en eerste oefening | Een nog nieuw leerdoel, met begeleide eerste toepassing | Als benodigde voorbereiding nog ontbreekt; eerder geldig bewijs blijft tellen |
| Oefenen | Gekozen leerdoel, passende varianten en geplande eerdere inhoud | Hoofdactie bij een stopplaats |
| Extra variatie | Andere getallen, voorstelling of verdieping | Optioneel; noodzakelijke basiskennis blijft in de hoofdroute |
| Gemengd herhalen | Eerdere beschikbare leerdoelen, ook uit andere deelkaarten | Vrijwillige extra ingang; herhaling zit ook automatisch in Oefenen |
| Onderwerptoets | Expliciete dekking van dit onderwerp met eerdere kennis | Persoonlijke mijlpaal; geen blokkade voor bestaande toegang |

Een stopplaats blijft bestaan nadat een reeks is afgerond. ‘Helling uit twee punten’ kan later een negatieve helling, breuk of andere voorstelling aanbieden. Een voltooiingsster zegt dat een bepaalde reeks is afgerond. Zelfstandigheid en later aangetoonde beheersing zijn afzonderlijke labels, afkomstig van de leerengine.

Voorbeeld: bij **Voorschrift uit een situatie** leest de leerling eerst gegevens als punten, bepaalt a en b, controleert het model en krijgt een geplande eerdere hellingsvraag. Als alleen b fout is, blijft de juiste a staan. De leerplanner plant later gerichte b-oefening met andere gegevens. Hiervoor hoeft de leerling niet eerst fysiek naar een oude deelkaart terug te klikken.

## 5. Contract met de bestaande trainer

De huidige twaalf primaire opgaven per ronde blijven het uitgangspunt. Een lange constructie heeft meer deelstappen dan een korte herkenningsvraag; de werkelijke duur moet worden gemeten voordat een tijdsbelofte of nieuwe rondelengte wordt vastgelegd. Tussentijds hervatten blijft nodig.

Een gekozen stopplaats geeft de planner een begrensde inhoudelijke voorkeur. Introducties, herstel, herhaling, variatie en bestaande toegang blijven bij de leerengine. Verschuldigde eerdere herhaling moet gegarandeerd aan bod blijven komen; een extra herhaalknop alleen is onvoldoende. De huidige herhaalafstanden zijn aantallen opgaven, geen kalenderdagen.

Een samengestelde opgave heeft één primaire skill. Diagnostische deelstappen waarderen niet automatisch alle onderliggende skills op. De kaart verwerkt één bevestigd pogingresultaat en kent geen tweede XP toe. Taakstate, leerstate en kaartstate blijven gescheiden. Nieuwe zichtbare namen zijn geen reden om skill-IDs, accountgegevens of bestaande voortgang te hernoemen.

Een onderwerptoets vereist een eigen dekkingsplan; het huidige checkpoint met vooral zwakke skills garandeert die dekking niet. Reeds zelfstandig aangetoonde onderdelen blijven bewaard. Een herkansing toetst ontbrekend bewijs met nieuwe gegevens; hulp blijft beschikbaar, maar telt niet als zelfstandig bewijs. De ranglijst gebruikt een aparte vergelijkbare uitdaging, niet de persoonlijke adaptieve oefenscore.

## 6. Visueel ontwerp en volgende stap

Behoud de sobere getekende stijl: rustige landschappen, donkere leesbare labels, groen voor selectie en goud voor een behaalde mijlpaal. Verschil tussen gebieden mag in reliëf, begroeiing of architectuur zitten. Het landschap bepaalt geen verborgen wiskundige betekenis. Decoratieve wegen zijn geen verplicht af te werken skillvolgorde.

Toon boven het werkvlak bijvoorbeeld **Rechten / Punten en helling / Helling uit twee punten**, met **Oefenen** als activiteit. Knoppen heten **Open deelkaart**, **Start oefening**, **Hervat opdracht** en **Bekijk resultaat**. Geen leerling hoeft ‘kamp’, ‘baken’ of ‘constructiehuis’ te vertalen om te weten wat een knop doet.

Het klikbare schermmodel toont deze hele indeling en één vaste voorbeeldopgave bij Helling uit twee punten. Andere stopplaatsen tonen hun eigen doel, maar bieden nog geen speelbare inhoud. Eerst beoordelen we de indeling en navigatie; daarna koppelen we één volledige cyclus aan de echte leerengine. De oude trainer en Kaartvallei-proef zijn hiermee niet automatisch hernoemd of gemigreerd.
