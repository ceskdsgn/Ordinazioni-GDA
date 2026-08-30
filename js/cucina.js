async function loadCucina(){
  const{data,error}=await sb.from('comande').select('*').eq('stato','attivo').order('ts');
  if(error){setSyncState('error');return;}
  comande=data||[];setSyncState('online');updateTabCounts();renderCucina();
}

function parsePiatti(c){return Array.isArray(c.piatti)?c.piatti:JSON.parse(c.piatti||'[]');}

function renderCucina(){

  const el=document.getElementById('cucina-grid');
  if(!comande.length){el.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-mut);font-size:15px">Nessuna comanda</div>';return;}

  el.innerHTML=comande.map(c=>{
    const isNew=!cucinaSeenIds.has(c.id);if(isNew)cucinaSeenIds.add(c.id);
    const time=new Date(c.ts).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
    const piatti=parsePiatti(c);

    const SOLO_TAVOLI=['Dessert','Bevande','Bibite','Vini','Birre','Bar'];
    const catOrder=CAT_CONFIG.map(x=>x.name);
    const byCat={};
    piatti.forEach(p=>{
      const k=p.cat||'Altro';
      if(SOLO_TAVOLI.includes(k)) return;
      if(!byCat[k]) byCat[k]=[];
      byCat[k].push(p);
    });
    const cats=[...catOrder.filter(c=>byCat[c]),...Object.keys(byCat).filter(c=>!catOrder.includes(c))];
    if(!cats.length) return '';

    const CAT_LETTER={'Antipasti':'A','Primi di mare':'P','Primi di terra':'P','Secondi di mare':'S','Secondi di carne':'S','Contorni':'C','Bibite':'B','Birre':'B','Vini':'V'};
    const CAT_COLOR_IDX={'Antipasti':0,'Primi di mare':1,'Primi di terra':1,'Secondi di mare':2,'Secondi di carne':2,'Contorni':3,'Dessert':4,'Bibite':5,'Vini':5,'Birre':5,'Bar':6};
    const catHtml=cats.map(cat=>{
      const idx=CAT_COLOR_IDX[cat]!==undefined?CAT_COLOR_IDX[cat]:catOrder.indexOf(cat);
      const barCls=idx>=0?'cat-bar-'+idx:'cat-bar-other';
      const letter=CAT_LETTER[cat]||cat.charAt(0).toUpperCase();
      const righe=byCat[cat].map(p=>`<div class="piatto-riga">
          <div class="piatto-riga-info">
            <span class="piatto-riga-qty">${p.qty}×</span>
            <span class="piatto-riga-name">${esc(p.name)}${p.kg!=null?`<span style="font-size:15px;font-weight:500;color:var(--text-pri)"> ${Number(p.kg).toFixed(2)} kg</span>`:''}</span>
          </div>
        </div>`).join('');
      return`<div class="cat-group"><div class="cat-bar ${barCls}">${letter}</div><div class="cat-righe">${righe}</div></div>`;
    }).join('');

    return`<div class="comanda-card">
      <div class="comanda-head">
        <span class="comanda-tavolo">Tavolo ${c.tavolo}</span>
        ${isNew?'<span class="new-badge">NUOVO</span>':''}
        <span class="comanda-time">${time}</span>
        <button class="comanda-del-btn" onclick="cancellaComanda('${c.id}')" title="Cancella">✕</button>
      </div>
      ${catHtml}
      ${c.note?`<div class="comanda-note"><span class="comanda-note-label">Note</span> ${esc(c.note)}</div>`:''}
    </div>`;
  }).join('');
}

function chiudiModale(){document.getElementById('modal-cancella').classList.remove('open');}

async function cancellaComanda(id){
  const modal=document.getElementById('modal-cancella');
  modal.classList.add('open');
  const oldBtn=document.getElementById('modal-confirm-btn');
  const newBtn=oldBtn.cloneNode(true);
  oldBtn.replaceWith(newBtn);
  newBtn.addEventListener('click',async()=>{
    chiudiModale();
    setSyncState('syncing');
    // aggiorna solo lo stato: rimane visibile in tavoli ma sparisce dalla cucina
    const{error}=await sb.from('comande').update({stato:'eliminato_cucina'}).eq('id',id);
    if(error){setSyncState('error');showToast('❌ Errore cancellazione');return;}
    setSyncState('online');showToast('Comanda cancellata');
    await loadCucina();
  });
}

