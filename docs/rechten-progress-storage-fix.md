# Rechtentrainer cloud storage correction — 2026-09-27

Production `axioma_save_progress` still accepted only state version 700, while the published trainer emits 704. The existing Wave 4 deployment script had not reached production. Saves from versions 701–704 were rejected with SQLSTATE 22023; the client retains dirty account-scoped browser caches after failure.

Applied the existing `supabase_rechten_wave4.sql` validator as migration `20260927191459_rechten_progress_versions.sql`. It preserves account checks, counter/skill validation, revisions, and prevents older clients overwriting newer state. No existing learner rows were edited or imported.

Validation: `node scripts/build-rechten-db-test.cjs --wave4` passed in temporary fixture tables with BEGIN/ROLLBACK. Repeated the test using a clone of the deployed function definition: versions 700–704, XP retention, required skills, revision conflicts, downgrade rejection and account isolation passed. Anonymous execution is denied; authenticated execution remains allowed. Security advisor findings are unchanged.

Recovery: on the original device, browser profile and website origin, reopen the old trainer with the same pupil account. An intact dirty account cache is retried automatically; Account & voortgang also provides Nu synchroniseren. Guest progress is not automatically assigned to an account. This correction cannot reconstruct browser data that was removed, and does not turn earlier XP into completed Rechtenwereld levels.
