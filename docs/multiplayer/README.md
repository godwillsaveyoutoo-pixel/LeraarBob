# Duo en groepsbattle

Vectormissie en Rechtenwereld gebruiken de gedeelde duo-coördinator in `shared/multiplayer/duo.js`. Wortelbouw behoudt zijn gelijktijdige bouwarena; die past nu ook twee werkborden boven elkaar op een portretscherm. Alle drie gebruiken `shared/multiplayer/classroom.js` voor groepssessies.

Elke spelmap bevat `battle-config.js`: eigen onderdelen, taakgeneratie en beoordeling via de bestaande wiskundemotor. Rechtenwereld controleert iedere stap; Wortelbouw speelt de ingediende bouwacties opnieuw af. Werkborden laden geen leerlingaccount of voortgangsopslag. Gewone oefenvoortgang verandert niet door een battle. Vectormissie behoudt bestaande sessies en lokale duo-ranglijsten.

De leerkracht kiest wereld, onderdeel, rondes en tijd. Leerlingen melden zich aan met het centrale leraarBob-account en voeren de code in. Late deelnemers spelen vanaf de volgende volledige ronde. Eén inzending per ronde, servergemeten tijd en punten; de leerkracht start elke volgende ronde. Het leerkrachtvenster moet open blijven voor het nakijken.

De database bewaart kamers per spel. De migratie `vector_class_multigame` voegt het spelkenmerk toe en behoudt de bestaande vector-RPC. `axioma_game_class` bedient de extra spellen. Beide gebruiken dezelfde gecontroleerde private functie. De private tabellen staan bewust achter deny-all RLS zonder directe tabelrechten; toegang loopt alleen via de functie die rollen en lidmaatschap controleert. De [RLS-melding zonder policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) is voor deze private tabellen dus verwacht. Bestaande projectmeldingen buiten de groepssessies zijn niet gewijzigd.

## Genereren en controleren

```sh
node scripts/build-vector-trainer.cjs
node scripts/build-multiplayer-pages.cjs
node --test tests/multiplayer-core.test.cjs
node tests/multiplayer-database.cjs
node tests/multiplayer-browser.cjs
node tests/multiplayer-duo-browser.cjs
```

Database- en groepsbrowsertests gebruiken `@electric-sql/pglite`, eventueel via `VECTOR_PGLITE_MODULE`. Browsertests gebruiken Chromium CDP op 9245 en een lokale server op 8775, instelbaar via `VECTOR_BROWSER_PORT` en `VECTOR_BASE_URL`. Tests isoleren browseraccounts en blokkeren externe verzoeken.

Gecontroleerd: vijf schermformaten, beide menustanden, alle aangeboden Rechtenonderdelen, docent- en leerlingrollen, code, beoordeling, ranglijst, volgende ronde, bestaande vector-login/herstel/late deelname, native Wortelbouw-voortgang en Rechten-runtime. De nieuwe RPC is ook op de online database met teruggedraaide testtransacties geverifieerd; er blijven geen testaccounts of antwoorden achter.
