# Content schema and authoring gate

Datum: 25 september 2026. De schemafase beschrijft het volledige productiecontract; de pilot implementeert drie gecontroleerde contentfamilies. `games/rechten/trainer-v2/content/skills.json` bevat alle 27 stabiele IDs; `equation_from_context.active=false`. Er ontstaan geen nieuwe skill-ID’s door wereldnamen, proefvarianten of UI-stappen.

## Authoringvelden

| Veld | Type en betekenis | Pilotinvulling / gate |
|---|---|---|
| id | deterministische task-ID | world/variant/seed/mode/version, niet een score-id |
| skill_id | bestaand ID | sign/zeroRead, slope_from_two_points, ab |
| family_id | F1–F8 | F6/F2/F3 |
| world_id | stabiele wereldslug | grenspas/hellingrug/signaalstad |
| mode | discover/practice/evidence/fluency | practice default; hulp maakt attempt supported |
| profile | contentversie + structurele stage | predict/diagnose/transfer, geen leerlingtype |
| curriculum_claim | concrete claim | x-regio, rate uit punten, a/b-rol |
| primary_cognitive_action | één primaire actie | construeer interval / ratio / herstel koppeling |
| given_representations | maximaal twee gepind | grafiek; punten; twee uit tabel/formule/grafiek |
| target_representation | semantisch antwoord | interval+ongelijkheid; rationale rate; herstelde a/b |
| task_features | lijst structurele kenmerken | richting, breuk, constante, verschilprobe; geen grotere getallen als enige transfer |
| visible_case | exacte gegeven modeldata | model rationals en punten/tabel; renderer onthult geen solution |
| contrast_case | andere structurele beslissing | dalend/constant; punten→tabel; negatieve parameter |
| hidden_cases | intern exact model + input | nieuwe x; output pas na commit |
| primary_action | label en commit | Test grens/interval/rate/koppeling |
| response_component | compositie | AxisAnchor+Interval, Delta+Fraction, Probe+Fault |
| allowed_alternatives | geldige strategieën | AB/BA, equivalente rationale, x0/verschilprobe |
| commit_policy | reveal gate | immutable semantic snapshot; geen live correctness |
| feedback_model | oorzakelijke response | probes, eerste afwijking, correcte componenten behouden |
| misconception_hypotheses | toegestane codes | catalogus; syntax/UI nooit leerlingdiagnose |
| repair_policy | lokale mutable velden | root/side/openheid; één delta/rate; defecte a↔b-koppeling |
| hints | vijf niveaus | korte cue, focus, strategie, parallel completion, parallel worked example |
| worked_example_ref | familiebron | eigen parallel getallen; nooit antwoordknop invullen |
| difficulty_features | structureel | negatieve richting, fractionele rate, horizontaal all/none |
| units | expliciete dimensies | abstracte x/y-eenheden; signal test input-output, geen verzonnen eurocontext |
| language_load | laag + korte zin | nl-BE, komma en verticale breuk, uitleg op verzoek |
| accessibility | alternatieven en labels | keyboard/tap; 44px; no color-only; reduced motion |
| evidence_events | semantische events | prediction, commit, result, repair, hint, hidden-result |
| asset_slots | vectorplaceholderreferenties | neutrale graph/rail/signal; alt zonder antwoord |
| validator | exacte contractversie | RechtenV2Math adapter op ongewijzigde RechtenWave |

## Vastgelegd task-API voor de drie slices

`RechtenV2Math` is een pure UMD-module. Browser load: transfer-workbench-core.js → transfer-core.js → wave-core.js → trainer-v2/semantic-math-core.js. Node `require(wave-core.js)` installeert de transfers zelf. Geen import van v1-index/UI of productie-state. Alle leerlingwaarden zijn rationale strings (punt/komma, breuk), `all`/`none` alleen waar semantisch toegestaan. Invoer is begrensd op een genormaliseerde teller/noemer van maximaal 1.000.000 om excessieve tussenproducten te vermijden; grotere invoer is een invoerfout, geen leerlingdiagnose. Ongeldige syntax is `{ok:false,kind:'interaction_error',code:'input.syntax',message,keep:{},probes:[]}`.

`makeTask(world,{variant=0,seed=1,mode='practice'})` levert:

```text
{id, world, world_id, skill_id, family_id, mode, variant, seed,
 model:{kind:'affine',a:{n,d},b:{n,d}},
 bounds:{xMin,xMax,yMin,yMax}, features, hidden:{x:{n,d},y:{n,d}},
 hints, ...authoring metadata}
```

