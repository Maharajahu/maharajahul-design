import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

async function core(file, names) {
  const source = await readFile(new URL('../references/' + file, import.meta.url), 'utf8');
  const blocks = [...source.matchAll(/```javascript\r?\n([\s\S]*?)```/g)].map(match => match[1]);
  assert.ok(blocks.length, file + ' has no documented JavaScript core');
  return vm.runInNewContext(blocks.join('\n') + '\n({' + names.join(',') + '})', { ArrayBuffer, DataView }, { timeout: 1000 });
}
const plain = value => JSON.parse(JSON.stringify(value));
const close = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);

test('glass coordinates account for stage offset, scaling and vertical inversion', async () => {
  const { panelToBuffer } = await core('recipes/liquid-glass.md', ['panelToBuffer']);
  const stage = { left: 50, top: 80, width: 400, height: 300 };
  assert.deepEqual(plain(panelToBuffer({ left: 150, top: 130, width: 100, height: 60 }, stage, 800, 450)), [300, 330, 100, 45]);
  assert.deepEqual(plain(panelToBuffer(stage, stage, 800, 450)), [400, 225, 400, 225]);
});

test('sphere intersections distinguish visible hits, misses and inside exits', async () => {
  const { sphereHit } = await core('recipes/orbital-planet.md', ['sphereHit']);
  close(sphereHit([0, 0, 5], [0, 0, -1], 1.12), 3.88);
  assert.equal(sphereHit([0, 0, 5], [1, 0, 0], 1.12), null);
  assert.equal(sphereHit([0, 0, 5], [0, 0, 1], 1.12), null);
  close(sphereHit([0, 0, 0], [0, 0, 1], 1.12), 1.12);
});

test('crystal absorption preserves a zero-length path and composes by thickness', async () => {
  const { attenuateGlass } = await core('recipes/spectral-crystal.md', ['attenuateGlass']);
  const color = [1, 0.8, 0.6], absorption = [0.11, 0.06, 0.08];
  assert.deepEqual(plain(attenuateGlass(color, absorption, 0)), color);
  const whole = attenuateGlass(color, absorption, 5);
  const split = attenuateGlass(attenuateGlass(color, absorption, 2), absorption, 3);
  whole.forEach((value, index) => {
    close(value, split[index]);
    assert.ok(value > 0 && value < color[index]);
  });
});

test('network projection preserves depth and packets stay on their edge', async () => {
  const { projectNode, edgePoint } = await core('recipes/spatial-network.md', ['projectNode', 'edgePoint']);
  assert.deepEqual(plain(projectNode([0, 0, 0], [100, 200], 40)), { x: 100, y: 200, depth: 0, scale: 1 });
  assert.ok(projectNode([1, 0, -1], [0, 0], 40).scale > projectNode([1, 0, 1], [0, 0], 40).scale);
  assert.deepEqual(plain(edgePoint([1, 2], [9, 6], 0)), [1, 2]);
  assert.deepEqual(plain(edgePoint([1, 2], [9, 6], 0.5)), [5, 4]);
  assert.deepEqual(plain(edgePoint([1, 2], [9, 6], 1)), [9, 6]);
});

test('tunnel center stays finite and drive and pulse change phase predictably', async () => {
  const { tunnelCoordinates } = await core('recipes/kinetic-tunnel.md', ['tunnelCoordinates']);
  close(tunnelCoordinates(0, 0, 0, 0).depth, 20);
  const low = tunnelCoordinates(0.4, 0.2, 2, 0);
  const high = tunnelCoordinates(0.4, 0.2, 2, 1);
  close(low.phase - high.phase, 16);
  close(high.phase - tunnelCoordinates(0.4, 0.2, 2, 1, 1).phase, 4);
  close(low.depth, tunnelCoordinates(-0.4, -0.2, 2, 0).depth);
});

test('energy summaries use the source interval series and handle empty or tied data', async () => {
  const { summarizeIntervals } = await core('recipes/energy-dashboard.md', ['summarizeIntervals']);
  const source = await readFile(new URL('../samples/app.js', import.meta.url), 'utf8');
  for (const [name, expected] of [['today', 12.4], ['yesterday', 16]]) {
    const values = source.match(new RegExp(name + ':\\s*\\[([^\\]]+)\\]'));
    assert.ok(values, 'Missing reference series: ' + name);
    close(summarizeIntervals(JSON.parse('[' + values[1] + ']')).total, expected);
  }
  assert.deepEqual(plain(summarizeIntervals([])), { total: 0, peak: null, peakHour: null });
  assert.deepEqual(plain(summarizeIntervals([1, 3, 3], 0.5)), { total: 7, peak: 3, peakHour: 0.5 });
});

