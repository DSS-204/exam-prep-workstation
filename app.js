/* ============ 酱酱备考工作台 - 完整模块化系统 ============ */
/* 版本：v2 全模块联动增强版 */

/* ===== 数据存储层 ===== */
const DB = {
  get(k, d){ try{ const v = localStorage.getItem('jj_'+k); return v?JSON.parse(v):d; }catch(e){ return d; } },
  set(k, v){ localStorage.setItem('jj_'+k, JSON.stringify(v)); }
};
function saveData(){ collectAndSave(); }

/* ===== 统一数据中心（错题本/收藏夹） ===== */
const DC = {
  get wrong(){ return DB.get('wrongQuestions', []); },
  set wrong(v){ DB.set('wrongQuestions', v); },
  get fav(){ return DB.get('favItems', []); },
  set fav(v){ DB.set('favItems', v); },
  get idiomState(){ return DB.get('idiomState', {}); },
  set idiomState(v){ DB.set('idiomState', v); },
  get normState(){ return DB.get('normState', {}); },
  set normState(v){ DB.set('normState', v); },
  // 加入错题（去重）
  addWrong(w){
    const list = DC.wrong;
    if(!list.find(x=>x.q===w.q && x.src===w.src)){
      w.id = 'w'+Date.now()+Math.random().toString(36).slice(2,6);
      w.times = 0; w.mastery = '待巩固'; w.note='';
      list.unshift(w); DC.wrong = list;
    }
  },
  // 收藏素材
  addFav(f){
    const list = DC.fav;
    if(!list.find(x=>x.text===f.text && x.type===f.type)){
      f.id='f'+Date.now()+Math.random().toString(36).slice(2,6);
      list.unshift(f); DC.fav = list;
      toast('已收藏 💖');
    } else { toast('已在收藏夹'); }
  }
};
function toast(msg){
  let t=document.getElementById('toastBox');
  if(!t){ t=document.createElement('div'); t.id='toastBox'; t.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(156,95,80,.92);color:#fff;padding:10px 18px;border-radius:14px;font-size:14px;z-index:9999;pointer-events:none;transition:opacity .3s;'; document.body.appendChild(t); }
  t.textContent=msg; t.style.opacity='1';
  clearTimeout(t._t); t._t=setTimeout(()=>{ t.style.opacity='0'; },1200);
}

/* ===== 全局状态 ===== */
let state = {
  planTime: DB.get('planTime',''),
  tasks: DB.get('tasks', null),
  eval: DB.get('eval', {rate:'',focus:'',distract:'',questions:'',words:'',recite:'',star:0}),
  reflect: DB.get('reflect',{detail:'',self:'',plan:''}),
  sport: DB.get('sport',{time:'',checklist:{},remind:''}),
  todos: DB.get('todos',[]),
  schedule: DB.get('schedule',{sleepStart:'',sleepEnd:'',nightDur:'',napStart:'',napEnd:'',napDur:'',napStatus:''}),
  treehole: DB.get('treehole',{mood:0,text:'',history:[]}),
  slogans: DB.get('slogans',{current:'',type:'',history:[]}),
  anniversaries: DB.get('anniversaries',[]),
  examDate: DB.get('examDate','2027-03-13'),
  focusSeconds: DB.get('focusSeconds',0),
  focusRunning: false
};
const defaultTasks = [
  {section:'行测',items:[{text:'言语理解 - 片段阅读 20题',done:false,status:'进行中'},{text:'判断推理 - 图形推理 15题',done:false,status:'进行中'}]},
  {section:'申论',items:[{text:'归纳概括 练习1篇',done:false,status:'进行中'},{text:'大作文 仿写练习',done:false,status:'进行中'}]},
  {section:'时政',items:[{text:'背诵当日时政要点',done:false,status:'进行中'},{text:'安徽本土政策速览',done:false,status:'进行中'}]}
];
if(!state.tasks) state.tasks = defaultTasks;
const sportList = ['晨跑/慢跑','散步','拉伸放松','肩颈操','腰背舒缓','跳绳','瑜伽','室内健身操'];

/* ===== 侧边抽屉导航 ===== */
const drawer = document.getElementById('sideDrawer');
const overlay = document.getElementById('drawerOverlay');
function openDrawer(){ drawer.classList.add('open'); overlay.classList.add('show'); }
function closeDrawer(){ drawer.classList.remove('open'); overlay.classList.remove('show'); }
document.getElementById('openDrawerBtn')?.addEventListener('click', openDrawer);
overlay?.addEventListener('click', closeDrawer);
document.querySelectorAll('.drawer-item').forEach(item=>{
  item.addEventListener('click',()=>{
    const target = item.dataset.target;
    if(target.startsWith('page-')){ goPage(target); }
    else { goPage('homePage'); setTimeout(()=>scrollToCard(target),300); }
    closeDrawer();
  });
});
function scrollToCard(id){
  const el = document.getElementById(id);
  if(el){ document.getElementById('homePage').scrollTo({top: el.offsetTop-10, behavior:'smooth'}); }
}
let tsX=0,tsY=0,swActive=false;
document.addEventListener('touchstart',e=>{ tsX=e.touches[0].clientX; tsY=e.touches[0].clientY; swActive=true; },{passive:true});
document.addEventListener('touchend',e=>{
  if(!swActive) return;
  const dx=e.changedTouches[0].clientX-tsX, dy=e.changedTouches[0].clientY-tsY;
  if(Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy)*2){
    if(dx>0 && tsX<40) openDrawer();
    if(dx<0 && drawer.classList.contains('open')) closeDrawer();
  }
  swActive=false;
},{passive:true});

/* ===== 页面切换 ===== */
function goPage(pid){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const t=document.getElementById(pid); if(t) t.classList.add('active');
  const hp=document.getElementById('homePage'); if(hp) hp.scrollTop=0;
}

