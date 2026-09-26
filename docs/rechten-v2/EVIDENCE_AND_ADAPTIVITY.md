# Evidence en adaptiviteit — slicecontract

## Productiebehoud

`wave-core.js`, `journey-core.js` en de planner in v1 blijven ongewijzigd. V2 houdt geen eigen `strength`, masterypercentage of XP bij. Een afgeronde wereldtaak is een presentatiefeit. De labeltaal beschrijft wat gedaan is, niet dat een volledige skill beheerst is.

## Compact eventcontract

Een semantisch event bevat een stabiele task-ID, unieke attempt-ID, skill-ID, fase (`predict`, `execute`, `diagnose`, `transfer`), variant/representatie, inhoudelijke uitkomst, steun/hintniveau, revisie, foutcode, timestamp en modus. Geen pointersporen, audio, video of typsnelheid. Een dubbele `(taskId,attemptId)` telt nooit tweemaal. Een inhoudelijk herziene poging krijgt een nieuwe attempt-ID, maar een eindclaim wordt niet dubbel toegekend aan dezelfde taak.

- `supported=true` of hulpniveau > 0 betekent altijd `independent=false`.
- Een poging ná onthulde feedback op dezelfde taak wordt niet zelfstandig; overstappen naar bewijs vraagt een verse variant.
- Alleen correctheid met valide uitvoer telt als inhoudelijke evidence. Een mis-tik, ongeldige invoer of onduidelijk authored geval is `interaction_error`/`authoring_error`.
- Missievoltooiing is `completed`, geen `mastered`. V2-events zijn proefevidence; ze veranderen v1 niet.
- Transfer wordt apart geauthoriseerd: andere representatie, gewijzigde oriëntatie of hidden input. Een identieke procedure met andere cijfers wordt niet als verre transfer geclaimd.

## Bestaande planner via adapter

De scheduleradapter ontvangt een read-only legacy snapshot, kloont deze en roept `W.unlock` en `J.choice`/`J.recommend` op die clone aan. Wijzigingen door unlock blijven in de tijdelijke kopie. Hij vertaalt bestaande skills naar slice-presentaties:

| Legacy skill | Presentatie |
|---|---|
| `zeroRead`, `zero`, `sign`, `signchart` | Grenspas |
| `delta`, `slope`, `slope_from_two_points` | Hellingrug |
| `intercept`, `ab`, `equation_from_ab` | Signaalstad |

Due repair/refresh behoudt voorrang via de bestaande keuze. Als de aanbeveling een andere skill vraagt, vermeldt de adapter dat deze nog in v1 zit; hij verzint geen vrijgave of mastery. Zonder bruikbare legacy state geldt de prototypevolgorde als preview, geen adaptieve diagnose.

## Steun en bewijs

Ontdekken mag causale livefeedback gebruiken. Oefenen/Bewijzen vereisen commit vóór evaluatie. Hints bouwen op van één denkduwtje via focus en strategie naar parallel uitgewerkt voorbeeld. Na volledige hulp volgt een nieuwe contrasttaak. Tijd, animatie, XP of aantallen klikken zijn geen masteryfeatures. Timer staat in deze slices uit.

De toekomstige evidenceketen is voorspelling → uitvoering/diagnose → later zelfstandig contrast → hidden/andere representatie. Deze branch mag afzonderlijke ketenstappen registreren, maar niet suggereren dat één sessie duurzame beheersing bewijst.

## Onderbouwd versus hypothese

De bestaande code ondersteunt traceerbare zelfstandige signatures, variantdekking en gespreide repair/refresh. De voorgestelde keten en beperkte events ondersteunen een controleerbare beoordeling. Dat Grenspas/Hellingrug/Signaalstad meer transfer of motivatie geven dan de eenvoudige controle blijft een hypothese; browsertests bewijzen technische werking, geen leereffect. De onderzoeksaudit bevat de externe bronnen en hun bewijsgrenzen.

## Geïmplementeerde adapter

`RechtenV2Evidence.record(state,event)` retourneert `{state,event,duplicate}` en muteert de invoer niet. Hulp bij eerdere events van dezelfde task-ID blijft meetellen. Een correctie na een eerder fout antwoord in dezelfde fase kan niet zelfstandig worden, ook als de aanroeper de supportflag vergeet. Voor een nieuwe contrastvariant is een nieuwe task-ID vereist. Het resultaat bevat altijd `mastery:false`; het kan niet rechtstreeks als productie-score worden ingestuurd.

`RechtenV2Scheduler.recommend(snapshot)` gebruikt exact de bestaande `W.migrate`, `W.unlock`, `J.choice` en `J.recommend` op een tijdelijke clone. Ontbrekende skilldefaults worden alleen daar aangevuld. Als de bestaande planner een actief herstelitem in een ingepland serviceslot kiest, neemt de presentatieadapter dat item inclusief review-ID en scaffold over. Geen extra prioritiseringsregels worden in v2 geïntroduceerd.
