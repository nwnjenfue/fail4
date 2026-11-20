/* Medeo — общая логика: данные (PostgreSQL через server.py), иконки, модалки, авторизация */
const ICONS={
calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
users:'<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6"/>',
heart:'<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
activity:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
home:'<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="M20 6L9 17l-5-5"/>',x:'<path d="M18 6L6 18M6 6l12 12"/>',
clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
arrow:'<path d="M5 12h14M12 5l7 7-7 7"/>',
star:'<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>',
shuffle:'<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
steth:'<path d="M5 3v6a5 5 0 0 0 10 0V3M10 14v2a5 5 0 0 0 10 0v-1"/><circle cx="20" cy="12" r="2"/>',
sparkles:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
eye:'<path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
smile:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
zap:'<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
cut:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
};
const ic=(n,cls='')=>`<svg class="ic ${cls}" viewBox="0 0 24 24">${ICONS[n]||''}</svg>`;
function hydrate(root=document){root.querySelectorAll('[data-i]').forEach(e=>{e.innerHTML=ic(e.dataset.i);e.removeAttribute('data-i')})}

/* ---- хранилище ---- */
/* ---- данные: база PostgreSQL через server.py; без сервера — localStorage ---- */
const SRV=(function(){try{const x=new XMLHttpRequest();x.open('GET','/api/state',false);x.send();if(x.status===200)return JSON.parse(x.responseText)}catch(e){}return null})();
const SK=['users','doctors','appts','seeded'];
const CACHE=SRV?{users:SRV.users,doctors:SRV.doctors,appts:SRV.appts,seeded:SRV.seeded?1:null}:null;
const DB={
  get(k,d){
    if(SRV&&SK.includes(k)){const v=CACHE[k];return v==null?d:v}
    try{const v=JSON.parse(localStorage.getItem('dm_'+k));return v==null?d:v}catch(e){return d}
  },
  set(k,v){
    if(SRV&&SK.includes(k)){
      const x=new XMLHttpRequest();x.open('POST','/api/save',false);x.setRequestHeader('Content-Type','application/json');
      let r={};
      try{x.send(JSON.stringify({key:k,value:v}));r=JSON.parse(x.responseText||'{}')}catch(e){r={ok:false,error:'Сервер недоступен'}}
      if(x.status!==200||!r.ok){const msg=r.error||'Не удалось сохранить данные';if(typeof toast==='function')toast(msg);throw new Error(msg)}
      CACHE[k]=k==='users'?v.map(({password,...u})=>u):v;return;
    }
    localStorage.setItem('dm_'+k,JSON.stringify(v));
  }
};
const uid=p=>p+Math.random().toString(36).slice(2,8);
const SPECS=['Имплантолог','Хирург','Терапевт','Ортопед','Ортодонт','Детский стоматолог'];
const SPEC_ICON={Имплантолог:'zap',Хирург:'cut',Терапевт:'steth',Ортопед:'shield',Ортодонт:'smile','Детский стоматолог':'smile'};