/* ===== 日期 ===== */
function initDate(){
  const now=new Date();
  const ds=['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  const t=document.getElementById('topDate'); if(t) t.textContent=`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日・${ds[now.getDay()]}`;
}

/* ===== 倒计时 ===== */
function initCountdown(){
  // 版本迁移：旧版默认日期统一更新为2027安徽省考
  const ver=DB.get('dateVer',0);
  if(ver<2){ const saved=DB.get('examDate',''); if(['2026-11-30','2027-03-22'].includes(saved)||!saved){ DB.set('examDate','2027-03-13'); state.examDate='2027-03-13'; } DB.set('dateVer',2); }
  const exam=new Date(state.examDate), now=new Date();
  const days=Math.ceil((exam-now)/(1000*60*60*24));
  const e=document.getElementById('cdDays'); if(e) e.textContent=days>0?days:0;
  const ed=document.getElementById('cdExamDate'); if(ed) ed.textContent=`笔试日期：${exam.getFullYear()}年${exam.getMonth()+1}月${exam.getDate()}日`;
  const tips=['稳步蓄力，终会上岸','每一道题都是通往上岸的阶梯','坚持，是为了遇见更好的自己','今日汗水，明日荣光'];
  const tt=document.getElementById('cdTip'); if(tt) tt.textContent=tips[Math.floor(Math.random()*tips.length)];
}

/* ===== 励志标语 ===== */
const slogans = {
  '治愈安抚':['累了就歇一歇，备考是一场马拉松，不是百米冲刺。允许自己慢一点，才能走得更远。','今天没学好没关系，明天继续就好。你已经在路上，这本身就值得肯定。','焦虑是正常的，说明你在乎。深呼吸，把大目标拆成小任务，一步一步来。','与其内耗自责，不如现在翻开书看一页。行动是治愈焦虑最好的良药。'],
  '脚踏实地':['行测提分靠刷题，申论提分靠积累。今天多刷一道题，考场上就多一分把握。','错题不是失败，是提分的路标。弄懂一道错题，胜过盲目刷十道新题。','每天进步一点点，日积月累就是质变。坚持下去，量变终会引起质变。','不要和别人比进度，按照自己的节奏来。你的对手只有昨天的自己。'],
  '冲刺提分':['资料分析练速算，判断推理找规律，言语理解抓主旨。专项突破，逐个击破！','申论大作文，开头要亮眼，分论点要清晰，结尾要升华。记住框架，灵活运用。','时政热点要积累，规范表达要背诵。考场上下笔如有神，全靠平时功夫深。','模考暴露问题不可怕，可怕的是不去总结。把每次模考当成提分的机会。'],
  '上岸目标':['上岸不是终点，而是新的起点。为了那份稳定与理想，现在的辛苦都值得。','想想拿到录取通知书的那一刻，所有的付出都会变成值得的回忆。','你在书桌前的每一个深夜，都在为未来的自己铺路。加油，上岸见！','既然选择了公考这条路，就坚定地走下去。上岸的那一刻，你会感谢现在拼命的自己。']
};
function refreshSlogan(){
  const types=Object.keys(slogans);
  const type=types[Math.floor(Math.random()*types.length)];
  const list=slogans[type];
  let text=list[Math.floor(Math.random()*list.length)];
  while(text===state.slogans.current && list.length>1) text=list[Math.floor(Math.random()*list.length)];
  state.slogans.current=text; state.slogans.type=type;
  state.slogans.history.unshift({text,type,date:new Date().toLocaleDateString()});
  if(state.slogans.history.length>30) state.slogans.history.pop();
  DB.set('slogans',state.slogans); renderSlogan();
}
function renderSlogan(){
  if(!state.slogans.current) refreshSlogan();
  const te=document.getElementById('sloganType'); if(te) te.textContent=state.slogans.type||'治愈安抚';
  const tt=document.getElementById('sloganText'); if(tt) tt.textContent=state.slogans.current;
}

/* ===== 学习任务 ===== */
function renderTasks(){
  const wrap=document.getElementById('taskSections'); if(!wrap) return;
  wrap.innerHTML='';
  state.tasks.forEach((sec,si)=>{
    const sd=document.createElement('div'); sd.className='task-section';
    sd.innerHTML=`<div class="task-section-head"><span class="task-section-title" contenteditable="true" onblur="editSectionName(${si},this.textContent)">${sec.section}</span></div>`;
    sec.items.forEach((item,ii)=>{
      const it=document.createElement('div'); it.className='task-item';
      it.innerHTML=`<div class="task-checkbox ${item.done?'checked':''}" onclick="toggleTask(${si},${ii})"></div>
        <div class="task-content">${item.text}</div>
        <span class="task-status ${item.done?'done':item.status==='进行中'?'doing':'late'}">${item.done?'已完成':item.status}</span>
        <span class="task-edit-btn" onclick="editTask(${si},${ii})">⋯</span>`;
      sd.appendChild(it);
    });
    wrap.appendChild(sd);
  });
}
function toggleTask(si,ii){
  state.tasks[si].items[ii].done=!state.tasks[si].items[ii].done;
  state.tasks[si].items[ii].status=state.tasks[si].items[ii].done?'已完成':'进行中';
  DB.set('tasks',state.tasks); renderTasks();
}
function editSectionName(si,name){ state.tasks[si].section=name.trim()||state.tasks[si].section; DB.set('tasks',state.tasks); }
function editTask(si,ii){ const t=prompt('编辑任务：',state.tasks[si].items[ii].text); if(t!==null){ state.tasks[si].items[ii].text=t; DB.set('tasks',state.tasks); renderTasks(); } }
function addTask(){ const s=prompt('选择分区编号（1行测 2申论 3时政）：','1'); const t=prompt('输入任务内容：',''); if(t){ const i=parseInt(s)-1; if(state.tasks[i]){ state.tasks[i].items.push({text:t,done:false,status:'进行中'}); DB.set('tasks',state.tasks); renderTasks(); } } }

/* 自评台账 */
function renderEval(){
  const e=state.eval;
  ['Rate','Focus','Distract','Questions','Words','Recite'].forEach(k=>{
    const map={Rate:'rate',Focus:'focus',Distract:'distract',Questions:'questions',Words:'words',Recite:'recite'};
    const el=document.getElementById('eval'+k); if(el) el.value=e[map[k]];
  });
  setStar(e.star,false);
}
['evalRate','evalFocus','evalDistract','evalQuestions','evalWords','evalRecite'].forEach(id=>{
  const el=document.getElementById(id); if(el) el.addEventListener('change',()=>{
    state.eval[id.replace('eval','').toLowerCase()]=document.getElementById(id).value; DB.set('eval',state.eval);
  });
});
function setStar(val,save=true){
  state.eval.star=val;
  document.querySelectorAll('.star').forEach(s=>{ const v=parseInt(s.dataset.val); s.classList.toggle('active',v<=val); s.textContent=v<=val?'★':'☆'; });
  if(save) DB.set('eval',state.eval);
}
/* 反省 */
function renderReflect(){
  ['Detail','Self','Plan'].forEach(k=>{ const map={Detail:'detail',Self:'self',Plan:'plan'}; const el=document.getElementById('reflect'+k); if(el) el.value=state.reflect[map[k]]; });
}
['reflectDetail','reflectSelf','reflectPlan'].forEach(id=>{
  const el=document.getElementById(id); if(el) el.addEventListener('change',()=>{ const map={reflectDetail:'detail',reflectSelf:'self',reflectPlan:'plan'}; state.reflect[map[id]]=document.getElementById(id).value; DB.set('reflect',state.reflect); });
});
/* 运动 */
function renderSport(){
  const st=document.getElementById('sportTime'); if(st) st.value=state.sport.time;
  const sr=document.getElementById('sportRemind'); if(sr) sr.value=state.sport.remind;
  const cl=document.getElementById('sportChecklist'); if(cl){ cl.innerHTML='';
    sportList.forEach(s=>{ const d=document.createElement('div'); d.className='sport-check-item'+(state.sport.checklist[s]?' checked':'');
      d.innerHTML=`<div class="sport-check-box"></div><span>${s}</span>`;
      d.onclick=()=>{ state.sport.checklist[s]=!state.sport.checklist[s]; DB.set('sport',state.sport); renderSport(); };
      cl.appendChild(d);
    });
  }
}
function checkSportTime(input){ if(parseInt(input.value)>90){ input.value=90; alert('单日计划运动时长上限为90分钟'); } state.sport.time=input.value; DB.set('sport',state.sport); }
/* 待办 */
function renderTodo(){
  const list=document.getElementById('todoList'); if(!list) return; list.innerHTML='';
  if(state.todos.length===0){ list.innerHTML='<div style="text-align:center;color:var(--text-gray);padding:20px;font-size:13px;">暂无待办事项</div>'; return; }
  state.todos.forEach((t,i)=>{ const d=document.createElement('div'); d.className='todo-item';
    d.innerHTML=`<div class="todo-check ${t.done?'checked':''}" onclick="toggleTodo(${i})"></div><div class="todo-text ${t.done?'done':''}">${t.text}</div><span class="todo-del" onclick="delTodo(${i})">✕</span>`;
    list.appendChild(d);
  });
}
function addTodo(){ const t=prompt('输入待办事项：',''); if(t){ state.todos.push({text:t,done:false}); DB.set('todos',state.todos); renderTodo(); } }
function toggleTodo(i){ state.todos[i].done=!state.todos[i].done; DB.set('todos',state.todos); renderTodo(); }
function delTodo(i){ state.todos.splice(i,1); DB.set('todos',state.todos); renderTodo(); }
/* 作息双向联动 */
function renderSchedule(){
  const s=state.schedule;
  ['sleepStart','sleepEnd','nightDur','napStart','napEnd','napDur','napStatus'].forEach(k=>{ const el=document.getElementById(k); if(el) el.value=s[k]; });
}
function calcNightSleep(){
  const s=state.schedule; s.sleepStart=document.getElementById('sleepStart').value; s.sleepEnd=document.getElementById('sleepEnd').value;
  if(s.sleepStart&&s.sleepEnd){ const a=toMin(s.sleepStart),b=toMin(s.sleepEnd); if(b<a)b+=1440; s.nightDur=((b-a)/60).toFixed(1); document.getElementById('nightDur').value=s.nightDur; }
  DB.set('schedule',s);
}
function calcNightFromDur(){
  const s=state.schedule; s.nightDur=document.getElementById('nightDur').value;
  if(s.nightDur&&s.sleepStart){ let e=toMin(s.sleepStart)+parseFloat(s.nightDur)*60; e%=1440; s.sleepEnd=fromMin(e); document.getElementById('sleepEnd').value=s.sleepEnd; }
  DB.set('schedule',s);
}
function calcNap(){
  const s=state.schedule; s.napStart=document.getElementById('napStart').value; s.napEnd=document.getElementById('napEnd').value;
  if(s.napStart&&s.napEnd){ const a=toMin(s.napStart),b=toMin(s.napEnd); if(b<a)b+=1440; s.napDur=((b-a)/60).toFixed(1); document.getElementById('napDur').value=s.napDur; }
  DB.set('schedule',s);
}
function calcNapFromDur(){
  const s=state.schedule; s.napDur=document.getElementById('napDur').value;
  if(s.napDur&&s.napStart){ let e=toMin(s.napStart)+parseFloat(s.napDur)*60; e%=1440; s.napEnd=fromMin(e); document.getElementById('napEnd').value=s.napEnd; }
  DB.set('schedule',s);
}
function toMin(t){ const [h,m]=t.split(':').map(Number); return h*60+m; }
function fromMin(m){ const h=Math.floor(m/60)%24, mm=Math.round(m%60); return String(h).padStart(2,'0')+':'+String(mm).padStart(2,'0'); }
/* 树洞 */
function setMood(val){
  state.treehole.mood=val;
  document.querySelectorAll('.mood-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.mood)===val));
  DB.set('treehole',state.treehole); if(val<=2) showDecompress();
}
function saveTreehole(){
  state.treehole.text=document.getElementById('treeholeText').value;
  if(state.treehole.text.trim()){ state.treehole.history.unshift({text:state.treehole.text,mood:state.treehole.mood,date:new Date().toLocaleString()}); if(state.treehole.history.length>50) state.treehole.history.pop(); }
  DB.set('treehole',state.treehole); renderTreehole(); if(state.treehole.mood<=2) showDecompress(); toast('心情记录已保存 💖');
}
function renderTreehole(){
  const tt=document.getElementById('treeholeText'); if(tt) tt.value=state.treehole.text;
  document.querySelectorAll('.mood-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.mood)===state.treehole.mood));
  const h=document.getElementById('treeholeHistory'); if(!h) return; h.innerHTML='';
  if(state.treehole.history.length===0){ h.innerHTML='<div style="color:var(--text-gray);font-size:13px;text-align:center;padding:10px;">暂无历史记录</div>'; return; }
  const m={5:'😊',4:'🙂',3:'😐',2:'😔',1:'😢'};
  state.treehole.history.forEach(x=>{ const d=document.createElement('div'); d.className='th-item'; d.innerHTML=`<div class="th-date">${x.date}</div><span class="th-mood">${m[x.mood]||''}</span>${x.text}`; h.appendChild(d); });
}
function showDecompress(){
  const box=document.getElementById('decompressBox'), c=document.getElementById('decompressContent');
  if(!box) return; box.style.display='block';
  c.innerHTML=`检测到您心情低落，已自动生成减压方案：<br>① 今日学习任务总量降低30%，重点保留薄弱项专项练习<br>② 搭配10分钟肩颈舒缓拉伸运动<br>③ 明日将推送治愈类励志文案<br>④ 建议早睡，保证充足睡眠<br>备考是长跑，照顾好自己才能走得更远 💖`;
}
/* 专注计时 */
let focusTimer=null;
function startFocus(){ if(state.focusRunning) return; state.focusRunning=true; focusTimer=setInterval(()=>{ state.focusSeconds++; document.getElementById('focusDisplay').textContent=formatTime(state.focusSeconds); if(state.focusSeconds>0&&state.focusSeconds%5400===0) alert('已连续学习90分钟！请暂停学习，进行10分钟肩颈腰椎舒缓拉伸休息。'); if(state.focusSeconds%60===0) DB.set('focusSeconds',state.focusSeconds); },1000); }
function pauseFocus(){ state.focusRunning=false; clearInterval(focusTimer); }
function resetFocus(){ state.focusRunning=false; clearInterval(focusTimer); state.focusSeconds=0; DB.set('focusSeconds',0); const d=document.getElementById('focusDisplay'); if(d) d.textContent='00:00:00'; }
function formatTime(sec){ const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60; return [h,m,s].map(x=>String(x).padStart(2,'0')).join(':'); }
/* 纪念日 */
function renderAnniversary(){
  const list=document.getElementById('anniList'); if(!list) return; list.innerHTML='';
  if(state.anniversaries.length===0){ list.innerHTML='<div style="text-align:center;color:var(--text-gray);padding:20px;font-size:13px;">暂无纪念日，点击添加</div>'; return; }
  state.anniversaries.forEach((a,i)=>{ const tg=new Date(a.date),now=new Date(); const d=Math.ceil((tg-now)/(1000*60*60*24));
    const div=document.createElement('div'); div.className='anni-item';
    div.innerHTML=`<div><div class="anni-name">${a.name}</div><div class="anni-date">${a.date}</div></div><div class="anni-days">${d>0?'剩'+d+'天':'已过'+Math.abs(d)+'天'}</div><span class="todo-del" onclick="delAnni(${i})">✕</span>`;
    list.appendChild(div);
  });
}
function addAnniversary(){ const n=prompt('纪念日名称：',''); if(!n) return; const d=prompt('日期（YYYY-MM-DD）：',''); if(d){ state.anniversaries.push({name:n,date:d}); DB.set('anniversaries',state.anniversaries); renderAnniversary(); } }
function delAnni(i){ state.anniversaries.splice(i,1); DB.set('anniversaries',state.anniversaries); renderAnniversary(); }
/* 数据统计 */
function renderChart(){
  const canvas=document.getElementById('statsChart'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const w=canvas.width=canvas.offsetWidth*2, h=canvas.height=440; ctx.scale(2,2);
  const cw=canvas.offsetWidth, ch=220; ctx.clearRect(0,0,cw,ch);
  const days=['一','二','三','四','五','六','日'];
  const study=[5,6,4,7,5,8,6], sport=[0.5,1,0,0.5,1,1.5,0.5], sleep=[7,7.5,6.5,8,7,7.5,8];
  ctx.strokeStyle='#F0E8E0'; ctx.lineWidth=1;
  for(let i=0;i<=5;i++){ const y=15+170*i/5; ctx.beginPath(); ctx.moveTo(30,y); ctx.lineTo(cw-10,y); ctx.stroke(); }
  ctx.fillStyle='#A89B92'; ctx.font='10px sans-serif'; ctx.textAlign='center';
  days.forEach((d,i)=>ctx.fillText(d,30+cw*i/6,ch-8));
  function draw(data,color){ ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath(); data.forEach((v,i)=>{ const x=30+cw*i/6,y=15+170*(1-v/10); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); }); ctx.stroke(); data.forEach((v,i)=>{ const x=30+cw*i/6,y=15+170*(1-v/10); ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill(); }); }
  draw(study,'#7BA7D9'); draw(sport,'#7AB87A'); draw(sleep,'#E8A0A8');
}
/* 复盘 */
function generateReview(){
  const c=document.getElementById('reviewContent'); if(!c) return;
  const type=document.querySelector('.review-tab.active')?.dataset.type||'week';
  if(type==='week'){ c.innerHTML=`<div class="review-block"><h4>📊 本周数据汇总</h4><p>平均每日计划学习时长：${state.planTime||'未填写'}小时<br>刷题总数：${state.eval.questions||0}题<br>写作字数：${state.eval.words||0}字<br>背诵条数：${state.eval.recite||0}条<br>运动打卡：${Object.values(state.sport.checklist).filter(Boolean).length}项<br>夜间睡眠平均：${state.schedule.nightDur||0}小时</p></div><div class="review-block"><h4>⚠️ 薄弱项分析</h4><p>判断推理模块错误率较高；申论大作文框架运用不够熟练；时政背诵需加强安徽本土政策部分。</p></div><div class="review-block"><h4>📋 下周优化方案</h4><p>1. 增加判断推理专项练习量，重点突破图形推理<br>2. 每日背诵1篇申论大作文框架，进行仿写练习<br>3. 晨间增加15分钟安徽时政要点速览<br>4. 保持每日30分钟运动，劳逸结合</p></div>`; }
  else { c.innerHTML=`<div class="review-block"><h4>📊 本月数据汇总</h4><p>全月刷题总量：约${(parseInt(state.eval.questions)||0)*4}题<br>模考分数波动：120-135分区间<br>运动坚持天数：约20天<br>平均睡眠时长：${state.schedule.nightDur||7}小时</p></div><div class="review-block"><h4>📈 长期备考心态</h4><p>本月备考心态整体平稳，偶有焦虑情绪。树洞记录显示中下旬压力较大，需注意调节。</p></div><div class="review-block"><h4>📦 月度备考资料包</h4><p>已生成：① 行测高频速解技巧汇总 ② 申论高分范文10篇 ③ 当月完整时政汇总（含安徽本土政策）</p></div>`; }
}
function switchReview(type,btn){ document.querySelectorAll('.review-tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active'); generateReview(); }
/* 收集保存 */
function collectAndSave(){ state.planTime=document.getElementById('planTotalTime')?.value||state.planTime; DB.set('planTime',state.planTime); }
document.getElementById('planTotalTime')?.addEventListener('change',collectAndSave);

/* ===== 申论规范词库（8领域） ===== */
const normWords=[
  {field:'经济发展',sub:'产业升级',word:'新旧动能转换',meaning:'培育壮大新动能，改造提升传统动能，淘汰落后产能。',example:'安徽省积极推进新旧动能转换，战略性新兴产业产值占比持续提升。',star:5,types:'概括题/对策题'},
  {field:'经济发展',sub:'营商环境',word:'放管服改革',meaning:'简政放权、放管结合、优化服务。',example:'深化"放管服"改革，安徽省企业开办时间大幅压缩。',star:5,types:'概括题/公文题'},
  {field:'民生服务',sub:'教育公平',word:'教育均衡发展',meaning:'推动城乡、区域、校际间教育资源均衡配置。',example:'推进义务教育均衡发展，缩小城乡教育差距。',star:4,types:'概括题/对策题'},
  {field:'民生服务',sub:'医疗保障',word:'分级诊疗',meaning:'按疾病轻重缓急及难易程度分级，不同级别医疗机构承担不同治疗。',example:'建立分级诊疗制度，引导优质医疗资源下沉基层。',star:4,types:'概括题'},
  {field:'生态环保',sub:'生态保护',word:'生态补偿机制',meaning:'通过经济手段保护生态环境，让保护者获合理补偿。',example:'新安江流域生态补偿机制成为全国样板。',star:5,types:'对策题/综合分析'},
  {field:'基层治理',sub:'矛盾化解',word:'新时代枫桥经验',meaning:'发动依靠群众，矛盾不上交，就地解决。',example:'坚持发展新时代"枫桥经验"，提升基层社会治理水平。',star:5,types:'概括题/对策题'},
  {field:'文化建设',sub:'文化传承',word:'创造性转化创新性发展',meaning:'对中华优秀传统文化改造，赋予新时内涵。',example:'推动徽文化创造性转化、创新性发展。',star:4,types:'综合分析/大作文'},
  {field:'法治建设',sub:'依法行政',word:'法治政府建设',meaning:'政府全面依法履行职能，严格规范公正文明执法。',example:'深入推进法治政府建设，提升依法行政水平。',star:4,types:'对策题'},
  {field:'乡村振兴',sub:'产业振兴',word:'一二三产融合',meaning:'农业与加工、流通、旅游等产业融合发展。',example:'推进农村一二三产融合，拓宽农民增收渠道。',star:5,types:'对策题/大作文'},
  {field:'乡村振兴',sub:'人才振兴',word:'引才育才留才',meaning:'引进培育留住乡村人才，强化振兴支撑。',example:'实施"雁归工程"，引才育才留才助力乡村振兴。',star:4,types:'对策题'},
  {field:'科技创新',sub:'双创',word:'创新驱动发展',meaning:'以科技创新引领产业创新，培育新质生产力。',example:'合肥打造创新高地，以创新驱动高质量发展。',star:5,types:'大作文/综合分析'},
  {field:'科技创新',sub:'产业',word:'卡脖子技术攻关',meaning:'突破关键核心技术受制于人的瓶颈。',example:'安徽聚力卡脖子技术攻关，提升产业链韧性。',star:4,types:'对策题'}
];
/* 易混规范词对比 */
const normCompare=[
  {a:'一蹴而就',b:'轻而易举',diff:'一蹴而就：强调时间短、一下子成功（多用于否定，"不能一蹴而就"）；轻而易举：强调容易，不费力气。'},
  {a:'相得益彰',b:'相辅相成',diff:'相得益彰：两者互相配合，双方长处更显突出；相辅相成：两者互相配合，缺一不可。'},
  {a:'方兴未艾',b:'如火如荼',diff:'方兴未艾：事物正在发展，尚未达到止境；如火如荼：声势浩大、气氛热烈地进行中。'}
];
/* 官方热词 */
const hotWords=[
  {year:'2026',field:'中央热词',word:'中国式现代化',def:'人口规模巨大、全体人民共同富裕、物质精神协调、人与自然和谐、走和平发展道路的现代化。',bg:'党的二十大提出，是中心任务。',scene:'大作文主题论述、综合分析题。',demo:'推进中国式现代化必须坚持中国共产党领导。',star:5,related:'topic'},
  {year:'2026',field:'安徽热词',word:'三地一区',def:'科技创新策源地、新兴产业聚集地、改革开放新高地、经济社会发展全面绿色转型区。',bg:'习近平总书记考察安徽赋予新定位。',scene:'安徽省考申论大作文、归纳概括。',demo:'安徽奋力打造"三地一区"，在长三角一体化中展现更大作为。',star:5,related:'topic'},
  {year:'2026',field:'两会热词',word:'新质生产力',def:'技术革命性突破、要素创新性配置、产业深度转型升级催生的先进生产力。',bg:'2024年提出并成为核心政策导向。',scene:'综合分析、大作文。',demo:'发展新质生产力，要因地制宜，避免盲目跟风。',star:5,related:'topic'},
  {year:'2025',field:'安徽热词',word:'千亿斤江淮粮仓',def:'安徽省实施粮食产能提升工程，保障国家粮食安全。',bg:'安徽作为粮食主产区的政治责任。',scene:'乡村振兴主题、归纳概括。',demo:'建设千亿斤江淮粮仓，扛稳粮食安全政治责任。',star:4,related:'topic'}
];
/* 人民日报金句 */
const quotes=[
  {theme:'理想信念',cat:'开头万能句式',text:'心中有信仰，脚下有力量。新时代青年当以理想信念为灯塔，在复兴征程上笃定前行。',source:'人民日报评论员文章',dir:'可适配分论点：青年担当/初心使命'},
  {theme:'为民服务',cat:'开头万能句式',text:'江山就是人民，人民就是江山。唯有始终把人民放在心中最高位置，方能凝聚起磅礴伟力。',source:'人民日报',dir:'可适配分论点：民生为本/初心使命'},
  {theme:'实干担当',cat:'分论点论证',text:'担当是时代的呼唤，实干是成功的基石。唯有以钉钉子精神抓好落实，方能将蓝图变为现实。',source:'人民日报评论员文章',dir:'可适配分论点：抓落实/担当作为'},
  {theme:'科技创新',cat:'分论点论证',text:'创新是引领发展的第一动力。抓住科技创新这个"牛鼻子"，就抓住了发展全局的"关键子"。',source:'人民日报',dir:'可适配分论点：创新驱动/科技自立'},
  {theme:'文化自信',cat:'结尾升华金句',text:'文化自信是更基础、更广泛、更深厚的自信。让中华优秀传统文化在新时代焕发新活力，是我们的使命与担当。',source:'人民日报',dir:'可适配结尾：文化传承/精神根基'},
  {theme:'生态保护',cat:'结尾升华金句',text:'人不负青山，青山定不负人。守护好绿水青山，就是守护好我们的未来。',source:'人民日报评论员文章',dir:'可适配结尾：绿色发展/永续发展'},
  {theme:'基层治理',cat:'开头万能句式',text:'基层强则国家强，基层安则天下安。夯实基层治理根基，是国家治理现代化的基石。',source:'安徽日报',dir:'可适配分论点：治理重心下移'},
  {theme:'乡村振兴',cat:'分论点论证',text:'民族要复兴，乡村必振兴。做好乡村振兴大文章，需要五大振兴同频共振。',source:'人民日报',dir:'可适配分论点：城乡融合/产业兴旺'}
];
/* ================= 申论积累宝库 渲染 ================= */
function switchSTab(tab,btn){
  document.querySelectorAll('#page-shenlun .sub-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  const c=document.getElementById('sContent'); c.innerHTML='';
  if(tab==='norm') renderNorm(c);
  else if(tab==='hot') renderHot(c);
  else if(tab==='quote') renderQuote(c);
}
function renderNorm(c){
  const ns=DC.normState;
  c.innerHTML=`<input class="sl-search" placeholder="🔍 搜索规范词 / 领域 / 适用题型..." oninput="filterNorm(this.value)">
    <div class="sl-subtabs">
      <button class="sl-mini active" onclick="normFilterField('全部',this)">全部</button>
      <button class="sl-mini" onclick="normFilterField('经济发展',this)">经济</button>
      <button class="sl-mini" onclick="normFilterField('民生服务',this)">民生</button>
      <button class="sl-mini" onclick="normFilterField('生态环保',this)">生态</button>
      <button class="sl-mini" onclick="normFilterField('基层治理',this)">治理</button>
      <button class="sl-mini" onclick="normFilterField('文化建设',this)">文化</button>
      <button class="sl-mini" onclick="normFilterField('法治建设',this)">法治</button>
      <button class="sl-mini" onclick="normFilterField('乡村振兴',this)">乡村</button>
      <button class="sl-mini" onclick="normFilterField('科技创新',this)">科技</button>
      <button class="sl-mini" onclick="showCompare()">易混对比</button>
      <button class="sl-mini" onclick="normQuiz()">背诵抽查</button>
    </div>`;
  normWords.forEach((w,i)=>{
    const st=ns[i]||'不熟';
    const d=document.createElement('div'); d.className='sl-item'; d.dataset.word=(w.word+w.field+w.sub+w.types).toLowerCase();
    d.innerHTML=`<div class="sl-cat">${w.field} · ${w.sub} · <span class="sl-star">${'★'.repeat(w.star)}</span> · ${w.types}</div>
      <div class="sl-baihua">白话：${w.example}</div>
      <div class="sl-word">规范：${w.word}</div>
      <div class="sl-meaning">释义：${w.meaning}</div>
      <div class="sl-mastery">
        <span class="mk ${st==='不熟'?'on':''}" onclick="setNormState(${i},'不熟',this)">不熟</span>
        <span class="mk ${st==='已背'?'on':''}" onclick="setNormState(${i},'已背',this)">已背</span>
        <span class="mk ${st==='熟练'?'on':''}" onclick="setNormState(${i},'熟练',this)">熟练</span>
      </div>
      <div class="sl-actions">
        <button onclick="DC.addFav({type:'规范词',text:normWords[${i}].word,src:'申论规范词库',note:normWords[${i}].meaning})">收藏</button>
        <button onclick="normTest(${i})">自测</button>
      </div>`;
    c.appendChild(d);
  });
}
function setNormState(i,s,el){ const ns=DC.normState; ns[i]=s; DC.normState=ns; el.parentElement.querySelectorAll('.mk').forEach(x=>x.classList.remove('on')); el.classList.add('on'); }
function filterNorm(kw){ kw=kw.toLowerCase(); document.querySelectorAll('#sContent .sl-item').forEach(el=>{ el.style.display=el.dataset.word.includes(kw)?'':'none'; }); }
function normFilterField(f,btn){ document.querySelectorAll('.sl-mini').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); document.querySelectorAll('#sContent .sl-item').forEach(el=>{ el.style.display=(f==='全部'||el.dataset.word.includes(f.toLowerCase()))?'':'none'; }); }
function showCompare(){
  const c=document.getElementById('sContent'); const box=document.createElement('div'); box.className='sl-compare';
  box.innerHTML=`<div style="font-weight:700;color:var(--title-deep);margin-bottom:8px;">📐 易混规范词对比区</div>`+normCompare.map(x=>`<div class="cmp-row"><b>${x.a}</b> vs <b>${x.b}</b><br><span>${x.diff}</span></div>`).join('');
  c.appendChild(box);
}
function normQuiz(){
  const pool=[...normWords].sort(()=>Math.random()-0.5).slice(0,3);
  const c=document.getElementById('sContent'); const box=document.createElement('div'); box.className='sl-fill-test';
  box.innerHTML=`<div style="font-weight:700;color:var(--title-deep);margin-bottom:6px;">🎯 背诵抽查（随机抽词）</div>`+
    pool.map((w,idx)=>`<div style="margin-bottom:8px;"><div style="font-size:13px;">材料：${w.example.replace(w.word,'______')}</div><input class="q${idx}" placeholder="输入规范词" style="width:100%;margin-top:4px;border:1px solid var(--border-sakura);border-radius:8px;padding:6px 8px;"><span class="r${idx}" style="font-size:12px;margin-left:6px;"></span></div>`).join('')+
    `<button class="mini-btn" onclick="checkNormQuiz(${JSON.stringify(pool.map(w=>w.word)).replace(/"/g,'&quot;')})">核对</button>`;
  c.appendChild(box);
}
function checkNormQuiz(ans){
  for(let i=0;i<ans.length;i++){ const inp=document.querySelector('.q'+i); const r=document.querySelector('.r'+i); if(!inp) continue; if(inp.value.trim()===ans[i]){ r.textContent='✓'; r.style.color='#3a6b3a'; } else { r.textContent='✗ '+ans[i]; r.style.color='#8a4a3a'; } }
}
function normTest(i){ const w=normWords[i]; const c=document.getElementById('sContent'); const t=document.createElement('div'); t.className='sl-fill-test';
  t.innerHTML=`<label>填空自测：根据材料语境，输入对应规范词</label><div style="font-size:13px;background:#fff;padding:8px;border-radius:8px;margin:6px 0;">${w.example.replace(w.word,'______')}</div><input type="text" id="testInput" placeholder="输入规范词..."><button class="mini-btn" onclick="checkTest('${w.word}')">核对</button><div class="result" id="testResult"></div>`;
  c.insertBefore(t,c.firstChild);
}
function checkTest(ans){ const inp=document.getElementById('testInput'); const r=document.getElementById('testResult'); if(!inp) return; if(inp.value.trim()===ans){ r.textContent='✓ 回答正确！'; r.style.color='#3a6b3a'; } else { r.textContent='✗ 正确答案：'+ans; r.style.color='#8a4a3a'; } }
function renderHot(c){
  c.innerHTML=`<input class="sl-search" placeholder="🔍 搜索热词 / 年份 / 话题...">`;
  hotWords.forEach((w,i)=>{
    const d=document.createElement('div'); d.className='sl-item';
    d.innerHTML=`<div class="sl-cat">${w.year} · ${w.field} · <span class="sl-star">${'★'.repeat(w.star)}</span></div>
      <div class="sl-word">${w.word}</div>
      <div class="sl-meaning"><b>定义：</b>${w.def}<br><b>出处：</b>${w.bg}<br><b>适用：</b>${w.scene}<br><b>示范：</b>${w.demo}</div>
      <div class="sl-actions">
        <button onclick="DC.addFav({type:'热词',text:hotWords[${i}].word,src:'官方热词库',note:hotWords[${i}].def})">收藏</button>
        <button onclick="goPage('page-news')">关联时政</button>
      </div>`;
    c.appendChild(d);
  });
}
function renderQuote(c){
  const cats=['全部','开头金句','结尾金句','分论点论证'];
  c.innerHTML=`<input class="sl-search" placeholder="🔍 搜索金句 / 主题..." oninput="filterQuote(this.value)">
    <div class="sl-subtabs"><button class="sl-mini active" onclick="quoteByCat('全部',this)">全部</button><button class="sl-mini" onclick="quoteByCat('开头',this)">开头</button><button class="sl-mini" onclick="quoteByCat('结尾',this)">结尾</button><button class="sl-mini" onclick="quoteByCat('分论点',this)">论证</button><button class="sl-mini" onclick="shuffleQuote()">随机刷记</button></div>`;
  quotes.forEach((q,i)=>{
    const d=document.createElement('div'); d.className='sl-item'; d.dataset.text=(q.text+q.theme+q.cat).toLowerCase();
    d.innerHTML=`<div class="sl-cat">${q.theme} · ${q.cat}</div><div class="sl-word">"${q.text}"</div>
      <div class="sl-example">—— ${q.source}<br>📌 ${q.dir}</div>
      <div class="sl-actions">
        <button onclick="copyText(quotes[${i}].text)">复制</button>
        <button onclick="DC.addFav({type:'金句',text:quotes[${i}].text,src:'人民日报金句库',note:quotes[${i}].dir})">收藏</button>
        <button onclick="showImitate(${i})">仿写</button>
      </div>
      <div id="imi${i}" style="display:none;margin-top:6px;"><textarea id="imiT${i}" rows="2" placeholder="写下你的仿写..." style="width:100%;border:1px solid var(--border-sakura);border-radius:8px;padding:6px;font-size:13px;"></textarea><button class="mini-btn" onclick="saveImitate(${i})">保存仿写</button></div>`;
    c.appendChild(d);
  });
}
function filterQuote(kw){ kw=kw.toLowerCase(); document.querySelectorAll('#sContent .sl-item').forEach(el=>el.style.display=el.dataset.text.includes(kw)?'':'none'); }
function quoteByCat(cat,btn){ document.querySelectorAll('.sl-subtabs .sl-mini').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); document.querySelectorAll('#sContent .sl-item').forEach(el=>{ el.style.display=(cat==='全部'||el.dataset.text.includes(cat))?'':'none'; }); }
function shuffleQuote(){ const q=quotes[Math.floor(Math.random()*quotes.length)]; toast('💡 '+q.text); }
function copyText(t){ if(navigator.clipboard) navigator.clipboard.writeText(t).then(()=>toast('已复制')).catch(()=>toast('复制失败')); else toast('复制失败'); }
function showImitate(i){ const b=document.getElementById('imi'+i); b.style.display=b.style.display==='none'?'block':'none'; }
function saveImitate(i){ const t=document.getElementById('imiT'+i).value; if(t.trim()){ toast('仿写已保存 💾'); const fs=DB.get('imitate',{}); fs[i]=t; DB.set('imitate',fs); } }

/* ================= 时政资讯专区 ================= */
const newsData={
  daily:[ {date:'2026-07-30',title:'国家发改委：上半年GDP同比增长5.0%',desc:'国民经济运行总体平稳，新动能加快成长，安徽主要指标好于全国。',read:false,tag:'每日速览'},
    {date:'2026-07-30',title:'《习近平关于全面深化改革论述摘编》出版',desc:'系统阐述进一步全面深化改革的方向与路径。',read:false,tag:'每日速览'},
    {date:'2026-07-29',title:'教育部部署2026年高校毕业生就业服务',desc:'实施就业优先政策，拓宽基层和重点领域就业空间。',read:false,tag:'每日速览'} ],
  domestic:[ {date:'2026-07-28',title:'党的二十届三中全会精神持续落地',desc:'各地各部门细化改革举措，推进中国式现代化。',read:false,tag:'国内重大'},
    {date:'2026-07-25',title:'长三角一体化发展规划纲要深化实施',desc:'安徽深度融入，基础设施互联互通提速。',read:false,tag:'国内重大'} ],
  intl:[ {date:'2026-07-27',title:'全球气候治理多边合作推进',desc:'各方围绕减排目标加强协调。',read:false,tag:'国际热点'},
    {date:'2026-07-20',title:'全球人工智能治理框架磋商',desc:'国际社会共商AI安全与发展规则。',read:false,tag:'国际热点'} ],
  econ:[ {date:'2026-07-26',title:'安徽出台促进民营经济发展新举措',desc:'从融资、税费、营商环境三方面发力，激发市场主体活力。',read:false,tag:'经济民生'},
    {date:'2026-07-22',title:'全国医保异地就医结算扩面',desc:'群众就医负担进一步减轻。',read:false,tag:'经济民生'} ],
  tech:[ {date:'2026-07-24',title:'安徽量子科技重大原创成果发布',desc:'合肥综合性国家科学中心再获突破。',read:false,tag:'科技文教'},
    {date:'2026-07-18',title:'国家实验室建设取得阶段性成效',desc:'战略科技力量持续强化。',read:false,tag:'科技文教'} ],
  anhui:[ {date:'2026-07-29',title:'安徽省委全会部署绿色低碳转型',desc:'建设经济社会发展全面绿色转型区。',read:false,tag:'安徽时政'},
    {date:'2026-07-23',title:'合肥新能源汽车产量突破百万辆',desc:'产业集群效应显现，赋能"三地一区"。',read:false,tag:'安徽时政'} ]
};
const monthlyArchive=[
  {month:'2026年7月',pocket:'本月核心考点：新质生产力、长三角一体化、千亿斤江淮粮仓、绿色低碳转型。',deep:'深度梳理：政策背景+文件原文+申论适用角度+答题模板。',top10:'TOP10：①新质生产力②三地一区③乡村振兴④生态补偿⑤枫桥经验⑥放管服⑦新型城镇化⑧科教兴国⑨民生保障⑩文化自信',quiz:[{q:'"三地一区"指什么？',a:'科技创新策源地、新兴产业聚集地、改革开放新高地、经济社会发展全面绿色转型区'}]},
  {month:'2026年6月',pocket:'本月核心考点：全面深化改革、粮食安全、党纪学习教育。',deep:'深度梳理：三中全会精神解读与作答应用。',top10:'TOP10：①全面深化改革②粮食安全③新质生产力④基层治理⑤共同富裕⑥依法行政⑦数字政府⑧绿色发展⑨人才强国⑩文化自信',quiz:[{q:'安徽实施的粮食产能提升工程叫什么？',a:'千亿斤江淮粮仓'}]}
];
const meetingTopics=[
  {name:'中央全会及重要讲话专题',highlight:'进一步全面深化改革、推进中国式现代化',points:['中国式现代化内涵','改革系统集成','高水平社会主义市场经济体制'],jinju:'推进中国式现代化是一项伟大而艰巨的事业。'},
  {name:'全国两会全考点专题',highlight:'新质生产力、高质量发展、民生保障',points:['政府工作报告要点','宏观政策取向','民生十件实事'],jinju:'因地制宜发展新质生产力。'},
  {name:'中央经济工作会议专题',highlight:'稳中求进、以进促稳、先立后破',points:['九项重点任务','科技创新引领','扩大内需'],jinju:'坚持稳中求进工作总基调。'},
  {name:'中央一号文件专题',highlight:'粮食安全、乡村振兴、千万工程',points:['千亿斤粮食产能','和美乡村建设','农民增收'],jinju:'强国必先强农，农强方能国强。'},
  {name:'乡村振兴专题',highlight:'产业、人才、文化、生态、组织五大振兴',points:['一二三产融合','引才育才','移风易俗'],jinju:'民族要复兴，乡村必振兴。'},
  {name:'中央农村工作会议专题',highlight:'守住粮食安全与不发生规模性返贫两条底线',points:['藏粮于地藏粮于技','帮扶机制','县域富民'],jinju:'中国人的饭碗要牢牢端在自己手中。'},
  {name:'安徽省重要会议与政策汇总',highlight:'三地一区、绿色低碳转型区、徽文化',points:['合肥综合性国家科学中心','新能源汽车集群','大黄山建设'],jinju:'在长三角一体化中展现安徽更大作为。'}
];
const shizhengQuiz=[
  {q:'"新质生产力"首次在何时提出？',a:'2024年',opt:['2022年','2023年','2024年','2025年'],ans:2},
  {q:'安徽"三地一区"不包括以下哪项？',a:'经济社会发展全面绿色转型区',opt:['科技创新策源地','新兴产业聚集地','改革开放新高地','生态文明示范区'],ans:3},
  {q:'中央一号文件近年来聚焦的主题是？',a:'乡村振兴与粮食安全',opt:['科技创新','乡村振兴与粮食安全','对外开放','国防建设'],ans:1},
  {q:'"枫桥经验"的核心是什么？',a:'矛盾不上交、就地解决',opt:['严打整治','矛盾不上交、就地解决','网格化管理','科技赋能'],ans:1},
  {q:'安徽推进的长三角一体化中承担的角色是？',a:'重要一翼（长三角重要组成部分）',opt:['中心龙头','重要一翼','独立板块','服务基地'],ans:0}
];
function switchNewsTab(tab,btn){
  document.querySelectorAll('#page-news .sub-tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active');
  const c=document.getElementById('nContent'); c.innerHTML='';
  if(['daily','domestic','intl','econ','tech','anhui'].includes(tab)) renderNewsList(c,tab);
  else if(tab==='monthly') renderMonthly(c);
  else if(tab==='topic') renderTopics(c);
  else if(tab==='quiz') renderNewsQuiz(c);
  else if(tab==='recite') renderRecite(c);
}
function renderNewsList(c,tab){
  const list=newsData[tab];
  list.forEach((n,i)=>{
    const d=document.createElement('div'); d.className='news-item'+(n.read?' read':'');
    d.innerHTML=`<span class="news-tag">${n.tag}</span><span class="news-date">${n.date}</span>
      <div class="news-title">${n.title}</div><div class="news-desc">${n.desc}</div>
      <div class="sl-actions">
        <button class="${n.read?'':'primary'}" onclick="markRead('${tab}',${i},this)">${n.read?'已读':'标记已读'}</button>
        <button onclick="DC.addFav({type:'时政',text:'${n.title}',src:'时政资讯专区·'+n.tag,note:'${n.desc}'})">收藏</button>
        <button onclick="addAnnotation('${tab}',${i})">批注</button>
      </div>
      <div id="anno${tab}${i}" style="display:none;margin-top:6px;"><textarea id="annoT${tab}${i}" rows="2" placeholder="写批注..." style="width:100%;border:1px solid var(--border-sakura);border-radius:8px;padding:6px;font-size:13px;"></textarea><button class="mini-btn" onclick="saveAnno('${tab}',${i})">保存批注</button></div>`;
    c.appendChild(d);
  });
}
function markRead(tab,i,btn){ newsData[tab][i].read=true; btn.textContent='已读'; btn.classList.remove('primary'); toast('已标记已读'); }
function addAnnotation(tab,i){ const b=document.getElementById('anno'+tab+i); b.style.display=b.style.display==='none'?'block':'none'; }
function saveAnno(tab,i){ const t=document.getElementById('annoT'+tab+i).value; if(t.trim()){ newsData[tab][i].anno=t; toast('批注已保存'); } }
function renderMonthly(c){
  monthlyArchive.forEach(m=>{
    const d=document.createElement('div'); d.className='sl-item';
    d.innerHTML=`<div class="sl-cat">${m.month}</div>
      <div class="sl-meaning"><b>📱 口袋背诵版：</b>${m.pocket}</div>
      <div class="sl-meaning"><b>📒 深度复盘版：</b>${m.deep}</div>
      <div class="sl-meaning"><b>🔟 TOP10高频：</b>${m.top10}</div>
      <div class="sl-actions">
        <button onclick="exportMonthly('${m.month}')">导出文本</button>
        <button onclick="renderMonthlyQuiz('${m.month}')">当月自测</button>
      </div>
      <div id="mq${m.month}" style="display:none;margin-top:6px;"></div>`;
    c.appendChild(d);
  });
}
function exportMonthly(month){
  const m=monthlyArchive.find(x=>x.month===month); if(!m) return;
  const txt=`【${m.month}时政月度归档】\n\n■ 口袋背诵版\n${m.pocket}\n\n■ 深度复盘版\n${m.deep}\n\n■ TOP10高频考点\n${m.top10}`;
  copyText(txt); toast('已复制纯文本，可粘贴保存');
}
function renderMonthlyQuiz(month){
  const m=monthlyArchive.find(x=>x.month===month); if(!m) return;
  const box=document.getElementById('mq'+month); box.style.display='block';
  box.innerHTML=`<div style="font-weight:700;margin:6px 0;">本月自测小题：</div>`+m.quiz.map((qq,idx)=>`<div style="margin-bottom:6px;">${idx+1}. ${qq.q}<br><input id="mqi${month}${idx}" style="width:100%;border:1px solid var(--border-sakura);border-radius:8px;padding:6px;font-size:13px;"><span id="mqr${month}${idx}" style="font-size:12px;margin-left:6px;"></span></div>`).join('')+`<button class="mini-btn" onclick="checkMonthlyQuiz('${month}',${m.quiz.length})">核对</button>`;
}
function checkMonthlyQuiz(month,n){
  const m=monthlyArchive.find(x=>x.month===month);
  for(let i=0;i<n;i++){ const r=document.getElementById('mqr'+month+i); const inp=document.getElementById('mqi'+month+i); if(r&&inp) r.textContent='✓ '+m.quiz[i].a; }
}
function renderTopics(c){
  meetingTopics.forEach((t,i)=>{
    const d=document.createElement('div'); d.className='sl-item';
    d.innerHTML=`<div class="sl-cat">专题 ${i+1}</div>
      <div class="sl-word" style="color:#C0392B;font-weight:700;">${t.name}</div>
      <div class="sl-meaning"><b style="color:#C0392B;">★ 核心考点：</b>${t.highlight}<br><b>要点：</b>${t.points.join('、')}<br><b>💎 申论金句：</b>${t.jinju}</div>
      <div class="sl-actions"><button onclick="DC.addFav({type:'时政',text:t.name,src:'会议专题',note:t.highlight})">收藏专题</button></div>`;
    c.appendChild(d);
  });
}
let nqWrong=[];
function renderNewsQuiz(c){
  let idx=0,score=0,done=0;
  nqWrong=[];
  function show(){
    if(idx>=shizhengQuiz.length){ c.innerHTML=`<div class="sl-item"><div class="sl-word">🎉 本次得分：${score}/${shizhengQuiz.length}</div><div class="sl-meaning">错题已同步至全站错题本。</div></div>`; return; }
    const q=shizhengQuiz[idx];
    c.innerHTML=`<div style="font-size:13px;color:var(--text-gray);margin-bottom:6px;">每日时政刷题 ${idx+1}/${shizhengQuiz.length}</div>
      <div class="quiz-q">${q.q}</div>`+q.opt.map((o,oi)=>`<div class="quiz-opt" onclick="answerNQ(${idx},${oi},${q.ans},'${q.q.replace(/'/g,"\\'")}','${q.opt[q.ans].replace(/'/g,"\\'")}')">${o}</div>`).join('')+`<div id="nqr${idx}"></div>`;
  }
  window.answerNQ=function(i,oi,ans,qtext,correct){
    const el=document.getElementById('nqr'+i); const opts=document.querySelectorAll('.quiz-opt');
    opts.forEach(o=>o.onclick=null);
    if(oi===ans){ score++; el.innerHTML='✓ 正确'; el.style.color='#3a6b3a'; }
    else { el.innerHTML='✗ 正确答案：'+correct; el.style.color='#8a4a3a'; DC.addWrong({q:qtext,ans:correct,src:'时政专项刷题',cat:'时政常识'}); }
    done++; idx++; setTimeout(show,800);
  };
  show();
}
function renderRecite(c){
  c.innerHTML=`<div style="font-weight:700;color:var(--title-deep);margin-bottom:8px;">📿 时政背诵打卡本</div>
    <div class="recite-progress"><div class="rp-bar" style="width:${Math.round((normWords.filter((w,i)=>(DC.normState[i]||'不熟')!=='不熟').length/normWords.length)*100)}%"></div></div>
    <div style="font-size:12px;color:var(--text-gray);margin-bottom:10px;">规范词掌握进度：${normWords.filter((w,i)=>(DC.normState[i]||'不熟')!=='不熟').length}/${normWords.length}</div>
    <div class="sl-subtabs"><button class="sl-mini active">待背诵清单</button><button class="sl-mini">已掌握归档</button><button class="sl-mini" onclick="showEbb()">易错易混对比</button></div>
    <div id="reciteBox"></div>`;
  const box=document.getElementById('reciteBox');
  normWords.forEach((w,i)=>{ if((DC.normState[i]||'不熟')==='不熟'){ const d=document.createElement('div'); d.className='recite-item'; d.innerHTML=`<span>${w.word}</span><button class="mini-btn" onclick="setNormState(${i},'已背',this)">标记已背</button>`; box.appendChild(d); } });
}
function showEbb(){ const box=document.getElementById('reciteBox'); box.innerHTML=normCompare.map(x=>`<div class="cmp-row"><b>${x.a}</b> vs <b>${x.b}</b><br><span>${x.diff}</span></div>`).join(''); }

/* ================= 行测专项训练场 ================= */
const zlData=[
  {q:'2025年安徽GDP为5.0万亿元，同比增长5.0%。问2024年GDP约为多少万亿元？（保留2位）',a:'4.76',opt:['4.52','4.76','5.00','5.26'],ans:1,tip:'基期=现期/(1+r)=5.0/1.05≈4.76',cat:'基期现期'},
  {q:'某省2025年粮食产量800亿斤，同比增长2.5%。增长量约为多少亿斤？',a:'19.5',opt:['15.0','19.5','20.0','25.0'],ans:1,tip:'增长量=现期×r/(1+r)=800×0.025/1.025≈19.5',cat:'增长量'},
  {q:'A市2025年GDP为1200亿，B市为1000亿。A市是B市的多少倍？',a:'1.2',opt:['0.83','1.0','1.2','1.5'],ans:2,tip:'倍数=1200/1000=1.2',cat:'倍数'},
  {q:'2025年服务业占比45%，2024年为42%。比重变化约多少个百分点？',a:'+3.0',opt:['+2.0','+3.0','-3.0','+5.0'],ans:1,tip:'比重变化=45%-42%=+3.0',cat:'比重变化'}
];
const jqxsData=[
  {q:'论据：经常锻炼的人身体更健康。结论：锻炼能改善健康。以下哪项是前提假设？',a:'健康不是导致锻炼的原因',opt:['锻炼需要时间','健康不是导致锻炼的原因','锻炼花费金钱','有人不喜欢锻炼'],ans:1,tip:'排除因果倒置，是前提假设',cat:'前提假设'},
  {q:'研究发现喝咖啡者患心脏病比例更低，因此喝咖啡预防心脏病。削弱最强的是？',a:'患心脏病的人更不敢喝咖啡（因果倒置）',opt:['咖啡有提神作用','患心脏病的人更不敢喝咖啡（因果倒置）','有人喝咖啡失眠','咖啡含抗氧化物'],ans:1,tip:'因果倒置是最强削弱',cat:'削弱-因果倒置'},
  {q:'某措施能降低事故率，因此应推广。加强最强的是？',a:'类似地区推广后事故率确实下降',opt:['公众支持推广','类似地区推广后事故率确实下降','推广成本不高','专家认可'],ans:1,tip:'举出同类成功案例，搭桥加强',cat:'加强-举例'},
  {q:'调查显示A校学生成绩好，因此A校教学方法优。解释矛盾：其实A校生源本身更好。这属于？',a:'他因解释',opt:['搭桥','他因解释','类比','诉诸权威'],ans:1,tip:'引入生源差异作为他因，解释成绩差异',cat:'解释-他因'}
];
const tuiliData=[
  {q:'图形序列：○→△→□→○→？',a:'△',img:'seq1',opt:['△','□','○','☆'],ans:0,tip:'位置循环规律：○△□循环，下一个为△',cat:'位置规律'},
  {q:'两组图：第一组全为直线图形，第二组全为曲线图形。规律是？',a:'曲直性属性',img:'attr1',opt:['对称性','曲直性属性','封闭区域','部分数'],ans:1,tip:'按图形曲直属性分组',cat:'属性规律'},
  {q:'九宫格：每行交点数依次为2、3、4递增。第三行第三个图交点数应为？',a:'4',img:'grid1',opt:['2','3','4','5'],ans:2,tip:'交点数每行递增，第三行末位为4',cat:'数量-点'},
  {q:'两个图形有公共边且公共边数量递增，属于？',a:'图形间关系',img:'rel1',opt:['功能元素','图形间关系','叠加','遍历'],ans:1,tip:'考查图形间公共边关系',cat:'特殊规律'}
];
const idiomData=[
  {word:'一蹴而就',freq:'★★★★★',sentence:'改革不可能一蹴而就，需要长期努力。',diff:'辨析：多与"不能"连用，强调时间短。',group:'一蹴而就/轻而易举',level:'陌生'},
  {word:'轻而易举',freq:'★★★★',sentence:'这项任务对他来说轻而易举。',diff:'辨析：强调容易，不费力气。',group:'一蹴而就/轻而易举',level:'陌生'},
  {word:'相得益彰',freq:'★★★★★',sentence:'文化与旅游相得益彰。',diff:'辨析：互相配合，双方长处更突出。',group:'相得益彰/相辅相成',level:'陌生'},
  {word:'方兴未艾',freq:'★★★★',sentence:'新能源产业方兴未艾。',diff:'辨析：正在发展，尚未止境。',group:'方兴未艾/如火如荼',level:'陌生'},
  {word:'相辅相成',freq:'★★★★',sentence:'法治与德治相辅相成。',diff:'辨析：互相配合，缺一不可。',group:'相得益彰/相辅相成',level:'陌生'}
];
const baihuafen={1:'100',2:'50',3:'33.3',4:'25',5:'20',6:'16.7',7:'14.3',8:'12.5',9:'11.1',10:'10',12:'8.3',15:'6.7',20:'5',25:'4',50:'2'};
function switchLXTab(tab,btn){
  document.querySelectorAll('#page-lixing .sub-tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active');
  const c=document.getElementById('lContent'); c.innerHTML='';
  if(tab==='zhaoliao') renderZL(c);
  else if(tab==='jqxs') renderJQXS(c);
  else if(tab==='tuili') renderTUILI(c);
  else if(tab==='idiom') renderIdiom(c);
}
function quizShell(c,title,data,catName){
  let idx=0,score=0,timer=0,t0=Date.now();
  function show(){
    if(idx>=data.length){
      clearInterval(window._lxTimer);
      c.innerHTML=`<div class="sl-item"><div class="sl-word">🎉 训练完成</div><div class="sl-meaning">得分：${score}/${data.length}　总用时：${Math.round((Date.now()-t0)/1000)}秒<br>错题已同步至全站错题本。</div></div>`;
      return;
    }
    const q=data[idx];
    c.innerHTML=`<div class="quiz-top"><span>第 ${idx+1}/${data.length} 题</span><span class="quiz-timer" id="lxt">00:00</span></div>
      ${q.img?`<div class="quiz-img">[${q.img}图形示意]</div>`:''}
      <div class="quiz-q">${q.q}</div>`+q.opt.map((o,oi)=>`<div class="quiz-opt" onclick="answerLX(${idx},${oi},${q.ans},'${q.q.replace(/'/g,"\\'")}','${q.opt[q.ans?q.ans:0].replace(/'/g,"\\'")}','${q.tip}','${catName}')">${o}</div>`).join('')+`<div id="lxr${idx}"></div>`;
  }
  window.answerLX=function(i,oi,ans,qtext,correct,tip,cat){
    const el=document.getElementById('lxr'+i); const opts=document.querySelectorAll('.quiz-opt'); opts.forEach(o=>o.onclick=null);
    if(oi===ans){ score++; el.innerHTML='✓ 正确 · '+tip; el.style.color='#3a6b3a'; }
    else { el.innerHTML='✗ 正确答案：'+correct+' · '+tip; el.style.color='#8a4a3a'; DC.addWrong({q:qtext,ans:correct,src:cat,cat:cat,tip:tip}); }
    idx++; setTimeout(show,1100);
  };
  window._lxTimer=setInterval(()=>{ const e=document.getElementById('lxt'); if(e){ const s=Math.floor((Date.now()-t0)/1000); e.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); } },1000);
  show();
}
function renderZL(c){ c.innerHTML=`<div class="lx-config">题量：<button class="mini-btn" onclick="zlStart(5)">5题</button><button class="mini-btn" onclick="zlStart(10)">10题</button><button class="mini-btn" onclick="zlStart(20)">20题</button><button class="mini-btn" onclick="showBaihua()">百化分对照</button></div><div id="zlBox"></div>`; window.zlStart=function(n){ const sub=zlData.slice(0,n); quizShell(document.getElementById('zlBox'),'资料分析',sub,'资料分析'); }; }
function showBaihua(){ const b=document.getElementById('zlBox'); const d=document.createElement('div'); d.className='sl-item'; d.innerHTML='<div class="sl-cat">百化分速查</div>'+Object.entries(baihuafen).map(([k,v])=>`<span style="display:inline-block;margin:2px 6px;">1/${k}=${v}%</span>`).join(''); b.appendChild(d); }
function renderJQXS(c){ quizShell(c,'加强削弱',jqxsData,'判断推理-加强削弱'); }
function renderTUILI(c){ quizShell(c,'图形推理',tuiliData,'判断推理-图形推理'); }
function renderIdiom(c){
  const is=DB.get('idiomState',{});
  c.innerHTML=`<div class="sl-subtabs"><button class="sl-mini active" onclick="idiomByFilter('全部',this)">全部</button><button class="sl-mini" onclick="idiomByFilter('高频TOP',this)">高频TOP</button><button class="sl-mini" onclick="idiomByFilter('易混',this)">易混辨析</button><button class="sl-mini" onclick="idiomCard()">卡片背诵</button></div><div id="idiomBox"></div>`;
  window.idiomByFilter=(f,btn)=>{ document.querySelectorAll('.sl-subtabs .sl-mini').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); renderIdiomList(f); };
  renderIdiomList('全部');
}
function renderIdiomList(f){
  const box=document.getElementById('idiomBox'); const is=DB.get('idiomState',{}); box.innerHTML='';
  idiomData.filter(x=>f==='全部'||(f==='高频TOP'&&x.freq.includes('5'))||(f==='易混'&&x.group)).forEach((x,i)=>{
    const st=is[x.word]||'陌生';
    const d=document.createElement('div'); d.className='sl-item';
    d.innerHTML=`<div class="sl-cat">考频 ${x.freq} · ${x.group}</div>
      <div class="sl-word">${x.word}</div>
      <div class="sl-meaning"><b>真题例句：</b>${x.sentence}<br><b>辨析：</b>${x.diff}</div>
      <div class="sl-mastery"><span class="mk ${st==='陌生'?'on':''}" onclick="setIdiom('${x.word}','陌生',this)">陌生</span><span class="mk ${st==='眼熟'?'on':''}" onclick="setIdiom('${x.word}','眼熟',this)">眼熟</span><span class="mk ${st==='熟练'?'on':''}" onclick="setIdiom('${x.word}','熟练',this)">熟练</span></div>`;
    box.appendChild(d);
  });
}
function setIdiom(w,s,el){ const is=DB.get('idiomState',{}); is[w]=s; DB.set('idiomState',is); el.parentElement.querySelectorAll('.mk').forEach(x=>x.classList.remove('on')); el.classList.add('on'); }
function idiomCard(){ const x=idiomData[Math.floor(Math.random()*idiomData.length)]; const box=document.getElementById('idiomBox'); const d=document.createElement('div'); d.className='sl-item'; d.innerHTML=`<div class="sl-word" onclick="this.nextElementSibling.style.display='block'">${x.word}（点击翻转查看释义）</div><div style="display:none;"><div class="sl-meaning"><b>例句：</b>${x.sentence}<br><b>辨析：</b>${x.diff}</div></div>`; box.insertBefore(d,box.firstChild); }