test('product light level clamps once and keeps preview and label consistent', async () => {
  const { lampAppearance } = await core('recipes/product-configurator.md', ['lampAppearance']);
  for (const [input, percent] of [[-10, 0], [0, 0], ['70', 70], [100, 100], [150, 100]]) {
    assert.deepEqual(plain(lampAppearance(input)), { opacity: percent / 100, label: percent + '%' });
  }
});

test('timeline boundaries never select a nonexistent final clip', async () => {
  const { sequencePosition } = await core('recipes/timeline-workspace.md', ['sequencePosition']);
  for (const [time, index] of [[-2, 0], [0, 0], [3.95, 0], [4, 1], [8, 2], [12, 3], [16, 3], [20, 3]]) {
    const state = sequencePosition(time);
    assert.equal(state.index, index);
    assert.equal(state.ended, time >= 16);
    assert.ok(state.time >= 0 && state.time <= 16);
  }
  assert.deepEqual(plain(sequencePosition(6, 3, 2)), { time: 6, index: 2, ended: true });
});

test('contour field stays finite across the sampled grid and relief scales the displacement', async () => {
  const { contourY } = await core('recipes/contour-landscape.md', ['contourY']);
  for (let row = 0; row < 54; row++) {
    for (let point = 0; point < 116; point++) {
      assert.ok(Number.isFinite(contourY(point / 115, row / 53, 100, 90, 1)));
    }
  }
  const flat = contourY(0.6, 0.5, 1, 0);
  close(flat, 0.42 + 0.5 * 0.45);
  close(contourY(0.6, 0.5, 1, 60) - flat, 2 * (contourY(0.6, 0.5, 1, 30) - flat));
  assert.notEqual(contourY(0.6, 0.5, 1, 55), contourY(0.6, 0.5, 2, 55));
});

test('editorial snippet parses without requiring a document during module loading', async () => {
  const { openStory } = await core('recipes/editorial-spread.md', ['openStory']);
  assert.equal(typeof openStory, 'function');
});

test('motion following has no constant-target frame subdivision drift', async () => {
  const { followValue } = await core('motion-recipes.md', ['followValue']);
  const whole = followValue(0, 1, 0.1, 0.1);
  close(whole, followValue(followValue(0, 1, 0.04, 0.1), 1, 0.06, 0.1));
  close(followValue(0.7, 1, 0, 0.1), 0.7);
  assert.ok(whole > 0 && whole < 1);
});

test('GPU particle packing preserves float fields and the integer seed byte layout', async () => {
  const { packParticle, dispatchGroups } = await core('gpu-pipelines.md', ['packParticle', 'dispatchGroups']);
  const packed = packParticle([1, -2, 0.5], 0.75, [4, 5, 6], 0xdeadbeef);
  assert.equal(packed.byteLength, 32);
  const view = new DataView(packed);
  for (const [offset, expected] of [[0, 1], [4, -2], [8, 0.5], [12, 0.75], [16, 4], [20, 5], [24, 6]]) {
    assert.equal(view.getFloat32(offset, true), expected);
  }
  assert.equal(view.getUint32(28, true), 0xdeadbeef);
  assert.equal(dispatchGroups(125, 64), 2);
  assert.equal(dispatchGroups(128, 64), 2);
  assert.equal(dispatchGroups(129, 64), 3);
});

test('audio envelope is bounded and preserves attack/release timing across frame rates', async () => {
  const { audioEnvelope } = await core('gpu-pipelines.md', ['audioEnvelope']);
  const whole = audioEnvelope(0, 1, 0.1);
  close(whole, audioEnvelope(audioEnvelope(0, 1, 0.04), 1, 0.06));
  assert.ok(audioEnvelope(0, 1, 0.035) > 1 - audioEnvelope(1, 0, 0.035));
  close(audioEnvelope(0, 10, 0.1), whole);
  close(audioEnvelope(1, -10, 0.1), audioEnvelope(1, 0, 0.1));
  assert.ok(audioEnvelope(1, 0, 0.1) > 0 && audioEnvelope(1, 0, 0.1) < 1);
});
