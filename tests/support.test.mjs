import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { loadChromium } from '../scripts/capture.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const pages = ['index.html', 'samples/index.html', 'samples/future/index.html', 'samples/aurel/index.html'];
const urls = ['https://x.com/ToolBraidComp', 'https://buymeacoffee.com/dumitrescup'];
const project = process.env.MAHARAJAHUL_BROWSER_PROJECT;

test('every published design surface includes the same explicit support links', async () => {
  for (const file of pages) {
    const html = await readFile(path.join(root, file), 'utf8');
    const section = html.match(/<aside class="creator-support[\s\S]*?<\/aside>/)?.[0];
    assert.ok(section, file);
    assert.match(section, /Support is always optional/);
    for (const url of urls) assert.equal(section.split(`href="${url}"`).length - 1, 1, file + ': ' + url);
    assert.equal((section.match(/rel="noopener noreferrer"/g) || []).length, 2);
    const css = html.match(/href="([^"]*assets\/support-links\.css)"/)?.[1];
    assert.ok(css, file + ': local stylesheet');
    await readFile(path.resolve(path.dirname(path.join(root, file)), css), 'utf8');
  }
});

test('support buttons fit phone and desktop layouts and open only their declared destinations', {
  skip: project ? false : 'Set MAHARAJAHUL_BROWSER_PROJECT to an existing Playwright installation',
  timeout: 60000,
}, async () => {
  const browser = await loadChromium(project).launch({ headless: true });
  const folder = path.join(root, 'artifacts', 'support-buttons');
  await mkdir(folder, { recursive: true });
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    // Never visit a payment or social service during a navigation test.
    for (const url of urls) await context.route(url, route => route.fulfill({ contentType: 'text/html', body: '<title>Verified destination</title>' }));
    const page = await context.newPage();
    for (const [index, file] of pages.entries()) {
      await page.goto(pathToFileURL(path.join(root, file)).href);
      for (const width of [320, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const section = page.locator('aside.creator-support');
        await section.scrollIntoViewIfNeeded();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, file + ' overflow at ' + width);
        const links = section.locator('a');
        assert.equal(await links.count(), 2);
        for (let i = 0; i < 2; i++) {
          const box = await links.nth(i).boundingBox();
          assert.ok(box.height >= 44 && box.x >= 0 && box.x + box.width <= width + 1, file + ': usable target');
          assert.equal(await links.nth(i).getAttribute('href'), urls[i]);
        }
        await section.screenshot({ path: path.join(folder, `${index}-${width}.png`) });
      }
      for (const url of urls) {
        const link = page.locator(`.creator-links a[href="${url}"]`);
        await link.focus();
        const popupEvent = page.waitForEvent('popup');
        await page.keyboard.press('Enter');
        const popup = await popupEvent;
        await popup.waitForLoadState('domcontentloaded');
        assert.equal(popup.url(), url);
        assert.equal(await popup.title(), 'Verified destination');
        await popup.close();
      }
    }
  } finally { await browser.close(); }
});