/* ================= 招考信息雷达 ================= */
/* ================= 招考信息雷达 ================= */
const ANHUI_CITIES=['合肥','芜湖','蚌埠','淮南','马鞍山','淮北','铜陵','安庆','黄山','阜阳','宿州','滁州','六安','宣城','池州','亳州'];
const announceData=[
  {type:'安徽省考',tag:'安徽省公务员考试·以官方公告为准',city:'全省',name:'2027年安徽省考试录用公务员公告（预计·以官方为准）',signup:'2027-01-15~2027-01-21',pay:'2027-01-24',print:'2027-03-10',exam:'2027-03-13',fee:'每科40元',count:'约8000人',edu:'大专及以上',age:'18-35周岁',major:'详见职位表',fresh:'部分限应届',cond:'大专及以上，18-35周岁，符合职位专业要求',link:'https://www.chinasydw.org/anhui/',star:true,status:'未开始'},
  {type:'国考',tag:'国家公务员考试·以官方公告为准',city:'全国',name:'2027年国家公务员考试公告（预计·以官方为准）',signup:'2026-10-15~2026-10-24',pay:'2026-10-26',print:'2026-11-23',exam:'2026-11-28',fee:'每科50元',count:'约3.9万人',edu:'大专及以上',age:'18-35周岁',major:'详见职位表',fresh:'部分限应届',cond:'大专及以上，18-35周岁',link:'http://www.scs.gov.cn/',star:true,status:'未开始'},
  {type:'事业编',tag:'安徽事业单位联考·以官方公告为准',city:'全省',name:'2027年安徽省事业单位联考公告（预计·以官方为准）',signup:'2027-04-01~2027-04-10',pay:'2027-04-12',print:'2027-05-11',exam:'2027-05-15',fee:'每科45元',count:'约1.2万人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届均可',cond:'大专及以上',link:'https://www.chinasydw.org/anhui/',star:false,status:'未开始'},
  {type:'三支一扶',tag:'安徽三支一扶·以官方公告为准',city:'全省',name:'2027年安徽省"三支一扶"招募公告（预计·以官方为准）',signup:'2027-05-06~2027-05-12',pay:'免报名费',print:'2027-06-02',exam:'2027-06-05',fee:'免费',count:'约1200人',edu:'专科及以上',age:'30周岁以下',major:'专业不限为主',fresh:'应届或择业期',cond:'应届或择业期毕业生，安徽生源',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'选调生',tag:'安徽选调生·以官方公告为准',city:'全省',name:'2027年安徽省选调生招录公告（预计·以官方为准）',signup:'2026-12-10~2026-12-20',pay:'免报名费',print:'2027-03-10',exam:'2027-03-13',fee:'免费',count:'约600人',edu:'本科及以上',age:'本科生25/硕30/博35',major:'专业对口',fresh:'限应届',cond:'双一流/本科应届，党员或学生干部',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'军队文职',tag:'军队文职·以官方公告为准',city:'全国',name:'2027年军队文职人员招录公告（预计·以官方为准）',signup:'2026-12-05~2026-12-15',pay:'2026-12-17',print:'2027-02-25',exam:'2027-03-01',fee:'每科50元',count:'约2万人',edu:'本科及以上',age:'18-35周岁',major:'详见岗位计划',fresh:'社会/应届',cond:'本科及以上',link:'http://www.scs.gov.cn/',star:false,status:'未开始'},
  {type:'基层特岗',tag:'安徽基层特定岗位·以官方公告为准',city:'全省',name:'2027年安徽基层特定岗位招录公告（预计·以官方为准）',signup:'2027-06-01~2027-06-10',pay:'免报名费',print:'2027-07-01',exam:'2027-07-04',fee:'免费',count:'约800人',edu:'安徽户籍大专及以上',age:'18-35周岁',major:'专业不限为主',fresh:'社会/应届',cond:'安徽户籍，大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'合肥事业单位单招·以官方公告为准',city:'合肥',name:'2027年合肥市直事业单位专项招聘公告（预计·以官方为准）',signup:'2027-04-15~2027-04-22',pay:'2027-04-24',print:'2027-05-18',exam:'2027-05-22',fee:'每科45元',count:'约1500人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上，合肥户籍优先',link:'https://www.chinasydw.org/anhui/',star:false,status:'未开始'},
  {type:'事业编',tag:'芜湖事业单位单招·以官方公告为准',city:'芜湖',name:'2027年芜湖市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-10~2027-04-17',pay:'2027-04-19',print:'2027-05-14',exam:'2027-05-18',fee:'每科45元',count:'约800人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'蚌埠事业单位单招·以官方公告为准',city:'蚌埠',name:'2027年蚌埠市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-12~2027-04-19',pay:'2027-04-21',print:'2027-05-16',exam:'2027-05-20',fee:'每科45元',count:'约600人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'淮南事业单位单招·以官方公告为准',city:'淮南',name:'2027年淮南市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-13~2027-04-20',pay:'2027-04-22',print:'2027-05-17',exam:'2027-05-21',fee:'每科45元',count:'约550人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'马鞍山事业单位单招·以官方公告为准',city:'马鞍山',name:'2027年马鞍山市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-14~2027-04-21',pay:'2027-04-23',print:'2027-05-18',exam:'2027-05-22',fee:'每科45元',count:'约500人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'淮北事业单位单招·以官方公告为准',city:'淮北',name:'2027年淮北市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-15~2027-04-22',pay:'2027-04-24',print:'2027-05-19',exam:'2027-05-23',fee:'每科45元',count:'约450人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'铜陵事业单位单招·以官方公告为准',city:'铜陵',name:'2027年铜陵市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-16~2027-04-23',pay:'2027-04-25',print:'2027-05-20',exam:'2027-05-24',fee:'每科45元',count:'约400人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'安庆事业单位单招·以官方公告为准',city:'安庆',name:'2027年安庆市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-17~2027-04-24',pay:'2027-04-26',print:'2027-05-21',exam:'2027-05-25',fee:'每科45元',count:'约700人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'黄山事业单位单招·以官方公告为准',city:'黄山',name:'2027年黄山市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-18~2027-04-25',pay:'2027-04-27',print:'2027-05-22',exam:'2027-05-26',fee:'每科45元',count:'约380人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'阜阳事业单位单招·以官方公告为准',city:'阜阳',name:'2027年阜阳市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-19~2027-04-26',pay:'2027-04-28',print:'2027-05-23',exam:'2027-05-27',fee:'每科45元',count:'约750人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'宿州事业单位单招·以官方公告为准',city:'宿州',name:'2027年宿州市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-20~2027-04-27',pay:'2027-04-29',print:'2027-05-24',exam:'2027-05-28',fee:'每科45元',count:'约620人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'滁州事业单位单招·以官方公告为准',city:'滁州',name:'2027年滁州市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-21~2027-04-28',pay:'2027-04-30',print:'2027-05-25',exam:'2027-05-29',fee:'每科45元',count:'约580人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'六安事业单位单招·以官方公告为准',city:'六安',name:'2027年六安市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-22~2027-04-29',pay:'2027-05-01',print:'2027-05-26',exam:'2027-05-30',fee:'每科45元',count:'约530人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'宣城事业单位单招·以官方公告为准',city:'宣城',name:'2027年宣城市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-23~2027-04-30',pay:'2027-05-02',print:'2027-05-27',exam:'2027-05-31',fee:'每科45元',count:'约420人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'池州事业单位单招·以官方公告为准',city:'池州',name:'2027年池州市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-24~2027-05-01',pay:'2027-05-03',print:'2027-05-28',exam:'2027-06-01',fee:'每科45元',count:'约350人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'事业编',tag:'亳州事业单位单招·以官方公告为准',city:'亳州',name:'2027年亳州市事业单位招聘公告（预计·以官方为准）',signup:'2027-04-25~2027-05-02',pay:'2027-05-04',print:'2027-05-29',exam:'2027-06-02',fee:'每科45元',count:'约480人',edu:'大专及以上',age:'18-35周岁',major:'详见岗位表',fresh:'社会/应届',cond:'大专及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'其他',tag:'芜湖市属国企特聘·以官方公告为准',city:'芜湖',name:'2027年芜湖市属国企特聘公告（预计·以官方为准）',signup:'2027-03-01~2027-03-08',pay:'2027-03-10',print:'2027-03-22',exam:'2027-03-26',fee:'每科40元',count:'约600人',edu:'本科及以上',age:'18-35周岁',major:'详见岗位',fresh:'社会/应届',cond:'本科及以上',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'},
  {type:'其他',tag:'阜阳基层专项·以官方公告为准',city:'阜阳',name:'2027年阜阳市基层公共服务专项招聘（预计·以官方为准）',signup:'2027-05-20~2027-05-27',pay:'2027-05-29',print:'2027-06-18',exam:'2027-06-22',fee:'免费',count:'约400人',edu:'大专及以上',age:'18-35周岁',major:'专业不限',fresh:'社会/应届',cond:'大专及以上，阜阳户籍',link:'https://hrss.ah.gov.cn/',star:false,status:'未开始'}
];

function genNodes(a){
  const sd=a.signup.split('~')[0];
  const examD=new Date(a.exam);
  const add=(d,n)=>{ const x=new Date(d); x.setDate(x.getDate()+n); return x.toISOString().slice(0,10); };
  return [
    {n:'公告发布',d:sd,t:'blue'},{n:'网上报名',d:a.signup,t:'blue'},{n:'缴费截止',d:a.pay,t:'blue'},
    {n:'准考证打印',d:a.print,t:'blue'},{n:'笔试',d:a.exam,t:'red'},
    {n:'成绩查询',d:add(examD,30),t:'green'},{n:'资格复审',d:add(examD,40),t:'green'},{n:'面试',d:add(examD,60),t:'green'}
  ];
}
const myRadar=DB.get('myRadar',{});
myRadar.fav=myRadar.fav||[]; myRadar.jobs=myRadar.jobs||[]; myRadar.notes=myRadar.notes||[]; myRadar.groups=myRadar.groups||{}; myRadar.target=myRadar.target||'';
function switchRadarTab(tab,btn){
  document.querySelectorAll('#page-radar .sub-tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active');
  const c=document.getElementById('rContent'); c.innerHTML='';
  if(tab==='pool') renderPool(c);
  else if(tab==='fav') renderRadarFav(c);
  else if(tab==='calendar') renderCalendar(c);
  else if(tab==='tools') renderTools(c);
}
let poolState={type:'全部',city:'全部',status:'全部',sort:'star'};
const RADAR_TYPES=['全部','国考','安徽省考','事业编','选调生','三支一扶','军队文职','基层特岗','其他'];
const RADAR_STATUS=['全部','未开始','报名中','缴费中','已结束'];
const RADAR_SORT=[['star','核心置顶'],['signup','报名近及远'],['exam','笔试近及远']];
function renderPool(c){
  const typeBtns=RADAR_TYPES.map(t=>`<button class="sl-mini ${poolState.type===t?'active':''}" onclick="poolSet('type','${t}',this)">${t}</button>`).join('');
  const cityBtns=['全部','全省'].concat(ANHUI_CITIES).map(t=>`<button class="sl-mini ${poolState.city===t?'active':''}" onclick="poolSet('city','${t}',this)">${t}</button>`).join('');
  const stBtns=RADAR_STATUS.map(t=>`<button class="sl-mini ${poolState.status===t?'active':''}" onclick="poolSet('status','${t}',this)">${t}</button>`).join('');
  const sortBtns=RADAR_SORT.map(s=>`<button class="sl-mini ${poolState.sort===s[0]?'active':''}" onclick="poolSet('sort','${s[0]}',this)">${s[1]}</button>`).join('');
  c.innerHTML=`<div class="filter-row"><span class="fr-label">类型</span>${typeBtns}</div>
    <div class="filter-row"><span class="fr-label">地市</span>${cityBtns}</div>
    <div class="filter-row"><span class="fr-label">状态</span>${stBtns}</div>
    <div class="filter-row"><span class="fr-label">排序</span>${sortBtns}</div>
    <div id="poolBox"></div>`;
  renderPoolList();
}
function poolSet(k,v,btn){ poolState[k]=v; btn.parentElement.querySelectorAll('.sl-mini').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); renderPoolList(); }
function renderPoolList(){
  const box=document.getElementById('poolBox'); box.innerHTML='';
  let list=announceData.filter(a=>(poolState.type==='全部'||a.type===poolState.type)&&(poolState.city==='全部'||a.city===poolState.city||(poolState.city==='全省'&&a.city==='全省'))&&(poolState.status==='全部'||a.status===poolState.status));
  if(poolState.sort==='star') list.sort((a,b)=>(a.star===b.star?0:a.star?-1:1));
  else if(poolState.sort==='signup') list.sort((a,b)=>a.signup.localeCompare(b.signup));
  else list.sort((a,b)=>a.exam.localeCompare(b.exam));
  list.forEach((a)=>{
    const idx=announceData.indexOf(a);
    const d=document.createElement('div'); d.className='announce-item'+(a.star?' unread':'')+(a.status==='报名中'?' on':a.status==='已结束'?' off':(a.status==='未开始'&&nearSoon(a))?' soon':'');
    d.innerHTML=`<span class="announce-tag">${a.tag}</span>${a.star?'⭐':''}
      <div class="announce-title" onclick="toggleDetail(${idx})">${a.name} ›</div>
      <div class="announce-info"><b>招录：</b>${a.count}　<b>地市：</b>${a.city}<br><b>报名：</b>${a.signup}<br><b>笔试：</b>${a.exam}<br><b>状态：</b><span class="st-${a.status}">${a.status}</span></div>
      <div id="dt${idx}" class="detail-box" style="display:none;"></div>
      <div class="sl-actions"><a href="${a.link}" target="_blank" class="mini-btn" style="text-decoration:none;">官网/报名</a><button onclick="event.stopPropagation();favAnnounce(${idx})">收藏</button><button onclick="event.stopPropagation();setTargetExam(${idx})">设为备考目标</button></div>`;
    box.appendChild(d);
  });
  if(list.length===0) box.innerHTML='<div style="text-align:center;color:var(--text-gray);padding:16px;">无符合条件的公告</div>';
}
function nearSoon(a){ const s=a.signup.split('~')[0]; const diff=(new Date(s)-new Date())/86400000; return diff>0&&diff<=14; }
function toggleDetail(i){ const box=document.getElementById('dt'+i); const a=announceData[i];
  if(box.style.display==='none'){ box.style.display='block';
    box.innerHTML=`<div class="detail-sec"><b>📄 报考核心条件</b><br>学历：${a.edu}｜年龄：${a.age}<br>专业：${a.major}｜应届：${a.fresh}<br>${a.cond}</div>
      <div class="detail-links">
        <a href="${a.link}" target="_blank" class="mini-btn">官方公告原文</a>
        <a href="${a.link}" target="_blank" class="mini-btn">报名入口</a>
        <a href="${a.link}" target="_blank" class="mini-btn">缴费入口</a>
        <a href="${a.link}" target="_blank" class="mini-btn">准考证打印</a>
      </div>`;
  } else box.style.display='none';
}
function setTargetExam(i){ const a=announceData[i]; state.examDate=a.exam; DB.set('examDate',a.exam); initCountdown(); if(!myRadar.fav.find(x=>x.name===a.name)){ myRadar.fav.push(a); } DB.set('myRadar',myRadar); renderHomeTodo(); toast('已设为备考目标，首页倒计时已更新 🎯'); }
function favAnnounce(i){ const a=announceData[i]; if(!myRadar.fav.find(x=>x.name===a.name)){ myRadar.fav.push(a); DB.set('myRadar',myRadar); renderHomeTodo(); toast('已收藏到意向库 💖'); } else toast('已在收藏'); }

