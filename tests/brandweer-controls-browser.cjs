/* Real formula input and rescue interactions in the OS, with isolated local accounts. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { start } = require('../scripts/serve-rechten-entry-preview.cjs');
const out = process.env.BRANDWEER_SCREENSHOTS || '/tmp/leraarbob-brandweer-controls';
const report = { scope: 'Chromium, 100% zoom; local accounts and original solo engine.', checks: [], layouts: [], errors: [], missing: [] };
let browser, preview;

(async () => {
  try {
    fs.mkdirSync(out, { recursive: true });
    preview = process.env.BRANDWEER_URL ? { base: process.env.BRANDWEER_URL, close: async () => {} } : await start({ port: 0 });
    browser = await chromium.launch({ headless: true, executablePath: process.env.LB_CHROMIUM || (fs.existsSync('/opt/brave.com/brave/brave') ? '/opt/brave.com/brave/brave' : undefined), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await context.route('**/*', r => new URL(r.request().url()).origin === preview.base ? r.continue() : r.abort());
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('response', r => { if (r.status() === 404) report.missing.push(r.url()); });
    const check = s => { report.checks.push(s); console.log('PASS ' + s); };
    await page.goto(preview.base + '/os/?previewUser=alex');
    await page.locator('#startButton').click();
    await page.locator('#startSearch').fill('Brandweer');
    await page.locator('#startResults .start-result').filter({ hasText: 'Brandweer' }).click();
    const node = await page.locator('.frame-wrapper:not([hidden])>iframe').elementHandle();
    const frame = await node.contentFrame();
    await frame.waitForFunction(() => !!window.Axioma);
    const snapshot = () => frame.evaluate(() => Axioma.snapshot());
    const setting = param => frame.locator(`.value[data-param="${param}"]`);
    const arrow = (param, step) => frame.locator(`.paramArrow[data-param="${param}"][data-step="${step}"]`);
    const equation = () => frame.locator('.rescueEquation').getAttribute('aria-label');
    async function choose(param, wanted) {
      for (let i = 0; i < 25; i++) {
        const value = (await snapshot()).plan[param];
        if (value === wanted) return;
        await arrow(param, value == null ? (wanted < 0 ? -1 : 1) : wanted > value ? 1 : -1).click();
      }
      throw Error('Cannot choose ' + param + ' = ' + wanted);
    }
    async function level(number) {
      await frame.locator('#teacherBtn').click();
      await frame.locator('#levelSelect').selectOption(String(number - 1));
      await frame.locator('#settingsApply').click();
      assert.equal((await snapshot()).level, number);
    }
    // Inspect the actual SVG outlines: window frames must stay on the facade,
    // including the tallest rescue and the small landscape layout.
    for (const size of [{ width: 1366, height: 768 }, { width: 640, height: 360 }]) {
      await page.setViewportSize(size);
      for (let number = 1; number <= 8; number++) {
        await level(number);
        const building = await frame.evaluate(() => {
          const box = el => { const r = el.getBBox(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
          return { facade: box(document.querySelector('.buildingFacade')), windows: [...document.querySelectorAll('.buildingWindow')].map(box), targets: document.querySelectorAll('.targetWindow').length };
        });
        assert.equal(building.targets, 1, 'Every street keeps its target window');
        assert(building.windows.length > 0);
        for (const w of building.windows) {
          const f = building.facade, tolerance = 3; // Hand-drawn outline jitter.
          assert(w.x >= f.x - tolerance && w.y >= f.y - tolerance && w.x + w.width <= f.x + f.width + tolerance && w.y + w.height <= f.y + f.height + tolerance, JSON.stringify({ number, size, w, f }));
        }
      }
    }
    await page.setViewportSize({ width: 1366, height: 768 }); await level(1);
    check('All eight street buildings at 1366/640px keep every window on the facade and exactly one target window');
    assert.equal(await equation(), 'y = ax + b');
    assert.equal(await frame.locator('.rescueEquation button').count(), 0);
    assert.equal(await frame.locator('leraarbob-topbar').count(), 0);
    await choose('a', 1); await choose('b', 0);
    await setting('a').focus(); await page.keyboard.press('ArrowRight');
    assert.equal((await snapshot()).plan.a, 2);
    assert.equal(await frame.locator(':focus').getAttribute('data-param'), 'a');
    await page.keyboard.press('ArrowLeft');
    await arrow('b', 1).focus(); await page.keyboard.press('Space');
    assert.equal((await snapshot()).plan.b, 1);
    await arrow('b', -1).focus(); await page.keyboard.press('Enter');
    assert.equal((await snapshot()).plan.b, 0);
    assert.equal(await frame.locator(':focus').getAttribute('role'), 'spinbutton');
    await page.screenshot({ path: path.join(out, 'os-brandweer.png') });
    check('Equation has no buttons; keyboard arrows, Enter and Space change the native plan, including focus fallback at a bound');

    await level(5); await choose('a', .5); await choose('b', 0);
    assert.equal(await equation(), 'y = 0,5x + 0');
    assert.equal(await frame.locator('.rescueEquation .frac').textContent(), '12');
    assert.equal(await setting('a').locator('.frac').textContent(), '12');
    for (const [param, values] of [['a', [0, .5, 1, 1.5, 2, 3]], ['b', Array.from({ length: 11 }, (_, i) => i)]]) {
      await choose(param, values[0]);
      for (const [i, value] of values.entries()) {
        assert.equal((await snapshot()).plan[param], value);
        assert.equal(await arrow(param, -1).isDisabled(), i === 0);
        assert.equal(await arrow(param, 1).isDisabled(), i === values.length - 1);
        if (i < values.length - 1) await arrow(param, 1).click();
      }
    }
    await level(13); await choose('a', -.5); await choose('b', -6);
    assert.equal(await equation(), 'y = -0,5x − 6');
    assert.equal(await setting('b').textContent(), '−6');
    assert.equal(await frame.locator('.rescueEquation .frac').textContent(), '12');
    for (const [param, values] of [['a', [-2, -1.5, -1, -.5, 0]], ['b', Array.from({ length: 11 }, (_, i) => i - 10)]]) {
      await choose(param, values[0]);
      for (const [i, value] of values.entries()) {
        assert.equal((await snapshot()).plan[param], value);
        assert.equal(await arrow(param, -1).isDisabled(), i === 0);
        assert.equal(await arrow(param, 1).isDisabled(), i === values.length - 1);
        if (i < values.length - 1) await arrow(param, 1).click();
      }
    }
    await level(14); await choose('a', -.5); await choose('b', -6);
    assert.equal(await frame.locator('.rescueEquation .frac').count(), 0);
    assert.equal(await equation(), 'y = -0,5x − 6');
    await setting('b').hover(); await page.mouse.wheel(0, -100);
    await frame.waitForFunction(() => Axioma.snapshot().plan.b === -5);
    const valueRect = await setting('b').boundingBox();
    await page.mouse.move(valueRect.x + valueRect.width / 2, valueRect.y + valueRect.height / 2);
    await page.mouse.down(); await page.mouse.move(valueRect.x + valueRect.width / 2, valueRect.y + valueRect.height / 2 + 26, { steps: 3 }); await page.mouse.up();
    assert.equal((await snapshot()).plan.b, -6);
    assert.equal((await snapshot()).attempts, 0);
    check('Positive/negative bounds, fractions and decimal levels, signed b, wheel and drag preserve the original value steps without executing a rescue');

    const plan = (await snapshot()).plan;
    await page.locator('#minimizeApp').click();
    await page.getByRole('button', { name: 'Terug naar Brandweer', exact: true }).click();
    assert(await node.evaluate(e => e.isConnected));
    assert.deepEqual((await snapshot()).plan, plan);
    check('Minimize/resume keeps the same native frame, rescue and chosen coefficients');

    async function layout(name) {
      await frame.evaluate(async () => { await document.fonts.ready; for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame); });
      const m = await frame.evaluate(() => {
        const rect = s => document.querySelector(s).getBoundingClientRect().toJSON();
        const targets = [...document.querySelectorAll('.paramArrow,.value,#executeBtn')].map(el => {
          const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return { ...r.toJSON(), hit: hit === el || el.contains(hit), label: el.getAttribute('aria-label') || el.textContent };
        });
        return { w: innerWidth, h: innerHeight, scroll: document.documentElement.scrollWidth, targets, equation: rect('.rescueEquation'), controls: rect('.rescueAdjustments'), stage: rect('#stage'), dock: rect('.controlBoard') };
      });
      assert(m.scroll <= m.w, name + ': no horizontal overflow');
      assert(m.stage.bottom <= m.dock.top + 1, name + ': footer outside playfield');
      assert(m.dock.bottom <= m.h + 1, name + ': footer inside game');
      assert(m.equation.right <= m.controls.left + 1 || m.equation.bottom <= m.controls.top + 1, name + ': equation separate from controls');
      for (const t of m.targets) assert(t.width >= 44 && t.height >= 44 && t.left >= 0 && t.right <= m.w + 1 && t.top >= 0 && t.bottom <= m.h + 1 && t.hit && t.label, JSON.stringify({ name, t, m }));
      report.layouts.push({ name, ...m });
      await page.screenshot({ path: path.join(out, name + '.png') });
    }
    for (const size of [{ width: 1366, height: 768 }, { width: 844, height: 390 }, { width: 640, height: 360 }, { width: 568, height: 320 }]) {
      await page.setViewportSize(size); await layout('os-' + size.width + '-expanded');
      await page.locator('leraarbob-topbar .collapse').click(); await layout('os-' + size.width + '-collapsed');
      const restore = page.locator('.lb-restore:not([hidden])');
      assert.equal(await restore.getAttribute('aria-expanded'), 'false');
      const r = await restore.boundingBox(); assert(r.width >= 44 && r.height >= 44);
      await page.locator('#focusWorkspace').click(); await layout('os-' + size.width + '-focus');
      assert(!await page.locator('#desktopHeader').isVisible()); assert(!await page.locator('#taskbar').isVisible());
      assert(await page.locator('#closeApp').isVisible());
      await page.locator('#focusRestore').click(); await restore.click();
      assert.deepEqual((await snapshot()).plan, plan);
    }
    check('1366/844/640/568px at 100%: equation separate, controls visible and >=44px; collapse/focus/restore preserve input');

    await page.setViewportSize({ width: 1366, height: 768 });
    await frame.locator('#executeBtn').click(); await frame.waitForFunction(() => Axioma.snapshot().state === 'debrief');
    assert.deepEqual((await snapshot()).lastCommand, { a: -.5, b: -6, y: -9, ok: true });
    await page.screenshot({ path: path.join(out, 'os-rescue-complete.png') });
    await frame.locator('#explainBtn').click(); await frame.locator('#nextBtn').click();
    assert.equal((await snapshot()).level, 15);
    assert((await snapshot()).results[13]);
    check('Native execution rescues the target with a negative decimal slope and intercept; explanation/next retain progress');

    // The standalone teacher check has its own account/cache; the preview's
    // progress stub is stateless and cannot model concurrent student saves.
    const soloContext = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await soloContext.route('**/*', r => new URL(r.request().url()).origin === preview.base ? r.continue() : r.abort());
    const solo = await soloContext.newPage();
    await solo.goto(preview.base + '/games/rechten/brandweer/?previewUser=teacher');
    await solo.waitForFunction(() => !!window.Axioma);
    await solo.locator('[data-param=a][data-step="1"]').click();
    const standalonePlan = await solo.evaluate(() => Axioma.snapshot().plan);
    await solo.getByRole('button', { name: 'Bovenbalk inklappen', exact: true }).click();
    assert.deepEqual(await solo.evaluate(() => Axioma.snapshot().plan), standalonePlan);
    await solo.reload();
    await solo.waitForFunction(() => !!window.Axioma);
    await solo.getByRole('button', { name: 'Bovenbalk uitklappen', exact: true }).click();
    check('Standalone formula works; collapse keeps input and the collapse preference survives reload');
    await soloContext.close();
    assert.deepEqual(report.errors, []); assert.deepEqual(report.missing, []);
    report.passed = true;
  } finally {
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    await browser?.close(); await preview?.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
