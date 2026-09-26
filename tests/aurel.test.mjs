import assert from 'node:assert/strict';
import { readFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { loadChromium } from '../scripts/capture.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const folder = path.join(root, 'samples', 'aurel');
const project = process.env.MAHARAJAHUL_BROWSER_PROJECT;
const url = pathToFileURL(path.join(folder, 'index.html')).href;

test('Aurel ships local resources and three real rendered object previews', async () => {
  const html = await readFile(path.join(folder, 'index.html'), 'utf8');
  for (const [, target] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(?:#|https?:)/.test(target)) continue;
    assert.ok((await stat(path.resolve(folder, target))).isFile() || target.endsWith('/'), target);
  }
  for (const name of ['continuum', 'solstice', 'aperture']) {
    const bytes = await readFile(path.join(folder, 'assets', name + '.jpg'));
    assert.equal(bytes.readUInt16BE(0), 0xffd8);
    assert.ok(bytes.length > 20000 && bytes.length < 650000, name + ': unexpected preview size');
  }
  assert.equal(/<(?:script|link|img)\b[^>]+(?:src|href)="https?:/i.test(html), false);
});

async function pixels(page) {
  return page.locator('#sculpture').evaluate(canvas => {
    const copy = document.createElement('canvas'); copy.width = 96; copy.height = 72;
    const context = copy.getContext('2d'); context.drawImage(canvas, 0, 0, 96, 72);
    const data = context.getImageData(0, 0, 96, 72).data;
    let dark = 0, hash = 2166136261;
    const colors = new Set();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] + data[i + 1] + data[i + 2] < 420) dark++;
      colors.add(`${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`);
      hash = Math.imul(hash ^ (data[i] + data[i + 1] * 3 + data[i + 2] * 7), 16777619);
    }
    return { dark, colors: colors.size, hash };
  });
}
async function settled(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

test('Aurel renders, responds, exports and respects reduced motion across sizes', {
  skip: project ? false : 'Set MAHARAJAHUL_BROWSER_PROJECT to an existing Playwright installation',
  timeout: 90000,
}, async () => {
  const browser = await loadChromium(project).launch({ headless: true });
  const output = path.join(root, 'artifacts', 'aurel-test');
  await mkdir(output, { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce', acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (/^https?:/.test(request.url())) errors.push('External runtime request: ' + request.url()); });
    await page.goto(url);
    await page.waitForFunction(() => document.querySelector('#sculpture').dataset.ready === 'true');
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'), 'true');
    const first = await pixels(page);
    assert.ok(first.dark > 150 && first.colors > 15, 'Sculpture is empty or nearly uniform');
    await settled(page);
    assert.deepEqual(await pixels(page), first, 'Reduced motion must not animate the initial sculpture');

    await page.locator('button[data-material="1"]').click();
    await settled(page);
    const gold = await pixels(page);
    assert.notEqual(first.hash, gold.hash, 'Material control must change the actual image');
    assert.equal(await page.locator('button[data-material="1"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#sculpture').getAttribute('aria-pressed'), null);
    await page.locator('#light').fill('-65');
    await settled(page);
    assert.notEqual((await pixels(page)).hash, gold.hash, 'Light control must change the image');
    assert.equal(await page.locator('#light-value').textContent(), '-65°');

    const beforeKeyboard = await pixels(page);
    await page.locator('#sculpture').focus();
    await page.keyboard.press('ArrowRight');
    await settled(page);
    assert.notEqual((await pixels(page)).hash, beforeKeyboard.hash, 'Keyboard rotation must change the image');
    const beforeDrag = await pixels(page);
    const box = await page.locator('#sculpture').boundingBox();
    await page.mouse.move(box.x + box.width * 0.66, box.y + box.height * 0.4);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.76, box.y + box.height * 0.44, { steps: 6 });
    await page.mouse.up();
    await settled(page);
    assert.notEqual((await pixels(page)).hash, beforeDrag.hash, 'Pointer drag must change the image');

    const downloadEvent = page.waitForEvent('download');
    await page.locator('#save-frame').click();
    const download = await downloadEvent;
    assert.match(download.suggestedFilename(), /^aurel-continuum-champagne\.png$/);
    await download.saveAs(path.join(output, download.suggestedFilename()));
    const png = await readFile(path.join(output, download.suggestedFilename()));
    assert.equal(png.readUInt32BE(0), 0x89504e47);

    const formHashes = new Set();
    for (const [index, name] of ['Continuum', 'Solstice', 'Aperture'].entries()) {
      await page.locator(`[data-object="${index}"]`).click();
      await page.waitForFunction(index => document.querySelector('#sculpture').dataset.form === String(index), index);
      await settled(page);
      assert.equal(await page.locator('#object-name').textContent(), name);
      formHashes.add((await pixels(page)).hash);
    }
    assert.equal(formHashes.size, 3);
    await page.locator('[data-object="0"]').click();
    for (const width of [1440, 900, 390, 320]) {
      await page.setViewportSize({ width, height: 1050 });
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await settled(page);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'Overflow at ' + width);
      assert.equal(await page.locator('#sculpture').getAttribute('data-ready'), 'true');
      await page.screenshot({ path: path.join(output, `aurel-${width}.png`), fullPage: true });
      for (const selector of ['#collection', '#approach']) {
        await page.locator(selector).scrollIntoViewIfNeeded();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, selector + ' overflow');
      }
    }
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.locator('#motion').click();
    const time = await page.locator('#sculpture').getAttribute('data-time');
    await page.waitForFunction(time => document.querySelector('#sculpture').dataset.time !== time, time);
    await page.locator('#motion').click();
    await settled(page);
    const paused = await pixels(page);
    await settled(page);
    assert.deepEqual(await pixels(page), paused);
    await page.locator('#motion').click();
    await page.locator('#approach').scrollIntoViewIfNeeded();
    await settled(page);
    const awayTime = await page.locator('#sculpture').getAttribute('data-time');
    await settled(page);
    assert.equal(await page.locator('#sculpture').getAttribute('data-time'), awayTime, 'Offscreen graphics must stop');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.classList.contains('has-motion'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('#motion').getAttribute('aria-pressed') === 'true' && !document.documentElement.classList.contains('has-motion'));
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'), 'true');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('Aurel remains usable without WebGL and restores an interrupted graphics context', {
  skip: project ? false : 'Set MAHARAJAHUL_BROWSER_PROJECT to an existing Playwright installation',
  timeout: 30000,
}, async () => {
  const browser = await loadChromium(project).launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...options) { return type === 'webgl' ? null : original.call(this, type, ...options); };
    });
    await page.goto(url);
    assert.match(await page.locator('#render-status').textContent(), /WEBGL UNAVAILABLE/);
    assert.equal(await page.locator('#save-frame').isDisabled(), true);
    assert.equal(await page.locator('.scene-poster').evaluate(image => image.complete && image.naturalWidth > 0), true);
    await page.locator('[data-object="2"]').click();
    assert.equal(await page.locator('#object-name').textContent(), 'Aperture');
    assert.match(await page.locator('.scene-poster').getAttribute('src'), /aperture/);
    await page.close();

    const live = await browser.newPage({ reducedMotion: 'reduce' });
    await live.goto(url);
    await live.waitForFunction(() => document.querySelector('#sculpture').dataset.ready === 'true');
    const available = await live.evaluate(() => {
      const extension = document.querySelector('#sculpture').getContext('webgl').getExtension('WEBGL_lose_context');
      if (!extension) return false;
      window.restoreAurelContext = () => extension.restoreContext();
      extension.loseContext();
      return true;
    });
    assert.ok(available, 'Test browser needs the context-loss extension');
    await live.waitForFunction(() => document.querySelector('#sculpture').dataset.ready === 'false');
    await live.evaluate(() => window.restoreAurelContext());
    await live.waitForFunction(() => document.querySelector('#sculpture').dataset.ready === 'true');
    assert.equal(await live.locator('#save-frame').isDisabled(), false);
    assert.ok((await pixels(live)).dark > 100);
  } finally { await browser.close(); }
});
