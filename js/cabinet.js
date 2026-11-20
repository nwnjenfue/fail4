const U=me();
if(!U){location.replace('index.html#login')}
const isDoc=U&&U.role==='doctor',isAdm=U&&U.role==='admin';
const MY=()=>isDoc?docById(U.doctorId):null;
const NAV=isAdm?[['overview','home','Обзор'],['aappts','calendar','Все записи'],['adocs','steth','Врачи'],['apats','users','Пациенты'],['profile','settings','Профиль']]
  :isDoc?[['overview','home','Обзор'],['schedule','calendar','Расписание'],['patients','users','Пациенты'],['profile','settings','Профиль']]
  :[['overview','home','Обзор'],['book','plus','Записаться'],['appointments','calendar','Мои записи'],['records','file','Медкарта'],['profile','settings','Профиль']];
const $v=document.getElementById('view');
let bk={doctor:null,spec:'Все',date:addDays(0),time:null},schDay=addDays(0);

function route(){
  const [name,qs]=(location.hash.slice(1)||'overview').split('?');
  if(qs){const p=new URLSearchParams(qs);if(p.get('doctor')){bk.doctor=p.get('doctor');bk.time=null;const dd=docById(bk.doctor);if(dd)bk.spec=dd.spec;if(p.get('date'))bk.date=p.get('date');if(p.get('time'))bk.time=p.get('time')}}
  const r=NAV.find(n=>n[0]===name)?name:'overview';
  document.getElementById('side').innerHTML=`<a class="lg" href="index.html"><img class="lgi" src="img/medeo-dark.svg" alt="Medeo"></a>
    ${NAV.map(n=>`<a class="item ${n[0]===r?'on':''}" href="#${n[0]}">${ic(n[1])}${n[2]}</a>`).join('')}
    <div class="me">${avatar(U.name,photoOf(U))}<div style="flex:1;min-width:0"><b>${esc(U.name)}</b><small>${isAdm?'Администратор':isDoc?MY().spec:'Пациент'}</small></div>
    <button class="btn sm ghost" id="out" title="Выйти">${ic('logout')}</button></div>`;
  document.getElementById('out').onclick=()=>{DB.set('session',null);location.href='index.html'};
  document.getElementById('side').classList.remove('open');
  (VIEWS[r])();hydrate();window.scrollTo(0,0);
}
document.getElementById('mb').onclick=()=>document.getElementById('side').classList.toggle('open');


