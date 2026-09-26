'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),pilot=path.join(root,'games/rechten/trainer-v2');
const M=require('../games/rechten/trainer-v2/semantic-math-core.js');

test('the pilot leaves every audited production engine, auth, storage, UI and pre-existing test byte-identical',()=>{
 const manifest=require('../docs/rechten-v2/V1_BASELINE_SHA256.json');assert(Object.keys(manifest).length>=80);
 for(const [file,expected] of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),expected,file+' changed outside pilot');
});

test('every semantic/decorative asset resolves with a documented fallback and bounded size',()=>{
 const {assets}=require('../games/rechten/trainer-v2/content/assets.json'),ids=new Set(assets.map(a=>a.id));
 assert.equal(ids.size,assets.length);
 for(const asset of assets){for(const field of ['source','renderer','aspectRatio','safeZone','layer','fallback','brief'])assert(asset[field]?.trim(),asset.id+' '+field);const file=fs.statSync(path.join(pilot,asset.source)),raster=asset.source.endsWith('.webp'),font=asset.source.endsWith('.ttf');assert(asset.budgetBytes>0&&asset.budgetBytes<=(raster?750000:font?250000:8192));assert(file.isFile());if(raster||font)assert(file.size<=asset.budgetBytes,asset.id+' exceeds its real file budget');}
 for(const world of ['grenspas','hellingrug','signaalstad'])for(let variant=0;variant<6;variant++)for(const slot of M.makeTask(world,{variant}).asset_slots)assert(ids.has(slot),slot);
});

test('paper, text, feedback and primary-action design tokens meet 4.5:1 text contrast',()=>{
 const css=fs.readFileSync(path.join(pilot,'styles/tokens.css'),'utf8'),colors=Object.fromEntries([...css.matchAll(/--([\w-]+):(#\w{6})/g)].map(m=>[m[1],m[2]]));
 const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};
 const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 for(const background of ['paper','surface','soft'])for(const foreground of ['ink','muted','accent','error'])assert(contrast(colors[foreground],colors[background])>=4.5,foreground+' on '+background);
 assert(contrast('#ffffff',colors.accent)>=4.5,'primary button');
 for(const background of ['paper','surface'])assert(contrast(colors.focus,colors[background])>=3,'focus outline');
});
