const DOLCI_CATS = ['Dessert'];

async function loadDolci(){
  const{data,error}=await sb.from('comande').select('*').eq('stato','attivo').order('ts');
  if(error){setSyncState('error');return;}
  comande=data||[];setSyncState('online');updateTabCounts();renderDolci();
}

function renderDolci(){
  const el=document.getElementById('dolci-grid');
  if(!el) return;

  const comandeConDolci=comande.filter(c=>{
    const piatti=parsePiatti(c);
    return piatti.some(p=>DOLCI_CATS.includes(p.cat));
  });

  if(!comandeConDolci.length){el.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px;color:#1a1916;font-size:15px;font-weight:500">Nessuna comanda dolci</div>';return;}

  el.innerHTML=comandeConDolci.map(c=>{
    const time=new Date(c.ts).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
    const piatti=parsePiatti(c).filter(p=>DOLCI_CATS.includes(p.cat));

    const righe=piatti.map(p=>`<div class="piatto-riga">
        <div class="piatto-riga-info">
          <span class="piatto-riga-qty">${p.qty}×</span>
          <span class="piatto-riga-name">${esc(p.name)}</span>
        </div>
      </div>`).join('');

    return`<div class="comanda-card">
      <div class="comanda-head">
        <div class="comanda-tavolo-wrap">
          <span class="comanda-tavolo">Tavolo ${c.tavolo}</span>
          <span class="comanda-time">${time}</span>
        </div>
        <button class="comanda-del-btn" onclick="cancellaDolci('${c.id}')" title="Cancella">✕</button>
      </div>
      <div class="cat-group"><div class="cat-bar cat-bar-4">D</div><div class="cat-righe">${righe}</div></div>
      ${c.note?`<div class="comanda-note"><span class="comanda-note-label">Note</span> ${esc(c.note)}</div>`:''}
    </div>`;
  }).join('');
}

async function cancellaDolci(id){
  const modal=document.getElementById('modal-cancella');
  modal.classList.add('open');
  const oldBtn=document.getElementById('modal-confirm-btn');
  const newBtn=oldBtn.cloneNode(true);
  oldBtn.replaceWith(newBtn);
  newBtn.addEventListener('click',async()=>{
    chiudiModale();
    setSyncState('syncing');
    const{error}=await sb.from('comande').update({stato:'eliminato_cucina'}).eq('id',id);
    if(error){setSyncState('error');showToast('❌ Errore cancellazione');return;}
    setSyncState('online');showToast('Comanda cancellata');
    await loadDolci();
  });
}
