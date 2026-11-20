const u=me();
const $=id=>document.getElementById(id);
const plural=(n,a,b,c)=>n%10===1&&n%100!==11?a:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?b:c;
const goBook=(q='')=>{const h='#book'+q;if(me())location.href='cabinet.html'+h;else{try{sessionStorage.setItem('dm_pend',h)}catch(e){}authModal('register')}};
document.querySelectorAll('[data-reg]').forEach(b=>b.onclick=e=>{e.preventDefault();goBook()});
document.querySelectorAll('[data-regdoc]').forEach(b=>b.onclick=e=>{e.preventDefault();u?location.href='cabinet.html':authModal('register','doctor')});
document.querySelectorAll('[data-login]').forEach(b=>b.onclick=e=>{e.preventDefault();u?location.href='cabinet.html':authModal('login')});
if(u){const g=document.querySelector('.glass-pill');g.innerHTML=esc(u.name.split(' ')[0])+' <b>→</b>';g.onclick=()=>location.href='cabinet.html'}

const DOCS=()=>doctors();

function nextFree(d){
  for(let i=0;i<10;i++){const s=addDays(i);if(new Date(s+'T00:00').getDay()===0)continue;
    const f=slotsFor(d,s).find(x=>x.free);if(f)return {date:s,time:f.t,label:(i===0?'сегодня':i===1?'завтра':fmtDate(s,true))+', '+f.t}}
  return null;
}

/* цифры и плашка в первом экране — из реальных данных */
(function(){const ds=DOCS(),mn=Math.min(...ds.map(d=>d.price)),n=new Set(ds.map(d=>d.spec)).size;
  $('facts').innerHTML=`<div><b>${ds.length}</b><span>${plural(ds.length,'врач','врача','врачей')}</span></div><div><b>${n}</b><span>${plural(n,'направление','направления','направлений')}</span></div><div><b>${(mn/1000)|0} тыс ₸</b><span>первичный приём от</span></div>`;
  const d=ds[0],nf=d&&nextFree(d);
  $('g1').innerHTML=d&&nf?`<span class="gi"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><span>Ближайшая запись<small>${esc(d.name)} · ${nf.label}</small></span>`:'';
})();

/* красивые выпадающие списки вместо системных (радиусные, под дизайн сайта) */
const CS=[];
function csClose(){document.querySelectorAll('.cs.open').forEach(w=>w.classList.remove('open'))}
function csInit(id){
  const sel=$(id);if(!sel)return;
  const w=document.createElement('div');w.className='cs';sel.parentNode.insertBefore(w,sel);w.appendChild(sel);sel.classList.add('cs-native');
  const b=document.createElement('button');b.type='button';b.className='cs-b';b.setAttribute('aria-haspopup','listbox');
  const l=document.createElement('div');l.className='cs-l';l.setAttribute('role','listbox');
  w.append(b,l);
  const sync=()=>{b.textContent=sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].text:'';
    l.innerHTML=[...sel.options].map((o,i)=>`<div class="cs-o${i===sel.selectedIndex?' on':''}" role="option" data-k="${i}">${esc(o.text)}</div>`).join('')};
  b.onclick=e=>{e.preventDefault();e.stopPropagation();const open=!w.classList.contains('open');csClose();w.classList.toggle('open',open);
    if(open){const on=l.querySelector('.on');if(on)l.scrollTop=on.offsetTop-l.clientHeight/2+on.offsetHeight/2}};
  l.onclick=e=>{const o=e.target.closest('.cs-o');if(!o)return;e.stopPropagation();sel.selectedIndex=+o.dataset.k;w.classList.remove('open');sel.dispatchEvent(new Event('change'))};
  CS.push({sync});sync();
}
document.addEventListener('click',csClose);
document.addEventListener('keydown',e=>{if(e.key==='Escape')csClose()});

