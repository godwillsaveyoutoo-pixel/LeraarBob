# Wereld en navigatie — De Lijnenwereld

Status: uitvoerbaar low-fidelity contract voor de geïsoleerde proef. Productieroute `/games/rechten/trainer/` blijft ongewijzigd. V2: `/games/rechten/trainer-v2/`; los mechanicsprototype: `/games/rechten/trainer-v2/prototype.html`.

## Het eerste scherm

De leerling ziet een rustige atlas met één dominante actie: **Hervat [missie]** als een missie openstaat, anders **Start je volgende ontdekking**. De atlas biedt drie speelbare locaties uit deze ronde. Puntbaai en Formulewerf zijn toekomstig ontwerp, geen misleidende actieve knoppen. Geen permanente XP, streak, detailkolom, legenda of instructieparagraaf. Een kleine proefvermelding maakt duidelijk dat dit een aparte versie is; technische opslagdetails staan in het menu.

Het merk is een terugbestemming buiten de missie. De bovenbalk toont alleen het merk, een benoemd profielicoon en de menuknop met drie streepjes. Dit volgt de expliciete gebruikerscorrectie in de conversatie; het éénknopvoorstel uit de masterprompt wordt hier zo ingevuld dat profiel en overige navigatie compact blijven. Het menu geeft toegang tot Wereld, Veldboek, Profiel en de bestaande trainer; account en voorkeuren staan in Profiel. Alleen echte actieve klasfunctionaliteit mag later **Samen** toevoegen. Er wordt in deze ronde geen lege sociale bestemming gebouwd. De expliciete gebruikerswens is leidend: minder tekst en rustige navigatie, niet dezelfde administratie in kleinere letters.

| Bestemming | Zichtbare inhoud | Hoofdactie | Bewaarcontract |
| --- | --- | --- | --- |
| Wereld | Huidige missie, drie landmarks, korte status | Start of hervat | Selecteren schrijft geen score en verandert geen actieve taak |
| Veldboek | Eigen proefconstructies en bewijszegels; zelfstandig/met steun onderscheiden | Hervat of terug naar wereld | Proefresultaten zijn geen productie-masteryscore |
| Menu/profiel | Accountstatus, toegankelijke voorkeuren, bestaande trainer | Sluiten/terug | Geen authkopie; accountwissel sluit oude actieve state |
| Missie | Pauze, compacte voortgang, hulp, één werkvlak, één antwoordzone | Test of Verder, afhankelijk van fase | Elke betekenisvolle handeling bewaart taak, seed, phase, deelwerk |
| Pauze | Hervatten, wereld, bestaande trainer | Hervatten | Geen nieuwe random taak, geen score-effect |
| Voltooid | Constructie en één blijvende wereldverandering | Verder naar wereld/volgende missie | Idempotente proefevidence, geen XP-bonus in productie |

## Routes en causale betekenis

| Route | Leerclaim en handeling | Betekenis van wereldreactie | Proefstatus |
| --- | --- | --- | --- |
| `?slice=grenspas` | `zeroRead` / `sign`: grens bepalen, x-gebied construeren, symbolisch vergelijken | Alleen het juiste x-gebied krijgt na test licht/patroon; grens blijft open bij strikt > of < | Lichtgrens vastgelegd, met hulpstatus |
| `?slice=hellingrug` | `slope_from_two_points`: richting, gerichte Δx/Δy, exact quotiënt | Gebouwde rail volgt de gecommitte verhouding; derde punt controleert extrapolatie | Brug/rail gecertificeerd, met hulpstatus |
| `?slice=signaalstad` | `ab`: twee views koppelen, informatierijke probe kiezen, verwisseling herstellen | Een foutieve signaalkoppeling wordt na de semantische parameterwissel consistent op hidden x | Signaalverbinding hersteld, met hulpstatus |

Een voltooiingssymbool zegt dat deze **proefmissie** is uitgevoerd. Het zegt niet dat alle skills van een wereld stevig beheerst zijn. Een bezoek ontstaat uitsluitend door werkelijk spelen; bestaande antwoorden worden niet omgezet in fictieve wereldbezoeken.

## Schermgrammatica

1. **Kijk/denk:** één korte opdracht, onopgeloste representatie, geen antwoordkleur. Geen verplichte uitlegpagina.
2. **Bouw:** semantische controls met duidelijke selectie, Undo en keyboard/tapalternatief. Syntaxis mag live feedback krijgen; wiskundige eindcorrectheid niet.
3. **Test:** commit legt de voorspelling vast. Causale reactie toont hetzelfde werkvlak en de eerste afwijking. Maximaal twee representaties tegelijk gepind.
4. **Herstel:** alleen relevante component wijzigen. Correcte waarden, punt, aftrekvolgorde en overige views blijven behouden.
5. **Contrast/hidden:** nieuwe structurele eigenschap, representatie of extrapolatie. Nieuwe getallen alleen zijn onvoldoende transfer.
6. **Resultaat:** geen automatische verdwijning van conceptfeedback; Verder is expliciet. Wereldreactie en veldboekzegel zijn permanent binnen de proefstate.

Hintniveau en methode mogen op verzoek verschijnen; hoofdscherm bevat geen stapels tips. De vijf niveaus zijn denkduwtje, focuscue, strategie, gedeeltelijk voorbeeld en volledig voorbeeld gevolgd door nieuw geval. Elk niveau verandert de actuele bewijsstatus naar ondersteund waar de hint conceptuele steun gaf.

## Mobile en input

Wereld/veldboek mogen portret en scroll gebruiken. Actieve gameplay draait vanaf 640 × 360 landscape zonder scroll; 780 × 360 is de Samsung A20-referentie. Bij onvoldoende ruimte toont een volledige oriëntatiestaat **Draai je toestel** met behoud van missie en bruikbare terugactie. De app schaalt het volledige scherm nooit uniform omlaag om tekst te laten passen. Decor verdwijnt vóór inhoud of touchzones krimpen.

Desktop en mobiel delen hetzelfde semantische antwoordmodel. Inputcontrols zijn minstens 44 CSS px, bij voorkeur 48; alle iconen hebben een Nederlandse toegankelijke naam. Focus en selectie zijn verschillende toestanden. Menu sluit met Escape en geeft focus terug. De lopende missie bevat geen globale profiel-/cloud-/DEV-navigatie.

## Stijlbasis en latere art

Warm papier, donkere inkt en een beperkt gedempt palet helpen hiërarchie. Gewone leesbare typografie draagt tekst/wiskunde; handschrift is hoogstens een later titelaccent. SVG maakt grafieken scherp en controleerbaar. Illustraties bevatten geen ingebakken tekst, mathematische antwoorden of interactiehitboxes. [ART_PLACEHOLDER_MANIFEST.md](ART_PLACEHOLDER_MANIFEST.md) houdt slots vervangbaar. Artproductie volgt pas nadat mechanic en controlevergelijking overtuigen.
