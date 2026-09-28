# Klasmodus: leerkracht start, leerlingen doen mee

Open [Klasmodus](../../games/vectoren/classroom.html) via het menu van Vectormissie. De lokale battle heeft ook een link naar de klasmodus.

1. Meld je als leerkracht aan via de centrale leraarBob-login. Het centrale aanmeldformulier opent in een venster binnen Klasmodus; je blijft op dezelfde pagina en gebruikt hetzelfde account als op de startpagina.
2. Kies Mixed of een wereld, 5/10 rondes en 30/60/90/120 seconden per ronde.
3. Maak een groepsbattle. Projecteer de wachtkamer met de grote sessiecode (zes letters/cijfers), of deel de deelnamelink.
4. Leerlingen gebruiken hun centrale leraarBob-account en voeren daarna de sessiecode in. Wie al aangemeld is, komt rechtstreeks bij de code-invoer. Een code uit de deelnamelink blijft bewaard tijdens het aanmelden.
5. De wachtkamer vult zich met de bestaande accountaliassen. De leerkracht beslist wanneer voldoende leerlingen aanwezig zijn en start zelf de eerste ronde.
6. Iedereen krijgt dezelfde opdracht. Elke leerling dient één antwoord in, of past.
7. Bij de deadline of zodra iedereen heeft ingediend, volgt het aantal juiste antwoorden en de ranglijst. Een juist antwoord levert 500 basispunten plus maximaal 500 snelheidspunten op. Fout, passen of niet indienen levert 0 punten op.
8. Alleen de leerkracht start de volgende ronde via de centrale knop. Na de laatste ronde volgt de eindranglijst.

Houd het leerkrachtvenster open: het kijkt ingediende antwoorden na met dezelfde validator als de trainer. Bij herladen hervatten leerkracht en leerlingen hun sessie. Een leerling die al heeft ingediend kan niet nogmaals antwoorden. Een tijdelijk mislukte verzending kan opnieuw worden verstuurd; de database telt uitsluitend de eerste ontvangen inzending. De rondetijd en punten worden berekend met ontvangsttijden op de server, niet met door leerlingen opgegeven tijden.

Nieuwe leerlingen kunnen ook aansluiten tijdens een lopende sessie. Ze komen meteen op de deelnemerslijst en spelen vanaf de volgende volledige ronde mee; ze blokkeren de huidige ronde niet en tellen niet mee in het aantal antwoorden voor die ronde. Tijdens de laatste ronde kunnen ze de eindranglijst nog bekijken. De sessiecode blijft tijdens het spelen kleiner zichtbaar. Bestaande deelnemers kunnen ook tijdens het spelen opnieuw verbinden. Maximaal 100 leerlingen per sessie; sessies verlopen na acht uur. De ranglijst hoort bij deze sessie en wijzigt geen persoonlijke oefen-XP. De sessie, deelnemers en inzendingen worden centraal opgeslagen; de hervatverwijzing in de browser is per account gescheiden.

Gebruik voor de klas een gedeelde HTTP(S)-website. Een `file://`-link verwijst naar bestanden op het eigen toestel en is niet bruikbaar als deelnamelink voor andere toestellen. De bestaande offline oefeningen en lokale battle blijven beschikbaar.

Op smartphones staan de code-invoer en deelnameknop boven de inklapbare speluitleg. Formulieren, wachtkamer en ranglijst passen ook op 320 px breed. De bovenbalk blijft inklapbaar en onthoudt de keuze bij herladen.

## Techniek