/* панель записи */
const B={spec:'',doc:'',date:'',time:''};
function bookRender(){
  const ds=DOCS(),specs=[...new Set(ds.map(d=>d.spec))];
  if(!B.spec||!specs.includes(B.spec))B.spec=specs[0];
  const list=ds.filter(d=>d.spec===B.spec);if(!list.some(d=>d.id===B.doc))B.doc=list[0]?.id;
  const doc=list.find(d=>d.id===B.doc);
  const days=Array.from({length:14},(_,i)=>addDays(i)).filter(s=>new Date(s+'T00:00').getDay()!==0).slice(0,7);
  if(!days.includes(B.date))B.date=days[0];
  const slots=doc?slotsFor(doc,B.date).filter(s=>s.free):[];
  if(!slots.some(s=>s.t===B.time))B.time=slots[0]?.t||'';
  const lab=s=>{const d=new Date(s+'T00:00');return (s===addDays(0)?'Сегодня':s===addDays(1)?'Завтра':d.toLocaleDateString('ru-RU',{weekday:'short'}))+', '+d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'})};
  $('bSpec').innerHTML=specs.map(s=>`<option ${s===B.spec?'selected':''}>${s}</option>`).join('');
  $('bDoc').innerHTML=list.map(d=>`<option value="${d.id}" ${d.id===B.doc?'selected':''}>${esc(d.name)} · ${money(d.price)}</option>`).join('');
  $('bDate').innerHTML=days.map(s=>`<option value="${s}" ${s===B.date?'selected':''}>${lab(s)}</option>`).join('');
  $('bTime').innerHTML=slots.length?slots.map(s=>`<option ${s.t===B.time?'selected':''}>${s.t}</option>`).join(''):'<option value="">нет окон</option>';
  $('bGo').disabled=!B.time;
  $('bSpec').onchange=e=>{B.spec=e.target.value;B.doc='';B.time='';bookRender()};
  $('bDoc').onchange=e=>{B.doc=e.target.value;B.time='';bookRender()};
  $('bDate').onchange=e=>{B.date=e.target.value;B.time='';bookRender()};
  $('bTime').onchange=e=>{B.time=e.target.value};
  CS.forEach(c=>c.sync());
}
$('book').onsubmit=e=>{e.preventDefault();if(!B.time)return;goBook(`?doctor=${B.doc}&date=${B.date}&time=${B.time}`)};
bookRender();
['bSpec','bDoc','bDate','bTime'].forEach(csInit);

/* карусель услуг: фото клиники, ведут к врачам нужного направления */
let filter='Все';
const SERV=[
 {t:'Лечение зубов',s:'Терапевт',img:'img/dent/tools.jpg',d:'кариес и каналы'},
 {t:'Эстетика улыбки',s:'Ортопед',img:'img/dent/smile.jpg',d:'виниры и коронки'},
 {t:'Хирургия',s:'Хирург',img:'img/dent/surgery.jpg',d:'удаление и пластика дёсен'},
 {t:'Имплантация',s:'Имплантолог',img:'img/dent/implant.jpg',d:'любой сложности'},
 {t:'Регенерация тканей',s:'Имплантолог',img:'img/dent/cells.jpg',d:'костная пластика, PRF'}
];
function renderSvc(){
  const ds=DOCS();
  $('track').innerHTML=SERV.map(v=>{const l=ds.filter(d=>d.spec===v.s),mn=l.length?Math.min(...l.map(d=>d.price)):0;
    return `<button class="sc" data-s="${v.s}"><img src="${v.img}" alt="" loading="lazy"><span class="t"><span class="tx">${v.t}<small>${v.d}</small></span><span class="a"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M8 7h9v9"/></svg></span></span></button>`}).join('');
  document.querySelectorAll('.sc').forEach(c=>c.onclick=()=>{filter=c.dataset.s;renderDocs();$('doctors').scrollIntoView({behavior:'smooth'})});
  const tr=$('track'),m=tr.children[2];if(m)tr.scrollLeft=m.offsetLeft-(tr.clientWidth-m.offsetWidth)/2;
}
$('sPrev').onclick=()=>$('track').scrollBy({left:-320,behavior:'smooth'});
$('sNext').onclick=()=>$('track').scrollBy({left:320,behavior:'smooth'});

/* врачи */
function renderDocs(){
  const ds=DOCS();
  $('tabs').innerHTML=['Все',...SPECS.filter(s=>ds.some(d=>d.spec===s))].map(s=>`<button class="${s===filter?'on':''}" data-s="${s}">${s}</button>`).join('');
  document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{filter=b.dataset.s;renderDocs()});
  const list=ds.filter(d=>filter==='Все'||d.spec===filter);
  $('wins').innerHTML=list.map(d=>{const n=nextFree(d);
    return `<article class="dc"><div class="im">${d.img?`<img src="${d.img}" alt="${esc(d.name)}" loading="lazy">`:`<div class="av">${initials(d.name)}</div>`}</div>
    <h3>${esc(d.name)}</h3><div class="sp">${d.spec} · стаж ${d.exp} ${plural(d.exp,'год','года','лет')} · ${money(d.price)}</div>
    ${n?`<div class="nx">Ближайшее: ${n.label}</div>`:'<div class="sp">Нет свободного времени</div>'}
    <button class="bk" data-book="${d.id}" ${n?`data-date="${n.date}" data-time="${n.time}"`:''}>Записаться</button></article>`}).join('')||'<p style="color:var(--mut)">Врачи не найдены</p>';
  document.querySelectorAll('[data-book]').forEach(b=>b.onclick=()=>goBook(`?doctor=${b.dataset.book}`+(b.dataset.date?`&date=${b.dataset.date}&time=${b.dataset.time}`:'')));
}
renderSvc();renderDocs();
$('fgo').onclick=()=>$('services').scrollIntoView({behavior:'smooth'});
if(location.hash==='#login')authModal('login');

