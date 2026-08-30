function renderCatGrid(){
  document.getElementById('cat-grid').innerHTML=CAT_CONFIG.map(cfg=>{
    // count includes sub-categories if present
    const cats=cfg.sub?cfg.sub.map(s=>s.name):[cfg.name];
    const count=menu.filter(p=>cats.includes(p.cat)).reduce((s,p)=>s+(order[p.id]||0),0);
    return`<div class="cat-box" onclick="openCategory('${esc(cfg.name)}')">
      <span class="cat-box-emoji">${cfg.emoji}</span>
      <span class="cat-box-name">${cfg.name}</span>
      <span class="cat-box-count ${count>0?'visible':''}" id="cbox-count-${esc(cfg.name)}">${count}</span>
    </div>`;
  }).join('')+
  `<div class="cat-box cat-box-custom" onclick="openCustomPiatto()">
    <span class="cat-box-emoji">✏️</span>
    <span class="cat-box-name">Personaliz.</span>
  </div>`;
}
function refreshCatCounts(){
  CAT_CONFIG.forEach(cfg=>{
    const el=document.getElementById('cbox-count-'+cfg.name);if(!el)return;
    const cats=cfg.sub?cfg.sub.map(s=>s.name):[cfg.name];
    const c=menu.filter(p=>cats.includes(p.cat)).reduce((s,p)=>s+(order[p.id]||0),0);
    el.textContent=c;el.classList.toggle('visible',c>0);
  });
}
function openCategory(catName){
  _currentParentCat=null;
  const cfg=CAT_CONFIG.find(c=>c.name===catName);
  if(cfg&&cfg.sub){
    document.getElementById('cam-level-1').classList.add('hidden');
    document.getElementById('cam-level-2').classList.remove('hidden');
    document.getElementById('cam-piatti-title').textContent=catName;
    document.querySelector('#cam-level-2 .back-btn').onclick=goBackToCategories;
    const listEl=document.getElementById('cam-piatti-list');
    listEl.style.cssText='display:flex;flex-direction:column;gap:12px;padding:12px;padding-bottom:82px;overflow-y:auto;';
    listEl.innerHTML=cfg.sub.map(s=>{
        const c=menu.filter(p=>p.cat===s.name).reduce((t,p)=>t+(order[p.id]||0),0);
        return`<div class="cat-box" style="flex:1" onclick="openSubCategory('${esc(s.name)}','${esc(catName)}')">
          <span class="cat-box-emoji">${s.emoji}</span>
          <span class="cat-box-name">${s.name}</span>
          <span class="cat-box-count ${c>0?'visible':''}">${c}</span>
        </div>`;
      }).join('');
    return;
  }
  document.getElementById('cam-level-1').classList.add('hidden');
  document.getElementById('cam-level-2').classList.remove('hidden');
  document.getElementById('cam-piatti-title').textContent=catName;
  renderPiattiList(catName);
}
function openSubCategory(subCat, parentCat){
  _currentParentCat=parentCat;
  document.getElementById('cam-piatti-title').textContent=subCat;
  renderPiattiList(subCat);
  document.querySelector('#cam-level-2 .back-btn').onclick=()=>{
    _currentParentCat=null;
    openCategory(parentCat);
  };
}
function goBackToCategories(){
  _currentParentCat=null;
  document.getElementById('cam-level-2').classList.add('hidden');
  document.getElementById('cam-level-3').classList.add('hidden');
  document.getElementById('cam-level-1').classList.remove('hidden');
  document.querySelector('#cam-level-2 .back-btn').onclick=goBackToCategories;
  refreshCatCounts();
}

function openCustomPiatto(){
  document.getElementById('cam-level-1').classList.add('hidden');
  document.getElementById('cam-level-3').classList.remove('hidden');
  document.getElementById('custom-step-cat').style.display='flex';
  document.getElementById('custom-step-subcat').style.display='none';
  document.getElementById('custom-step-form').style.display='none';
}