- `classroom.html`, `vector-classroom.js` en `styles/vector-classroom.css` leveren aanmelden, lobby, rondes en ranglijst.
- `battle-player.html?mode=class` hergebruikt de werkbordrenderer. Alleen in deze modus wordt een fout antwoord zonder herkansing ingediend en verschijnt de uitslag pas na de ronde.
- Private tabellen: `axioma_private.vector_class_rooms`, `vector_class_members`, `vector_class_answers`. RLS staat aan en rechtstreekse tabeltoegang voor anon/authenticated is ingetrokken.
- Publieke `SECURITY INVOKER`-RPC `axioma_vector_class` roept een private `SECURITY DEFINER`-functie aan. Deze controleert `auth.uid()`, de vertrouwde `axioma_is_teacher()`-rol en sessielidmaatschap. Alleen authenticated heeft uitvoerrechten. Dit is bewust een vertrouwde leerkracht als beoordelaar: een leerling kan geen beoordeling of score insturen.
- Lobby/vraag/resultaten worden elke 1,5 seconde opgehaald, met geserialiseerde verzoeken en automatisch opnieuw verbinden. Er is geen Realtime-publicatie nodig.
- Het leerkrachtvenster ontvangt alleen tijdens het nakijken de ruwe antwoorden. Leerlingen zien geen antwoorden van anderen, geen toekomstige vragen en geen juistheid vóór de uitslag.
- De SQL-migraties `*_vector_class_sessions.sql` en `*_vector_class_late_join.sql` zijn aangemaakt met Supabase CLI. De tweede voegt `eligible_from_round` toe aan het sessielidmaatschap. Bestaande deelnemers blijven vanaf ronde 0 speelgerechtigd; nieuwe deelnemers krijgen hun eerste ronde uitsluitend van de server.

## Controles

De SQL-tests gebruiken echte PostgreSQL via PGlite, met synthetische accounts. De browserproef opent onafhankelijke Chromium-contexten voor een leerkracht, twee leerlingen en een gast die via de centrale aanmeldcomponent een derde leerling wordt; hun RPC-verzoeken gaan naar dezelfde lokale SQL. Er worden geen echte leerlingaccounts gebruikt.

```sh
npm install --prefix /tmp/vector-class-tools --save-exact @electric-sql/pglite@0.5.8
VECTOR_PGLITE_MODULE=/tmp/vector-class-tools/node_modules/@electric-sql/pglite node tests/vector-class-database.cjs
VECTOR_PGLITE_MODULE=/tmp/vector-class-tools/node_modules/@electric-sql/pglite node tests/vector-class-browser.cjs
```

De browserproef gebruikt de bestaande lokale HTTP-server op 8775 en Chromium CDP op 9245 (aanpasbaar via `VECTOR_BASE_URL` en `VECTOR_BROWSER_PORT`). Getest: rollen, onbekende code, dubbel deelnemen, hervatten, tekenen, juist/fout indienen, eenmalige scoring, deadline, alle-antwoorden-binnen, handmatig starten van volgende ronde, ranglijst, stoppen en mobiele lobby. Ook getest: aanmelden zonder paginawissel met behoud van code, een fout wachtwoord opnieuw proberen, leerling- en leerkrachtaanmelding en de bestaande startpaginalogin, latere deelname, geen inzending vóór de eerste speelgerechtigde ronde, herladen na wijzigen van code en inklappen/uitklappen van de bovenbalk. Bestaande lokale battle wordt afzonderlijk getest, zowel HTTP als `file://`.

## Centrale koppeling

De migraties `vector_class_sessions` en `vector_class_late_join` zijn toegepast op het bestaande project LeraarBob. De centrale SQL-controle in `tests/vector-class-live-database.sql` slaagde met een leerkracht en drie synthetische leerlingaccounts (waarvan één later aansloot) binnen één teruggedraaide transactie. Er zijn geen testaccounts of testsessies blijven staan. De nieuwe webbestanden staan in de werkmap; publicatie van die bestanden is nog nodig om de klasmodus op de gedeelde website te openen.

De security-advisor meldt voor de drie private tabellen [RLS Enabled No Policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). Dat is hier opzettelijk: alle rechtstreekse toegang wordt geweigerd; uitsluitend de gecontroleerde private functie heeft toegang. Er kwamen geen nieuwe security-waarschuwingen bij. De eerdere waarschuwingen over bestaande publieke functies en wachtwoordinstellingen vallen buiten deze wijziging.
