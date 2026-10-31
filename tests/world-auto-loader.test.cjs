'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const zlib=require('node:zlib');
const engine=require('../js/world-career.js');
const loader=require('../js/world-auto-loader.js');
const PLAYERS='player_id,name,current_club_id,current_club_name,date_of_birth,position,sub_position,market_value_in_eur,last_season,current_club_domestic_competition_id\n418560,Erling Haaland,281,Manchester City,2000-07-21,Attack,Centre-Forward,200000000,2026,GB1\n342229,Kylian Mbappé,418,Real Madrid,1998-12-20,Attack,Centre-Forward,180000000,2026,ES1\n';
const CLUBS='club_id,name,domestic_competition_id\n281,Manchester City,GB1\n418,Real Madrid,ES1\n';
const response=(body,status=200)=>({ok:status===200,status,headers:{get:k=>k==='content-type'?'application/gzip':null},arrayBuffer:async()=>body.buffer.slice(body.byteOffset,body.byteOffset+body.byteLength)});
test('baixa e descompacta automaticamente o snapshot Transfermarkt e preserva os IDs reais',async()=>{
 const calls=[];
 const result=await loader.load({engine,minPlayers:2,fetcher:async url=>{calls.push(url);const part=url.includes('part=clubs')?CLUBS:PLAYERS;return response(zlib.gzipSync(part))}});
 assert.equal(result.players.length,2);assert.equal(result.players[0].id,'tm:418560');assert.equal(result.players[1].id,'tm:342229');
 assert.equal(result.meta.sourceDate,'2026-07-06');assert.equal(result.meta.verified2026Window,false);assert.ok(calls[0].startsWith('/api/world-transfermarkt'));
});
test('reutiliza o snapshot por sessão e não substitui carreiras por trás do usuário',async()=>{
 const a=await loader.load({engine,minPlayers:2,fetcher:async()=>{throw Error('não deve baixar novamente')}});
 assert.equal(a.players.length,2);assert.equal(a.meta.automatic,true);
});
test('rota Cloudflare não aceita urls externas nem partes não autorizadas',async()=>{
 const fs=require('node:fs');const src=fs.readFileSync(require('node:path').join(__dirname,'../functions/api/world-transfermarkt.js'),'utf8');
 const {onRequestGet}=await import('data:text/javascript,'+encodeURIComponent(src));
 const r=await onRequestGet({request:new Request('https://example.com/api/world-transfermarkt?part=https://evil.example/')});
 assert.equal(r.status,400);
});