function openCustomSub(label, subs){
  document.getElementById('custom-subcat-label').textContent=label;
  document.getElementById('custom-subcat-btns').innerHTML=subs.map(s=>
    `<div class="cat-box" style="flex:1;background:#2c2c29;border-color:#38362f" onclick="openCustomForm('${s.cat}')">
      <span class="cat-box-emoji">${s.emoji}</span>
      <span class="cat-box-name" style="color:#f0ede8">${s.label}</span>
    </div>`
  ).join('');
  document.getElementById('custom-step-cat').style.display='none';
  document.getElementById('custom-step-subcat').style.display='flex';
  document.getElementById('custom-step-form').style.display='none';
}

function openCustomSubOrForm(label, cat){
  openCustomForm(cat);
}

function openCustomForm(cat){
  document.getElementById('custom-form-cat-label').textContent=cat;
  document.getElementById('custom-piatto-text').value='';
  document.getElementById('custom-piatto-price').value='';
  document.getElementById('custom-add-btn').disabled=true;
  document.getElementById('custom-step-cat').style.display='none';
  document.getElementById('custom-step-subcat').style.display='none';
  document.getElementById('custom-step-form').style.display='flex';
  setTimeout(()=>document.getElementById('custom-piatto-text').focus(),100);
}

function backToCustomCat(){
  document.getElementById('custom-step-form').style.display='none';
  document.getElementById('custom-step-subcat').style.display='none';
  document.getElementById('custom-step-cat').style.display='flex';
}

document.addEventListener('input',e=>{
  if(e.target.id==='custom-piatto-text'){
    document.getElementById('custom-add-btn').disabled=e.target.value.trim().length===0;
  }
});

