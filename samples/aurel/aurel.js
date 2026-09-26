(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const canvas = $('#sculpture');
  const scene = $('#scene');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const objects = [
    { name: 'Continuum', note: 'ONE SURFACE. ENDLESS POSSIBILITY.', image: 'continuum', material: 0 },
    { name: 'Solstice', note: 'LIGHT, HELD FOR A MOMENT.', image: 'solstice', material: 1 },
    { name: 'Aperture', note: 'WHAT REMAINS IS THE SPACE.', image: 'aperture', material: 2 },
  ];
  const materials = [
    { name: 'Titanium', tint: [0.78, 0.82, 0.8], dark: 0 },
    { name: 'Champagne', tint: [1.0, 0.65, 0.3], dark: 0 },
    { name: 'Obsidian', tint: [0.2, 0.32, 0.28], dark: 1 },
  ];
  const state = { form: 0, material: 0, time: 0.8, yaw: -0.24, pitch: 0.2, light: 35, paused: preference.matches };
  let gl, program, buffer, uniforms, frame = 0, last = 0, visible = true, lost = false;
  let width = 1, height = 1, toastTimer = 0, drag = null, resizeObserver, contourVisible = false;

  const vertex = `attribute vec2 a_position;
    void main(){gl_Position=vec4(a_position,0.,1.);}`;
  const fragment = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform vec2 u_rotation;
uniform float u_time;
uniform float u_light;
uniform float u_dark;
uniform float u_compact;
uniform int u_form;
uniform vec3 u_tint;
const float PI=3.14159265359;
mat2 turn(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 localPoint(vec3 p){
  p.yz=turn(0.25+u_rotation.y)*p.yz;
  p.xz=turn(u_rotation.x+u_time*0.11)*p.xz;
  p.xy=turn(-0.38)*p.xy;
  return p;
}
float field(vec3 position){
  vec3 p=localPoint(position);
  float d;
  if(u_form==0){
    p.xy=turn(p.z*0.75)*p.xy;
    p.yz=turn(0.82)*p.yz;
    float angle=atan(p.z,p.x);
    vec2 tube=vec2(length(p.xz)-(0.94+0.045*cos(angle*3.)),p.y);
    d=length(tube)-(0.29+0.025*sin(angle*2.));
  }else if(u_form==1){
    float angle=atan(p.z,p.x);
    vec3 q=p/vec3(0.90,1.19,0.90);
    float radius=length(q);
    d=(radius-1.)*0.82;
    d+=0.047*cos(angle*14.+p.y*1.8)*smoothstep(0.05,0.45,length(p.xz));
  }else{
    p.yz=turn(0.38)*p.yz;
    float angle=atan(p.y,p.x);
    float ring=length(p.xy)-0.88;
    vec2 q=abs(vec2(ring,p.z))-vec2(0.115,0.26);
    d=length(max(q,0.))+min(max(q.x,q.y),0.)-0.13;
  }
  return d;
}
float surface(vec3 position){
  vec3 p=localPoint(position);
  float detail;
  if(u_form==0){
    p.xy=turn(p.z*0.75)*p.xy;p.yz=turn(0.82)*p.yz;
    detail=0.0034*sin(atan(p.z,p.x)*96.+atan(p.y,length(p.xz)-0.94)*2.);
  }else if(u_form==1){detail=0.003*sin(p.y*104.+atan(p.z,p.x)*3.);}
  else{p.yz=turn(0.38)*p.yz;detail=0.0038*sin(atan(p.y,p.x)*88.);}
  return field(position)+detail;
}
vec3 normalAt(vec3 p){
  vec2 e=vec2(0.0014,0.);
  return normalize(vec3(surface(p+e.xyy)-surface(p-e.xyy),surface(p+e.yxy)-surface(p-e.yxy),surface(p+e.yyx)-surface(p-e.yyx)));
}
float rectangle(vec2 p,vec2 halfSize,float edge){
  vec2 w=1.-smoothstep(halfSize,halfSize+edge,abs(p));return w.x*w.y;
}
vec3 studio(vec3 direction){
  vec3 r=direction;r.xz=turn(u_light)*r.xz;
  vec3 color=mix(vec3(0.018,0.024,0.02),vec3(0.68,0.73,0.68),smoothstep(-0.1,0.54,r.y));
  float key=pow(max(dot(r,normalize(vec3(-0.7,0.8,0.6))),0.),10.);
  float fill=pow(max(dot(r,normalize(vec3(0.8,0.3,0.5))),0.),20.);
  color+=vec3(3.3,3.04,2.53)*key;
  color+=vec3(1.4,1.65,1.8)*fill;
  vec2 wall=r.xy/max(abs(r.z),0.18);
  float window=rectangle(wall-vec2(-0.8,0.7),vec2(0.40,0.8),0.13)*step(0.,r.z);
  float mullion=smoothstep(0.018,0.029,abs(wall.x+0.8));
  color+=vec3(2.5,2.65,2.5)*window*mullion;
  float strip=(1.-smoothstep(0.025,0.08,abs(r.y+0.26)))*smoothstep(-0.3,0.6,r.x);
  color+=vec3(1.6,1.48,1.2)*strip;
  float flag=rectangle(wall-vec2(0.5,0.2),vec2(0.15,0.9),0.04)*step(0.,r.z);
  color*=1.-flag*0.9;
  return color;
}
float occlusion(vec3 p,vec3 n){
  float a=0.;
  a+=max(0.,0.06-field(p+n*0.06))*2.7;
  a+=max(0.,0.18-field(p+n*0.18))*1.5;
  return clamp(1.-a,0.42,1.);
}
vec3 grade(vec3 c){return pow(clamp((c*(2.51*c+0.03))/(c*(2.43*c+0.59)+0.14),0.,1.),vec3(1./2.2));}
void main(){
  vec2 screen=gl_FragCoord.xy/u_resolution;
  vec2 uv=(gl_FragCoord.xy-u_resolution*u_center)/u_resolution.y*2.;
  vec3 color=vec3(238.,237.,231.)/255.;
  vec2 shade=(uv-vec2(0.035,-0.72))*vec2(1.55,12.);
  color-=vec3(0.14,0.14,0.12)*exp(-dot(shade,shade)*1.6);
  color-=vec3(0.036)*exp(-dot((uv-vec2(0.02,-0.74))*vec2(3.9,27.),(uv-vec2(0.02,-0.74))*vec2(3.9,27.)));
  color+=0.009*exp(-length(uv-vec2(-0.4,0.7))*1.6);
  vec3 ro=vec3(0.,0.,5.3);
  vec3 rd=normalize(vec3(uv,-mix(2.52,2.48,u_compact)));
  float b=dot(ro,rd),h=b*b-dot(ro,ro)+3.4;
  if(h>0.){
    float travel=max(0.,-b-sqrt(h));
    float end=-b+sqrt(h);
    bool hit=false;
    for(int i=0;i<116;i++){
      float distance=field(ro+rd*travel);
      if(distance<0.0011){hit=true;break;}
      travel+=max(distance*0.52,0.0006);
      if(travel>end)break;
    }
    if(hit){
      vec3 p=ro+rd*travel,n=normalAt(p);
      vec3 reflected=reflect(rd,n);
      float facing=max(dot(n,-rd),0.);
      float rim=pow(1.-facing,4.);
      float ao=occlusion(p,n);
      vec3 environment=studio(reflected);
      vec3 metal=environment*u_tint;
      metal=mix(metal,environment*vec3(0.9,0.94,0.9),rim*(0.4+u_dark*0.52));
      vec3 light=normalize(vec3(-0.6,0.85,1.2));light.xz=turn(u_light)*light.xz;
      float diffuse=max(dot(n,light),0.);
      metal*=ao*(0.78+0.22*diffuse);
      metal+=u_tint*diffuse*0.045;
      metal+=vec3(0.9,0.86,0.73)*pow(max(dot(reflect(-light,n),-rd),0.),90.)*0.8;
      metal+=u_dark*rim*vec3(0.018,0.055,0.046);
      color=grade(metal*0.94);
    }
  }
  float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-0.5;
  gl_FragColor=vec4(clamp(color+grain*0.003,0.,1.),1.);
}`;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function initialize() {
    gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    if (!gl) { unavailable('STATIC STUDY — WEBGL UNAVAILABLE'); return; }
    try {
      const vertexShader = compile(gl.VERTEX_SHADER, vertex);
      const fragmentShader = compile(gl.FRAGMENT_SHADER, fragment);
      program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const attribute = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
      uniforms = Object.fromEntries(['resolution', 'center', 'rotation', 'time', 'light', 'dark', 'compact', 'form', 'tint'].map(name => [name, gl.getUniformLocation(program, 'u_' + name)]));
      lost = false;
      $$('button[data-material], #light, #motion, #save-frame').forEach(control => { control.disabled = false; });
      $('#render-status').textContent = 'LIVE GEOMETRY / WEBGL';
      resize();
    } catch (error) {
      console.error('AUREL renderer:', error.message);
      unavailable('STATIC STUDY — RENDERER COULD NOT START');
    }
  }

  function unavailable(message) {
    lost = true;
    cancelAnimationFrame(frame); frame = 0;
    scene.classList.remove('is-ready');
    canvas.dataset.ready = 'false';
    canvas.style.opacity = '0';
    canvas.tabIndex = -1;
    $('#render-status').textContent = message;
    $('#drag-hint').textContent = 'STATIC VIEW / EXPLORE THE COLLECTION BELOW';
    $$('button[data-material], #light, #motion, #save-frame').forEach(control => { control.disabled = true; });
  }

  function resize() {
    if (!gl || lost) return;
    const rect = scene.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    const compact = width < 700;
    const budget = compact ? 750000 : 1700000;
    const scale = Math.min(devicePixelRatio || 1, 1.65, Math.sqrt(budget / (width * height)));
    const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, canvas.width, canvas.height);
    requestRender();
  }

  function draw() {
    const material = materials[state.material];
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.center, width < 700 ? 0.50 : 0.655, width < 700 ? 0.53 : 0.565);
    gl.uniform2f(uniforms.rotation, state.yaw, state.pitch);
    gl.uniform1f(uniforms.time, state.time);
    gl.uniform1f(uniforms.light, state.light * Math.PI / 180);
    gl.uniform1f(uniforms.dark, material.dark);
    gl.uniform1f(uniforms.compact, width < 700 ? 1 : 0);
    gl.uniform1i(uniforms.form, state.form);
    gl.uniform3fv(uniforms.tint, material.tint);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.dataset.ready = 'true';
    scene.classList.add('is-ready');
    canvas.dataset.form = String(state.form);
    canvas.dataset.material = String(state.material);
    canvas.dataset.time = state.time.toFixed(3);
  }

  function tick(now) {
    frame = 0;
    if (!gl || lost || document.hidden || !visible) { last = 0; return; }
    if (!state.paused && last && now - last < 1000 / 30) { frame = requestAnimationFrame(tick); return; }
    if (!state.paused && last && !drag) state.time += Math.min((now - last) / 1000, 0.08);
    last = now;
    draw();
    if (!state.paused) frame = requestAnimationFrame(tick);
  }

  function requestRender() {
    if (!frame && gl && !lost && visible && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function setMaterial(index) {
    state.material = index;
    $$('button[data-material]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.material) === index)));
    canvas.setAttribute('aria-label', `Interactive ${materials[index].name.toLowerCase()} ${objects[state.form].name} sculpture. Drag or use arrow keys to rotate.`);
    requestRender();
  }

  function motionChanged() {
    $('#motion').setAttribute('aria-pressed', String(state.paused));
    $('#motion-label').textContent = state.paused ? 'Resume motion' : 'Pause motion';
    $('.motion-icon').textContent = state.paused ? '▷' : 'Ⅱ';
    document.body.classList.toggle('is-paused', state.paused);
    $('#contour-art').style.animationPlayState = state.paused || !contourVisible || document.hidden ? 'paused' : 'running';
    canvas.dataset.paused = String(state.paused);
    last = 0;
    if (state.paused) { cancelAnimationFrame(frame); frame = 0; }
    requestRender();
  }

  $$('button[data-material]').forEach(button => button.addEventListener('click', () => setMaterial(Number(button.dataset.material))));
  $('#light').addEventListener('input', event => {
    state.light = Number(event.target.value);
    $('#light-value').textContent = state.light + '°';
    requestRender();
  });
  $('#motion').addEventListener('click', () => { state.paused = !state.paused; motionChanged(); });
  preference.addEventListener('change', () => {
    state.paused = preference.matches;
    document.documentElement.classList.toggle('has-motion', !preference.matches);
    motionChanged();
  });

  $$('[data-object]').forEach(button => button.addEventListener('click', () => {
    state.form = Number(button.dataset.object);
    const object = objects[state.form];
    state.yaw = -0.24; state.pitch = 0.2; state.time = 0.8;
    $('#object-number').textContent = '0' + (state.form + 1);
    $('#object-name').textContent = object.name;
    $('#object-note').textContent = object.note;
    $('#coordinate-label').textContent = 'AU — 00' + (state.form + 1);
    $('.scene-poster').src = 'assets/' + object.image + '.jpg';
    $('.scene-poster').alt = object.name + ': a studio-lit procedural sculpture.';
    setMaterial(object.material);
    scene.scrollIntoView({ behavior: preference.matches ? 'instant' : 'smooth', block: 'center' });
    if (!lost) canvas.focus({ preventScroll: true });
  }));

  canvas.addEventListener('pointerdown', event => {
    if (lost || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: state.yaw, pitch: state.pitch };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    state.yaw = drag.yaw + (event.clientX - drag.x) * 0.009;
    state.pitch = Math.max(-1.1, Math.min(1.1, drag.pitch + (event.clientY - drag.y) * 0.005));
    requestRender();
  });
  function endDrag() { drag = null; last = 0; }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('lostpointercapture', endDrag);
  canvas.addEventListener('keydown', event => {
    const keys = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] };
    if (!keys[event.key] || lost) return;
    event.preventDefault();
    state.yaw += keys[event.key][0];
    state.pitch = Math.max(-1.1, Math.min(1.1, state.pitch + keys[event.key][1]));
    requestRender();
  });

  function toast(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500);
  }
  $('#save-frame').addEventListener('click', () => {
    if (lost || !gl) return;
    draw();
    canvas.toBlob(blob => {
      if (!blob) { toast('The image could not be saved. Please try again.'); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'aurel-' + objects[state.form].image + '-' + materials[state.material].name.toLowerCase() + '.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast('Your frame is ready. Keep this perspective.');
    }, 'image/png');
  });

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    unavailable('STATIC STUDY — GRAPHICS CONTEXT INTERRUPTED');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    canvas.style.opacity = '';
    canvas.tabIndex = 0;
    $('#drag-hint').innerHTML = '<span aria-hidden="true">↔</span> DRAG TO FIND YOUR PERSPECTIVE';
    initialize();
  });

  const contourGroup = $('#contours');
  for (let ring = 0; ring < 84; ring++) {
    let d = '';
    for (let step = 0; step <= 192; step++) {
      const a = step / 192 * Math.PI * 2;
      const r = 70 + ring * 4.3 + Math.sin(a * 3 + ring * 0.045) * (12 + ring * 0.53);
      const x = 500 + Math.cos(a) * r;
      const y = 500 + Math.sin(a) * r * (0.89 + Math.cos(a + ring * 0.022) * 0.12);
      d += (step ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
    }
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d + 'Z');
    path.setAttribute('opacity', String(0.32 + 0.68 * Math.pow(Math.sin(ring * 0.078), 2)));
    contourGroup.append(path);
  }

  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } });
    }, { threshold: 0.08 });
    reveals.forEach(element => revealObserver.observe(element));
    document.documentElement.classList.toggle('has-motion', !preference.matches);
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      last = 0;
      if (!visible) { cancelAnimationFrame(frame); frame = 0; }
      else requestRender();
    }, { threshold: 0 }).observe(scene);
    new IntersectionObserver(entries => {
      contourVisible = entries[0].isIntersecting;
      $('#contour-art').style.animationPlayState = contourVisible && !state.paused && !document.hidden ? 'running' : 'paused';
    }, { threshold: 0 }).observe($('#approach'));
  }

  let scrollPending = false;
  function progress() {
    const length = document.documentElement.scrollHeight - innerHeight;
    $('.reading-progress').style.transform = 'scaleX(' + (length > 0 ? Math.min(1, scrollY / length) : 0) + ')';
    scrollPending = false;
  }
  addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(progress); } }, { passive: true });
  addEventListener('resize', progress, { passive: true });
  document.addEventListener('visibilitychange', () => {
    last = 0;
    $('#contour-art').style.animationPlayState = contourVisible && !state.paused && !document.hidden ? 'running' : 'paused';
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else requestRender();
  });
  addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; last = 0; });
  addEventListener('pageshow', requestRender);
  motionChanged();
  initialize();
  if ('ResizeObserver' in window) { resizeObserver = new ResizeObserver(resize); resizeObserver.observe(scene); }
  else addEventListener('resize', resize, { passive: true });
  progress();
})();
