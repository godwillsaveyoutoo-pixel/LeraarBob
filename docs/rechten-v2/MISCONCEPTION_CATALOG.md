# Misconception catalog — gebeurtenissen, geen leerlinglabels

Auditdatum: 25 september 2026. Een code beschrijft een observeerbare antwoordhypothese bij één taakfeature. V2 verandert v1-codes en opgeslagen tellers niet. Een fout, stilte, snelheid of onhandige tik bewijst geen misvatting. De v2 pilot schrijft geen nieuwe hypotheses in de productieplanner.

## Beslisregel

1. Valideer syntax, semantisch target en authoring eerst. `interaction_error` of `authoring_error` heeft geen inhoudelijke diagnose.
2. Vergelijk exacte grootheden en benoem de eerste causale afwijking; behoud ieder correct onderdeel.
3. Bewaar code, gegeven taakfeature, leerlingrespons, steun en mogelijke alternatieve verklaring bij de poging.
4. Bied één lokale repair. Nieuwe contrasttaak controleert de hypothese; één succesvolle zelfstandige check verzwakt de hypothese. Er is geen permanente classificatie van de leerling.
5. Plannerinvloed is pas een toekomstige adapter na UI-controle, repair, onafhankelijke hercheck en inhoudelijke review. Huidige productiegedrag blijft intact.

Feedback heeft hoogstens drie korte lagen: wat ingevoerd werd; welk wiskundig gevolg dit heeft; één volgende handeling. Syntax geeft bijvoorbeeld “Gebruik een getal of breuk met noemer ongelijk aan nul”, zonder rood leerlingoordeel.

## Aangetroffen bestaande codes en veilige mapping

Bronnen: `index.html` functies `deltaError`, `slopeError`, `interceptError`, `fxError`, `tableError`, `zeroReadError`, `zeroError`, renderers; `wave-core.js` check/constructionCheck/algebraCheck; `transfer-core.js` en `transfer-workbench-core.js` check. Dynamische stagecodes zijn foutlocaties, geen reeds gevalideerde cognitieve diagnoses.