function ymd(d){const z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`}
function addDays(n){const d=new Date();d.setDate(d.getDate()+n);return ymd(d)}
function fmtDate(s,short){const d=new Date(s+'T00:00');return d.toLocaleDateString('ru-RU',short?{day:'numeric',month:'short'}:{weekday:'short',day:'numeric',month:'long'})}

const ADMIN={id:'u0',role:'admin',name:'Администратор Medeo',email:'admin@damumed.kz',phone:'+7 7172 00 00 00',password:'admin123'};
const NEWDOCS=[
 {id:'d7',name:'Арман Касымов',spec:'Терапевт',exp:10,price:8000,rating:4.8,img:'img/p6.jpg',bio:'Лечение кариеса и пульпита, реставрация зубов, консультации по плану лечения.',from:'09:00',to:'17:00'},
 {id:'d8',name:'Ерлан Нурланов',spec:'Имплантолог',exp:18,price:16000,rating:4.9,img:'img/p7.jpg',bio:'Имплантация, синус-лифтинг, восстановление всех зубов за один день.',from:'10:00',to:'18:00'},
 {id:'d9',name:'Динара Сулейменова',spec:'Детский стоматолог',exp:9,price:7000,rating:4.8,img:'img/p8.jpg',bio:'Плановые осмотры детей, серебрение и герметизация, советы родителям.',from:'09:00',to:'16:00'}
];
function seed(){
  if(DB.get('seeded'))return;
  DB.set('users',[
    {id:'u1',role:'patient',name:'Асель Нурмагамбетова',email:'demo@damumed.kz',phone:'+7 701 123 45 67',password:'demo123',birth:'1994-05-12'},
    {id:'u2',role:'doctor',name:'Данияр Ахметов',email:'doctor@damumed.kz',phone:'+7 702 555 11 22',password:'doctor123',doctorId:'d1'},
    ADMIN
  ]);
  DB.set('doctors',[
    {id:'d1',userId:'u2',name:'Данияр Ахметов',spec:'Имплантолог',exp:12,price:15000,rating:4.9,img:'img/p2.jpg',bio:'Имплантация любой сложности, All-on-4, навигационная имплантация и костная пластика.',from:'09:00',to:'17:00'},
    {id:'d2',name:'Алихан Сериков',spec:'Хирург',exp:9,price:12000,rating:4.8,img:'img/p1.jpg',bio:'Удаление зубов, в том числе зубов мудрости, пластика дёсен, малоинвазивная хирургия.',from:'10:00',to:'18:00'},
    {id:'d3',name:'Айгерим Ким',spec:'Терапевт',exp:8,price:8000,rating:4.9,img:'img/p4.jpg',bio:'Лечение кариеса и каналов под микроскопом, реставрация, профессиональная гигиена.',from:'09:00',to:'16:00'},
    {id:'d4',name:'Мадина Беккожина',spec:'Детский стоматолог',exp:15,price:7000,rating:5.0,img:'img/p3.jpg',bio:'Лечение молочных зубов без страха, герметизация, профилактика для детей с 3 лет.',from:'09:00',to:'15:00'},
    {id:'d5',name:'Зарина Омарова',spec:'Ортодонт',exp:11,price:10000,rating:4.7,img:'img/p5.jpg',bio:'Исправление прикуса: брекеты, элайнеры, ретейнеры для детей и взрослых.',from:'11:00',to:'19:00'},
    {id:'d6',name:'Сабина Ли',spec:'Ортопед',exp:7,price:11000,rating:4.8,img:'img/p9.jpg',bio:'Коронки, виниры, протезирование на имплантах и съёмные конструкции.',from:'09:00',to:'17:00'},
    ...NEWDOCS
  ]);
  DB.set('appts',[
    {id:'a1',patientId:'u1',doctorId:'d1',date:addDays(1),time:'10:00',reason:'Болит зуб при холодном и горячем',status:'confirmed',note:''},
    {id:'a2',patientId:'u1',doctorId:'d1',date:addDays(0),time:'15:30',reason:'Консультация по плану имплантации',status:'pending',note:''},
    {id:'a3',patientId:'u1',doctorId:'d3',date:addDays(-14),time:'11:00',reason:'Профессиональная гигиена',status:'done',note:'Гигиена проведена. Рекомендованы ирригатор и повторный осмотр через 6 месяцев.'}
  ]);
  DB.set('seeded',1);
}
seed();
(function(){const M={d1:['img/p2.jpg'],d2:['img/p1.jpg'],d3:['img/p4.jpg'],d4:['img/p3.jpg'],d5:['img/p5.jpg','Зарина Омарова'],d6:['img/p9.jpg']};const ds=DB.get('doctors',[]);let ch=0;ds.forEach(d=>{const m=M[d.id];if(m&&!d.custom&&d.img!==m[0]){d.img=m[0];if(m[1])d.name=m[1];ch=1}});NEWDOCS.forEach(n=>{if(!ds.some(d=>d.id===n.id)){ds.push({...n});ch=1}});if(ch)DB.set('doctors',ds)})();


/* перевод врачей и демо-записей на стоматологию (однократно для уже созданной базы) */
(function(){const M={d1:['Имплантолог',15000,'Имплантация любой сложности, All-on-4, навигационная имплантация и костная пластика.'],d2:['Хирург',12000,'Удаление зубов, в том числе зубов мудрости, пластика дёсен, малоинвазивная хирургия.'],d3:['Терапевт',8000,'Лечение кариеса и каналов под микроскопом, реставрация, профессиональная гигиена.'],d4:['Детский стоматолог',7000,'Лечение молочных зубов без страха, герметизация, профилактика для детей с 3 лет.'],d5:['Ортодонт',10000,'Исправление прикуса: брекеты, элайнеры, ретейнеры для детей и взрослых.'],d6:['Ортопед',11000,'Коронки, виниры, протезирование на имплантах и съёмные конструкции.'],d7:['Терапевт',8000,'Лечение кариеса и пульпита, реставрация зубов, консультации по плану лечения.'],d8:['Имплантолог',16000,'Имплантация, синус-лифтинг, восстановление всех зубов за один день.'],d9:['Детский стоматолог',7000,'Плановые осмотры детей, серебрение и герметизация, советы родителям.']};
  const ds=DB.get('doctors',[]);let ch=0;ds.forEach(d=>{const m=M[d.id];if(m&&!d.custom&&!SPECS.includes(d.spec)){d.spec=m[0];d.price=m[1];d.bio=m[2];ch=1}else if(!SPECS.includes(d.spec)&&d.spec){d.spec='Терапевт';ch=1}});if(ch)DB.set('doctors',ds);
  const R={'Боли в области сердца при нагрузке':'Болит зуб при холодном и горячем','Консультация по результатам ЭКГ':'Консультация по плану имплантации','Общий осмотр':'Профессиональная гигиена'};
  const ap=DB.get('appts',[]);let c2=0;ap.forEach(a=>{if(R[a.reason]){a.reason=R[a.reason];c2=1}if(a.id==='a3'&&a.record&&/витамина D/.test(a.record.diagnosis||'')){a.record={diagnosis:'Здоровая полость рта. Лёгкий налёт и зубной камень',recommendations:'Чистка зубов дважды в день, ирригатор, осмотр через 6 месяцев.',meds:'Паста с фтором, ополаскиватель без спирта',next:a.record.next};a.note='Гигиена проведена. Рекомендованы ирригатор и повторный осмотр через 6 месяцев.';c2=1}});if(c2)DB.set('appts',ap)})();

/* демо-данные медкарты для показательного пациента */
(function(){const us=DB.get('users',[]),u=us.find(x=>x.id==='u1');
  if(u&&!u.health){u.health={blood:'II (A) Rh+',height:168,weight:62,allergies:'Пенициллин',chronic:'',meds:'Витамин D3, 1000 МЕ в день',notes:''};DB.set('users',us)}
  const ap=DB.get('appts',[]),a=ap.find(x=>x.id==='a3');
  if(a&&!a.record){a.record={diagnosis:'Здоровая полость рта. Лёгкий налёт и зубной камень',recommendations:'Чистка зубов дважды в день, ирригатор, осмотр через 6 месяцев.',meds:'Паста с фтором, ополаскиватель без спирта',next:addDays(150)};DB.set('appts',ap)}})();
(function(){const us=DB.get('users',[]);if(!us.some(u=>u.id==='u0')){us.push(ADMIN);DB.set('users',us)}})();
const allDoctors=()=>DB.get('doctors',[]),doctors=()=>allDoctors().filter(d=>!d.hidden&&!d.deleted),users=()=>DB.get('users',[]),appts=()=>DB.get('appts',[]);
const docById=id=>allDoctors().find(d=>d.id===id),userById=id=>users().find(u=>u.id===id);
const me=()=>userById(DB.get('session'));
const photoOf=u=>u?(u.photo||(u.doctorId?docById(u.doctorId)?.img:'')||''):'';
/* загрузка фото: сжимаем до 360px и храним dataURL */
function pickPhoto(cb){
  /* input добавляем в документ: в Safari «висящий» input не присылает событие change */
  const i=document.createElement('input');i.type='file';i.accept='image/png,image/jpeg,image/webp,image/gif,image/*';
  i.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';document.body.appendChild(i);
  const clean=()=>setTimeout(()=>i.remove(),60000);
  i.addEventListener('change',()=>{
    const f=i.files&&i.files[0];clean();if(!f)return;
    if(f.size>15*1024*1024)return toast('Файл слишком большой (максимум 15 МБ)');
    const url=URL.createObjectURL(f),im=new Image();
    im.onerror=()=>{URL.revokeObjectURL(url);toast('Не удалось открыть фото. Выберите JPG, PNG или WebP.')};
    im.onload=()=>{
      const S=360,k=Math.max(S/im.width,S/im.height),w=im.width*k,h=im.height*k,c=document.createElement('canvas');
      c.width=c.height=S;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,S,S);
      x.drawImage(im,(S-w)/2,Math.min(0,(S-h)*0.15),w,h);URL.revokeObjectURL(url);
      cb(c.toDataURL('image/jpeg',.85));
    };
    im.src=url;
  });
  i.click();
}
const initials=n=>n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const avatar=(name,img,cls='')=>`<div class="avatar ${cls}">${img?`<img src="${img}" alt="">`:initials(name)}</div>`;
const money=n=>n.toLocaleString('ru-RU')+' ₸';
const STATUS={pending:'Ожидает',confirmed:'Подтверждена',done:'Завершена',cancelled:'Отменена'};
const badge=s=>`<span class="badge b-${s}">${STATUS[s]}</span>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function slotsFor(doc,date){
  const [h1,m1]=doc.from.split(':').map(Number),[h2]=doc.to.split(':').map(Number);
  const taken=appts().filter(a=>a.doctorId===doc.id&&a.date===date&&a.status!=='cancelled').map(a=>a.time);
  const now=new Date(),isToday=date===ymd(now),out=[];
  for(let m=h1*60+m1;m<h2*60;m+=30){
    const t=`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    const past=isToday&&m<=now.getHours()*60+now.getMinutes();
    out.push({t,free:!taken.includes(t)&&!past});
  }
  return out;
}

/* ---- UI ---- */
function toast(msg){let c=document.querySelector('.toasts');if(!c){c=document.createElement('div');c.className='toasts';document.body.appendChild(c)}
  const t=document.createElement('div');t.className='toast';t.textContent=msg;c.appendChild(t);setTimeout(()=>t.remove(),3200)}
function openModal(html){closeModal();const o=document.createElement('div');o.className='overlay';o.id='ov';
  o.innerHTML=`<div class="modal"><button class="x" aria-label="Закрыть">${ic('x')}</button>${html}</div>`;
  o.addEventListener('mousedown',e=>{if(e.target===o)closeModal()});o.querySelector('.x').onclick=closeModal;
  document.body.appendChild(o);return o.querySelector('.modal')}
function closeModal(){document.getElementById('ov')?.remove()}

function authModal(tab='login',role='patient'){
  const m=openModal(`
  <h3>${tab==='login'?'С возвращением':'Создать аккаунт'}</h3>
  <p class="sub">${tab==='login'?'Войдите в личный кабинет Medeo':'Регистрация занимает меньше минуты'}</p>
  <div class="seg" id="tabs"><button data-t="login" class="${tab==='login'?'on':''}">Вход</button><button data-t="register" class="${tab==='register'?'on':''}">Регистрация</button></div>
  <form id="af" novalidate>
    ${tab==='register'?`<div class="seg" id="roles"><button type="button" data-r="patient" class="${role==='patient'?'on':''}">Я пациент</button><button type="button" data-r="doctor" class="${role==='doctor'?'on':''}">Я врач</button></div>
    <div class="field"><label>ФИО</label><input class="input" name="name" placeholder="Иван Иванов"></div>
    <div class="field"><label>Телефон</label><input class="input" name="phone" placeholder="+7 700 000 00 00"></div>
    ${role==='doctor'?`<div class="field"><label>Специальность</label><select class="input" name="spec">${SPECS.map(s=>`<option>${s}</option>`).join('')}</select></div>`:''}`:''}
    <div class="field"><label>Email</label><input class="input" name="email" type="email" placeholder="you@mail.com"></div>
    <div class="field"><label>Пароль</label><input class="input" name="password" type="password" placeholder="Минимум 6 символов"></div>
    <div class="err" id="err"></div>
    <button class="btn primary lg" style="width:100%">${tab==='login'?'Войти':'Создать аккаунт'}</button>
    ${tab==='login'?`<div class="hint"><b>Демо-доступ</b><br>Пациент: demo@damumed.kz / demo123<br>Врач: doctor@damumed.kz / doctor123<br>Админ: admin@damumed.kz / admin123</div>`:''}
  </form>`);
  m.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>authModal(b.dataset.t,role));
  m.querySelectorAll('#roles button').forEach(b=>b.onclick=()=>authModal('register',b.dataset.r));
  const finish=()=>{
    let pend='';try{pend=sessionStorage.getItem('dm_pend')||'';sessionStorage.removeItem('dm_pend')}catch(e){}
    location.href='cabinet.html'+(DB.get('session')&&users().find(x=>x.id===DB.get('session'))?.role==='patient'?pend:'');
  };
  const createAccount=f=>{
    const us=users();
    const u={id:uid('u'),role,name:f.name.trim(),email:f.email,phone:f.phone||'',password:f.password};let pendingDoc=null;
    if(role==='doctor'){
      const d={id:uid('d'),userId:u.id,name:u.name,spec:f.spec,exp:1,price:7000,rating:5,img:'',bio:'Новый врач клиники Medeo.',from:'09:00',to:'17:00'};
      u.doctorId=d.id;pendingDoc=d;
    }
    DB.set('users',[...us,u]);
    if(pendingDoc)DB.set('doctors',[...allDoctors(),pendingDoc]);
    DB.set('session',u.id);finish();
  };
  /* шаг 2 регистрации: код подтверждения приходит в терминал сервера (server.py) */
  const post=(url,body)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
  const askCode=async f=>{
    let sent;try{sent=await post('/api/send-code',{email:f.email,name:f.name})}catch(e){sent=null}
    if(!sent||!sent.ok){toast('Сервер кодов не запущен (python3 server.py). Аккаунт создан без подтверждения.');return createAccount(f)}
    m.innerHTML=`<button class="x" aria-label="Закрыть">${ic('x')}</button>
      <h3>Введите код</h3><p class="sub">Мы отправили 6-значный код для <b>${esc(f.email)}</b>. В демо он появляется в терминале, где запущен сервер.</p>
      <form id="cf" novalidate><div class="field"><label>Код подтверждения</label><input class="input" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" style="letter-spacing:.5em;text-align:center;font-size:26px;font-weight:700"></div>
      <div class="err" id="cerr"></div><button class="btn primary lg" style="width:100%">Подтвердить</button>
      <button type="button" class="btn ghost" id="rs" style="width:100%;margin-top:8px">Отправить код ещё раз</button></form>`;
    m.querySelector('.x').onclick=closeModal;
    const inp=m.querySelector('[name=code]');inp.focus();
    m.querySelector('#rs').onclick=async()=>{try{const r=await post('/api/send-code',{email:f.email,name:f.name});toast(r.ok?'Новый код отправлен в терминал':'Не удалось отправить код')}catch(e){toast('Сервер кодов недоступен')}};
    m.querySelector('#cf').onsubmit=async ev=>{
      ev.preventDefault();const ce=m.querySelector('#cerr'),code=inp.value.trim();
      if(!/^\d{6}$/.test(code))return ce.textContent='Введите 6 цифр';
      let r;try{r=await post('/api/verify',{email:f.email,code})}catch(e){return ce.textContent='Сервер недоступен'}
      if(!r.ok)return ce.textContent=r.error||'Неверный код';
      createAccount(f);
    };
  };
  m.querySelector('#af').onsubmit=e=>{
    e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),err=m.querySelector('#err');
    f.email=(f.email||'').trim().toLowerCase();
    if(!/^\S+@\S+\.\S+$/.test(f.email))return err.textContent='Введите корректный email';
    if((f.password||'').length<6)return err.textContent='Пароль — минимум 6 символов';
    const us=users();
    if(tab==='login'){
      if(SRV){post('/api/login',{email:f.email,password:f.password}).then(r=>{if(!r.ok)return err.textContent=r.error||'Неверный email или пароль';DB.set('session',r.id);finish()}).catch(()=>err.textContent='Сервер недоступен');return}
      const u=us.find(u=>u.email===f.email&&u.password===f.password);
      if(!u)return err.textContent='Неверный email или пароль';
      DB.set('session',u.id);finish();
    }else{
      if(!f.name||f.name.trim().length<3)return err.textContent='Укажите ФИО';
      if(us.some(u=>u.email===f.email))return err.textContent='Этот email уже зарегистрирован';
      askCode(f);
    }
  };
}
document.addEventListener('DOMContentLoaded',()=>hydrate());
