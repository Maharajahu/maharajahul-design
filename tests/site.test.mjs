import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('..',import.meta.url));
const site = await readFile(path.join(root,'index.html'),'utf8');
const readme = await readFile(path.join(root,'README.md'),'utf8');

test('published README and showcase reference existing local files', async () => {
  const refs = new Set([...`${site}\n${readme}`.matchAll(/(?:href|src)="([^"]+)"|\]\(([^)]+)\)/g)].map((match)=>match[1] || match[2]));
  for(const ref of refs) {
    if(/^(?:https?:|#|data:)/.test(ref)) continue;
    const relative = ref.split(/[?#]/)[0];
    const resolved = path.resolve(root,relative);
    const info = await stat(resolved).catch(()=>null);
    assert.ok(info,'Missing publication target: '+ref);
    if(info.isDirectory()) assert.ok((await stat(path.join(resolved,'index.html'))).isFile(),ref+' has no index');
  }
});

test('all six future studies have real preview images and live links', async () => {
  for(const name of ['orbis','morph','synapse','velocity','chroma','lucent']) {
    assert.ok(site.includes(`href="samples/future/#${name}"`),'Missing scene link: '+name);
    assert.ok(readme.includes(`samples/future/#${name}`),'Missing README scene link: '+name);
    const data = await readFile(path.join(root,'assets','previews',name+'.jpg'));
    assert.equal(data.readUInt16BE(0),0xffd8,name+' is not a JPEG');
    assert.ok(data.length>10000 && data.length<1000000,name+' preview has an unexpected size');
  }
});

test('showcase loads local assets without third-party runtime code', () => {
  assert.equal(/<script\b/i.test(site),false);
  assert.equal(/<(?:img|link)[^>]+(?:src|href)="https?:/i.test(site),false);
  assert.ok(site.includes('name="viewport"'));
  assert.ok(site.includes('prefers-reduced-motion'));
  assert.ok(site.includes('class="skip"'));
});
