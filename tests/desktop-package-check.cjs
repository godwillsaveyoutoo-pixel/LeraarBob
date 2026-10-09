/* Static wiring check: no browser or production data required. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'os/index.html'),'utf8'),js=fs.readFileSync(path.join(root,'os/desktop.js'),'utf8'),css=fs.readFileSync(path.join(root,'os/desktop.css'),'utf8');
const ids=new Set();for(const match of html.matchAll(/\bid="([^\"]+)"/g)){assert(!ids.has(match[1]),'Duplicate DOM ID: '+match[1]);ids.add(match[1]);}
for(const match of js.matchAll(/\$\('([^']+)'\)/g))assert(ids.has(match[1]),'Missing desktop control: '+match[1]);
let linked=0;for(const match of html.matchAll(/(?:src|href)="([^\"]+)"/g)){
  const url=match[1];if(url.startsWith('#')||/^(https?:|data:)/.test(url))continue;
  const file=path.resolve(root,'os',url.split(/[?#]/)[0]);assert(file.startsWith(root+path.sep));assert(fs.existsSync(file),'Missing frontend dependency: '+url);linked++;
}
for(const match of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g))assert(fs.existsSync(path.resolve(root,'os',match[1])),'Missing wallpaper: '+match[1]);
assert(!js.includes('completeUnit('));assert(!js.includes('saveLatest('));assert(!js.includes('signInWithPassword('));
console.log(`Desktop package: ${ids.size} controls and ${linked} local frontend dependencies verified; engines remain responsible for input and learning saves.`);
