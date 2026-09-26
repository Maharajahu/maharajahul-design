#!/usr/bin/env node
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const help = `Capture rendered pages using an existing project's Playwright.
Required: --url http://localhost:3000 --out ./artifacts
Optional: --project ./app --sizes 390x844,1440x960 --themes light,dark
          --motion reduce --wait-for main --timeout 15000
No dependencies or browsers are installed. Each run gets a new directory.`;

export function parseOptions(argv) {
  const { values } = parseArgs({ args: argv, options: {
    url: { type: 'string' }, out: { type: 'string' },
    project: { type: 'string', default: process.cwd() },
    sizes: { type: 'string', default: '390x844,1440x960' },
    themes: { type: 'string', default: 'light,dark' },
    motion: { type: 'string', default: 'reduce' },
    'wait-for': { type: 'string' },
    timeout: { type: 'string', default: '15000' },
    help: { type: 'boolean', default: false },
  } });
  if (values.help) return { help: true };
  if (!values.url || !values.out) throw new Error('--url and --out are required');
  const url = new URL(values.url);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use an HTTP or HTTPS URL');
  const sizes = [...new Set(values.sizes.split(','))].map((size) => {
    const match = /^(\d+)x(\d+)$/.exec(size);
    if (!match) throw new Error('Sizes must use WIDTHxHEIGHT, separated by commas');
    const [width, height] = match.slice(1).map(Number);
    if ([width, height].some((value) => value < 100 || value > 8192)) {
      throw new Error('Viewport dimensions must be between 100 and 8192');
    }
    return { width, height };
  });
  const themes = [...new Set(values.themes.split(','))];
  if (themes.some((theme) => !['light', 'dark'].includes(theme))) {
    throw new Error('Themes must be light, dark, or light,dark');
  }
  if (!['reduce', 'no-preference'].includes(values.motion)) {
    throw new Error('Motion must be reduce or no-preference');
  }
  const timeout = Number(values.timeout);
  if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 120000) {
    throw new Error('Timeout must be an integer from 1000 to 120000 milliseconds');
  }
  return {
    url: url.href, out: path.resolve(values.out), project: path.resolve(values.project),
    sizes, themes, motion: values.motion, waitFor: values['wait-for'], timeout,
  };
}

export function loadChromium(project) {
  const require = createRequire(path.join(path.resolve(project), 'package.json'));
  for (const name of ['playwright', '@playwright/test']) {
    let entry;
    try {
      entry = require.resolve(name);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') continue;
      throw error;
    }
    return require(entry).chromium;
  }
  throw new Error('No existing Playwright installation found for --project. Use your available browser tool; this helper does not install packages.');
}

export async function capture(options) {
  const chromium = loadChromium(options.project);
  const browser = await chromium.launch({ headless: true });
  try {
    await mkdir(options.out, { recursive: true });
    const directory = await mkdtemp(path.join(options.out, 'capture-'));
    const report = {
      url: options.url, startedAt: new Date().toISOString(),
      browser: browser.version(), motion: options.motion,
      screenshot: { fullPage: true, cssAnimations: 'disabled' },
      scope: 'Observed page behavior, not a visual or accessibility certification.',
      captures: [],
    };
    for (const size of options.sizes) {
      for (const theme of options.themes) {
        const context = await browser.newContext({
          viewport: size, deviceScaleFactor: 1,
          colorScheme: theme, reducedMotion: options.motion,
        });
        const item = {
          viewport: size, theme, screenshot: null,
          consoleErrors: [], pageErrors: [], failedRequests: [], httpErrors: [],
          captureError: null, layout: null,
        };
        try {
          const page = await context.newPage();
          page.setDefaultTimeout(options.timeout);
          page.on('console', (message) => {
            if (message.type() === 'error') item.consoleErrors.push(message.text());
          });
          page.on('pageerror', (error) => item.pageErrors.push(error.message));
          page.on('requestfailed', (request) => item.failedRequests.push({
            url: request.url(), reason: request.failure()?.errorText,
          }));
          page.on('response', (response) => {
            if (response.status() >= 400) item.httpErrors.push({
              url: response.url(), status: response.status(),
            });
          });
          await page.goto(options.url, { waitUntil: 'domcontentloaded' });
          if (options.waitFor) await page.locator(options.waitFor).first().waitFor();
          await page.waitForFunction(() =>
            (!document.fonts || document.fonts.status === 'loaded') &&
            [...document.images].every((image) => image.loading === 'lazy' || image.complete));
          const filename = `${size.width}x${size.height}-${theme}.png`;
          await page.screenshot({ path: path.join(directory, filename), fullPage: true, animations: 'disabled' });
          item.screenshot = filename;
          item.layout = await page.evaluate(() => {
            const viewport = document.documentElement.clientWidth;
            const width = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0);
            const overflow = width > viewport + 1;
            const candidates = overflow ? [...document.querySelectorAll('body *')].filter((element) => {
              const bounds = element.getBoundingClientRect();
              return bounds.width > 0 && (bounds.right > viewport + 1 || bounds.left < -1);
            }).slice(0, 12).map((element) => ({
              tag: element.tagName.toLowerCase(), id: element.id,
              classes: element.getAttribute('class'),
            })) : [];
            return {
              viewportWidth: viewport, documentWidth: width, overflow, candidates,
              brokenImages: [...document.images]
                .filter((image) => image.complete && !image.naturalWidth && (image.currentSrc || image.getAttribute('src')))
                .map((image) => ({ src: image.currentSrc || image.src, alt: image.alt })),
            };
          });
          item.finalUrl = page.url();
        } catch (error) {
          item.captureError = error.message;
        } finally {
          await context.close();
        }
        item.needsInspection = Boolean(item.captureError || item.consoleErrors.length ||
          item.pageErrors.length || item.failedRequests.length || item.httpErrors.length ||
          item.layout?.overflow || item.layout?.brokenImages.length);
        report.captures.push(item);
      }
    }
    report.finishedAt = new Date().toISOString();
    report.exitCode = report.captures.some((item) => item.captureError) ? 1 :
      report.captures.some((item) => item.needsInspection) ? 2 : 0;
    await writeFile(path.join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    return { directory, report };
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseOptions(process.argv.slice(2));
    if (options.help) {
      console.log(help);
    } else {
      const result = await capture(options);
      console.log(path.join(result.directory, 'report.json'));
      process.exitCode = result.report.exitCode;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
