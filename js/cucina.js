async function loadCucina(silent=false){
  const{data,error}=await sb.from('comande').select('*').eq('stato','attivo').order('ts');
  if(error){setSyncState('error');return;}
  comande=data||[];setSyncState('online');updateTabCounts();renderCucina(silent);
}

function parsePiatti(c){return Array.isArray(c.piatti)?c.piatti:JSON.parse(c.piatti||'[]');}

function playNotificationSound(){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    [[880,0,0.25],[1100,0.15,0.25],[1320,0.3,0.4]].forEach(([freq,start,dur])=>{
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.type='sine';osc.frequency.value=freq;
      gain.gain.setValueAtTime(1.0,ctx.currentTime+start);
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+start+dur);
      osc.start(ctx.currentTime+start);
      osc.stop(ctx.currentTime+start+dur+0.05);
    });
  }catch(e){}
}

function renderCucina(silent=false){

  const el=document.getElementById('cucina-grid');
  if(!comande.length){el.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-mut);font-size:15px">Nessuna comanda</div>';return;}

  let hasNew=false;
  el.innerHTML=comande.map(c=>{
    const isNew=!cucinaSeenIds.has(c.id);if(isNew){cucinaSeenIds.add(c.id);hasNew=true;}
    const time=new Date(c.ts).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
    const piatti=parsePiatti(c);

    const SOLO_TAVOLI=['Dessert','Bevande','Bibite','Vini','Birre','Bar','Coperti'];
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
        <div class="comanda-tavolo-wrap">
          <span class="comanda-tavolo">Tavolo ${c.tavolo}</span>
          <span class="comanda-time">${time}</span>
        </div>
        ${isNew?'<span class="new-badge">NUOVO</span>':''}
        <button class="comanda-del-btn" onclick="cancellaComanda('${c.id}')" title="Cancella">✕</button>
      </div>
      ${catHtml}
      ${c.note?`<div class="comanda-note"><span class="comanda-note-label">Note</span> ${esc(c.note)}</div>`:''}
    </div>`;
  }).join('');
  if(hasNew && !silent) playNotificationSound();
}

function chiudiModale(){document.getElementById('modal-cancella').classList.remove('open');}

async function cancellaComanda(id){
  setSyncState('syncing');
  const{error}=await sb.from('comande').update({stato:'eliminato_cucina'}).eq('id',id);
  if(error){setSyncState('error');showToast('❌ Errore cancellazione');return;}
  setSyncState('online');showToast('Comanda cancellata');
  await loadCucina();
}