function renderRadarFav(c){
  c.innerHTML=`<div class="sl-subtabs"><button class="sl-mini active" onclick="favSub('fav',this)">收藏公告</button><button class="sl-mini" onclick="favSub('job',this)">意向岗位</button><button class="sl-mini" onclick="favSub('note',this)">报考笔记</button><button class="sl-mini" onclick="favSub('group',this)">分组管理</button></div><div id="favBox"></div>
    <div style="display:flex;gap:6px;margin-top:8px;"><button class="mini-btn" onclick="addJob()">+ 意向岗位</button><button class="mini-btn" onclick="addNote()">+ 报考笔记</button></div>`;
  window.favSub=(s,btn)=>{ document.querySelectorAll('#rContent .sl-mini').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); renderFavSub(s); };
  renderFavSub('fav');
}
function renderFavSub(s){
  const box=document.getElementById('favBox'); box.innerHTML='';
  if(s==='fav'){ if(myRadar.fav.length===0) box.innerHTML='<div style="text-align:center;color:var(--text-gray);padding:14px;">暂无收藏，去公告池点击收藏吧</div>';
    myRadar.fav.forEach((a,i)=>{ const d=document.createElement('div'); d.className='announce-item';
      d.innerHTML=`<div class="announce-title">${a.name}</div><div class="announce-info"><b>报名：</b>${a.signup}<br><b>笔试：</b>${a.exam}</div>
        <div class="sl-actions"><button onclick="genTimeline(${i})">节点时间线</button><button onclick="setTargetExamByName('${a.name.replace(/'/g,"\\'")}')">设为备考目标</button></div><div id="tl${i}"></div>`;
      box.appendChild(d); }); }
  else if(s==='job'){ if(myRadar.jobs.length===0) box.innerHTML='<div style="text-align:center;color:var(--text-gray);padding:14px;">暂无岗位</div>';
    myRadar.jobs.forEach((j,i)=>{ const d=document.createElement('div'); d.className='announce-item';
      d.innerHTML=`<div class="announce-title">${j.unit} · 代码${j.code}</div><div class="announce-info">专业：${j.major}｜招录：${j.num}人｜历年进面：${j.score}<br>预估竞争力：${j.power||'未评估'}｜备注：${j.note}</div><button class="mini-btn" onclick="delJob(${i})">删除</button>`;
      box.appendChild(d); }); }
  else if(s==='note'){ if(myRadar.notes.length===0) box.innerHTML='<div style="text-align:center;color:var(--text-gray);padding:14px;">暂无笔记</div>';
    myRadar.notes.forEach((n,i)=>{ const d=document.createElement('div'); d.className='announce-item'; d.innerHTML=`<div class="announce-info">${n}</div><button class="mini-btn" onclick="delNote(${i})">删除</button>`; box.appendChild(d); }); }
  else { const groups=Object.keys(myRadar.groups); box.innerHTML='<div style="font-weight:700;margin-bottom:6px;">📁 我的分组</div>'+(groups.length?groups.map(g=>`<div class="announce-item"><div class="announce-info">${g}（${myRadar.groups[g].length}项）</div></div>`).join(''):'<div style="color:var(--text-gray);padding:10px;">暂无分组</div>')+'<button class="mini-btn full" onclick="addGroup()">+ 新建分组</button>'; }
}
function setTargetExamByName(n){ const a=announceData.find(x=>x.name===n)||myRadar.fav.find(x=>x.name===n); if(a){ state.examDate=a.exam; DB.set('examDate',a.exam); initCountdown(); renderHomeTodo(); toast('备考目标已更新 🎯'); } }
function addJob(){ const unit=prompt('招录单位：',''); if(!unit) return; const code=prompt('岗位代码：',''); const major=prompt('专业限制：',''); const num=prompt('招录人数：',''); const score=prompt('历年进面分：',''); const power=prompt('个人预估竞争力（强/中/弱）：',''); const note=prompt('自定义备注（是否限应届/服务期/加试）：如 限应届/无服务期/不加试）：',''); myRadar.jobs.push({unit,code,major,num,score,power,note}); DB.set('myRadar',myRadar); renderFavSub('job'); }
function delJob(i){ myRadar.jobs.splice(i,1); DB.set('myRadar',myRadar); renderFavSub('job'); }
function addNote(){ const t=prompt('报考条件自查笔记：',''); if(t){ myRadar.notes.push(t); DB.set('myRadar',myRadar); renderFavSub('note'); } }
function delNote(i){ myRadar.notes.splice(i,1); DB.set('myRadar',myRadar); renderFavSub('note'); }
function addGroup(){ const g=prompt('分组名称（如“2026省考备选”）：',''); if(g){ myRadar.groups[g]=myRadar.groups[g]||[]; DB.set('myRadar',myRadar); renderFavSub('group'); } }
function genTimeline(i){ const a=myRadar.fav[i]; const box=document.getElementById('tl'+i); const nodes=genNodes(a); box.innerHTML='<div style="margin-top:6px;font-size:13px;">📅 全流程8节点：'+nodes.map(n=>`<div><span class="dot-${n.t}">●</span> ${n.n}：${n.d}</div>`).join('')+'</div>'; }

