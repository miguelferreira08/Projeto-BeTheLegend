/* Attribution and provenance for community-sourced static club crests. */
(()=>{
const trigger=document.querySelector('[data-commons-credits]')||document.getElementById('commons-attribution-open');
const modal=document.getElementById('commons-attribution-modal');
const close=document.getElementById('commons-attribution-close');
const list=document.getElementById('commons-attribution-list');
function show(){
 if(!modal)return;modal.classList.remove('hidden');
 if(list)list.innerHTML='<p><strong>Fonte:</strong> <a href="https://github.com/JoseArroyave/football-logos" target="_blank" rel="noopener noreferrer">JoseArroyave/football-logos (GitHub)</a></p><p>Imagem SVG por clube e país; catálogo associado a um commit específico. Escudos e marcas pertencem aos clubes. A versão pode ficar desatualizada quando uma equipe muda de símbolo.</p>'
}
trigger?.addEventListener('click',show);
close?.addEventListener('click',()=>modal?.classList.add('hidden'));
})();
