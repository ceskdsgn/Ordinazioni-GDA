function renderCatSelect(){
  const flatCats=CAT_CONFIG.flatMap(c=>c.sub||[c]);
  const sel=document.getElementById('dish-cat-sel');
  sel.innerHTML=`<option value="">— Categoria —</option>`+flatCats.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
  checkAddDishBtn();
}
function checkAddDishBtn(){
  const name=document.getElementById('dish-name').value.trim();
  const price=document.getElementById('dish-price').value.trim();
  const cat=document.getElementById('dish-cat-sel').value;
  const btn=document.getElementById('add-dish-btn');
  if(btn) btn.disabled=!(name&&price&&cat);
}
function renderDishList(){
  const el=document.getElementById('dish-list');
  if(!menu.length){el.innerHTML='<div class="no-dishes">Nessun piatto. Aggiungine uno sopra!</div>';return;}
  const flatCats=CAT_CONFIG.flatMap(c=>c.sub?c.sub:[c]).map(c=>c.name);
  const byCat={};
  flatCats.forEach(c=>byCat[c]=[]);
  menu.forEach(d=>{
    const k=d.cat&&byCat[d.cat]!==undefined?d.cat:flatCats[0];
    byCat[k].push(d);
  });
  el.innerHTML=flatCats.map(cat=>{
    const items=byCat[cat];
    if(!items.length) return '';
    const isFish=FISH_CATS.includes(cat);
    const rows=items.map(d=>{
      const enabled=d.enabled!==false;
      const ppk=Number(d.price_per_kg||0);
      const bp=Number(d.base_price||d.price||0);
      const priceLabel=ppk>0?`base €${bp.toFixed(2)} + €${ppk.toFixed(2)}/kg`:`€${Number(d.price).toFixed(2)}`;
      return`
      <div class="dish-list-item${enabled?'':' disabled-dish'}" id="dish-item-${d.id}">
        <div class="dish-info">
          <div class="dish-name">${esc(d.name)}${enabled?'':' <span style="font-size:11px;color:var(--text-mut)">(non disp.)</span>'}</div>
          <div class="dish-meta">${priceLabel}</div>
        </div>
        <button class="dish-toggle-btn" onclick="toggleDishEnabled('${d.id}')" title="${enabled?'Disabilita':'Abilita'}">${enabled?'⏸':'▶'}</button>
        <button class="dish-edit-btn" onclick="toggleEditDish('${d.id}')" title="Modifica">✏️</button>
        <button class="dish-delete" onclick="deleteDish('${d.id}')">🗑</button>
      </div>
      <div class="dish-edit-form" id="dish-edit-${d.id}">
        <div class="dish-edit-row">
          <input class="form-input" id="edit-name-${d.id}" value="${esc(d.name)}" placeholder="Nome" />
          <select class="form-select" id="edit-cat-${d.id}">${CAT_CONFIG.flatMap(c=>c.sub||[c]).map(c=>`<option value="${esc(c.name)}"${c.name===d.cat?' selected':''}>${esc(c.name)}</option>`).join('')}</select>
        </div>
        ${isFish?`
        <div class="dish-edit-row">
          <input class="form-input form-input-sm" id="edit-baseprice-${d.id}" type="number" min="0" step="0.5" value="${bp.toFixed(2)}" placeholder="€ base fissa" />
          <input class="form-input form-input-sm" id="edit-ppk-${d.id}" type="number" min="0" step="0.1" value="${ppk.toFixed(2)}" placeholder="€/kg pesce" />
        </div>
        <div style="display:flex;gap:8px;font-size:11px;color:var(--text-mut);padding:0 2px">
          <span style="flex:1;text-align:center">€ fissi</span>
          <span style="flex:1;text-align:center">€/kg</span>
        </div>
        <div style="font-size:12px;color:var(--text-sec);padding:2px 2px 0">Prezzo = base fissa + (kg × €/kg)</div>
        `:`
        <div class="dish-edit-row">
          <input class="form-input form-input-sm" id="edit-price-${d.id}" type="number" min="0" step="0.5" value="${Number(d.price).toFixed(2)}" placeholder="€" />
        </div>
        `}
        <button class="add-dish-btn" style="margin-top:4px" onclick="saveDish('${d.id}')">Salva modifiche</button>
      </div>`;
    }).join('');
    return`<div class="dish-cat-section">
      <div class="dish-cat-label">${esc(cat)}</div>
      <div class="dish-cat-items">${rows}</div>
    </div>`;
  }).join('');
}
function toggleEditDish(id){
  const form=document.getElementById('dish-edit-'+id);
  form.classList.toggle('open');
}
async function toggleDishEnabled(id){
  const d=menu.find(x=>x.id===id);if(!d)return;
  const enabled=d.enabled===false?true:false;
  setSyncState('syncing');
  const{error}=await sb.from('menu').update({enabled}).eq('id',id);
  if(error){setSyncState('error');showToast('❌ Errore');return;}
  setSyncState('online');await loadMenu();
  showToast(enabled?'✓ Piatto abilitato':'⏸ Piatto disabilitato');
}
async function saveDish(id){
  const d=menu.find(x=>x.id===id);if(!d)return;
  const name=document.getElementById('edit-name-'+id).value.trim();
  const cat=document.getElementById('edit-cat-'+id).value;
  if(!name||!cat){showToast('❌ Dati non validi');return;}
  const isFish=FISH_CATS.includes(cat);
  let update={name,cat};
  if(isFish){
    const base_price=parseFloat(document.getElementById('edit-baseprice-'+id).value)||0;
    const price_per_kg=parseFloat(document.getElementById('edit-ppk-'+id).value)||0;
    update={...update,base_price,price_per_kg,price:base_price};
  } else {
    const price=parseFloat(document.getElementById('edit-price-'+id).value);
    if(isNaN(price)||price<0){showToast('❌ Prezzo non valido');return;}
    update={...update,price,base_price:0,price_per_kg:0};
  }
  setSyncState('syncing');
  const{error}=await sb.from('menu').update(update).eq('id',id);
  if(error){setSyncState('error');showToast('❌ Errore salvataggio');return;}
  setSyncState('online');await loadMenu();showToast('Piatto aggiornato!');
}
async function addDish(){
  const name=document.getElementById('dish-name').value.trim();
  const price=parseFloat(document.getElementById('dish-price').value);
  const cat=document.getElementById('dish-cat-sel').value;
  const errEl=document.getElementById('add-dish-err');errEl.textContent='';
  if(!name){errEl.textContent='Inserisci il nome del piatto.';return;}
  if(!cat){errEl.textContent='Seleziona una categoria.';return;}
  const isFish=FISH_CATS.includes(cat);
  if(!isFish&&(isNaN(price)||price<0)){errEl.textContent='Inserisci un prezzo valido.';return;}
  const row={id:'p'+Date.now(),cat,name,sort_order:menu.length,enabled:true};
  if(isFish){row.price=price||0;row.base_price=price||0;row.price_per_kg=0;}
  else{row.price=price;row.base_price=0;row.price_per_kg=0;}
  setSyncState('syncing');
  const{error}=await sb.from('menu').insert(row);
  if(error){setSyncState('error');showToast('❌ Errore salvataggio');return;}
  setSyncState('online');
  document.getElementById('dish-name').value='';
  document.getElementById('dish-price').value='';
  document.getElementById('dish-cat-sel').value='';
  checkAddDishBtn();
  await loadMenu();showToast('Piatto aggiunto!');
}
async function deleteDish(id){
  setSyncState('syncing');
  await sb.from('menu').delete().eq('id',id);
  setSyncState('online');await loadMenu();
}
async function moveDish(i,dir){
  const j=i+dir;if(j<0||j>=menu.length)return;
  [menu[i],menu[j]]=[menu[j],menu[i]];
  renderDishList();await saveMenuOrder();await loadMenu();
}
