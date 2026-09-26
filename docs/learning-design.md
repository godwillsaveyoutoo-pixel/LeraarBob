# Visuele basis voor leraarBob

De referentiemockup combineert warm papier, blauwe inkt, een nauwkeurige grafiek,
grote antwoordkaarten en groene bevestiging. De eerste toepassing staat op de
startpagina en in de Rechtentrainer.

## Gedeelde basis

`shared/learning-theme.css` bevat de semantische kleuren, het lettertype,
oppervlakken, schaduwen en afrondingen. Importeer dit bestand vóór de lokale
componentstijlen. Koppel bestaande variabelen aan `--learning-*`, zoals in
`css/frontpage.css` en `games/rechten/trainer/notebook.css`. Zo kunnen andere
spellen stapsgewijs aansluiten zonder hun indeling of interacties te wijzigen.
De donkere variant volgt het bestaande `data-mode="dark"` op het html-element;
de startpagina gebruikt die al. De trainer krijgt hiermee geen nieuwe modusknop.

## Afspraken voor volgende schermen

- De kop toont het logo, profiel en menu. Navigatielabels staan in het menu.
- Toon alleen tekst die de volgende keuze helpt. Zet aanvullende toelichting
  achter een herkenbare uitklapknop; noodzakelijke opdrachten en foutmeldingen
  blijven direct zichtbaar.
- Eén prominente opdracht; grafiek en antwoordzone krijgen de meeste ruimte.
- Gewone tekst en wiskunde blijven scherp en leesbaar. Een eventueel handschrift
  is voor korte titels of illustratieve notities, niet voor alle tekst.
- Papier en verfstreken zijn decoratief. Wiskunde blijft berekend SVG/HTML;
  verander geen coördinaten of lijngeometrie om een handgetekend effect te krijgen.
- Blauw/rood duidt positief/negatief aan, groen bevestigt een juist antwoord.
  Vermeld betekenis ook in tekst of symbolen. Kleur is nooit het enige signaal.
- Eén relevante hint op verzoek of bij een fout. Toon uitleg, notitie en coach
  niet drie keer tegelijk. Voor toetsvragen blijft hulp afgestemd op de toetsmodus.
- Zet op de grafiek een gevuld punt voor een aanwezig nulpunt. Een open cirkel
  hoort bij een uitgesloten punt of bij de grens van een oplossingsinterval.
- Gebruik brede kaarten voor tekst en intervallen. Behoud compacte tokens waar
  leerlingen getallen kiezen, coördinaten bouwen of onderdelen verslepen.
- Reserveer ruimte voor feedback en de volgende stap; spring niet tijdens lezen.
- Controleer focus, contrast, aanraking, verminderde beweging en compacte schermen.

## Vervolg

Maak een gedeelde oefenlayout met vaste plaatsen voor opdracht, visualisatie,
antwoord, optionele hulp en feedback. Migreer vervolgens per vraagtype en spel.
De huidige trainer vereist bij oefeningen nog een liggend scherm; een echte
staande telefoonlayout vraagt een afzonderlijke aanpassing van de oefenindeling.
Een getekende mascotte, papiertextuur en handschrift zijn nog niet toegevoegd.