/* ---------- медкарта: общие функции ---------- */
const ageOf=b=>{if(!b)return '';const d=new Date(b),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a};
const fmtSize=n=>n>1048576?(n/1048576).toFixed(1)+' МБ':Math.max(1,Math.round(n/1024))+' КБ';
const cardNo=u=>'DM-'+String(Math.abs([...u.id].reduce((h,ch)=>(h*31+ch.charCodeAt(0))|0,7))%900000+100000);
const BLOOD=['','I (0) Rh+','I (0) Rh−','II (A) Rh+','II (A) Rh−','III (B) Rh+','III (B) Rh−','IV (AB) Rh+','IV (AB) Rh−'];
const DOCCAT=['Анализы','Снимки и УЗИ','Справки','Другое'];
function visitHTML(a){
  const d=docById(a.doctorId),r=a.record||{},rec=r.recommendations||(!a.record?a.note:'');
  return `<div class="visit"><div class="vh">${avatar(d?.name||'?',d?.img)}<div><b>${esc(d?.name||'Врач')}</b><small>${d?.spec||''} · ${fmtDate(a.date)}, ${a.time}</small></div></div>
  <dl class="vd"><dt>Причина обращения</dt><dd>${esc(a.reason||'—')}</dd>
  ${r.diagnosis?`<dt>Диагноз</dt><dd><b>${esc(r.diagnosis)}</b></dd>`:''}
  ${rec?`<dt>Рекомендации</dt><dd>${esc(rec)}</dd>`:''}
  ${r.meds?`<dt>Назначения</dt><dd><ul>${r.meds.split('\n').filter(x=>x.trim()).map(m=>`<li>${esc(m)}</li>`).join('')}</ul></dd>`:''}
  ${r.next?`<dt>Следующий визит</dt><dd>${fmtDate(r.next)}</dd>`:''}</dl></div>`;
}
function healthHTML(h,compact){
  h=h||{};const bmi=h.height&&h.weight?(h.weight/Math.pow(h.height/100,2)).toFixed(1):'';
  const row=(t,v,warn)=>`<div class="hr"><small>${t}</small><b class="${warn&&v?'warn':''}">${v?esc(v):'не указано'}</b></div>`;
  return `<div class="hgrid"><div class="card stat"><small>Группа крови</small><b>${esc(h.blood||'—')}</b></div>
  <div class="card stat"><small>Рост / вес</small><b>${h.height?esc(h.height):'—'} <span class="u">см</span> / ${h.weight?esc(h.weight):'—'} <span class="u">кг</span></b></div>
  <div class="card stat"><small>Индекс массы тела</small><b>${bmi||'—'}</b></div></div>
  <div class="panel hl">${row('Аллергии',h.allergies,1)}${row('Хронические заболевания',h.chronic)}${row('Постоянные препараты',h.meds)}${h.notes?row('Примечания',h.notes):''}</div>`;
}
const openBlob=d=>fetch(d.data).then(r=>r.blob()).then(b=>{const u=URL.createObjectURL(b);window.open(u,'_blank');setTimeout(()=>URL.revokeObjectURL(u),60000)});
function docsHTML(files,canEdit){
  return `<div class="panel">${files.length?`<div class="list">${files.slice().reverse().map(f=>`<div class="it"><div class="timebox" style="min-width:64px">${f.type==='application/pdf'?'PDF':'IMG'}<small>${fmtSize(f.size)}</small></div><div class="grow"><b>${esc(f.title)}</b><small>${esc(f.cat)} · ${fmtDate(f.date,true)}${f.by?' · '+esc(f.by):''}</small></div><div class="acts"><button class="btn sm" data-open="${f.id}">Открыть</button>${canEdit?`<button class="btn sm danger" data-del="${f.id}">Удалить</button>`:''}</div></div>`).join('')}</div>`:'<div class="empty">Документов пока нет</div>'}</div>`;
}
function readDocFile(file,cb){
  if(file.type==='application/pdf'){if(file.size>900*1024)return toast('PDF слишком большой (максимум 900 КБ)');const r=new FileReader();r.onload=()=>cb({data:r.result,type:file.type,size:file.size});r.readAsDataURL(file);return}
  if(!file.type.startsWith('image/'))return toast('Подходят фото и PDF');
  const url=URL.createObjectURL(file),im=new Image();
  im.onerror=()=>{URL.revokeObjectURL(url);toast('Не удалось открыть изображение')};
  im.onload=()=>{const k=Math.min(1,1400/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
    const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);
    const d=c.toDataURL('image/jpeg',.8);cb({data:d,type:'image/jpeg',size:Math.round(d.length*0.75)})};
  im.src=url;
}
function addDocFlow(patientId,byName,done){
  const i=document.createElement('input');i.type='file';i.accept='image/*,application/pdf';i.style.cssText='position:fixed;left:-9999px;opacity:0';document.body.appendChild(i);
  i.addEventListener('change',()=>{const f=i.files&&i.files[0];setTimeout(()=>i.remove(),60000);if(!f)return;
    readDocFile(f,info=>{
      const m=openModal(`<h3>Новый документ</h3><p class="sub">${esc(f.name)} · ${fmtSize(info.size)}</p>
      <div class="field"><label>Название</label><input class="input" id="dt" value="${esc(f.name.replace(/\.[^.]+$/,''))}"></div>
      <div class="field"><label>Категория</label><select class="input" id="dc">${DOCCAT.map(x=>`<option>${x}</option>`).join('')}</select></div>
      <button class="btn primary" style="width:100%" id="ds">Сохранить в медкарту</button>`);
      m.querySelector('#ds').onclick=()=>{
        const us=users(),u=us.find(x=>x.id===patientId);u.files=[...(u.files||[]),{id:uid('f'),title:m.querySelector('#dt').value.trim()||f.name,cat:m.querySelector('#dc').value,date:addDays(0),by:byName||'',...info}];
        try{DB.set('users',us)}catch(e){return toast('Память браузера заполнена: удалите ненужные документы')}
        closeModal();toast('Документ добавлен');done&&done()};
    })});
  i.click();
}
function healthForm(done){
  const u=userById(U.id),h=u.health||{};
  const m=openModal(`<h3>Данные о здоровье</h3><p class="sub">Эти сведения видят ваши врачи</p><form id="hf">
  <div class="row2"><div class="field"><label>Группа крови</label><select class="input" name="blood">${BLOOD.map(b=>`<option ${b===h.blood?'selected':''}>${b}</option>`).join('')}</select></div>
  <div class="row2" style="grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label>Рост, см</label><input class="input" type="number" min="30" max="250" name="height" value="${esc(h.height||'')}"></div><div class="field"><label>Вес, кг</label><input class="input" type="number" min="2" max="400" name="weight" value="${esc(h.weight||'')}"></div></div></div>
  <div class="field"><label>Аллергии</label><textarea class="input" name="allergies" style="height:70px" placeholder="Например: пенициллин, орехи">${esc(h.allergies||'')}</textarea></div>
  <div class="field"><label>Хронические заболевания</label><textarea class="input" name="chronic" style="height:70px">${esc(h.chronic||'')}</textarea></div>
  <div class="field"><label>Постоянные препараты</label><textarea class="input" name="meds" style="height:70px">${esc(h.meds||'')}</textarea></div>
  <div class="field"><label>Примечания</label><textarea class="input" name="notes" style="height:70px">${esc(h.notes||'')}</textarea></div>
  <button class="btn primary" style="width:100%">Сохранить</button></form>`);
  m.style.maxWidth='620px';
  m.querySelector('#hf').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
    const us=users(),x=us.find(z=>z.id===U.id);x.health={blood:f.blood,height:+f.height||'',weight:+f.weight||'',allergies:f.allergies.trim(),chronic:f.chronic.trim(),meds:f.meds.trim(),notes:f.notes.trim()};DB.set('users',us);closeModal();toast('Данные сохранены');done()};
}
function openCard(pid){ /* медкарта пациента глазами врача */
  const p=userById(pid);if(!p)return;
  const visits=appts().filter(a=>a.patientId===pid&&a.status==='done').sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  const m=openModal(`<h3>Медкарта · ${esc(p.name)}</h3><p class="sub">№ ${cardNo(p)}${p.birth?' · '+ageOf(p.birth)+' лет':''} · ${esc(p.phone||'телефон не указан')}</p>
  ${healthHTML(p.health)}<h3 style="font-size:18px;margin:6px 0 10px">Приёмы</h3>${visits.map(visitHTML).join('')||'<div class="empty">Завершённых приёмов нет</div>'}
  <h3 style="font-size:18px;margin:18px 0 10px">Документы</h3>${docsHTML(p.files||[],false)}
  <button class="btn" style="width:100%;margin-top:6px" id="adddoc">Добавить документ пациента</button>`);
  m.style.maxWidth='760px';
  const wire=()=>m.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openBlob(userById(pid).files.find(f=>f.id===b.dataset.open)));wire();
  m.querySelector('#adddoc').onclick=()=>addDocFlow(pid,U.name,()=>openCard(pid));
}
const head=(t,p,act='')=>`<div class="top"><div><h1>${t}</h1><p>${p}</p></div>${act}</div>`;
const apptRow=(a,mode)=>{
  const d=docById(a.doctorId),p=userById(a.patientId);const dt=new Date(a.date+'T00:00');
  const who=mode==='doc'?p:d;
  return `<div class="it"><div class="timebox">${a.time}<small>${fmtDate(a.date,true)}</small></div>
  <div class="grow"><b>${esc(who?.name||'—')}${mode==='doc'?'':` · <span style="color:var(--primary)">${d?.spec||''}</span>`}</b><small>${esc(a.reason||'Без указания причины')}</small></div>
  ${badge(a.status)}<div class="acts">${actions(a,mode)}</div></div>`};