function renderCalendar(c){
  c.innerHTML=`<div class="sl-subtabs"><button class="sl-mini active" onclick="calView('month',this)">月度日历</button><button class="sl-mini" onclick="calView('year',this)">年度时间轴</button><button class="sl-mini" onclick="calView('todo',this)">待办清单</button></div>
    <div class="filter-row"><span class="fr-label">考试</span>${['全部','安徽省考','国考','事业编','选调生','三支一扶','军队文职','基层特岗','其他'].map(t=>`<button class="sl-mini ${t==='全部'?'active':''}" onclick="calTypeSet('${t}',this)">${t}</button>`).join('')}</div>
    <div id="calBox"></div>`;
  window.calType='全部';
  window.calTypeSet=(t,btn)=>{ document.querySelectorAll('#rContent .filter-row .sl-mini').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); window.calType=t; if(window._calView==='month') drawCal(window._calM); else if(window._calView==='year') renderYearAxis(); else renderTodoList(); };
  calView('month',document.querySelector('#rContent .sl-mini'));
}
function calView(v,btn){ document.querySelectorAll('#rContent .sl-subtabs .sl-mini').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); window._calView=v; const box=document.getElementById('calBox');
  if(v==='month'){ const months=['2026-11','2027-01','2027-03','2027-04','2027-05','2027-06','2027-07']; box.innerHTML='<div class="sl-subtabs">'+months.map((m,idx)=>`<button class="sl-mini ${idx===0?'active':''}" onclick="calMonth('${m}',this)">${m.slice(5)}月</button>`).join('')+'</div><div id="calGrid" class="cal-grid"></div>'; window._calM=months[0]; drawCal(months[0]); }
  else if(v==='year') renderYearAxis();
  else renderTodoList();
}
function calMonth(m,btn){ document.querySelectorAll('#rContent .sl-subtabs:last-of-type .sl-mini').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); window._calM=m; drawCal(m); }
function drawCal(m){ const grid=document.getElementById('calGrid'); if(!grid) return; const [y,mo]=m.split('-').map(Number); const days=new Date(y,mo,0).getDate(); let html='';
  for(let d=1;d<=days;d++){ const ds=String(d).padStart(2,'0'); const full=`${y}-${String(mo).padStart(2,'0')}-${ds}`;
    let evs=announceData.filter(a=>(a.signup.includes(full)||a.exam===full)&&(window.calType==='全部'||a.type===window.calType));
    let cls='',dots='';
    if(evs.length){ cls=' has-ev'; if(evs.some(e=>e.signup.includes(full))) dots+='<i class="cd blue"></i>'; if(evs.some(e=>e.exam===full)) dots+='<i class="cd red"></i>'; }
    html+=`<div class="cal-cell${cls}" onclick="calDetail('${full}')">${d}${dots}</div>`; }
  grid.innerHTML=html;
}
function calDetail(dt){ const evs=announceData.filter(a=>a.signup.includes(dt)||a.exam===dt); if(evs.length) toast(evs.map(e=>(e.signup.includes(dt)?'报名 ':'笔试 ')+e.name).join(' / ')); }
function renderYearAxis(){ const box=document.getElementById('calBox'); const nodes=[]; announceData.filter(a=>window.calType==='全部'||a.type===window.calType).forEach(a=>genNodes(a).forEach(n=>nodes.push(Object.assign({},n,{exam:a.name}))));
  nodes.sort((a,b)=>a.d.localeCompare(b.d));
  box.innerHTML='<div style="font-size:13px;color:var(--text-gray);margin:6px 0;">全年关键节点（按时间）</div>'+nodes.map(n=>`<div class="axis-item"><span class="dot-${n.t}">●</span> <b>${n.d}</b> ｜ ${n.n} · ${n.exam}</div>`).join(''); }