function addCustomPiatto(){
  const cat=document.getElementById('custom-form-cat-label').textContent;
  const name=document.getElementById('custom-piatto-text').value.trim();
  if(!name) return;
  const priceRaw=document.getElementById('custom-piatto-price').value.trim();
  const price=priceRaw?parseFloat(priceRaw):0;
  const customId='custom_'+Date.now();
  order[customId]=1;
  if(!window._customPiatti) window._customPiatti={};
  window._customPiatti[customId]={id:customId,name,cat,price:isNaN(price)?0:price,custom:true};
  goBackToCategories();
  updateFab();
  renderCart();
  showToast('✓ Piatto personalizzato aggiunto');
}
function renderPiattiList(cat){
  const piatti=menu.filter(p=>p.cat===cat&&p.enabled!==false);
  const el=document.getElementById('cam-piatti-list');
  el.style.cssText='';
  if(!piatti.length){el.innerHTML='<div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--text-mut)">Nessun piatto disponibile</div>';return;}
  const isFish=FISH_CATS.includes(cat);
  el.innerHTML=piatti.map(p=>{
    const qty=order[p.id]||0;
    const ppk=Number(p.price_per_kg||0);
    const bp=Number(p.base_price||p.price||0);
    const kgVal=window._kgMap&&window._kgMap[p.id]!=null?window._kgMap[p.id]:'';
    if(isFish&&ppk>0){
      if(!window._kgMap) window._kgMap={};
      if(window._kgMap[p.id]==null){window._kgMap[p.id]='';}
      const pm=menu.find(x=>x.id===p.id);if(pm){pm._bp=bp;pm._ppk=ppk;}
      const qty=order[p.id]||0;
      const kg=parseFloat(kgVal)||0;
      const dynPrice=kg>0?`€${(bp*qty+ppk*kg).toFixed(2)}`:`€${(bp*qty).toFixed(2)}`;
      return`<div class="cam-piatto-box" id="row-${p.id}">
        <div class="cam-piatto-box-top">
          <div class="cam-piatto-name">${esc(p.name)}</div>
          <div class="cam-piatto-price" id="dynprice-${p.id}">${dynPrice}</div>
        </div>
        <div class="cam-piatto-box-bottom" style="justify-content:stretch;gap:6px;">
          <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;background:#1a1916;border:1.5px solid #4a4842;border-radius:10px;padding:5px 8px;">
            <input type="number" min="0" step="0.1" placeholder="0" value="${kgVal}"
              style="width:100%;background:transparent;border:none;color:#f0ede8;font-size:13px;font-weight:600;text-align:center;outline:none;-moz-appearance:textfield;"
              oninput="updateFishKg('${p.id}',this.value,${bp},${ppk})" onkeydown="if(event.key==='Enter')this.blur()" />
            <span style="font-size:11px;color:#6b6860;flex-shrink:0">kg</span>
          </div>
          <div class="inline-qty" style="flex:2;">
            <button class="iq-btn" style="flex:1" onclick="changeQty('${p.id}',-1)">−</button>
            <span class="iq-val ${qty===0?'zero':''}" id="iq-${p.id}">${qty}</span>
            <button class="iq-btn" style="flex:1" onclick="changeQty('${p.id}',1)">+</button>
          </div>
        </div>
      </div>`;
    }
    return`<div class="cam-piatto-box">
      <div class="cam-piatto-box-top">
        <div class="cam-piatto-name">${esc(p.name)}</div>
        <div class="cam-piatto-price">€${Number(p.price).toFixed(2)}</div>
      </div>
      <div class="cam-piatto-box-bottom">
        <div class="inline-qty" style="width:100%;">
          <button class="iq-btn" style="flex:1" onclick="changeQty('${p.id}',-1)">−</button>
          <span class="iq-val ${qty===0?'zero':''}" id="iq-${p.id}">${qty}</span>
          <button class="iq-btn" style="flex:1" onclick="changeQty('${p.id}',1)">+</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
function updateFishKg(id,val,bp,ppk){
  if(!window._kgMap) window._kgMap={};
  window._kgMap[id]=val;
  const p=menu.find(x=>x.id===id);
  if(p){p._bp=bp;p._ppk=ppk;}
  const qty=order[id]||0;
  const el=document.getElementById('dynprice-'+id);
  if(el){
    const kg=val!==''&&!isNaN(parseFloat(val))?parseFloat(val):0;
    const total=bp*qty||0+ppk*kg;
    el.textContent=`€${total.toFixed(2)}`;
  }
  renderCart();setTotal();
}
function changeQty(id,delta){
  order[id]=(order[id]||0)+delta;
  if(order[id]<=0)delete order[id];
  const el=document.getElementById('iq-'+id);
  if(el){const q=order[id]||0;el.textContent=q;el.className='iq-val'+(q===0?' zero':'');}
  // aggiorna display prezzo per piatti pesce
  const p=menu.find(x=>x.id===id);
  if(p&&p._ppk>0){
    const priceEl=document.getElementById('dynprice-'+id);
    if(priceEl){
      const kg=window._kgMap&&window._kgMap[id]?parseFloat(window._kgMap[id]):0;
      const qty=order[id]||0;
      const total=p._bp*qty||0+p._ppk*kg;
      priceEl.textContent=`€${total.toFixed(2)}`;
    }
  }
  updateFab();renderCart();
}
function updateFab(){
  const total=Object.values(order).reduce((a,b)=>a+b,0);
  const fab=document.getElementById('cart-fab');
  const tv=getTavolo();
  if(tv){fab.classList.remove('hidden');document.getElementById('cart-count').textContent=total;fab.classList.toggle('cart-count-zero',total===0);}
  else fab.classList.add('hidden');
  document.getElementById('send-btn').disabled=total===0||!tv;
}
function openCart(){renderCart();document.getElementById('cart-overlay').classList.add('open');document.body.style.overflow='hidden';}
function closeCart(){document.getElementById('cart-overlay').classList.remove('open');document.body.style.overflow='';}
function renderCart(){
  const el=document.getElementById('cart-body');
  const ids=Object.keys(order);
  if(!ids.length){el.innerHTML='<div class="cart-empty">Nessun piatto aggiunto</div>';setTotal();return;}
  el.innerHTML=ids.map(id=>{
    const p=menu.find(x=>x.id===id)||(window._customPiatti&&window._customPiatti[id]);
    if(!p) return'';
    let totalPrice;
    if(p.custom&&p.price===0){totalPrice=null;}
    else if(p._ppk>0&&window._kgMap&&window._kgMap[id]!=null){
      // pesce: base*qty + ppk*kg
      const kg=parseFloat(window._kgMap[id])||0;
      totalPrice=p._bp*(order[id]||1)+p._ppk*kg;
    }
    else{totalPrice=Number(p.price)*(order[id]||0);}
    const priceStr=totalPrice==null?'—':`€${totalPrice.toFixed(2)}`;
    const kg=p._ppk>0&&window._kgMap&&window._kgMap[id]?` (${parseFloat(window._kgMap[id]).toFixed(2)} kg)`:'';
    return`<div class="cart-item">
      <div class="cart-item-name">${esc(p.name)}${kg}${p.custom?` <span style="font-size:11px;color:#9e9b96">(${esc(p.cat)})</span>`:''}</div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="cartCQ('${id}',-1)">−</button>
        <span class="qty-val-c">${order[id]}</span>
        <button class="qty-btn" onclick="cartCQ('${id}',1)">+</button>
      </div>
      <div class="cart-item-price">${priceStr}</div>
    </div>`;
  }).join('');
  setTotal();
}
function cartCQ(id,delta){
  order[id]=(order[id]||0)+delta;if(order[id]<=0)delete order[id];
  updateFab();renderCart();
  const el=document.getElementById('iq-'+id);
  if(el){const q=order[id]||0;el.textContent=q;el.className='iq-val'+(q===0?' zero':'');}
}
function setTotal(){
  let tot=0;let hasUnpriced=false;
  for(const id in order){
    if(window._customPiatti&&window._customPiatti[id]){
      const cp=window._customPiatti[id];
      if(cp.price>0) tot+=cp.price*order[id];
      else hasUnpriced=true;
      continue;
    }
    const p=menu.find(x=>x.id===id);
    if(!p) continue;
    if(p._ppk>0&&window._kgMap&&window._kgMap[id]!=null){
      const kg=parseFloat(window._kgMap[id])||0;
      tot+=p._bp*(order[id]||1)+p._ppk*kg;
    } else {
      tot+=Number(p.price)*order[id];
    }
  }
  document.getElementById('cart-total').textContent='€'+tot.toFixed(2)+(hasUnpriced?' + da definire':'');
}
async function sendComanda(){
  const tv=getTavolo();
  if(!tv||!Object.keys(order).length)return;
  const note=document.getElementById('order-note').value.trim();
  const piatti=Object.entries(order).map(([id,qty])=>{
    if(window._customPiatti&&window._customPiatti[id]){
      const cp=window._customPiatti[id];
      return{name:cp.name,qty,price:cp.price||0,cat:cp.cat,custom:true};
    }
    const p=menu.find(x=>x.id===id);
    const kg=(p&&p._ppk>0&&window._kgMap&&window._kgMap[id]!=null)?parseFloat(window._kgMap[id]):null;
    const price=p?(p._ppk>0&&kg!=null?p._bp*(qty||1)+p._ppk*kg:Number(p.price)):0;
    return{name:p?p.name:id,qty,price,cat:p?p.cat:'',kg:kg!=null?kg:undefined};
  });
  const c={id:'c'+Date.now(),tavolo:tv,piatti,note,stato:'attivo',ts:Date.now()};
  setSyncState('syncing');
  const{error}=await sb.from('comande').insert(c);
  if(error){setSyncState('error');showToast('❌ Errore invio comanda');return;}
  setSyncState('online');
  order={};
  if(window._customPiatti) window._customPiatti={};
  if(window._kgMap) window._kgMap={};
  menu.forEach(p=>delete p._dynPrice);
  document.getElementById('order-note').value='';
  document.getElementById('sel-tavolo').value='';
  closeCart();updateFab();renderCart();renderCatGrid();
  // torna alla schermata iniziale (griglia categorie)
  document.getElementById('cam-level-1').classList.remove('hidden');
  document.getElementById('cam-level-2').classList.add('hidden');
  showToast('✅ Comanda tavolo '+tv+' inviata!');
}

