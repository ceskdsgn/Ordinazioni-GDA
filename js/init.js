/* ── PIN ── */
let _pinBuffer='';

function pinCheckStored(){
  const ts=localStorage.getItem('rist_pin_ts');
  return ts && (Date.now()-parseInt(ts)<PIN_EXPIRY_MS);
}

function pinUnlock(){
  localStorage.setItem('rist_pin_ts',Date.now().toString());
  document.getElementById('pin-screen').classList.add('unlocked');
}

function pinUpdateDots(){
  document.querySelectorAll('.pin-dot').forEach((d,i)=>{
    d.classList.toggle('filled',i<_pinBuffer.length);
  });
}

function pinKey(digit){
  if(_pinBuffer.length>=4) return;
  _pinBuffer+=digit;
  pinUpdateDots();
  if(_pinBuffer.length===4){
    if(_pinBuffer===PIN_CODE){
      pinUnlock();
    } else {
      const dots=document.getElementById('pin-dots');
      dots.classList.add('shake');
      document.getElementById('pin-err').textContent='Codice errato';
      setTimeout(()=>{
        dots.classList.remove('shake');
        _pinBuffer='';
        pinUpdateDots();
        document.getElementById('pin-err').textContent='';
      },400);
    }
  }
}

function pinDel(){
  if(!_pinBuffer.length) return;
  _pinBuffer=_pinBuffer.slice(0,-1);
  pinUpdateDots();
}

async function init(){
  setSyncState('syncing');
  const sel=document.getElementById('sel-tavolo');
  for(let i=1;i<=NUM_TAVOLI;i++) sel.innerHTML+=`<option value="${i}">Tavolo ${i}</option>`;
  // sala is the default tab → apply dark nav immediately
  document.querySelector('.topbar').classList.add('dark-nav');
  await loadMenu();
  subscribeRealtime();
}

/* ── MENU ── */
async function loadMenu(){
  setSyncState('syncing');
  const{data,error}=await sb.from('menu').select('*').order('sort_order').order('id');
  if(error){setSyncState('error');showToast('❌ Errore caricamento menu');return;}
  menu=data.length?data:await seedDefaultMenu();
  setSyncState('online');
  renderCatGrid();renderDishList();renderCatSelect();
  loadSalaLevel0();
}
async function seedDefaultMenu(){
  const d=[
    {id:'p1',cat:'Antipasti',name:'Bruschetta al pomodoro',price:6,sort_order:1},
    {id:'p2',cat:'Antipasti',name:'Tagliere misto',price:12,sort_order:2},
    {id:'p3',cat:'Primi di mare',name:'Spaghetti alle vongole',price:12,sort_order:3},
    {id:'p4',cat:'Primi di terra',name:'Risotto ai funghi',price:13,sort_order:4},
    {id:'p5',cat:'Secondi',name:'Tagliata di manzo',price:18,sort_order:5},
    {id:'p6',cat:'Secondi',name:'Salmone alla griglia',price:16,sort_order:6},
    {id:'p7',cat:'Dessert',name:'Tiramisù',price:6,sort_order:7},
    {id:'p8',cat:'Dessert',name:'Panna cotta',price:5,sort_order:8},
    {id:'p9',cat:'Bevande',name:'Acqua naturale',price:2,sort_order:9},
    {id:'p10',cat:'Bevande',name:'Vino rosso (calice)',price:5,sort_order:10},
  ];
  await sb.from('menu').upsert(d);return d;
}
async function saveMenuOrder(){await sb.from('menu').upsert(menu.map((d,i)=>({...d,sort_order:i})));}


function subscribeRealtime(){
  sb.channel('all-changes')
    .on('postgres_changes',{event:'*',schema:'public',table:'comande'},async()=>{
      await loadCucina();
      if(document.getElementById('screen-dolci').classList.contains('visible')) await loadDolci();
      if(document.getElementById('screen-tavoli').classList.contains('visible')) await loadTavoli();
      if(document.getElementById('screen-cameriere').classList.contains('visible')&&
         !document.getElementById('cam-level-0').classList.contains('hidden')) await loadSalaLevel0();
    })
    .subscribe(s=>{
      if(s==='SUBSCRIBED')setSyncState('online');
      else if(s==='CLOSED'||s==='CHANNEL_ERROR')setSyncState('error');
    });

  // polling ogni 5 secondi come fallback
  setInterval(async()=>{
    if(document.getElementById('screen-cucina').classList.contains('visible')) await loadCucina();
    if(document.getElementById('screen-dolci').classList.contains('visible')) await loadDolci();
    if(document.getElementById('screen-tavoli').classList.contains('visible')) await loadTavoli();
  }, 5000);
}


if(pinCheckStored()) pinUnlock();
init();
