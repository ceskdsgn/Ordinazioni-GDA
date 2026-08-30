const SUPA_URL='https://sptwxscoqzbazpojgikv.supabase.co';
const SUPA_KEY='sb_publishable_Kmndi3DKhim7hNM1V8maEQ_b17Hl2YA';
const sb=supabase.createClient(SUPA_URL,SUPA_KEY);

let menu=[], order={}, comande=[], cucinaSeenIds=new Set();
const NUM_TAVOLI=60;
const CAT_CONFIG=[
  {name:'Antipasti',emoji:'🥗'},{name:'Primi',emoji:'🍝',sub:[{name:'Primi di mare',emoji:'🦞'},{name:'Primi di terra',emoji:'🍝'}]},
  {name:'Secondi',emoji:'🥩',sub:[{name:'Secondi di mare',emoji:'🐟'},{name:'Secondi di carne',emoji:'🥩'}]},
  {name:'Contorni',emoji:'🥦'},
  {name:'Dessert',emoji:'🍮'},
  {name:'Bevande',emoji:'🍷',sub:[{name:'Bibite',emoji:'🥤'},{name:'Vini',emoji:'🍷'},{name:'Birre',emoji:'🍺'}]},
  {name:'Bar',emoji:'☕'},
];
const FISH_CATS=['Primi di mare','Secondi di mare'];