| Bestaand | Betekenis in huidige validator | Voorzichtige v2-hypothese / beperking |
|---|---|---|
| `point.xySwap`, `wave.point.swapped` | Exact omgekeerd paar | `coord.swap_xy`; bij x=y niet diagnostisch |
| `point.xSign`, `point.ySign` | Eén teken omgekeerd | `coord.sign_x`, `coord.sign_y`; nul niet diagnostisch |
| `wave.point.x/y/both` | Eén of beide coördinaten fout | Bewaar `correctAxes`; schaal/teken/tik niet afleidbaar zonder vervolg |
| `point.other`, `wave.point.missing` | Overige / nog geen selectie | Onbekend of interaction_error, geen nieuwe misvatting |
| `delta.swap` | Andere component gegeven | `delta.swap_axes`, tenzij componenten gelijk zijn |
| `delta.sign` | Tegengestelde gerichte waarde | `delta.absolute_only` slechts na contrasterende negatieve case |
| `slope.inverse` | Δx/Δy gekozen | `slope.reciprocal`; ±1 is niet onderscheidend |
| `slope.sign` | Tegengestelde a | `slope.sign`; bron aftrekvolgorde eerst onderzoeken |
| `slope.deltaYOnly`, `slope.deltaXOnly` | Eén component als rate | `equation.delta_without_ratio` / rate-hypothese; geen bewijs bij Δx=1 |
| `wave.direction` | xs-point-identities verschillen van ys | `delta.orientation_mixed`; beide consistente richtingen zijn goed |
| `wave.ys/xs/a/dy/dx` | Onjuiste fase-invoer | Foutlocatie; specifieke oorzaak nog onbekend |
| `intercept.aInstead` | a als b gekozen | `param.slope_intercept_swap` alleen bij aanvullende a-respons |
| `intercept.sign`, `intercept.origin` | −b of 0 gekozen | `param.b_sign` / onbekend; b=0 sluit origin-hypothese uit |
| `ab.swapped` | Beide exacte waarden verwisseld | `param.slope_intercept_swap` mits a≠b |
| `ab.intercept/slope/both` | Eén of beide parameters fout | Juiste parameter behouden; geen a/b-label zonder bewijs |
| `fx.returnsX`, `table.usesX` | Input als uitvoer | `function.return_input` behalve fixed point |
| `fx.forgetB`, `table.forgetB` | ax zonder b | `function.omit_intercept` mits b≠0 |
| `fx.interceptOnly`, `table.interceptOnly` | Alleen b | Mogelijk product weggelaten, niet vaststellen bij x=0 |
| `fx.sign` | Negatie van uitvoer | Alleen tekenhypothese, eerst bewerkingsroute vragen |
| `zeroRead.yIsZero`, `zero.definition` | 0 ingevuld | `zero.output_zero` alleen wanneer root≠0 |
| `zeroRead.xySwap` | (0,r) i.p.v. (r,0) | `zero.point_vs_value` of asverwisseling; vervolg nodig |
| `zeroRead.usesB`, `zero.coefficient` | Coëfficiënt als nulwaarde | `param.intercept_x_for_y` / verkeerde grens; wanneer b=root ambigu |
| `zeroRead.sign`, `zero.sign`, `signchart.rootSign` | −root | `zero.sign` mits root≠0 |
| `sign.wrongSide` | Andere strikte zijde | `sign.side_reversed`; één antwoord toont geen always-right-patroon |
| `sign.zeroOnly` | Alleen x=root | `zero.output_zero`; onderscheid nulwaarde versus heel interval |
| `signchart.zero`, `signchart.direction` | Middenteken / zijtekens fout | `sign.side_reversed` of grensrol; behoud juist ingevulde slots |
| `wave.formula.incomplete/invalid` | Ontbrekend/ongeldig token | interaction_error, niet inhoudelijk |
| `wave.formula.slope/intercept` | Exacte coëfficiënt onjuist | `equation.a_b_swap` alleen als volledige dubbele verwisseling zichtbaar |
| `wave.graph.missing/identical` | Onvoldoende / identieke punten | `graph.one_point_only`, `graph.duplicate_point`; onvoltooide invoer niet scoren |
| `wave.graph.first/second` | Eerste/tweede punt niet onLine | Correct punt behouden; specifieke helling/asschaalhypothese nog onbewezen |
| `wave.algebra.operation/unfinished` | Ongeldige move / doelvorm niet bereikt | Syntax/routefout; onderscheid divide-zero en onvoltooide handeling |
| `wave.algebra.equivalence` | Oplossingsrelatie niet behouden | `algebra.solution_set_lost`, alleen oude/nieuwe semantiek vergelijken |
| `wave.subPoint/subOutput/pointValue/pointVerdict` | Substitutie, berekening of verdict | Eerste verkeerde stap; berekende output en verdict niet samen weggooien |
| `wave.constantSolutions/constantVerify/modelKind` | Constant/verticaal begrip | Specifiek contrast all/none of verticale lijn, geen algemene zwakte |
| `wave.b/ax/formulaA/formulaB/verifyA/verifyB` | Formulefase incorrect | Correcte prefix behouden; stage is geen causaal leerlinglabel |
| `wave.transfer.fractionAxes/Points/Order` | Assen, verschillende punten, volgorde | `delta.swap_axes` / degeneraat / `delta.orientation_mixed` |
| `wave.transfer.plotX/Y/Both` | Rij-puntcomponent mismatch | `table.row_column_swap` alleen bij exacte verwisseling; correctAxes bewaren |
| `wave.transfer.drawSame/drawLine` | Geen unieke/valide tabelrechte | `graph.duplicate_point` of ongespecificeerde lijnfout |
| `wave.transfer.graphA/graphB` | Parameter mismatch | Correcte parameter behouden, niet infereren dat tunen begrip is |
| `wave.transfer.pointX/pointY/tableB` | Gekozen cel past niet bij rol | `table.row_column_swap` / x=0-b-hypothese; native focusfout uitsluiten |
| `wave.transfer.grid/columns/value/coefficients` | Ontbrekende/ongeldige selectie | interaction_error zolang geen geldige mathematische keuze is gedaan |
| `wave.transfer.roleA/roleB/contextA/contextB/contextZero/contextTest/contextDomain` | Legacy contextfase fout | Historisch bewaren; geen heractivering of nieuwe claims |
| `wave.transfer.tableVerdict/verifyRest` | Legacy inconsistente tabel | Historisch bewaren; moderne generator levert consistente tabellen |
| `*.other`, `generic`, `timeout`, `journey.supported` | Restcategorie, tijd of hulp | Geen specifieke inhoudelijke diagnose; hulp apart als supported registreren |