const admRow=(a,full)=>{const d=docById(a.doctorId),p=userById(a.patientId);
  return `<div class="it"><div class="timebox">${a.time}<small>${fmtDate(a.date,true)}</small></div><div class="grow"><b>${esc(p?.name||'—')} <span style="color:var(--primary)">→ ${esc(d?.name||'—')}</span></b><small>${d?.spec||''} · ${esc(a.reason||'Без указания причины')}</small></div>${badge(a.status)}${full&&['pending','confirmed'].includes(a.status)?`<div class="acts">${a.status==='pending'?`<button class="btn sm primary" data-act="confirm" data-id="${a.id}">Подтвердить</button>`:''}<button class="btn sm danger" data-act="cancel" data-id="${a.id}">Отменить</button></div>`:''}</div>`};
function actions(a,mode){
  if(mode==='doc'){
    if(a.status==='pending')return `<button class="btn sm primary" data-act="confirm" data-id="${a.id}">Подтвердить</button><button class="btn sm danger" data-act="cancel" data-id="${a.id}">Отклонить</button>`;
    if(a.status==='confirmed')return `<button class="btn sm primary" data-act="finish" data-id="${a.id}">Провести приём</button><button class="btn sm danger" data-act="cancel" data-id="${a.id}">Отменить</button>`;
    return a.status==='done'?`<button class="btn sm" data-act="view" data-id="${a.id}">Заключение</button>`:'';
  }
  if(a.status==='pending'||a.status==='confirmed')return `<button class="btn sm" data-act="move" data-id="${a.id}">Перенести</button><button class="btn sm danger" data-act="cancel" data-id="${a.id}">Отменить</button>`;
  return a.status==='done'?`<button class="btn sm" data-act="view" data-id="${a.id}">Заключение</button>`:'';
}
function bind(){
  $v.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.id,all=appts(),a=all.find(x=>x.id===id)||{},act=b.dataset.act;
    const save=s=>{a.status=s;DB.set('appts',all);route()};
    if(act==='confirm'){save('confirmed');toast('Запись подтверждена')}
    else if(act==='cancel'){if(confirm('Отменить запись?')){save('cancelled');toast('Запись отменена')}}
    else if(act==='move'){
      const doc=docById(a.doctorId);let dt=a.date,tm=null;
      const m=openModal('');const draw=()=>{m.innerHTML=`<button class="x" aria-label="Закрыть">${ic('x')}</button><h3>Перенести запись</h3><p class="sub">${esc(doc.name)} · ${doc.spec}</p>
        <div class="days" style="margin-bottom:14px">${Array.from({length:10},(_,i)=>addDays(i)).filter(s=>new Date(s+'T00:00').getDay()!==0).map(s=>{const d=new Date(s+'T00:00');return `<div class="day ${s===dt?'on':''}" data-dt="${s}"><small>${d.toLocaleDateString('ru-RU',{weekday:'short'})}</small><span>${d.getDate()}</span></div>`}).join('')}</div>
        <div class="slots">${slotsFor(doc,dt).map(x=>`<button class="slot ${tm===x.t?'on':''}" data-t="${x.t}" ${x.free||(dt===a.date&&x.t===a.time)?'':'disabled'}>${x.t}</button>`).join('')}</div>
        <button class="btn primary" style="width:100%;margin-top:18px" id="mv" ${tm?'':'disabled'}>Подтвердить перенос</button>`;
        m.querySelector('.x').onclick=closeModal;
        m.querySelectorAll('[data-dt]').forEach(b=>b.onclick=()=>{dt=b.dataset.dt;tm=null;draw()});
        m.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tm=b.dataset.t;draw()});
        m.querySelector('#mv').onclick=()=>{a.date=dt;a.time=tm;a.status='pending';DB.set('appts',all);closeModal();route();toast('Запись перенесена, врач подтвердит время')}};draw();
    }
    else if(act==='del-doc'){if(confirm('Удалить врача? Его записи сохранятся в истории.')){DB.set('doctors',allDoctors().map(d=>d.id===id?{...d,deleted:true,hidden:true}:d));route();toast('Врач удалён')}}
    else if(act==='view'){const m=openModal(`<h3>Заключение врача</h3><p class="sub">Приём завершён</p>${visitHTML(a)}`);m.style.maxWidth='620px'}
    else if(act==='finish'){
      const pt=userById(a.patientId);
      const m=openModal(`<h3>Заключение</h3><p class="sub">Пациент: ${esc(pt?.name)}${pt?.health?.allergies?` · <b style="color:var(--bad)">аллергия: ${esc(pt.health.allergies)}</b>`:''}</p>
      <div class="field"><label>Диагноз</label><input class="input" id="dg" placeholder="Например: ОРВИ, лёгкое течение"></div>
      <div class="field"><label>Рекомендации</label><textarea class="input" id="rc" style="height:90px" placeholder="Режим, питание, обследования"></textarea></div>
      <div class="field"><label>Назначения (каждый препарат с новой строки)</label><textarea class="input" id="md" style="height:90px" placeholder="Парацетамол 500 мг — при температуре, до 3 раз в сутки"></textarea></div>
      <div class="field"><label>Следующий визит (необязательно)</label><input class="input" type="date" id="nx" min="${addDays(1)}"></div>
      <button class="btn primary" style="width:100%" id="sv">Завершить приём</button>`);
      m.querySelector('#sv').onclick=()=>{const dg=m.querySelector('#dg').value.trim(),rc=m.querySelector('#rc').value.trim(),md=m.querySelector('#md').value.trim(),nx=m.querySelector('#nx').value;
        if(!dg&&!rc)return toast('Укажите диагноз или рекомендации');
        a.record={diagnosis:dg,recommendations:rc,meds:md,next:nx};a.note=[dg,rc].filter(Boolean).join('. ');closeModal();save('done');toast('Приём завершён, заключение в медкарте пациента')};
    }
  });
}

