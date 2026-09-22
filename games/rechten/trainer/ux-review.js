/* Editorial UX review, separate from learner state and mastery. */
(function(root){
const rows=[
  {
    "skill": "point",
    "priority": "P2",
    "note": "Coördinaten dichter bij het rooster kiezen; x en y afzonderlijk laten aanwijzen."
  },
  {
    "skill": "point_plot",
    "priority": "Aangepast",
    "note": "Rechtstreeks klikken, tikken of slepen; geen x/y-stapknoppen. Assenschaal en bevestiging blijven expliciet."
  },
  {
    "skill": "delta",
    "priority": "P2",
    "note": "De horizontale en verticale verplaatsing rechtstreeks laten markeren."
  },
  {
    "skill": "slope",
    "priority": "P2",
    "note": "Δy en Δx vanuit de stapdriehoek naar een grote breuk laten plaatsen."
  },
  {
    "skill": "slope_from_two_points",
    "priority": "Aangepast",
    "note": "Sobere sleepbreuk zonder vraagtekens of aslabels per getal. De volgende rekenstappen kunnen nog in hetzelfde werkblad worden samengebracht."
  },
  {
    "skill": "line_behavior",
    "priority": "Aangepast",
    "note": "Grafiek, hellingsgetal en punten hebben een passende schaal. Ronde keuzes; grafiek verschijnt bij de puntenvariant pas na het antwoord."
  },
  {
    "skill": "special_lines",
    "priority": "Aangepast",
    "note": "Grafiek, vaste coördinaat, x = c of y = b en functiebegrip blijven verbonden. Identieke punten tonen meerdere mogelijke rechten."
  },
  {
    "skill": "intercept",
    "priority": "P3",
    "note": "Het snijpunt met de y-as rechtstreeks laten aanwijzen."
  },
  {
    "skill": "ab",
    "priority": "P1",
    "note": "Afzonderlijke vaste invulplaatsen voor a en b; huidige gemengde antwoordkeuzes zijn moeilijk te overzien."
  },
  {
    "skill": "equation_from_ab",
    "priority": "P2",
    "note": "Tekens en negatieve coëfficiënten in de formuletokens verduidelijken."
  },
  {
    "skill": "intercept_from_point",
    "priority": "P1",
    "note": "x en y vanuit het punt naar de substitutie slepen; b in dezelfde grote vergelijking berekenen."
  },
  {
    "skill": "equation_from_point_slope",
    "priority": "P1",
    "note": "Eén zichtbaar rekenblad voor substitutie, b, formule en controle; minder losse schermstappen."
  },
  {
    "skill": "equation_from_two_points",
    "priority": "P1",
    "note": "Coördinatenplaatsing is aangepast; puntkeuze, b en beide controles nog in hetzelfde rekenblad samenbrengen."
  },
  {
    "skill": "graph_from_equation",
    "priority": "P2",
    "note": "Actief punt en bevestiging verduidelijken; fout bij één punt lokaal markeren."
  },
  {
    "skill": "fx",
    "priority": "P1",
    "note": "x rechtstreeks in de formule plaatsen; berekening verbinden met het punt op de grafiek."
  },
  {
    "skill": "rewrite_linear_equation",
    "priority": "P1",
    "note": "Vorige regel en bewerking zijn nu zichtbaar. Bewerkingen nog directer naast beide leden aanbieden; de losse invoerstappen blijven omslachtig."
  },
  {
    "skill": "input_from_output",
    "priority": "P1",
    "note": "Gegeven uitvoer in de formule plaatsen en onbekende x zichtbaar houden tijdens herleiding."
  },
  {
    "skill": "point_on_line",
    "priority": "P2",
    "note": "Substitutie en vergelijking met de gegeven y in één controlekaart tonen."
  },
  {
    "skill": "table",
    "priority": "P2",
    "note": "Ontbrekende tabelcel als invoervak gebruiken in plaats van losse antwoordbollen."
  },
  {
    "skill": "graph_from_table",
    "priority": "P2",
    "note": "Gekozen tabelkolom met het actieve roosterpunt verbinden en derde-puntcontrole duidelijker maken."
  },
  {
    "skill": "equation_from_graph",
    "priority": "P1",
    "note": "Coördinatenplaatsing is aangepast; gekozen grafiekpunten en latere berekening samen zichtbaar houden."
  },
  {
    "skill": "equation_from_table",
    "priority": "P1",
    "note": "Coördinatenplaatsing is aangepast; kolommen, formule en controle van de derde kolom verbinden."
  },
  {
    "skill": "equation_from_context",
    "priority": "P1",
    "note": "Gegevens en eenheden uit de tekst naar de formule plaatsen; context zichtbaar houden tijdens rekenen."
  },
  {
    "skill": "zeroRead",
    "priority": "P3",
    "note": "Nulpunt rechtstreeks selecteren; verschil met nulwaarde expliciet tonen."
  },
  {
    "skill": "zero",
    "priority": "P1",
    "note": "Berekening 0 = ax + b als invulbare vergelijking opbouwen in plaats van alleen resultaatkeuze."
  },
  {
    "skill": "sign",
    "priority": "P2",
    "note": "Het gevraagde x-gebied rechtstreeks op de as kiezen."
  },
  {
    "skill": "signchart",
    "priority": "P1",
    "note": "Tekens naar specifieke schemavakken plaatsen en afzonderlijk kunnen verbeteren; volgorde van klikken nu te impliciet."
  }
];
if(typeof module==='object')module.exports=rows;else root.RechtenUXReview=rows;
})(globalThis);
