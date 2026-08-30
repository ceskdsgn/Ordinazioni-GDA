function getTavolo(){
  return document.getElementById('sel-tavolo').value;
}

function onTavoloSelect(){ updateFab(); }

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function getCategories(){return[...new Set(menu.map(d=>d.cat))];}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.style.opacity=1;clearTimeout(t._t);t._t=setTimeout(()=>{t.style.opacity=0;},2400);}
function setSyncState(s){document.getElementById('sync-dot').className='sync-dot '+s;}

function showTab(tab){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('visible'));
  document.querySelectorAll('.tab-bar-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('screen-'+tab).classList.add('visible');
  // dark topbar only on sala
  document.querySelector('.topbar').classList.toggle('dark-nav', tab==='cameriere');
  const m={cameriere:'sala',cucina:'cuci',tavoli:'tavo',menu:'menu'};
  document.getElementById('tab-'+m[tab]).classList.add('active');
  if(tab==='cucina') loadCucina();
  if(tab==='tavoli') loadTavoli();
}
