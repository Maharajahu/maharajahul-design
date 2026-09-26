import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { loadChromium } from '../scripts/capture.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const project = process.env.MAHARAJAHUL_BROWSER_PROJECT;
test('five offline studies render responsively and their controls work', {
  skip: project ? false : 'Set MAHARAJAHUL_BROWSER_PROJECT to an existing Playwright installation',
  timeout: 60000,
}, async () => {
  const browser = await loadChromium(project).launch({ headless: true });
  const output = path.join(root, 'artifacts', 'samples');
  await mkdir(output, { recursive: true });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', (request) => { if (/^https?:/.test(request.url())) errors.push('Unexpected network request: ' + request.url()); });
    await page.goto(pathToFileURL(path.join(root, 'samples', 'index.html')).href);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1050 : 844 });
      for (const name of ['edition', 'pulse', 'form', 'cutroom', 'drift']) {
        await page.locator(`.gallery-nav a[href="#${name}"]`).click();
        await page.locator(`#${name}`).waitFor({ state: 'visible' });
        assert.equal(await page.locator('.study:visible').count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${name} overflows at ${width}`);
        await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true, animations: 'disabled' });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.locator('.gallery-nav a[href="#edition"]').click();
    await page.locator('#read-essay').click();
    assert.equal(await page.locator('dialog').evaluate((dialog) => dialog.open), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').evaluate((dialog) => dialog.open), false);
    assert.equal(await page.locator('#read-essay').evaluate((button) => document.activeElement === button), true);

    await page.locator('.gallery-nav a[href="#pulse"]').click();
    const total = await page.locator('#energy-total').textContent();
    await page.locator('[data-period="yesterday"]').click();
    assert.notEqual(await page.locator('#energy-total').textContent(), total);
    assert.equal(await page.locator('[data-period="yesterday"]').getAttribute('aria-pressed'), 'true');
    await page.locator('#charging').click();
    assert.match(await page.locator('#charging-note').textContent(), /6.8 kWh/);
    await page.locator('#charging').click();
    assert.match(await page.locator('#charging-note').textContent(), /Not scheduled/);

    await page.locator('.gallery-nav a[href="#form"]').click();
    await page.locator('input[value="Graphite"]').check();
    assert.equal(await page.locator('#finish-label').textContent(), 'Graphite');
    assert.equal(await page.locator('.lamp-finish').first().evaluate((shape) => getComputedStyle(shape).fill), 'rgb(69, 74, 68)');
    await page.locator('#brightness').fill('25');
    assert.equal(await page.locator('#light-output').textContent(), '25%');
    await page.locator('#review-lamp').click();
    assert.match(await page.locator('#dialog-body').textContent(), /Graphite/);
    assert.match(await page.locator('#dialog-body').textContent(), /25%/);
    await page.locator('#close-dialog').click();

    await page.locator('.gallery-nav a[href="#cutroom"]').click();
    await page.locator('[data-clip="2"]').click();
    assert.equal(await page.locator('#scene-name').textContent(), 'Blue hour.');
    assert.equal(await page.locator('#playhead').inputValue(), '8');
    await page.locator('#play-cut').click();
    await page.waitForFunction(() => Number(document.querySelector('#playhead').value) > 8.15);
    await page.locator('#play-cut').click();
    const pausedTime = await page.locator('#playhead').inputValue();
    await page.waitForTimeout(150);
    assert.equal(await page.locator('#playhead').inputValue(), pausedTime);
    await page.locator('#rewind').click();
    assert.equal(await page.locator('#playhead').inputValue(), '0');
    await page.locator('#playhead').fill('16');
    await page.locator('#play-cut').click();
    await page.waitForFunction(() => Number(document.querySelector('#playhead').value) > 0.1);
    assert.ok(Number(await page.locator('#playhead').inputValue()) < 1);

    await page.locator('.gallery-nav a[href="#drift"]').click();
    assert.equal(await page.locator('#pause-field').textContent(), 'Resume field');
    const still = await page.locator('#terrain').evaluate((canvas) => canvas.toDataURL());
    await page.waitForTimeout(120);
    assert.equal(await page.locator('#terrain').evaluate((canvas) => canvas.toDataURL()), still);
    await page.locator('#field-color').click();
    assert.notEqual(await page.locator('#terrain').evaluate((canvas) => canvas.toDataURL()), still);
    await page.locator('#relief').fill('80');
    assert.equal(await page.locator('#relief-output').textContent(), '80%');
    await page.locator('#pause-field').click();
    const start = await page.locator('#terrain').evaluate((canvas) => canvas.toDataURL());
    await page.waitForTimeout(180);
    assert.notEqual(await page.locator('#terrain').evaluate((canvas) => canvas.toDataURL()), start);
    await page.locator('#pause-field').click();
    assert.deepEqual(errors, []);
    console.log('Verified 10 viewport renders, offline loading, dialogs, filters, lamp configuration, playback, pause and reduced motion.');
  } finally {
    await browser.close();
  }
});