## Nieuwe hypotheses: authoringdoelen, geen reeds ondersteunde detectoren

| Familie | Nieuwe codes / observatie | Contrast / ontkrachting | Lokale repair |
|---|---|---|---|
| Coördinaten | `coord.scale`, `coord.axis_point`, `coord.motor_miss` | Zelfde punt op schaal 2; keyboard herinvoer elimineert motorverklaring | Alleen verkeerde component, schaal leesbaar |
| Δ en helling | `delta.absolute_only`, `delta.swap_axes`, `slope.height_for_rate`, `slope.scale` | Negatieve component; gelijke rate op grotere driehoek; hoog-dalend lijnpaar | Richting, as of rate apart |
| Bijzondere lijnen | `slope.vertical_undefined`, `slope.same_point_degenerate` | Gelijke x met verschillende y versus twee identieke punten | Classificatie; geen deling door nul uitvoeren |
| Parameters | `param.intercept_x_for_y`, `param.intercept_height_general`, `param.a_sign`, `param.b_sign`, `param.one_parameter_affects_all` | x=0 en verschilprobes; lijnpaar waar maar één parameter verandert | Alleen defecte semantische koppeling |
| Functies/tabellen | `function.operation_order`, `function.inverse_by_guess`, `table.local_pattern_only`, `point.membership_no_substitution` | Ongelijke x-afstanden; hidden input; plan vóór run | Eerste foutieve operatie, kandidaatinput behouden |
| Grafiek | `graph.slope_reciprocal`, `graph.intercept_wrong_axis`, `graph.table_row_mismatch`, `graph.pixel_near_miss` | Exact semantisch punt, andere asschaal; pixelmisser is UI-ruis | Alleen verkeerde puntcomponent |
| Nul/teken | `sign.boundary_included`, `sign.always_right_positive`, `sign.graph_segment_for_x_interval`, `sign.horizontal_all_none` | Strikte grens; dalende lijn; dezelfde selectie als x-regio; constant 0/± | Grensopenheid, zijde of type apart |
| Formule | `equation.a_b_swap`, `equation.omit_b`, `equation.b_sign`, `equation.use_x_intercept_as_b`, `equation.delta_without_ratio`, `equation.local_table_pattern` | Hidden input, x=0, niet-eenheidsafstand, equivalent model | Behoud juiste coefficient en tussenwerk |
| Context, gepauzeerd | `equation.unit_mismatch`, `equation.context_fixed_cost_repeated` | Nieuwe unit/domein met dezelfde invariant | Unitcontract of vaste kost; geen productieclaims |
| Algebra, gedeeltelijk buiten parser | `algebra.answer_arrow_equal`, `algebra.one_side_only`, `algebra.illegal_cancel`, `algebra.distribute_sign`, `algebra.divide_zero_risk`, `algebra.solution_set_lost`, `algebra.flip_inequality_missing`, `algebra.syntax_only` | Onafhankelijke equivalentietest; expressies/ongelijkheden alleen na nieuwe parseraudit | Alleen ongeldige stap terug; equivalente schrijfwijze nooit fout |

## Concrete slice-regels

Grenspas: verkeerde root, zijde, openheid en symbolische grens krijgen afzonderlijke feedback; `always_right_positive` is nooit uit één rechterkeuze af te leiden. Hellingrug: beide consistente aftrekvolgorden zijn geldig, `−2/−3` en `2/3` zijn exact hetzelfde; juiste Δx of Δy blijft. Syntax/noemer 0 is geen misvatting. Signaalstad: verwisselde helling en y-afsnede is één defecte koppeling met twee verwisselde waarden. Een atomische repair herstelt `{a,b}` samen; “wijzig slechts één getal” zou deze taak onoplosbaar maken. Probe-uitkomst verschijnt na vastgelegde voorspelling. Een onafhankelijke hidden input x=10 toetst de herstelde relatie.
