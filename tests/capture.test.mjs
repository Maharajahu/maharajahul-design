import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { capture, loadChromium, parseOptions } from '../scripts/capture.mjs';

const args = ['--url', 'http://127.0.0.1:3000', '--out', './artifacts'];

test('defaults give a small responsive capture matrix', () => {
  const options = parseOptions(args);
  assert.deepEqual(options.sizes, [{ width: 390, height: 844 }, { width: 1440, height: 960 }]);
  assert.deepEqual(options.themes, ['light', 'dark']);
  assert.equal(options.motion, 'reduce');
  assert.ok(path.isAbsolute(options.out));
  assert.equal(options.timeout, 15000);
});

test('explicit capture choices remain intact and duplicates collapse', () => {
  const options = parseOptions([...args, '--sizes', '800x600,800x600', '--themes', 'dark',
    '--motion', 'no-preference', '--wait-for', '#ready', '--timeout', '2000']);
  assert.deepEqual(options.sizes, [{ width: 800, height: 600 }]);
  assert.deepEqual(options.themes, ['dark']);
  assert.equal(options.motion, 'no-preference');
  assert.equal(options.waitFor, '#ready');
  assert.equal(options.timeout, 2000);
});

test('help does not require a target or browser dependency', () => {
  assert.deepEqual(parseOptions(['--help']), { help: true });
});

test('invalid capture arguments fail before browser work', () => {
  for (const invalid of [[], ['--url', 'file:///example', '--out', './artifacts'],
    [...args, '--sizes', 'zero'], [...args, '--sizes', '90x800'],
    [...args, '--sizes', '8193x800'], [...args, '--themes', 'unknown'],
    [...args, '--motion', 'fast'], [...args, '--timeout', 'NaN'],
    [...args, '--timeout', '0'], [...args, '--unknown']]) {
    assert.throws(() => parseOptions(invalid));
  }
});

test('a missing project dependency has an actionable error', () => {
  const missing = path.join(path.parse(process.cwd()).root, 'maharajahul-missing-project');
  assert.throws(() => loadChromium(missing), /No existing Playwright installation/);
});

const browserProject = process.env.MAHARAJAHUL_BROWSER_PROJECT;
test('browser captures and reports real good and broken pages without overwrites', {
  skip: browserProject ? false : 'Set MAHARAJAHUL_BROWSER_PROJECT to an existing Playwright project',
  timeout: 60000,
}, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'maharajahul-browser-'));
  const server = createServer((request, response) => {
    if (request.url === '/missing.png') {
      response.writeHead(404).end('Missing');
      return;
    }
    if (request.url === '/disconnect') {
      request.socket.destroy();
      return;
    }
    const broken = request.url === '/broken';
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html><html><head><title>Capture fixture</title>
      <link rel="icon" href="data:,"><style>
        body { margin:0; font:18px system-ui; background:#f3f1e9; color:#132827; }
        main { box-sizing:border-box; padding:24px; }
        @media(prefers-color-scheme:dark) { body { background:#132827; color:#f3f1e9; } }
      </style></head><body><main id="ready"><h1>Room for the next action</h1>
      <p>Choose a state, inspect the evidence, and keep the result portable.</p>
      ${broken ? `<div id="too-wide" style="width:2200px;height:40px;background:#c96345">Overflow</div>
        <img src="/missing.png" alt="Missing fixture"><script>
          console.error('fixture console error');
          fetch('/disconnect').catch(() => {});
          throw new Error('fixture page error');
        </script>` : '<button>Inspect state</button>'}
      </main></body></html>`);
  });
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    const options = parseOptions(['--url', url, '--out', root, '--project', browserProject,
      '--sizes', '390x844,1280x800', '--themes', 'light,dark', '--wait-for', '#ready']);
    const good = await capture(options);
    assert.equal(good.report.exitCode, 0, JSON.stringify(good.report));
    assert.equal(good.report.captures.length, 4);
    for (const item of good.report.captures) {
      assert.equal(item.layout.overflow, false);
      assert.deepEqual(item.layout.brokenImages, []);
      const png = await readFile(path.join(good.directory, item.screenshot));
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(png.readUInt32BE(16), item.viewport.width);
      assert.ok(png.readUInt32BE(20) >= item.viewport.height);
    }
    const saved = await readFile(path.join(good.directory, 'report.json'), 'utf8');
    assert.deepEqual(JSON.parse(saved), good.report);
    const bad = await capture({ ...options, url: url + '/broken', sizes: [options.sizes[0]], themes: ['light'] });
    assert.notEqual(good.directory, bad.directory);
    assert.equal(await readFile(path.join(good.directory, 'report.json'), 'utf8'), saved);
    assert.equal(bad.report.exitCode, 2);
    const item = bad.report.captures[0];
    assert.equal(item.layout.overflow, true);
    assert.ok(item.layout.candidates.some((element) => element.id === 'too-wide'));
    assert.ok(item.layout.brokenImages.some((image) => image.src.endsWith('/missing.png')));
    assert.ok(item.consoleErrors.includes('fixture console error'));
    assert.ok(item.pageErrors.includes('fixture page error'));
    assert.ok(item.failedRequests.some((request) => request.url.endsWith('/disconnect')));
    assert.ok(item.httpErrors.some((response) => response.status === 404));
    const notReady = await capture({ ...options, sizes: [options.sizes[0]], themes: ['light'],
      waitFor: '#never-created', timeout: 1000 });
    assert.equal(notReady.report.exitCode, 1);
    assert.ok(notReady.report.captures[0].captureError);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    const relative = path.relative(os.tmpdir(), root);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative) ||
        !path.basename(root).startsWith('maharajahul-browser-')) {
      throw new Error('Refusing cleanup outside the dedicated test directory');
    }
    await rm(root, { recursive: true, force: true });
  }
});