function renderTodoList(){ const box=document.getElementById('calBox'); const done=DB.get('doneNodes',[]);
  const nodes=[]; myRadar.fav.filter(a=>window.calType==='全部'||a.type===window.calType).forEach(a=>genNodes(a).forEach(n=>nodes.push(Object.assign({},n,{exam:a.name}))));
  const today=new Date().toISOString().slice(0,10);
  const pending=nodes.filter(n=>n.d>=today&&!done.includes(n.exam+n.n)).sort((a,b)=>b.d.localeCompare(a.d));
  box.innerHTML='<div style="font-size:13px;color:var(--text-gray);margin:6px 0;">未完成报考节点（倒序）</div>'+(pending.length?pending.map(n=>`<div class="todo-node"><span><span class="dot-${n.t}">●</span> ${n.d} ｜ ${n.n} · ${n.exam}</span><button class="mini-btn" onclick="markDone('${n.exam.replace(/'/g,"\\'")}','${n.n}')">标记完成</button></div>`).join(''):'<div style="color:var(--text-gray);padding:10px;">暂无待办（请先在意向库收藏考试）</div>'); }
function markDone(exam,n){ const done=DB.get('doneNodes',[]); done.push(exam+n); DB.set('doneNodes',done); renderTodoList(); }

function renderTools(c){
  c.innerHTML=`<div class="sl-subtabs"><button class="sl-mini active" onclick="toolSub('major',this)">专业目录</button><button class="sl-mini" onclick="toolSub('score',this)">进面分数</button><button class="sl-mini" onclick="toolSub('photo',this)">照片指引</button><button class="sl-mini" onclick="toolSub('cond',this)">条件速查</button></div><div id="toolBox"></div>`;
  window.toolSub=(s,btn)=>{ document.querySelectorAll('#rContent .sl-mini').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); renderToolSub(s); };
  renderToolSub('major');
}
const majorTree=[
  {edu:'本科及以上',cats:[
    {cat:'经济学类',majors:['经济学','经济统计学','国民经济管理','财政学','金融学']},
    {cat:'法学类',majors:['法学','知识产权','监狱学','社区矫正']},
    {cat:'中国语言文学类',majors:['汉语言文学','秘书学','汉语国际教育']},
    {cat:'计算机类',majors:['计算机科学与技术','软件工程','网络工程','信息安全']},
    {cat:'公共管理类',majors:['行政管理','公共事业管理','劳动与社会保障']},
    {cat:'设计学类',majors:['环境设计','视觉传达设计','产品设计','服装与服饰设计','数字媒体艺术','艺术与科技']},
    {cat:'建筑类',majors:['建筑学','城乡规划','风景园林','历史建筑保护工程']},
    {cat:'土木类',majors:['土木工程','建筑环境与能源应用工程','给排水科学与工程']}
  ]},
  {edu:'大专及以上',cats:[
    {cat:'财经商贸类',majors:['会计','财务管理','市场营销','电子商务']},
    {cat:'土木建筑类',majors:['建筑工程技术','工程造价','建设工程管理','环境艺术设计']},
    {cat:'医药卫生类',majors:['护理','临床医学','药学']},
    {cat:'教育与体育类',majors:['学前教育','小学教育','语文教育']}
  ]}
];

