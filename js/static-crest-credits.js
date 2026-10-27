/* Attribution and provenance for community-sourced static club crests. */
(()=>{
const trigger=document.querySelector('[data-commons-credits]')||document.getElementById('commons-attribution-open');
const modal=document.getElementById('commons-attribution-modal');
const close=document.getElementById('commons-attribution-close');
const list=document.getElementById('commons-attribution-list');
function show(){
 if(!modal)return;modal.classList.remove('hidden');
 if(list){
   list.replaceChildren();
   const intro=document.createElement('p');intro.innerHTML='<strong>Escudos:</strong> <a href="https://github.com/JoseArroyave/football-logos" target="_blank" rel="noopener noreferrer">catálogo estático do GitHub</a>. Os símbolos pertencem aos respectivos clubes.';list.appendChild(intro);
   const title=document.createElement('h3');title.textContent='Troféus — Wikimedia Commons';list.appendChild(title);
   for(const item of (window.BTL_COMMONS_TROPHIES||[]).filter(x=>x.src)){
     const row=document.createElement('div');row.className='commons-credit-row';
     const label=document.createElement('strong');label.textContent=item.file;row.appendChild(label);
     const meta=document.createElement('small');meta.textContent=`Autor: ${item.author||'consultar Commons'} · Licença: ${item.license||'consultar Commons'}`;row.appendChild(meta);
     const link=document.createElement('a');link.href=item.page;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Arquivo, licença e atribuição no Wikimedia Commons';row.appendChild(link);
     list.appendChild(row);
   }
 }

}
trigger?.addEventListener('click',show);
close?.addEventListener('click',()=>modal?.classList.add('hidden'));
})();
