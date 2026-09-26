const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const names = { edition: 'Off Hours', pulse: 'Pulse', form: 'Form', cutroom: 'Cutroom', drift: 'Drift' };
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const state = { page: 'edition', playing: false, time: 0, fieldPaused: motionPreference.matches, fieldTime: 0, relief: 55, cool: false, pointer: 0 };
let frame = 0;
let lastTime = 0;

function selectStudy() {
  const requested = location.hash.slice(1);
  state.page = Object.hasOwn(names, requested) ? requested : 'edition';
  $$('.study').forEach((study) => { study.hidden = study.id !== state.page; });
  $$('.gallery-nav a').forEach((link) => {
    if (link.hash === '#' + state.page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.title = names[state.page] + ' · Maharajahul Design';
  state.playing = false;
  syncPlayback();
  if (state.page === 'drift') resizeField();
  schedule();
}
addEventListener('hashchange', selectStudy);

const dialog = $('#detail-dialog');
function showDetail(kicker, title, content) {
  $('#dialog-kicker').textContent = kicker;
  $('#dialog-title').textContent = title;
  $('#dialog-body').replaceChildren(content);
  dialog.showModal();
}
$('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) {
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
} });
$('#read-essay').addEventListener('click', () => {
  const article = document.createElement('article');
  for (const text of [
    'At six, the courtyard belongs to the people passing through it. At seven, it belongs to a chair, a small tree, and a patch of light that has finally reached the ground.',
    'Nothing extraordinary happens. A window opens. Somebody carries a glass of water outside. Without the traffic asking for your attention, you notice that the bricks are not all the same colour.',
    'Perhaps a quieter city is not a different place. Perhaps it is the familiar one, with a little less urgency. Take the longer way home. There might be a warm square of pavement waiting for you.',
  ]) { const paragraph = document.createElement('p'); paragraph.textContent = text; article.append(paragraph); }
  showDetail('OFF HOURS / FIELD NOTE 001', 'A quieter kind of city.', article);
});

const energy = { today: [0.4,0.3,0.3,0.8,1.7,1.1,0.8,0.9,1.3,2.1,1.8,0.9], yesterday: [0.5,0.4,0.3,0.9,2.2,1.5,1.1,1.3,1.9,2.6,2.2,1.1] };
function updateEnergy(period) {
  const values = energy[period];
  const points = values.map((value, index) => `${index * 680 / 11},${190 - value * 54}`);
  $('#energy-line').setAttribute('d', 'M' + points.join(' L'));
  $('#energy-area').setAttribute('d', 'M0,210 L' + points.join(' L') + ' L680,210 Z');
  $('#energy-total').textContent = values.reduce((a, b) => a + b, 0).toFixed(1);
  const peak = Math.max(...values);
  $('#energy-peak').textContent = `Peak interval: ${peak.toFixed(1)} kWh at ${String(values.indexOf(peak) * 2).padStart(2, '0')}:00 · illustrative values`;
  $('#chart-title').textContent = `${period === 'today' ? "Today's" : "Yesterday's"} simulated consumption: ${values.join(', ')} kWh per two-hour interval, from midnight.`;
  $$('[data-period]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.period === period)));
}
$$('[data-period]').forEach((button) => button.addEventListener('click', () => updateEnergy(button.dataset.period)));
$('#charging').addEventListener('click', (event) => {
  const enabled = event.currentTarget.getAttribute('aria-pressed') !== 'true';
  event.currentTarget.setAttribute('aria-pressed', String(enabled));
  $('#charging-note').textContent = enabled ? 'Scheduled in this demo · 00:00–02:00 · 6.8 kWh planned. No device connected.' : 'Not scheduled · no additional energy planned.';
});

const finishes = { Terracotta: '#ae6046', Chalk: '#e2dbc8', Graphite: '#454a44' };
$$('[name=finish]').forEach((input) => input.addEventListener('change', () => {
  $('#form').style.setProperty('--finish', finishes[input.value]);
  $('#finish-label').textContent = input.value;
}));
$('#brightness').addEventListener('input', (event) => {
  $('#light-output').value = event.target.value + '%';
  $('#lamp-light').style.opacity = event.target.value / 100;
});
$('#lamp-light').style.opacity = '0.7';
$('#review-lamp').addEventListener('click', () => {
  const content = document.createElement('div');
  const list = document.createElement('dl');
  for (const [name, value] of [['Object', 'The Everyday Lamp'], ['Finish', $('[name=finish]:checked').value], ['Light level', $('#brightness').value + '%']]) {
    const term = document.createElement('dt'); term.textContent = name;
    const detail = document.createElement('dd'); detail.textContent = value;
    list.append(term, detail);
  }
  const note = document.createElement('p'); note.className = 'dialog-note'; note.textContent = 'This is a design sample, not an order. Your choices stay in this page until you reload.';
  content.append(list, note);
  showDetail('FORM / YOUR SELECTION', 'A light of your own.', content);
});

const scenes = [{ name: 'First light.', style: 'dawn' }, { name: 'Long shadows.', style: 'noon' }, { name: 'Blue hour.', style: 'dusk' }, { name: 'Homeward.', style: 'night' }];
function syncPlayback() {
  const index = Math.min(3, Math.floor(state.time / 4));
  $('#scene-preview').className = 'scene-preview ' + scenes[index].style;
  $('#scene-name').textContent = scenes[index].name;
  $('#frame-number').textContent = `0${index + 1} / 04`;
  $('#timecode').value = `00:${String(Math.floor(state.time)).padStart(2, '0')} / 00:16`;
  $('#playhead').value = state.time;
  $('#play-cut').textContent = state.playing ? 'Ⅱ Pause cut' : '▶ Play cut';
  $('#play-cut').setAttribute('aria-pressed', String(state.playing));
  $$('[data-clip]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.clip) === index)));
}
$$('[data-clip]').forEach((button) => button.addEventListener('click', () => { state.time = Number(button.dataset.clip) * 4; syncPlayback(); }));
$('#playhead').addEventListener('input', (event) => { state.time = Number(event.target.value); syncPlayback(); });
$('#rewind').addEventListener('click', () => { state.time = 0; state.playing = false; syncPlayback(); schedule(); });
$('#play-cut').addEventListener('click', () => {
  if (state.time >= 16) state.time = 0;
  state.playing = !state.playing; syncPlayback(); schedule();
});

const canvas = $('#terrain');
const context = canvas.getContext('2d');
let width = 0;
let height = 0;
function resizeField() {
  if (state.page !== 'drift') return;
  width = canvas.clientWidth; height = canvas.clientHeight;
  const ratio = Math.min(devicePixelRatio || 1, 1.75);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawField();
}
function drawField() {
  if (!width || !height) return;
  context.fillStyle = '#142025'; context.fillRect(0, 0, width, height);
  const time = state.fieldTime * 0.24;
  for (let row = 0; row < 54; row++) {
    const depth = row / 53;
    context.beginPath();
    for (let step = 0; step <= 115; step++) {
      const x = step / 115;
      const hill = Math.exp(-Math.pow((x - 0.67 - state.pointer * 0.04) * 3, 2));
      const ridge = Math.sin(x * 8 + depth * 4 + time) * 0.65 + Math.sin(x * 15 - depth * 3 - time * 0.7) * 0.22;
      const y = height * (0.42 + depth * 0.45) - hill * (ridge + 0.9) * height * state.relief / 420 * (0.45 + depth);
      if (step === 0) context.moveTo(x * width, y); else context.lineTo(x * width, y);
    }
    context.strokeStyle = state.cool ? `rgba(142,205,194,${0.12 + depth * 0.57})` : `rgba(231,171,109,${0.12 + depth * 0.57})`;
    context.lineWidth = 0.7 + depth * 0.6; context.stroke();
  }
  const shade = context.createLinearGradient(0, 0, width * 0.6, 0);
  shade.addColorStop(0, '#142025dd'); shade.addColorStop(1, '#14202500');
  context.fillStyle = shade; context.fillRect(0, 0, width, height);
}
function fieldButton() {
  $('#pause-field').textContent = state.fieldPaused ? 'Resume field' : 'Pause field';
  $('#pause-field').setAttribute('aria-pressed', String(state.fieldPaused));
}
$('#relief').addEventListener('input', (event) => { state.relief = Number(event.target.value); $('#relief-output').value = state.relief + '%'; drawField(); });
$('#field-color').addEventListener('click', (event) => { state.cool = !state.cool; event.currentTarget.textContent = 'Palette: ' + (state.cool ? 'Tide' : 'Ember'); event.currentTarget.setAttribute('aria-pressed', String(state.cool)); drawField(); });
$('#pause-field').addEventListener('click', () => { state.fieldPaused = !state.fieldPaused; fieldButton(); schedule(); });
canvas.addEventListener('pointermove', (event) => { if (state.fieldPaused) return; state.pointer = (event.clientX - canvas.getBoundingClientRect().left) / width - 0.5; });
motionPreference.addEventListener('change', () => { if (motionPreference.matches) { state.fieldPaused = true; fieldButton(); schedule(); } });
addEventListener('resize', resizeField);
document.addEventListener('visibilitychange', schedule);
function schedule() {
  cancelAnimationFrame(frame); frame = 0; lastTime = 0;
  if (!document.hidden && ((state.page === 'cutroom' && state.playing) || (state.page === 'drift' && !state.fieldPaused))) frame = requestAnimationFrame(tick);
}
function tick(timestamp) {
  const elapsed = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.1) : 0;
  lastTime = timestamp;
  if (state.page === 'cutroom' && state.playing) {
    state.time = Math.min(16, state.time + elapsed);
    if (state.time >= 16) state.playing = false;
    syncPlayback();
  } else if (state.page === 'drift' && !state.fieldPaused) {
    state.fieldTime += elapsed; drawField();
  }
  if (!document.hidden && ((state.page === 'cutroom' && state.playing) || (state.page === 'drift' && !state.fieldPaused))) frame = requestAnimationFrame(tick);
  else frame = 0;
}
updateEnergy('today'); fieldButton(); selectStudy();
