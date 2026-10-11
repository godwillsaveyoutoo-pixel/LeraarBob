# Centrale sessievensters en persoonlijke battle-PDF

Ontwikkelcontrole, 11 oktober 2026. Synthetische accounts en echte lokale PostgreSQL-functies; geen productieproef.

## Gedrag

- Samen & live gebruikt compacte appkaarten met rechtstreeks de ondersteunde werkvormen voor de accountrol. Klascode, uitnodigingen en ranglijsten openen de eigen OS-vensters. Live lessen houden hun afzonderlijke werkende deelname-ingang.
- Oude ranglijst- en klasstartlinks worden binnen het OS opgevangen, ook wanneer een native pagina rechtstreeks navigeert. Het oude overzicht met tabs Samen leren/Battles/Ranglijsten wordt niet meer in een OS-frame geopend.
- Alle zeven OS-klasbattleapps gebruiken dezelfde persoonlijke PDF-knop: Rechtenwereld, Vectormissie, Vergelijkingen, Wortelbouw, Getallenwereld, Logicawereld en Kleiduifschieten. Zowel de huidige Numbers-engine als historische Getallen-klasbattles zijn aangesloten.
- De PDF gebruikt uitsluitend eigen opgeslagen resultaten, inclusief vroegtijdig gestopte sessies, onbeantwoorde/niet-gespeelde/niet-nagekeken rondes. Battlepunten worden niet omgerekend naar toetscijfers. Bij Numbers blijft verdiende XP afzonderlijk zichtbaar.
- Kleiduif toont verwerkte schoten, juiste treffers, missers, laatste reeks en echte battle-XP. Die engine bewaart totalen, geen individuele schothistorie. Een leerling die via de groepsingang aan een klasbattle deelnam, behoudt nu de einduitslag en download.
- Ranglijsten bevat Mijn battleverslagen. De laatste 100 eigen afgesloten sessies per provider zijn opvraagbaar; een bekend verslag blijft ook daarna op ID toegankelijk. Herladen verliest de serverresultaten niet.
- Getallen-sessielinks met een sessie-ID openen rechtstreeks de sessie; een laatste ronde krijgt de titel Eindresultaat. Centrale codelinks vullen zes- én achttekencodes in.

## Uitgevoerde controles

- [Concrete previewcontrole](preview-smoke.json): leerling versus leraar, zeven leraarklasstarts, onderscheid duo op één/twee toestellen, achttekencode en alle drie rapportproviders op poort 8798.
- [Databaseproef](../../../tests/class-battle-report-db.test.cjs): alle providers, scores van uitsluitend de aanvrager, andere leerling/observerende leraar geweigerd, anonieme functieaanroep geweigerd, geen directe tabeltoegang, geen eindrapport tijdens een lopende battle.
- [Browserrapport](report.json): alle acht technische eindroutes openen de PDF, blijven beschikbaar na herladen, centrale OS-ranglijst en klascode, taakbalkvenster, oude ranglijstlink, herdownload, mislukte download met herstelmogelijkheid. 1366 × 768 en 390 × 844, 100% zoom, boven-/onderbalk open en ingeklapt.
- [Kleiduif](clay-play-report.json): daadwerkelijk solo, duo, groep en klas gespeeld. De leerling raakt zeven doelen en downloadt daarna de klasresultaten. De leraar blijft observator.
- [Logicawereld](logica-play-report.json): aliasuitnodiging, twee klaarstaande spelers, klascode, drie echte native waarheidstabelrondes en leerling-PDF. Vergelijkingen-mix en oorspronkelijke invoer blijven werken.
- [Werkvormregressie](workforms-report.json): bestaande Rechten- en Zeeslaguitnodigingen, Getallen-Samen-leren en achttekencodes, plus alle vijftien bestaande startcombinaties op desktop en telefoon. De test kiest bij de tweepuntenvariant eerst een punt; een nog geblokkeerde antwoordkeuze wordt niet geforceerd.
- [Vensterregressie](window-regression.json): echte oefenbladbewaring, mappen/ranglijsten in de taakbalk, minimaliseren/hervatten, sluiting en accountwissel. Gecontroleerd op 1366 × 768, 390 × 844 en 640 × 360 met beide balkstanden.
- Alle 16 PDF's (18 pagina's) met `pdfinfo` structureel gelezen. Representatieve resultaten en alle drie pagina's van het lange rapport met Poppler gerenderd en visueel nagekeken: correcte paginering, geen afgekapt antwoord/overlap, accenten en logische tekens leesbaar. De PDF gebruikt de bestaande browserlettertypen via de gedeelde lokale PDF-schrijver.