/* ---------- анимации при прокрутке ---------- */
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
if(!reduce){
  const rvs=['.svc .chip','.svc h2','.arrows','.proc-head','.ind-h','.irow','.docs-h','.cl-photo','.cl-map','.role','.faq>*','.ft'];
  document.querySelectorAll(rvs.join(',')).forEach((e,i)=>{e.classList.add('rv');e.style.transitionDelay=(i%3)*90+'ms'});
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
  document.querySelectorAll('.rv').forEach(e=>io.observe(e));
}
const hero=document.querySelector('.hero'),hdoc=document.querySelector('.hdoc'),procEl=$('process'),procIn=$('procIn'),wm=$('wm'),docsEl=$('indications'),fcta=$('fcta'),ftEl=document.querySelector('.ft');
const pts=[...document.querySelectorAll('.pt')];
let ticking=false;
function frame(){
  ticking=false;const sy=scrollY,vh=innerHeight;
  // параллакс фото врача
  if(!reduce&&hdoc&&sy<vh*1.2&&innerWidth>1100){hdoc.style.transform=`translateY(${sy*.07}px) scale(${1+sy*.00012})`}
  // закреплённый 3D-экран
  if(innerWidth>1100){const r=procEl.getBoundingClientRect(),p=clamp(-r.top/(r.height-vh),0,1);
    procIn.style.setProperty('--p',reduce?1:p.toFixed(4));
    pts.forEach((el,i)=>el.classList.toggle('on',reduce||p>=[.1,.32,.54,.76][i]));
  }else pts.forEach(el=>el.classList.add('on'));
  // огромная надпись за врачами
  if(wm){const r=docsEl.getBoundingClientRect();wm.style.setProperty('--wx',((r.top-vh*.5)*.12).toFixed(1)+'px')}
  // наклон карточек направлений
  if(!reduce)document.querySelectorAll('.sc').forEach(c=>{const r=c.getBoundingClientRect();if(r.right<-200||r.left>innerWidth+200)return;
    const d=clamp((r.left+r.width/2-innerWidth/2)/(r.width*1.05),-2,2);
    c.style.setProperty('--rz',(d*9).toFixed(2)+'deg');c.style.setProperty('--ty',(Math.abs(d)*34).toFixed(1)+'px');c.style.setProperty('--sc',(1-Math.min(Math.abs(d),1.6)*.07).toFixed(3))});
  // плавающая плашка записи
  const nearEnd=ftEl.getBoundingClientRect().top<vh*.9;
  const pr=procEl.getBoundingClientRect(),inProc=innerWidth>1100&&pr.top<vh*.6&&pr.bottom>vh*.4;
  fcta.classList.toggle('show',sy>vh*.85&&!nearEnd&&!inProc);
}
const tick=()=>{if(!ticking){ticking=true;requestAnimationFrame(frame)}};
addEventListener('scroll',tick,{passive:true});addEventListener('resize',tick);
$('track').addEventListener('scroll',tick,{passive:true});
frame();