const VIEWS={
adm(){
  const A=appts(),D=allDoctors().filter(d=>!d.deleted),P=users().filter(u=>u.role==='patient'),today=addDays(0);
  const rev=A.filter(a=>a.status==='done').reduce((s,a)=>s+(docById(a.doctorId)?.price||0),0);
  const top=D.map(d=>({d,n:A.filter(a=>a.doctorId===d.id&&a.status!=='cancelled').length})).sort((x,y)=>y.n-x.n).slice(0,5);
  const mx=Math.max(1,...top.map(t=>t.n));
  const last=[...A].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,6);
  $v.innerHTML=head('Панель администратора','Вся клиника Medeo на одном экране',`<a class="btn primary" href="#adocs">${ic('plus')} Врачи</a>`)+
  `<div class="stats">
    <div class="card stat"><small>${ic('calendar')} Записей сегодня</small><b>${A.filter(a=>a.date===today&&a.status!=='cancelled').length}</b></div>
    <div class="card stat"><small>${ic('clock')} Ждут подтверждения</small><b>${A.filter(a=>a.status==='pending').length}</b></div>
    <div class="card stat"><small>${ic('users')} Пациентов</small><b>${P.length}</b></div>
    <div class="card stat"><small>${ic('check')} Выручка</small><b style="font-size:24px;padding-top:8px">${money(rev)}</b></div></div>
  <div class="cols"><div class="panel"><h3>Последние записи</h3><div class="list">${last.map(a=>admRow(a)).join('')||'<div class="empty">Записей пока нет</div>'}</div></div>
  <div class="panel"><h3>Загрузка врачей</h3><div class="list">${top.map(t=>`<div class="it">${avatar(t.d.name,t.d.img)}<div class="grow"><b>${esc(t.d.name)}</b><div class="pbar"><i style="width:${t.n/mx*100}%"></i></div></div><b>${t.n}</b></div>`).join('')}</div></div></div>`;
  bind();
},
aappts(){
  const f=window._af||'all';
  const list=appts().filter(a=>f==='all'||a.status===f).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  $v.innerHTML=head('Все записи','Контроль записей по всем врачам')+
  `<div class="chips">${[['all','Все'],['pending','Ожидают'],['confirmed','Подтверждены'],['done','Завершены'],['cancelled','Отменены']].map(([k,t])=>`<button class="chip ${k===f?'on':''}" data-f="${k}">${t}</button>`).join('')}</div>
  <div class="panel"><div class="list">${list.map(a=>admRow(a,true)).join('')||'<div class="empty">Нет записей</div>'}</div></div>`;
  $v.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{window._af=b.dataset.f;VIEWS.aappts();hydrate()});bind();
},
adocs(){
  const D=allDoctors().filter(d=>!d.deleted);
  $v.innerHTML=head('Врачи','Состав клиники: добавляйте, скрывайте и редактируйте',`<button class="btn primary" id="addd">${ic('plus')} Добавить врача</button>`)+
  `<div class="panel"><table class="tbl"><tr><th>Врач</th><th>Направление</th><th>Цена</th><th>Рейтинг</th><th>Статус</th><th></th></tr>${D.map(d=>`<tr><td><div style="display:flex;gap:12px;align-items:center">${avatar(d.name,d.img)}<b>${esc(d.name)}</b></div></td><td>${d.spec}</td><td>${money(d.price)}</td><td>★ ${Number(d.rating).toFixed(1)}</td><td>${d.hidden?'<span class="badge b-cancelled">Скрыт</span>':'<span class="badge b-confirmed">Активен</span>'}</td>
    <td style="text-align:right;white-space:nowrap"><button class="btn sm" data-tg="${d.id}">${d.hidden?'Показать':'Скрыть'}</button> <button class="btn sm" data-ed="${d.id}">Изменить</button> <button class="btn sm danger" data-act="del-doc" data-id="${d.id}">Удалить</button></td></tr>`).join('')}</table></div>`;
  const form=d=>{const m=openModal(`<h3>${d?'Редактировать врача':'Новый врач'}</h3><p class="sub">Данные появятся на сайте сразу</p><form id="df">
    <div class="field"><label>ФИО</label><input class="input" name="name" value="${esc(d?.name||'')}"></div>
    <div class="row2"><div class="field"><label>Направление</label><select class="input" name="spec">${SPECS.map(s=>`<option ${s===d?.spec?'selected':''}>${s}</option>`).join('')}</select></div>
    <div class="field"><label>Цена, ₸</label><input class="input" type="number" name="price" value="${d?.price||7000}"></div></div>
    <div class="row2"><div class="field"><label>Стаж, лет</label><input class="input" type="number" name="exp" value="${d?.exp||5}"></div><div class="field"><label>Рейтинг</label><input class="input" type="number" step="0.1" max="5" name="rating" value="${d?.rating||5}"></div></div>
    <div class="field"><label>О враче</label><textarea class="input" name="bio">${esc(d?.bio||'')}</textarea></div>
    <div class="field"><label>Фото</label><button type="button" class="btn sm" id="ph">${ic('plus')} Загрузить</button> <small id="phn" style="color:var(--muted)">${d?.img?'Фото есть':''}</small></div>
    <button class="btn primary" style="width:100%">Сохранить</button></form>`);let img=d?.img||'';
    m.querySelector('#ph').onclick=()=>pickPhoto(v=>{img=v;m.querySelector('#phn').textContent='Фото загружено'});
    m.querySelector('#df').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));if(f.name.trim().length<3)return toast('Укажите ФИО');
      const ds=allDoctors();const row={name:f.name.trim(),spec:f.spec,price:+f.price||0,exp:+f.exp||0,rating:Math.min(5,+f.rating||5),bio:f.bio,img,custom:1};
      if(d){const i=ds.findIndex(x=>x.id===d.id);ds[i]={...ds[i],...row}}else ds.push({id:uid('d'),from:'09:00',to:'17:00',...row});
      DB.set('doctors',ds);closeModal();VIEWS.adocs();hydrate();toast('Сохранено')}};
  $v.querySelector('#addd').onclick=()=>form(null);
  $v.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>form(docById(b.dataset.ed)));
  $v.querySelectorAll('[data-tg]').forEach(b=>b.onclick=()=>{const ds=allDoctors(),d=ds.find(x=>x.id===b.dataset.tg);d.hidden=!d.hidden;DB.set('doctors',ds);VIEWS.adocs();hydrate();toast(d.hidden?'Врач скрыт с сайта':'Врач снова на сайте')});
  bind();
},
apats(){
  const P=users().filter(u=>u.role==='patient'),A=appts();
  $v.innerHTML=head('Пациенты','Все зарегистрированные пациенты')+
  `<div class="panel">${P.length?`<table class="tbl"><tr><th>Пациент</th><th>Телефон</th><th>Визитов</th><th>Последний</th></tr>${P.map(p=>{const v=A.filter(a=>a.patientId===p.id).sort((a,b)=>b.date.localeCompare(a.date));return `<tr><td><div style="display:flex;gap:12px;align-items:center">${avatar(p.name,p.photo)}<span><b>${esc(p.name)}</b><br><small style="color:var(--muted)">${esc(p.email)}</small></span></div></td><td>${esc(p.phone||'—')}</td><td>${v.length}</td><td>${v[0]?fmtDate(v[0].date,true):'—'}</td></tr>`}).join('')}</table>`:'<div class="empty">Пациентов нет</div>'}</div>`;
},
overview(){
  if(isAdm)return VIEWS.adm();
  const all=appts().filter(a=>isDoc?a.doctorId===U.doctorId:a.patientId===U.id);
  const up=all.filter(a=>['pending','confirmed'].includes(a.status)&&a.date>=addDays(0)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const today=all.filter(a=>a.date===addDays(0)&&a.status!=='cancelled');
  const firstName=U.name.split(' ')[isDoc?0:0];
  if(isDoc){
    const pat=new Set(all.map(a=>a.patientId)).size;
    $v.innerHTML=head(`Здравствуйте, ${esc(firstName)}`,'Ваш рабочий день в Medeo',`<a class="btn primary" href="#schedule">${ic('calendar')} Расписание</a>`)+
    `<div class="stats">
      <div class="card stat"><small>${ic('calendar')} Сегодня</small><b>${today.length}</b></div>
      <div class="card stat"><small>${ic('clock')} Ожидают</small><b>${all.filter(a=>a.status==='pending').length}</b></div>
      <div class="card stat"><small>${ic('check')} Проведено</small><b>${all.filter(a=>a.status==='done').length}</b></div>
      <div class="card stat"><small>${ic('users')} Пациентов</small><b>${pat}</b></div></div>
    <div class="panel"><h3>Ближайшие приёмы</h3><div class="list">${up.map(a=>apptRow(a,'doc')).join('')||'<div class="empty">Нет предстоящих приёмов</div>'}</div></div>`;
  }else{
    $v.innerHTML=head(`Здравствуйте, ${esc(firstName)}`,'Ваши записи и медкарта',`<a class="btn primary" href="#book">${ic('plus')} Записаться к врачу</a>`)+
    `<div class="stats">
      <div class="card stat"><small>${ic('calendar')} Предстоящие</small><b>${up.length}</b></div>
      <div class="card stat"><small>${ic('check')} Завершённые</small><b>${all.filter(a=>a.status==='done').length}</b></div>
      <div class="card stat"><small>${ic('steth')} Врачей</small><b>${new Set(all.map(a=>a.doctorId)).size}</b></div>
      <div class="card stat"><small>${ic('file')} Заключений</small><b>${all.filter(a=>a.note).length}</b></div></div>
    <div class="cols"><div class="panel"><h3>Ближайшие приёмы</h3><div class="list">${up.map(a=>apptRow(a,'pat')).join('')||'<div class="empty">Записей пока нет. <a href="#book" style="color:var(--primary);font-weight:600">Записаться</a></div>'}</div></div>
    <div class="panel"><h3>Быстрая запись</h3><div class="list">${doctors().slice(0,4).map(d=>`<a class="it" href="#book?doctor=${d.id}">${avatar(d.name,d.img)}<div class="grow"><b>${esc(d.name)}</b><small>${d.spec} · ${money(d.price)}</small></div>${ic('arrow')}</a>`).join('')}</div></div></div>`;
  }
  bind();
},
book(){
  const specs=['Все',...SPECS];let list=doctors().filter(d=>bk.spec==='Все'||d.spec===bk.spec);
  const doc=bk.doctor?docById(bk.doctor):null;
  $v.innerHTML=head('Запись на приём','Выберите врача, дату и время')+
  `<div class="panel"><h3>1. Врач</h3><div class="chips">${specs.map(s=>`<button class="chip ${s===bk.spec?'on':''}" data-sp="${s}">${s}</button>`).join('')}</div>
    <div class="pick">${list.map(d=>`<div class="opt ${bk.doctor===d.id?'on':''}" data-d="${d.id}">${avatar(d.name,d.img)}<div><b>${esc(d.name)}</b><small>${d.spec} · ${money(d.price)}</small></div></div>`).join('')}</div></div>
  ${doc?`<div class="panel"><h3>2. Дата и время</h3>
    <div class="days">${Array.from({length:14},(_,i)=>addDays(i)).filter(s=>new Date(s+'T00:00').getDay()!==0).map(s=>{const d=new Date(s+'T00:00');return `<div class="day ${s===bk.date?'on':''}" data-dt="${s}"><small>${d.toLocaleDateString('ru-RU',{weekday:'short'})}</small><span>${d.getDate()}</span></div>`}).join('')}</div>
    <div class="slots">${slotsFor(doc,bk.date).map(s=>`<button class="slot ${bk.time===s.t?'on':''}" data-t="${s.t}" ${s.free?'':'disabled'}>${s.t}</button>`).join('')}</div></div>
  <div class="panel"><h3>3. Причина обращения</h3><div class="field"><textarea class="input" id="rs" placeholder="Опишите, что вас беспокоит"></textarea></div>
    <button class="btn primary lg" id="go" ${bk.time?'':'disabled'}>Записаться · ${money(doc.price)}</button></div>`:''}`;
  $v.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{bk.spec=b.dataset.sp;bk.doctor=null;bk.time=null;VIEWS.book();hydrate()});
  $v.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{bk.doctor=b.dataset.d;bk.time=null;VIEWS.book();hydrate()});
  $v.querySelectorAll('[data-dt]').forEach(b=>b.onclick=()=>{bk.date=b.dataset.dt;bk.time=null;VIEWS.book();hydrate()});
  $v.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{bk.time=b.dataset.t;const r=$v.querySelector('#rs')?.value;VIEWS.book();hydrate();if(r)$v.querySelector('#rs').value=r});
  $v.querySelector('#go')?.addEventListener('click',()=>{
    if(!slotsFor(doc,bk.date).find(s=>s.t===bk.time)?.free)return toast('Это время уже занято');
    DB.set('appts',[...appts(),{id:uid('a'),patientId:U.id,doctorId:doc.id,date:bk.date,time:bk.time,reason:$v.querySelector('#rs').value.trim(),status:'pending',note:''}]);
    bk.time=null;toast('Запись создана! Ожидайте подтверждения врача');location.hash='#appointments';
  });
},
appointments(){
  const all=appts().filter(a=>a.patientId===U.id).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  $v.innerHTML=head('Мои записи','Все ваши визиты к врачам',`<a class="btn primary" href="#book">${ic('plus')} Новая запись</a>`)+
  `<div class="panel"><div class="list">${all.map(a=>apptRow(a,'pat')).join('')||'<div class="empty">Записей нет</div>'}</div></div>`;bind();
},
records(){
  const u=userById(U.id),tab=window._mc||'sum';
  const visits=appts().filter(x=>x.patientId===U.id&&x.status==='done').sort((x,y)=>(y.date+y.time).localeCompare(x.date+x.time));
  const files=u.files||[];
  const tabs=[['sum','Обзор'],['vis',`Приёмы · ${visits.length}`],['doc',`Документы · ${files.length}`]];
  let body='';
  if(tab==='sum')body=`<div class="mchead"><h3>Здоровье</h3><button class="btn sm no-print" id="eh">Изменить</button></div>${healthHTML(u.health)}<div class="mchead"><h3>Последний приём</h3></div>${visits[0]?visitHTML(visits[0]):'<div class="panel"><div class="empty">Приёмов пока не было. Заключение врача появится здесь.</div></div>'}`;
  else if(tab==='vis')body=visits.map(visitHTML).join('')||'<div class="panel"><div class="empty">Заключений пока нет</div></div>';
  else body=`<div class="mchead"><h3>Документы и анализы</h3><button class="btn sm primary no-print" id="ad">${ic('plus')} Загрузить</button></div>${docsHTML(files,true)}<p class="note-s">Фото сжимаются автоматически, PDF — до 900 КБ. Файлы сохраняются в базе данных клиники.</p>`;
  $v.innerHTML=head('Медицинская карта',`№ ${cardNo(u)} · ${esc(u.name)}${u.birth?', '+ageOf(u.birth)+' лет':''}`,`<button class="btn no-print" id="prn">Печать</button>`)+
    `<div class="chips no-print">${tabs.map(([k,t])=>`<button class="chip ${k===tab?'on':''}" data-mc="${k}">${t}</button>`).join('')}</div><div class="mcbody">${body}</div>`;
  $v.querySelectorAll('[data-mc]').forEach(b=>b.onclick=()=>{window._mc=b.dataset.mc;VIEWS.records();hydrate()});
  $v.querySelector('#prn').onclick=()=>window.print();
  $v.querySelector('#eh')?.addEventListener('click',()=>healthForm(()=>{VIEWS.records();hydrate()}));
  $v.querySelector('#ad')?.addEventListener('click',()=>addDocFlow(U.id,'',()=>{VIEWS.records();hydrate()}));
  $v.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openBlob(files.find(f=>f.id===b.dataset.open)));
  $v.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(!confirm('Удалить документ?'))return;const us=users(),x=us.find(z=>z.id===U.id);x.files=(x.files||[]).filter(f=>f.id!==b.dataset.del);DB.set('users',us);VIEWS.records();hydrate();toast('Документ удалён')});
},
schedule(){
  const days=Array.from({length:10},(_,i)=>addDays(i));
  const list=appts().filter(a=>a.doctorId===U.doctorId&&a.date===schDay).sort((a,b)=>a.time.localeCompare(b.time));
  $v.innerHTML=head('Расписание','Приёмы по дням')+
  `<div class="days">${days.map(s=>{const d=new Date(s+'T00:00');return `<div class="day ${s===schDay?'on':''}" data-s="${s}"><small>${d.toLocaleDateString('ru-RU',{weekday:'short'})}</small><span>${d.getDate()}</span></div>`}).join('')}</div>
  <div class="panel"><h3>${fmtDate(schDay)} <span class="badge b-confirmed">${list.length} зап.</span></h3><div class="list">${list.map(a=>apptRow(a,'doc')).join('')||'<div class="empty">На этот день записей нет</div>'}</div></div>`;
  $v.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{schDay=b.dataset.s;VIEWS.schedule();hydrate()});bind();
},
patients(){
  const all=appts().filter(a=>a.doctorId===U.doctorId),ids=[...new Set(all.map(a=>a.patientId))];
  $v.innerHTML=head('Пациенты','Все, кто записывался к вам')+
  `<div class="panel">${ids.length?`<table class="tbl"><tr><th>Пациент</th><th>Телефон</th><th>Визитов</th><th>Последний</th><th></th></tr>${ids.map(id=>{const p=userById(id),v=all.filter(a=>a.patientId===id).sort((a,b)=>b.date.localeCompare(a.date));
    return `<tr><td><b>${esc(p?.name)}</b><br><small style="color:var(--muted)">${esc(p?.email)}</small></td><td>${esc(p?.phone||'—')}</td><td>${v.length}</td><td>${fmtDate(v[0].date,true)}</td><td style="text-align:right"><button class="btn sm" data-card="${id}">Медкарта</button></td></tr>`}).join('')}</table>`:'<div class="empty">Пациентов пока нет</div>'}</div>`;
  $v.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>openCard(b.dataset.card));
},
profile(){
  const d=MY();
  $v.innerHTML=head('Профиль','Ваши данные и настройки')+
  `<div class="panel prog" style="max-width:640px">${(()=>{const it=[['Загрузите фото',!!photoOf(U)],['Укажите ФИО',U.name.trim().length>2],['Добавьте телефон',!!U.phone],...(isDoc?[['Расскажите о себе',(d.bio||'').length>40],['Задайте цену приёма',d.price>0]]:[...(isAdm?[]:[['Дата рождения',!!U.birth]]),['Подтвердите email',true]])];const n=it.filter(x=>x[1]).length;return `<div class="pg-h"><b>Заполненность профиля</b><span>${n} из ${it.length}</span></div><div class="pg-bar"><i style="width:${n/it.length*100}%"></i></div><div class="pg-l">${it.map(x=>`<span class="${x[1]?'ok':''}">${x[1]?'✓':'○'} ${x[0]}</span>`).join('')}</div>`})()}</div>
  <div class="panel" style="max-width:640px"><div style="display:flex;gap:18px;align-items:center;margin-bottom:22px"><div class="pav">${avatar(U.name,photoOf(U),'xl')}</div><div><h3 style="margin:0;font-size:26px">${esc(U.name)}</h3><small style="color:var(--muted)">${esc(U.email)}</small><div style="display:flex;gap:8px;margin-top:10px"><button type="button" class="btn sm" id="upl">${ic('plus')} Загрузить фото</button>${photoOf(U)?'<button type="button" class="btn sm ghost" id="rmp">Удалить</button>':''}</div></div></div>
  <form id="pf"><div class="row2"><div class="field"><label>ФИО</label><input class="input" name="name" value="${esc(U.name)}"></div>
  <div class="field"><label>Телефон</label><input class="input" name="phone" value="${esc(U.phone||'')}"></div></div>
  ${isDoc?`<div class="row2"><div class="field"><label>Специальность</label><select class="input" name="spec">${SPECS.map(s=>`<option ${s===d.spec?'selected':''}>${s}</option>`).join('')}</select></div>
  <div class="field"><label>Стоимость приёма, ₸</label><input class="input" type="number" min="0" name="price" value="${d.price}"></div></div>
  <div class="row2"><div class="field"><label>Приём с</label><input class="input" type="time" name="from" value="${d.from}"></div><div class="field"><label>Приём до</label><input class="input" type="time" name="to" value="${d.to}"></div></div>
  <div class="field"><label>Стаж, лет</label><input class="input" type="number" min="0" name="exp" value="${d.exp}"></div>
  <div class="field"><label>О враче</label><textarea class="input" name="bio">${esc(d.bio)}</textarea></div>`
  :isAdm?'':`<div class="field"><label>Дата рождения</label><input class="input" type="date" name="birth" value="${U.birth||''}"></div>`}
  <button class="btn primary">Сохранить</button></form></div>`;
  const setPhoto=v=>{try{const us=users(),i=us.findIndex(x=>x.id===U.id);us[i]={...us[i],photo:v};DB.set('users',us);
    if(isDoc){const ds=allDoctors(),j=ds.findIndex(x=>x.id===U.doctorId);ds[j]={...ds[j],img:v,custom:1};DB.set('doctors',ds)}}
    catch(e){return toast('Не удалось сохранить фото: память браузера заполнена')}
    toast(v?'Фото обновлено':'Фото удалено');setTimeout(()=>location.reload(),400)};
  $v.querySelector('#upl').onclick=()=>pickPhoto(setPhoto);
  $v.querySelector('#rmp')?.addEventListener('click',()=>setPhoto(''));
  $v.querySelector('#pf').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
    if(!f.name.trim())return toast('Укажите ФИО');
    const us=users(),i=us.findIndex(x=>x.id===U.id);us[i]={...us[i],name:f.name.trim(),phone:f.phone,birth:f.birth};DB.set('users',us);
    if(isDoc){const ds=doctors(),j=ds.findIndex(x=>x.id===U.doctorId);
      ds[j]={...ds[j],name:f.name.trim(),spec:f.spec,price:+f.price||0,from:f.from,to:f.to,exp:+f.exp||0,bio:f.bio};DB.set('doctors',ds)}
    toast('Профиль сохранён');setTimeout(()=>location.reload(),600)};
}};
if(U){window.addEventListener('hashchange',route);route()}