De eindrouteproef gebruikt vooraf ingevoegde, uitdrukkelijk synthetische eindresultaten. De afzonderlijke Kleiduif- en Logicawereldproeven spelen werkelijk de sessie door. Dit zijn verschillende soorten bewijs.

## Review en uitrol

De aanvullende migratie is `20261011145622_class_battle_personal_report.sql`. Ze voegt alleen een leescontract toe over de bestaande privéresultaten, zonder eigen scoreopslag. De functie gebruikt `auth.uid()`, controleert daadwerkelijk lidmaatschap en terminale status en heeft geen parameter om een andere leerling te kiezen. De publieke wrapper is security invoker; de private functie heeft een lege search_path en beperkte uitvoerrechten.

Nog niet uitgevoerd: deze migratie op productie, productieaanmelding met echte leerling-/leraarsaccounts en downloads tegen die omgeving. De Supabase security-advisor kon lokaal niet verbinden met poort 54322; hier draait PGlite, geen lokale Supabase/Docker-stack. De toegangscontroles zijn wel met de daadwerkelijke SQL in PGlite uitgevoerd. De eerdere branch/PR-CI op `7f42ac5` was groen; een nieuwe push krijgt een eigen controle en is niet automatisch door die eerdere uitslag gedekt.

De oudere previews blijven intact. De bijgewerkte preview gebruikt poort 8798, met een kopie van het bestaande samengestelde toetswerk. Bestaande tijdelijke battles op eerdere previewpoorten worden niet gewist of als gemigreerd voorgesteld.

## Controle voor publieke uitrol

De [aanvullende publicatiecontrole](../release-readiness-20261011/verification.json) herstelt verouderde CI-ingangen en gebruikt de op GitHub geïnstalleerde Chromium. De nieuwe OS-appkaarten en centrale code-ingang zijn doorgelopen met echte lokale Learn-, Getallen- en Rechten-battles en een live les. Oude zelfstandige hubroutes hebben een afzonderlijke compatibiliteitsproef; het OS opent ze niet opnieuw.

Hierbij is een hervatfout opgelost: na een verkeerde code handmatig corrigeren bleef de oude code in het adres staan. De succesvolle deelname verbruikt nu de code, zodat herladen de bestaande sessie en exacte invoer herstelt. De aanvullende lokale controles slagen (31 DOM/database-tests, 13 live-interactiegroepen, 32 zelfstandige compatibiliteitscontroles). De productie-inventaris is uitsluitend gelezen: zeven migraties en drie nieuwe Edge Functions ontbreken nog. Een nieuwe volledige GitHub-controle hoort bij de definitieve commit.

De volledige controle op `f14aed0` vond daarna nog een verloren wereld-/levelcontext bij de centrale leerling-/gastingang van Vergelijkingen. De centrale route neemt nu ook de oorspronkelijke map mee. Bovendien vervangt een daadwerkelijk geladen oude klaslink zijn venster voordat de nieuwe ingang met dezelfde sleutel wordt geopend; de afzonderlijke onafgemaakte oefening blijft behouden. De definitieve lokale hercontrole telt 143 DOM-tests, 13 Algebra-browsergroepen met 103 doelmetingen en 21 screenshots, plus alle acht technische battle-PDF-routes. De publicatie-PR richt zich nu op `main`; productie is nog niet gewijzigd.
