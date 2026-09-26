import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { loadChromium } from '../scripts/capture.mjs';

const root = fileURLToPath(new URL('..',import.meta.url));
const project = process.env.MAHARAJAHUL_BROWSER_PROJECT;
test('six future studies render and react offline at desktop and phone sizes', {
  skip: project ? false : 'Set MAHARAJAHUL_BROWSER_PROJECT to an existing Playwright installation',
  timeout: 120000,
}, async () => {
  const browser = await loadChromium(project).launch({headless:true});
  const output = path.join(root,'artifacts','future');
  await mkdir(output,{recursive:true});
  const errors = [];
  try {
    const context = await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'});
    const page = await context.newPage();
    page.on('pageerror',(error) => errors.push(error.message));
    page.on('console',(message) => { if(message.type()==='error') errors.push(message.text()); });
    page.on('request',(request) => { if(/^https?:/.test(request.url())) errors.push('Unexpected network request: '+request.url()); });
    await page.goto(pathToFileURL(path.join(root,'samples','future','index.html')).href);
    for(const width of [1440,390]) {
      await page.setViewportSize({width,height:width===1440?1050:844});
      for(const name of ['orbis','morph','synapse','velocity','chroma','lucent']) {
        await page.locator(`.world-nav a[href="#${name}"]`).click();
        await page.waitForFunction((name) => document.body.dataset.world===name,name);
        assert.equal(await page.locator('#unavailable').isVisible(),false,name+' renderer unavailable');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth>innerWidth+1),false,name+' horizontal overflow');
        const canvas = page.locator(name==='synapse'?'#network':'#gpu');
        const pixels = await canvas.evaluate((canvas) => {
          const copy = document.createElement('canvas'); copy.width=80; copy.height=80;
          const ctx=copy.getContext('2d'); ctx.drawImage(canvas,0,0,80,80);
          const data=ctx.getImageData(0,0,80,80).data;
          const colors=new Set(); let bright=0;
          for(let index=0;index<data.length;index+=4) {
            colors.add(`${data[index]>>4},${data[index+1]>>4},${data[index+2]>>4}`);
            if(data[index]+data[index+1]+data[index+2]>160) bright++;
          }
          return {colors:colors.size,bright};
        });
        assert.ok(pixels.colors>12 && pixels.bright>10,`${name}: empty or nearly uniform render ${JSON.stringify(pixels)}`);
        await page.screenshot({path:path.join(output,`${name}-${width}.png`),fullPage:true});
        if(name==='lucent' && width===390) {
          for(const selector of ['#glass-motion','#glass-light','[data-light-scene="1"]','#action','#parameter']) {
            const control=page.locator(selector);
            await control.scrollIntoViewIfNeeded();
            assert.ok(await control.evaluate((element)=>{
              const box=element.getBoundingClientRect();
              const top=document.elementFromPoint(box.x+box.width/2,box.y+box.height/2);
              return top===element || element.contains(top);
            }),selector+' is obscured on a phone-sized viewport');
          }
        }
      }
    }
    await page.setViewportSize({width:1440,height:1050});
    for(const name of ['orbis','morph','synapse','velocity','chroma','lucent']) {
      await page.locator(`.world-nav a[href="#${name}"]`).click();
      await page.waitForFunction((name) => document.body.dataset.world===name,name);
      const canvas=page.locator(name==='synapse'?'#network':'#gpu');
      const initial=await canvas.evaluate((canvas)=>canvas.toDataURL());
      await page.locator('#parameter').fill('82');
      assert.equal(await page.locator('#parameter-value').textContent(),'82%');
      const changed=await canvas.evaluate((canvas)=>canvas.toDataURL());
      assert.ok(initial!==changed,name+' slider does not change pixels');
      await page.locator('[data-variant="1"]').click();
      assert.equal(await page.locator('[data-variant="1"]').getAttribute('aria-pressed'),'true');
      assert.ok(changed!==await canvas.evaluate((canvas)=>canvas.toDataURL()),name+' palette does not change pixels');
      await page.locator('#action').click();
      if(['orbis','morph','chroma','lucent'].includes(name)) {
        assert.ok(await page.locator('#experience').evaluate((element)=>element.classList.contains('inspecting')));
        await page.locator('#action').click();
        assert.equal(await page.locator('#experience').evaluate((element)=>element.classList.contains('inspecting')),false);
      } else assert.match(await page.locator('#action-label').textContent(),/again/);
    }
    const glass=page.locator('#gpu');
    const morning=await glass.evaluate((canvas)=>canvas.toDataURL());
    await page.locator('[data-light-scene="1"]').click();
    assert.match(await page.locator('#glass-title').textContent(),/blue/);
    const dusk=await glass.evaluate((canvas)=>canvas.toDataURL());
    assert.ok(morning!==dusk,'daylight control does not change the environment');
    await page.locator('#glass-light').fill('30');
    assert.equal(await page.locator('#glass-light-value').textContent(),'30%');
    assert.ok(dusk!==await glass.evaluate((canvas)=>canvas.toDataURL()),'brightness does not change the environment');
    await page.locator('#glass-motion').click();
    assert.equal(await page.locator('#motion-label').textContent(),'Pause motion');
    assert.equal(await page.locator('#glass-motion-label').textContent(),'Flowing');
    await page.locator('#glass-motion').click();
    assert.equal(await page.locator('#motion-label').textContent(),'Resume motion');
    assert.equal(await page.locator('#glass-motion-label').textContent(),'Still');
    await page.locator('.world-nav a[href="#synapse"]').click();
    await page.waitForFunction(() => document.body.dataset.world==='synapse');
    assert.equal(await page.locator('#motion-label').textContent(),'Resume motion');
    const before=await page.locator('#network').evaluate((canvas)=>canvas.toDataURL());
    await page.waitForTimeout(100);
    assert.ok(before===await page.locator('#network').evaluate((canvas)=>canvas.toDataURL()),'reduced motion changes without input');
    await page.locator('#motion').click();
    await page.waitForTimeout(180);
    assert.ok(before!==await page.locator('#network').evaluate((canvas)=>canvas.toDataURL()),'motion never starts');
    await page.locator('#motion').click();
    const paused=await page.locator('#network').evaluate((canvas)=>canvas.toDataURL());
    await page.waitForTimeout(120);
    assert.ok(paused===await page.locator('#network').evaluate((canvas)=>canvas.toDataURL()),'motion does not stop');
    assert.deepEqual(errors,[]);
    console.log('12 renders verified; pixel changes for every control/palette, glass environment/brightness, inspect/recovery, animation and reduced motion pass.');
  } finally { await browser.close(); }
});
