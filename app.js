(() => {
  "use strict";
  const DB_KEY = "knitting_little_days_v1";
  const $ = id => document.getElementById(id);
  const now = () => Date.now();
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + now() + "-" + Math.random().toString(16).slice(2));
  const emptyDB = () => ({version:1,activeProjectId:null,projects:[],sessions:[]});
  let db = loadDB();
  let toastTimer;
  function loadDB(){try{const raw=localStorage.getItem(DB_KEY);if(!raw)return emptyDB();const x=JSON.parse(raw);if(!x||!Array.isArray(x.projects)||!Array.isArray(x.sessions))return emptyDB();return {...emptyDB(),...x};}catch(e){return emptyDB();}}
  function saveDB(){localStorage.setItem(DB_KEY,JSON.stringify(db));}
  function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2300);}
  function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function activeProject(){return db.projects.find(p=>p.id===db.activeProjectId)||null;}
  function ensureProject(){if(!activeProject()&&db.projects.length){db.activeProjectId=db.projects[0].id;saveDB();}}
  function fmt(sec){sec=Math.max(0,Math.floor(sec));return [Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60].map(n=>String(n).padStart(2,"0")).join(":");}
  function duration(s){return `${Math.floor(s/3600)} 小時 ${Math.floor(s%3600/60)} 分`;}
  function sessionSeconds(s){return Math.max(0,Number(s.seconds)||0);}
  function projectSessions(id){return db.sessions.filter(s=>s.projectId===id);}
  function projectTotals(id){const a=projectSessions(id);return {seconds:a.reduce((n,s)=>n+sessionSeconds(s),0),rows:a.reduce((n,s)=>n+(Number(s.rows)||0),0)};}
  function renderAll(){ensureProject();renderProjectSelect();renderWorkbench();renderProjects();renderHistory();}
  function renderProjectSelect(){
    const select=$("activeProjectSelect");const current=db.activeProjectId;
    select.innerHTML=db.projects.length?db.projects.map(p=>`<option value="${escapeHTML(p.id)}">${escapeHTML(p.name)}</option>`).join(""):'<option value="">請先新增作品</option>';
    select.disabled=!db.projects.length;if(current)select.value=current;
    const filter=$("historyProjectFilter");const old=filter.value;
    filter.innerHTML='<option value="all">所有作品</option>'+db.projects.map(p=>`<option value="${escapeHTML(p.id)}">${escapeHTML(p.name)}</option>`).join("");
    if([...filter.options].some(o=>o.value===old))filter.value=old;
  }
  function renderWorkbench(){
    const p=activeProject();const rows=p?.currentRows||0;const target=p?.targetRows||0;
    $("activeProjectMeta").textContent=p?[p.type,p.yarn||"未填寫毛線"].filter(Boolean).join(" · "):"尚未建立作品";
    const totals=p?projectTotals(p.id):{rows:0,seconds:0};
    const pct=target?Math.min(100,Math.round(rows/target*100)):0;
    $("activeProjectProgress").textContent=target?`${pct}% 完成`:`累積 ${totals.rows+rows} 行`;
    $("activeProgressBar").style.width=pct+"%";
    $("partSelect").value=p?.currentPart||"前片";$("partPill").textContent=p?.currentPart||"前片";
    $("rowCount").textContent=rows;$("targetRows").value=target||"";
    $("partProgressBar").style.width=pct+"%";
    $("partProgressText").textContent=target?`${rows} / ${target} 行 · ${pct}%`:"尚未設定目標行數";
    const allSeconds=db.sessions.reduce((n,s)=>n+sessionSeconds(s),0)+(p?.timer?.running?Math.floor((now()-p.timer.startedAt)/1000):p?.timer?.elapsed||0);
    $("totalTime").textContent=duration(allSeconds);
    $("totalRows").textContent=db.sessions.reduce((n,s)=>n+(Number(s.rows)||0),0)+db.projects.reduce((n,x)=>n+(x.currentRows||0),0);
    $("startTimer").disabled=!p||!!p.timer?.running;$("pauseTimer").disabled=!p||!p.timer?.running;
    $("timerStatus").textContent=p?.timer?.running?"正在計時":"尚未開始";
    $("timerDisplay").textContent=fmt(p?.timer?.running?(p.timer.elapsed||0)+(now()-p.timer.startedAt)/1000:p?.timer?.elapsed||0);
    $("saveSession").disabled=!p;
    $("partSelect").disabled=!p;$("targetRows").disabled=!p;
  }
  function renderProjects(){
    const el=$("projectList");
    if(!db.projects.length){el.innerHTML='<div class="empty-state">還沒有作品，新增一件作品開始記錄吧 ♡</div>';return;}
    el.innerHTML=db.projects.map(p=>{
      const t=projectTotals(p.id),g=p.gauge;
      return `<article class="project-card"><div class="project-card-head"><div><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.type)}${p.needle?` · ${p.needle} mm`:``}${p.color?` · ${escapeHTML(p.color)}`:``}</p></div>${p.id===db.activeProjectId?'<span class="soft-pill">目前作品</span>':''}</div>
      <p>${escapeHTML(p.yarn||"尚未填寫毛線")} · 已記錄 ${t.rows+(p.currentRows||0)} 行 · ${duration(t.seconds)}</p>
      ${g?`<div class="gauge-line">Gauge：${g.stitches||"—"} 針 / 10 cm · ${g.rows||"—"} 行 / 10 cm · ${g.needle||"—"} mm 棒針<br>${escapeHTML(g.pattern||"")}</div>`:'<div class="gauge-line">尚未填寫 Gauge</div>'}
      <div class="project-actions"><button class="small-button" data-action="activate" data-id="${p.id}">設為目前作品</button><button class="small-button" data-action="gauge" data-id="${p.id}">Gauge</button><button class="small-button" data-action="edit" data-id="${p.id}">編輯</button><button class="small-button danger-text" data-action="delete" data-id="${p.id}">刪除</button></div></article>`;
    }).join("");
  }
  function renderHistory(){
    const filter=$("historyProjectFilter").value;
    const items=[...db.sessions].filter(s=>filter==="all"||s.projectId===filter).sort((a,b)=>b.createdAt-a.createdAt);
    $("historyCount").textContent=`${items.length} 筆`;
    $("historyList").innerHTML=items.length?items.map(s=>`<article class="history-card"><div><strong>${escapeHTML(s.projectName)} · ${escapeHTML(s.part)}</strong><p>${new Date(s.createdAt).toLocaleString("zh-TW",{hour12:false})}</p>${s.note?`<p>${escapeHTML(s.note)}</p>`:""}</div><div class="history-number">${Number(s.rows)||0} 行<p>${fmt(sessionSeconds(s))}</p></div></article>`).join(""):'<div class="empty-state">目前沒有符合條件的紀錄。</div>';
  }
  function openProjectDialog(p=null){
    $("projectForm").reset();$("projectId").value=p?.id||"";
    $("projectDialogTitle").textContent=p?"編輯作品":"新增作品";
    $("projectName").value=p?.name||"";$("projectType").value=p?.type||"毛衣";$("projectNeedle").value=p?.needle||"";
    $("projectYarn").value=p?.yarn||"";$("projectColor").value=p?.color||"";$("projectNotes").value=p?.notes||"";
    $("projectDialog").showModal();
  }
  function saveProjectFromForm(e){
    e.preventDefault();const id=$("projectId").value;const old=db.projects.find(p=>p.id===id);
    const p={...(old||{id:uid(),currentRows:0,currentPart:"前片",targetRows:0,timer:{elapsed:0,running:false}}),
      name:$("projectName").value.trim(),type:$("projectType").value,needle:$("projectNeedle").value,
      yarn:$("projectYarn").value.trim(),color:$("projectColor").value.trim(),notes:$("projectNotes").value.trim()};
    if(!p.name)return;
    if(old)db.projects=db.projects.map(x=>x.id===id?p:x);else{db.projects.push(p);db.activeProjectId=p.id;}
    saveDB();$("projectDialog").close();renderAll();toast(old?"作品已更新":"已新增作品");
  }
  function switchTab(tab){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===tab));}
  function startTimer(){const p=activeProject();if(!p)return toast("請先新增作品");p.timer=p.timer||{elapsed:0,running:false};if(!p.timer.running){p.timer.running=true;p.timer.startedAt=now();saveDB();renderWorkbench();}}
  function pauseTimer(){const p=activeProject();if(!p?.timer?.running)return;p.timer.elapsed=(p.timer.elapsed||0)+(now()-p.timer.startedAt)/1000;p.timer.running=false;delete p.timer.startedAt;saveDB();renderWorkbench();}
  function resetTimer(){const p=activeProject();if(!p)return;if(!confirm("確定將這件作品目前尚未儲存的計時歸零？"))return;p.timer={elapsed:0,running:false};saveDB();renderWorkbench();}
  function addRows(n){const p=activeProject();if(!p)return toast("請先新增作品");p.currentRows=Math.max(0,(p.currentRows||0)+n);saveDB();renderWorkbench();}
  function saveSession(){
    const p=activeProject();if(!p)return toast("請先新增作品");
    const seconds=p.timer?.running?(p.timer.elapsed||0)+(now()-p.timer.startedAt)/1000:p.timer?.elapsed||0;
    const rows=p.currentRows||0;if(!rows&&!seconds)return toast("目前沒有行數或時間可以儲存");
    db.sessions.push({id:uid(),projectId:p.id,projectName:p.name,part:p.currentPart||"前片",rows,seconds:Math.round(seconds),note:"",createdAt:now()});
    p.currentRows=0;p.timer={elapsed:0,running:false};saveDB();renderAll();toast("本次編織紀錄已儲存");
  }
  function saveGauge(e){e.preventDefault();const p=db.projects.find(x=>x.id===$("gaugeProjectId").value);if(!p)return;
    p.gauge={stitches:$("gaugeStitches").value,rows:$("gaugeRows").value,needle:$("gaugeNeedle").value,pattern:$("gaugePattern").value.trim()};
    saveDB();$("gaugeDialog").close();renderProjects();toast("Gauge 已儲存");
  }
  function openGauge(id){const p=db.projects.find(x=>x.id===id);if(!p)return;const g=p.gauge||{};$("gaugeProjectId").value=id;$("gaugeStitches").value=g.stitches||"";$("gaugeRows").value=g.rows||"";$("gaugeNeedle").value=g.needle||p.needle||"";$("gaugePattern").value=g.pattern||"";$("gaugeDialog").showModal();}
  function exportFile(name,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function exportBackup(){exportFile(`knitting-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(db,null,2),"application/json");toast("備份檔已準備下載");}
  function exportCSV(){const cols=["日期","作品","部位","行數","秒數","備註"];const rows=db.sessions.map(s=>[new Date(s.createdAt).toLocaleString("zh-TW"),s.projectName,s.part,s.rows,s.seconds,s.note||""]);const csv=[cols,...rows].map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");exportFile("knitting-history.csv","\ufeff"+csv,"text/csv;charset=utf-8");}
  async function importBackup(file){try{const parsed=JSON.parse(await file.text());if(!parsed||!Array.isArray(parsed.projects)||!Array.isArray(parsed.sessions))throw new Error("格式不正確");if(!confirm(`備份內有 ${parsed.projects.length} 件作品及 ${parsed.sessions.length} 筆紀錄。匯入後會取代目前資料，確定繼續？`))return;db={...emptyDB(),...parsed};saveDB();renderAll();$("settingsDialog").close();toast("備份匯入完成");}catch(e){alert("無法匯入：請確認選擇的是本 App 匯出的 JSON 備份檔。");}}
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
  $("settingsBtn").onclick=()=>$("settingsDialog").showModal();
  $("quickAddProject").onclick=$("addProjectBtn").onclick=()=>openProjectDialog();
  $("projectForm").addEventListener("submit",saveProjectFromForm);$("gaugeForm").addEventListener("submit",saveGauge);
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>$(b.dataset.close).close()));
  $("activeProjectSelect").onchange=e=>{db.activeProjectId=e.target.value;saveDB();renderAll();};
  $("partSelect").onchange=e=>{const p=activeProject();if(p){p.currentPart=e.target.value;saveDB();$("partPill").textContent=p.currentPart;}};
  $("targetRows").onchange=e=>{const p=activeProject();if(p){p.targetRows=Math.max(0,Number(e.target.value)||0);saveDB();renderWorkbench();}};
  $("startTimer").onclick=startTimer;$("pauseTimer").onclick=pauseTimer;$("resetTimer").onclick=resetTimer;
  $("plusRow").onclick=()=>addRows(1);$("minusRow").onclick=()=>addRows(-1);
  document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addRows(Number(b.dataset.add)));
  $("saveSession").onclick=saveSession;$("historyProjectFilter").onchange=renderHistory;
  $("projectList").addEventListener("click",e=>{const b=e.target.closest("button[data-action]");if(!b)return;const p=db.projects.find(x=>x.id===b.dataset.id);if(!p)return;
    if(b.dataset.action==="activate"){db.activeProjectId=p.id;saveDB();renderAll();switchTab("workbench");toast("已切換目前作品");}
    if(b.dataset.action==="edit")openProjectDialog(p);
    if(b.dataset.action==="gauge")openGauge(p.id);
    if(b.dataset.action==="delete"){if(!confirm(`刪除「${p.name}」及其所有歷史紀錄？此操作無法復原。`))return;db.projects=db.projects.filter(x=>x.id!==p.id);db.sessions=db.sessions.filter(x=>x.projectId!==p.id);if(db.activeProjectId===p.id)db.activeProjectId=db.projects[0]?.id||null;saveDB();renderAll();toast("作品已刪除");}
  });
  $("exportBackup").onclick=exportBackup;$("exportCsv").onclick=exportCSV;
  $("importBackup").onchange=e=>{const f=e.target.files?.[0];if(f)importBackup(f);e.target.value="";};
  $("deleteAllData").onclick=()=>{if(confirm("確定清除這台裝置上的所有作品及紀錄？建議先下載備份。")){db=emptyDB();saveDB();renderAll();$("settingsDialog").close();toast("資料已清除");}};
  setInterval(()=>{if(activeProject()?.timer?.running)renderWorkbench();},500);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)renderWorkbench();});
  if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
  renderAll();
})();