#!/usr/bin/env node
/* Builds a self-contained roster snapshot from the user's Kaggle/Transfermarkt CSV.
   Does NOT scrape Transfermarkt or claim data freshness. */
'use strict';
const fs=require('node:fs'),zlib=require('node:zlib'),path=require('node:path');
const world=require('../js/world-career.js');
const input=process.argv.slice(2).filter(x=>!x.startsWith('--'));
const dateArg=process.argv.slice(2).find(x=>x.startsWith('--as-of='));
const asOf=dateArg?dateArg.slice('--as-of='.length):'2026-07-06';
if(!/^\d{4}-\d\d-\d\d$/.test(asOf))throw Error('Formato de data: --as-of=AAAA-MM-DD');
const playerFile=input[0],clubFile=input[1];
if(!playerFile){console.error('Uso: node tools/build-world-catalog.cjs players.csv[.gz] [clubs.csv[.gz]] [--as-of=AAAA-MM-DD]');process.exit(2)}
const parse=file=>{const content=fs.readFileSync(file);return world.parseCSV(/\.gz$/i.test(file)?zlib.gunzipSync(content).toString('utf8'):content.toString('utf8'))};
const result=world.mapTransfermarkt(parse(playerFile),{sourceDate:asOf,year:2026});
if(clubFile)world.attachClubs(result.players,parse(clubFile));
if(result.players.length<5)throw Error('CSV insuficiente: menos de cinco atletas elegíveis.');
const metadata={source:'Transfermarkt via Kaggle',sourceDate:asOf,records:result.players.length,excluded:result.omitted,note:'Snapshot datado. Overall/potencial são estimativas de simulação, não atributos Transfermarkt.'};
const destination=path.join(__dirname,'../js/world-catalog.js');
const js='/* Gerado localmente a partir do arquivo selecionado pelo editor. */\nwindow.BTLTransfermarktSeed='+JSON.stringify({meta:metadata,players:result.players}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';\n';
fs.writeFileSync(destination,js);
console.log(JSON.stringify({destination,players:result.players.length,excluded:result.omitted,sizeBytes:Buffer.byteLength(js),asOf},null,2));