Grenspas voegt `ask:'positive'|'negative'` en `root:{n,d}|null` toe; constant 0 heeft alle nulwaarden, constant ≠0 geen. Hellingrug voegt `points:{A:{x,y},B:{x,y}}` en `legacy:{skill:'slope_from_two_points',params:{A,B,model}}` toe. Signaalstad voegt `faultModel` (verwisselde a/b) en correcte `rows:[{x,y}]` toe. Interne hidden/solutiondata mogen in deze statische pilot aanwezig zijn maar worden nooit in DOM, labels of accessible descriptions onthuld vóór de relevante commit; dit is geen anti-cheat-server.

| Functie | Input | Resultaat / invariant |
|---|---|---|
| checkRoot(task, value) | rationale string, all/none | Exact −b/a of constante classificatie; projection pas na commit |
| checkInterval(task, response) | boundary, side:left/right/all/none, closed:boolean, symbol:< /> /all/none, symbolBoundary defaults boundary | Strikte regio, symbolische kant en grens onafhankelijk; goede root/side behouden |
| checkDeltas(task, response) | direction:AB/BA, dx, dy | W.expected(t,w,'dx'/'dy'), consistent gekozen richting; correct veld in keep |
| checkSlope(task, response) | direction,dx,dy,numerator,denominator | Deltas plus W.check op a-stage; equivalente ratio goed; denominator 0 is interaction_error |
| signalProbe(task, kind, prediction) | kind:zero/difference, prediction:{expected:string} | Uitkomst model en faultModel pas in geretourneerde probes; verwachting vóór resultaat |
| checkSignal(task, response) | feature:'swapped',a,b | Eén atomische semantische repair; twee numerieke velden herstellen één defecte koppeling |
| checkHidden(task, value) | nieuwe exacte y als string | Onafhankelijke input-outputcheck; x10 bij signal; slope derde punt |

Alle checks zijn pure functies zonder score, storage, auth, planner of DOM. Resultaat bevat `ok,kind,code,message,keep,probes`; correctheid geeft geen automatische mastery. `keep` meldt alleen al correct gecommitte leerlingwerk. De UI bewaart pogingen/hints/commits apart en roept geen checker bij typen aan.

## Authoringlint en publicatiegrenzen

Automatisch: alle 27 IDs exact, geen contextreactivatie; alle verplichte metadatavelden zinvol; rationals genormaliseerd en veilig; taak oplosbaar; affine/constant/vertical/identical onderscheiden; equivalente breuken geaccepteerd; boundary all/none exact; elke variant deterministic; hidden x verschillend van zichtbare inputs; snapshot/JSON roundtrip; syntax geen diagnose; beide deltarichtingen; onafhankelijke rekenoracle via integer kruisproducten; geen mutation van task.

Browser: antwoord niet in kleur/label/aria vooraf; root niet vooraf gemarkeerd in evidence; max twee representaties; 44px targets; zichtbare focus; bediening zonder drag; geen gameplayscroll op 640×360; reduced-motion static causal feedback; geen verloren deelwerk of dubbele evidence; schema/UI gebruikt alleen veilige velden.

Handmatig/leerlingtoets: hint geeft geen actief antwoord; wereldgevolg blijft functioneel; transfer is structureel; geen systematisch blind tunen; context/asschaal helder; controleconditie met dezelfde inhoud en tijd. Deze checks zijn geen door automated tests bewezen pedagogische werkzaamheid. Bij meer dan één geldige respons moet validator die expliciet accepteren. Vrije equivalente formule-syntax, algemene haakjesparser, ongelijkheden herleiden, contextunits en volledige overige-skillbibliotheek blijven buiten de pilot.

## Getoetste Hellingrug-transfer

De eerste taak geeft twee punten bij een rooster; de tweede geeft dezelfde soort informatie als tabel met een negatieve fractionele rate. De pilot claimt een punten→tabel-overgang en een richtingscontrast. De renderer gebruikt gewone benoemde aswaarden; er is geen geïmplementeerde onafhankelijk gewijzigde asschaal. `scaleX/scaleY` en de onjuiste unequal-axis-scales claim zijn daarom uit de pilotmetadata verwijderd. Ongelijke asschalen blijven een toekomstige authoringvariant in de 27-skillmatrix.