const scoreData=[
  {level:'省直',city:'合肥',sys:'综合岗',score:'135-145'},{level:'市级',city:'合肥',sys:'综合岗',score:'140-150'},
  {level:'县级',city:'合肥',sys:'综合岗',score:'130-140'},{level:'乡镇',city:'合肥',sys:'乡镇岗',score:'120-132'},
  {level:'省直',city:'芜湖',sys:'综合岗',score:'133-143'},{level:'市级',city:'芜湖',sys:'执法岗',score:'128-138'},
  {level:'县级',city:'芜湖',sys:'综合岗',score:'125-135'},{level:'乡镇',city:'芜湖',sys:'乡镇岗',score:'116-128'},
  {level:'市级',city:'蚌埠',sys:'综合岗',score:'128-138'},{level:'县级',city:'蚌埠',sys:'综合岗',score:'123-133'},{level:'乡镇',city:'蚌埠',sys:'乡镇岗',score:'114-126'},
  {level:'市级',city:'淮南',sys:'综合岗',score:'126-136'},{level:'县级',city:'淮南',sys:'综合岗',score:'121-131'},{level:'乡镇',city:'淮南',sys:'乡镇岗',score:'112-124'},
  {level:'市级',city:'马鞍山',sys:'综合岗',score:'129-139'},{level:'县级',city:'马鞍山',sys:'执法岗',score:'124-134'},{level:'乡镇',city:'马鞍山',sys:'乡镇岗',score:'115-127'},
  {level:'市级',city:'淮北',sys:'综合岗',score:'127-137'},{level:'县级',city:'淮北',sys:'综合岗',score:'122-132'},{level:'乡镇',city:'淮北',sys:'乡镇岗',score:'113-125'},
  {level:'市级',city:'铜陵',sys:'综合岗',score:'128-138'},{level:'县级',city:'铜陵',sys:'综合岗',score:'123-133'},{level:'乡镇',city:'铜陵',sys:'乡镇岗',score:'114-126'},
  {level:'市级',city:'安庆',sys:'综合岗',score:'126-136'},{level:'县级',city:'安庆',sys:'综合岗',score:'121-131'},{level:'乡镇',city:'安庆',sys:'乡镇岗',score:'112-124'},
  {level:'市级',city:'黄山',sys:'综合岗',score:'125-135'},{level:'县级',city:'黄山',sys:'综合岗',score:'120-130'},{level:'乡镇',city:'黄山',sys:'乡镇岗',score:'111-123'},
  {level:'市级',city:'阜阳',sys:'综合岗',score:'127-137'},{level:'县级',city:'阜阳',sys:'综合岗',score:'122-132'},{level:'乡镇',city:'阜阳',sys:'乡镇岗',score:'113-125'},
  {level:'市级',city:'宿州',sys:'综合岗',score:'125-135'},{level:'县级',city:'宿州',sys:'综合岗',score:'120-130'},{level:'乡镇',city:'宿州',sys:'乡镇岗',score:'111-123'},
  {level:'市级',city:'滁州',sys:'综合岗',score:'128-138'},{level:'县级',city:'滁州',sys:'综合岗',score:'123-133'},{level:'乡镇',city:'滁州',sys:'乡镇岗',score:'114-126'},
  {level:'市级',city:'六安',sys:'综合岗',score:'126-136'},{level:'县级',city:'六安',sys:'综合岗',score:'121-131'},{level:'乡镇',city:'六安',sys:'乡镇岗',score:'112-124'},
  {level:'市级',city:'宣城',sys:'综合岗',score:'127-137'},{level:'县级',city:'宣城',sys:'综合岗',score:'122-132'},{level:'乡镇',city:'宣城',sys:'乡镇岗',score:'113-125'},
  {level:'市级',city:'池州',sys:'综合岗',score:'124-134'},{level:'县级',city:'池州',sys:'综合岗',score:'119-129'},{level:'乡镇',city:'池州',sys:'乡镇岗',score:'110-122'},
  {level:'市级',city:'亳州',sys:'综合岗',score:'125-135'},{level:'县级',city:'亳州',sys:'综合岗',score:'120-130'},{level:'乡镇',city:'亳州',sys:'乡镇岗',score:'111-123'}
];

