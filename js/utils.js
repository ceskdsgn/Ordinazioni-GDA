function getTavolo(){
  return document.getElementById('sel-tavolo').value;
}

function onTavoloSelect(){
  const tv=getTavolo();
  const wrap=document.getElementById('coperti-wrap');
  if(tv){
    copertiCount=2;
    document.getElementById('coperti-val').textContent=copertiCount;
    wrap.classList.remove('hidden');
  } else {
    wrap.classList.add('hidden');
  }
  updateFab();
}

function changeCoperti(delta){
  copertiCount=Math.max(1,copertiCount+delta);
  document.getElementById('coperti-val').textContent=copertiCount;
}

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function getCategories(){return[...new Set(menu.map(d=>d.cat))];}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.style.opacity=1;clearTimeout(t._t);t._t=setTimeout(()=>{t.style.opacity=0;},2400);}
function setSyncState(s){document.getElementById('sync-dot').className='sync-dot '+s;}

function updateTabCounts(){
  const SOLO_TAVOLI=['Dessert','Bevande','Bibite','Vini','Birre','Bar'];
  const cucinaCount=comande.filter(c=>parsePiatti(c).some(p=>!SOLO_TAVOLI.includes(p.cat||'Altro'))).length;
  const dolciCount=comande.filter(c=>parsePiatti(c).some(p=>p.cat==='Dessert')).length;
  const cucinaEl=document.getElementById('cucina-tab-count');
  if(cucinaEl){cucinaEl.textContent=cucinaCount;cucinaEl.style.display=cucinaCount?'inline':'none';}
  const dolciEl=document.getElementById('dolci-tab-count');
  if(dolciEl){dolciEl.textContent=dolciCount;dolciEl.style.display=dolciCount?'inline':'none';}
}

function showTab(tab){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('visible'));
  document.querySelectorAll('.tab-bar-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('screen-'+tab).classList.add('visible');
  // dark topbar only on sala
  document.querySelector('.topbar').classList.toggle('dark-nav', tab==='cameriere');
  const m={cameriere:'sala',cucina:'cuci',dolci:'dolci',tavoli:'tavo',menu:'menu'};
  document.getElementById('tab-'+m[tab]).classList.add('active');
  if(tab==='cucina') loadCucina(true);
  if(tab==='dolci') loadDolci();
  if(tab==='tavoli') loadTavoli();
}
