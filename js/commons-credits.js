/* Wikimedia attribution notice for crests returned by the live lookup.
   Preserves file page, author and license text; untrusted data is textContent. */
(()=>{'use strict';
const key='btl-wikimedia-credits-v15';
const $=s=>document.querySelector(s);
const btn=$('#commons-attribution-open'),modal=$('#commons-attribution-modal'),list=$('#commons-attribution-list');
if(!btn||!modal||!list)return;
function safeFilePage(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='commons.wikimedia.org'?u.href:null}catch{return null}}
function open(){let entries=[];try{entries=Object.entries(JSON.parse(localStorage.getItem(key)||'{}'))}catch(_){}
 list.replaceChildren();if(!entries.length){const p=document.createElement('p');p.textContent='Nenhum escudo do Wikimedia Commons foi carregado neste navegador ainda. Consulte os escudos ao jogar e volte aqui para verificar os créditos.';list.appendChild(p)}
 for(const [club,c] of entries){const row=document.createElement('div');row.className='commons-credit-row';const strong=document.createElement('strong');strong.textContent=club;row.appendChild(strong);const small=document.createElement('small');small.textContent='Licença: '+String(c.license||'consultar página do arquivo');row.appendChild(small);const file=safeFilePage(c.filePage);if(file){const a=document.createElement('a');a.href=file;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Abrir arquivo e atribuição no Commons ↗';row.appendChild(a)}list.appendChild(row)}
 modal.classList.remove('hidden');$('#commons-attribution-close')?.focus()}
btn.addEventListener('click',open);$('#commons-attribution-close')?.addEventListener('click',()=>modal.classList.add('hidden'));
modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))modal.classList.add('hidden')});
})();