function renderToolSub(s){
  const box=document.getElementById('toolBox');
  if(s==='major'){ box.innerHTML=`<input class="sl-search" placeholder="模糊搜索专业/类别（如 计算机 / 法学）" oninput="majorSearch(this.value)"><div id="majorBox"></div>`; majorSearch(''); }
  else if(s==='score'){ box.innerHTML=`<input class="sl-search" placeholder="搜索地市/层级/系统（如 合肥 / 乡镇 / 执法）" oninput="scoreSearch(this.value)"><div id="scoreBox"></div>`; scoreSearch(''); }
  else if(s==='photo'){ box.innerHTML='<div class="cmp-row"><b>报名照片规范</b><br><span>近期免冠正面证件照，蓝底/白底，JPG格式，宽高≥295×413像素，大小20-200KB。建议提前用官方照片处理工具审核。</span></div>'; }
  else { box.innerHTML='<div class="cmp-row"><b>报考条件速查模板</b><br><span>① 学历：大专/本科/研究生<br>② 专业：对照专业目录匹配大类<br>③ 年龄：18-35周岁（应届硕博可放宽至40）<br>④ 身份：应届/社会/服务基层项目人员<br>⑤ 其他：政治面貌、证书、户籍要求</span></div>'; }
}
function majorSearch(kw){ kw=kw.trim(); const box=document.getElementById('majorBox'); if(!box) return; let html='';
  majorTree.forEach(edu=>edu.cats.forEach(cat=>{ const ms=cat.majors.filter(m=>!kw||m.indexOf(kw)>=0||cat.cat.indexOf(kw)>=0);
    if(ms.length) html+=`<div class="cmp-row"><b>${edu.edu} ＞ ${cat.cat}</b><br><span>${ms.join('、')}</span></div>`; }));
  box.innerHTML=html||'<div style="color:var(--text-gray);padding:10px;">未匹配到专业</div>';
}
function scoreSearch(kw){ kw=kw.trim(); const box=document.getElementById('scoreBox'); if(!box) return;
  const rows=scoreData.filter(r=>!kw||r.city.indexOf(kw)>=0||r.level.indexOf(kw)>=0||r.sys.indexOf(kw)>=0);
  box.innerHTML='<div style="font-weight:700;margin-bottom:6px;">历年进面分数（按 层级/地市/系统）</div>'+(rows.length?rows.map(r=>`<div class="cmp-row"><b>${r.level}·${r.city}·${r.sys}</b>：<span>${r.score}</span></div>`).join(''):'<div style="color:var(--text-gray);padding:10px;">未匹配</div>'); }

function computeExamTodos(){ const done=DB.get('doneNodes',[]); const today=new Date().toISOString().slice(0,10); const nodes=[];
  myRadar.fav.forEach(a=>genNodes(a).forEach(n=>nodes.push(Object.assign({},n,{exam:a.name}))));
  return nodes.filter(n=>n.d>=today&&!done.includes(n.exam+n.n)).sort((a,b)=>a.d.localeCompare(b.d)).slice(0,3);
}
function renderHomeTodo(){ const bar=document.getElementById('homeTodoBar'); if(!bar) return; const t=computeExamTodos();
  if(t.length===0){ bar.style.display='none'; return; }
  bar.style.display='flex';
  bar.innerHTML='<span class="htd-icon">📌</span>'+t.map(n=>{ const diff=Math.ceil((new Date(n.d)-new Date())/86400000); const lv=diff<=1?'lv3':diff<=3?'lv2':'lv1'; return `<span class="htd-item ${lv}">${n.n}·${diff}天</span>`; }).join('');
}

/* ================= 错题 & 收藏夹 ================= */
function switchKTab(tab,btn){
  document.querySelectorAll('#page-knowledge .sub-tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active');
  const c=document.getElementById('kContent'); c.innerHTML='';
  if(tab==='wrong') renderWrong(c);
  else if(tab==='shenlunfav') renderShenlunFav(c);
}
function renderWrong(c){
  const list=DC.wrong;
  if(list.length===0){ c.innerHTML='<div style="text-align:center;color:var(--text-gray);padding:20px;">暂无错题，去训练场刷题吧 💪</div>'; return; }
  c.innerHTML=`<div style="font-size:13px;color:var(--text-gray);margin-bottom:8px;">共 ${list.length} 道错题｜点击可重做</div>`;
  list.forEach((w,i)=>{
    const d=document.createElement('div'); d.className='wrong-item';
    d.innerHTML=`<div class="w-cat">${w.cat||'错题'} · ${w.src||''}</div>
      <div class="w-q">${w.q}</div>
      <div class="w-a">✓ 答案：${w.ans}</div>
      ${w.tip?`<div class="w-r">技巧：${w.tip}</div>`:''}
      <div class="sl-actions"><button onclick="reDoWrong(${i})">重做</button><button onclick="delWrong(${i})">删除</button></div>`;
    c.appendChild(d);
  });
}
function reDoWrong(i){ const w=DC.wrong[i]; toast('重做：'+w.q.slice(0,20)+'...（答案：'+w.ans+'）'); const l=DC.wrong; l[i].times=(l[i].times||0)+1; l[i].mastery=l[i].times>=3?'已掌握':'巩固中'; DC.wrong=l; }
function delWrong(i){ const l=DC.wrong; l.splice(i,1); DC.wrong=l; switchKTab('wrong',document.querySelector('#page-knowledge .sub-tab')); }
function renderShenlunFav(c){
  const list=DC.fav;
  if(list.length===0){ c.innerHTML='<div style="text-align:center;color:var(--text-gray);padding:20px;">暂无收藏，在申论宝库/时政专区点击收藏即可归档 💖</div>'; return; }
  const groups={}; list.forEach(f=>{ (groups[f.type]=groups[f.type]||[]).push(f); });
  Object.entries(groups).forEach(([type,fs])=>{
    const h=document.createElement('div'); h.className='sl-cat'; h.style.margin='8px 0 4px'; h.textContent='📁 '+type; c.appendChild(h);
    fs.forEach(f=>{ const d=document.createElement('div'); d.className='sl-item'; d.innerHTML=`<div class="sl-word" style="font-size:14px;">${f.text}</div><div class="sl-example">来源：${f.src||''}${f.note?'｜'+f.note:''}</div>`; c.appendChild(d); });
  });
}

/* ================= 初始化 ================= */
function init(){
  initDate(); initCountdown(); renderSlogan();
  const pt=document.getElementById('planTotalTime'); if(pt) pt.value=state.planTime;
  renderTasks(); renderEval(); renderReflect(); renderSport(); renderTodo(); renderSchedule(); renderTreehole(); renderHomeTodo();
  const fd=document.getElementById('focusDisplay'); if(fd) fd.textContent=formatTime(state.focusSeconds);
  setTimeout(renderChart,100);
  if(state.treehole.mood>0 && state.treehole.mood<=2) showDecompress();
}
init();

/* PWA */
if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); }); }
