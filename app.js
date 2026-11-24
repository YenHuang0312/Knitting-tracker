(() => {
"use strict";
const KEY="knitting_little_days_v1", OLD_KEY="knit_tracker_v1";
const $=id=>document.getElementById(id), now=()=>Date.now();
const uid=()=>crypto.randomUUID?crypto.randomUUID():"id-"+now()+"-"+Math.random().toString(16).slice(2);
const blank=()=>({version:2,activeProjectId:null,projects:[],sessions:[],crochetProjects:[],activeCrochetProjectId:null,activeCrochetPartId:null});
function load(){try{let raw=localStorage.getItem(KEY);if(!raw)raw=localStorage.getItem(OLD_KEY);if(!raw)return blank();let d=JSON.parse(raw);return {...blank(),...d,projects:Array.isArray(d.projects)?d.projects:[],sessions:Array.isArray(d.sessions)?d.sessions:[],crochetProjects:Array.isArray(d.crochetProjects)?d.crochetProjects:[]};}catch(e){return blank();}}
let db=load(), toastTimer=null, lastCalc=null;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function save(){localStorage.setItem(KEY,JSON.stringify(db));}
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2200);}
function fmt(sec){sec=Math.max(0,Math.floor(sec||0));return [Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60].map(x=>String(x).padStart(2,"0")).join(":");}
function duration(sec){return `${Math.floor(sec/3600)} 小時 ${Math.floor(sec%3600/60)} 分`;}
function active(){return db.projects.find(p=>p.id===db.activeProjectId)||null;}
function totals(){return {seconds:db.sessions.reduce((n,s)=>n+(+s.seconds||0),0),rows:db.sessions.reduce((n,s)=>n+(+s.rows||0),0)};}
function render(){if(!active()&&db.projects.length)db.activeProjectId=db.projects[0].id;renderActive();renderProjects();renderHistory();renderCrochet();}
function renderActive(){
 const p=active();$("activeProjectSelect").innerHTML=db.projects.length?db.projects.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join(""):'<option value="">請先新增作品</option>';
 if(p)$("activeProjectSelect").value=p.id;
 $("activeProjectSelect").disabled=!p;
 $("activeProjectMeta").textContent=p?`${p.mode||"棒針"} · ${p.type||""} · ${p.yarn||"未填毛線"}`:"尚未建立作品";
 $("activeProjectProgress").textContent=p?`${p.currentRows||0} 行／圈`:"0 行";
 $("activeProgressBar").style.width=p&&p.targetRows?Math.min(100,(p.currentRows||0)/p.targetRows*100)+"%":"0%";
 $("homePart").value=p?.currentPart||"前片";$("currentPartPill").textContent=p?.currentPart||"前片";$("rowCount").textContent=p?.currentRows||0;
 $("startTimer").disabled=!p||!!p.timer?.running;$("pauseTimer").disabled=!p||!p.timer?.running;
 $("timerStatus").textContent=p?.timer?.running?"正在計時":"尚未開始";
 $("timerDisplay").textContent=fmt(p?.timer?.running?(p.timer.elapsed||0)+(now()-p.timer.startedAt)/1000:p?.timer?.elapsed||0);
 const t=totals();const running=p?.timer?.running?(now()-p.timer.startedAt)/1000:0;
 $("totalTime").textContent=duration(t.seconds+running+(p?.timer?.elapsed||0));$("totalRows").textContent=t.rows+db.projects.reduce((n,x)=>n+(+x.currentRows||0),0);
 $("saveSession").disabled=!p;
}
function renderProjects(){
 const el=$("projectList");if(!db.projects.length){el.innerHTML='<div class="empty-state">尚無作品，先建立一件作品吧。</div>';return;}
 el.innerHTML=db.projects.map(p=>`<article class="project-card"><div class="section-heading"><h3>${esc(p.name)}</h3>${p.id===db.activeProjectId?'<span class="soft-pill">目前作品</span>':""}</div><p>${esc(p.mode||"棒針")} · ${esc(p.type||"")} · ${esc(p.yarn||"未填毛線")}</p><p>目前累積 ${p.currentRows||0} 行／圈 · ${p.needle?esc(p.needle)+" mm":""}</p><div class="project-actions"><button class="small-button" data-project-action="activate" data-id="${p.id}">設為目前</button><button class="small-button" data-project-action="edit" data-id="${p.id}">編輯</button><button class="small-button danger-text" data-project-action="delete" data-id="${p.id}">刪除</button></div></article>`).join("");
}
function renderHistory(){
 const filter=$("historyFilter").value||"all";const list=[...db.sessions].filter(s=>filter==="all"||s.projectId===filter).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
 $("historyFilter").innerHTML='<option value="all">所有作品</option>'+db.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");$("historyFilter").value=filter;
 $("historyList").innerHTML=list.length?list.map(s=>`<article class="history-card"><div><b>${esc(s.projectName||"作品")} · ${esc(s.part||"未指定部位")}</b><p>${new Date(s.createdAt||Date.now()).toLocaleString("zh-TW",{hour12:false})}${s.note?" · "+esc(s.note):""}</p></div><b>${+s.rows||0} 行／圈<p>${fmt(+s.seconds||0)}</p></b></article>`).join(""):'<div class="empty-state">目前沒有編織歷史紀錄。</div>';
}
function tab(id){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>tab(b.dataset.tab));
document.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>tab(b.dataset.goto));
$("settingsBtn").onclick=()=>$("settingsDialog").showModal();
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).close());
function openProject(p=null){$("projectForm").reset();$("projectId").value=p?.id||"";$("projectDialogTitle").textContent=p?"編輯作品":"新增作品";$("projectName").value=p?.name||"";$("projectMode").value=p?.mode||"棒針";$("projectType").value=p?.type||"";$("projectNeedle").value=p?.needle||"";$("projectYarn").value=p?.yarn||"";$("projectNotes").value=p?.notes||"";$("projectDialog").showModal();}
$("addProjectBtn").onclick=$("homeAddProject").onclick=()=>openProject();
$("projectForm").onsubmit=e=>{e.preventDefault();let id=$("projectId").value,old=db.projects.find(p=>p.id===id);let p={...(old||{id:uid(),currentRows:0,currentPart:"前片",timer:{elapsed:0,running:false}}),name:$("projectName").value.trim(),mode:$("projectMode").value,type:$("projectType").value.trim(),needle:$("projectNeedle").value,yarn:$("projectYarn").value.trim(),notes:$("projectNotes").value.trim()};if(old)db.projects=db.projects.map(x=>x.id===id?p:x);else{db.projects.push(p);db.activeProjectId=p.id;}save();$("projectDialog").close();render();toast("作品已儲存");};
$("projectList").onclick=e=>{let b=e.target.closest("[data-project-action]");if(!b)return;let p=db.projects.find(x=>x.id===b.dataset.id);if(!p)return;if(b.dataset.projectAction==="activate"){db.activeProjectId=p.id;save();render();tab("home");}if(b.dataset.projectAction==="edit")openProject(p);if(b.dataset.projectAction==="delete"&&confirm(`刪除「${p.name}」及其歷史紀錄？`)){db.projects=db.projects.filter(x=>x.id!==p.id);db.sessions=db.sessions.filter(x=>x.projectId!==p.id);if(db.activeProjectId===p.id)db.activeProjectId=db.projects[0]?.id||null;save();render();}};
$("activeProjectSelect").onchange=e=>{db.activeProjectId=e.target.value;save();renderActive();};
$("homePart").onchange=e=>{let p=active();if(p){p.currentPart=e.target.value;save();$("currentPartPill").textContent=p.currentPart;}};
$("startTimer").onclick=()=>{let p=active();if(!p)return toast("請先新增作品");p.timer=p.timer||{elapsed:0,running:false};if(!p.timer.running){p.timer.running=true;p.timer.startedAt=now();save();renderActive();}};
$("pauseTimer").onclick=()=>{let p=active();if(!p?.timer?.running)return;p.timer.elapsed=(p.timer.elapsed||0)+(now()-p.timer.startedAt)/1000;p.timer.running=false;delete p.timer.startedAt;save();renderActive();};
$("resetTimer").onclick=()=>{let p=active();if(!p)return;if(confirm("確定將尚未儲存的計時歸零？")){p.timer={elapsed:0,running:false};save();renderActive();}};
function addRows(n){let p=active();if(!p)return toast("請先新增作品");p.currentRows=Math.max(0,(p.currentRows||0)+n);save();renderActive();}
$("plusRow").onclick=()=>addRows(1);$("minusRow").onclick=()=>addRows(-1);document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addRows(+b.dataset.add));
$("saveSession").onclick=()=>{let p=active();if(!p)return;let sec=p.timer?.running?(p.timer.elapsed||0)+(now()-p.timer.startedAt)/1000:p.timer?.elapsed||0,rows=p.currentRows||0;if(!sec&&!rows)return toast("目前沒有行數或時間");db.sessions.push({id:uid(),projectId:p.id,projectName:p.name,part:p.currentPart||"未指定",rows,seconds:Math.round(sec),createdAt:now()});p.currentRows=0;p.timer={elapsed:0,running:false};save();render();toast("本次紀錄已儲存");};
$("historyFilter").onchange=renderHistory;

/* Sweater calculation draft */
const val=id=>Number($(id).value)||0;
function knitGenerator(e){
 e.preventDefault();
 const gs=val("kGaugeSt"),gr=val("kGaugeRow"),chest=val("kChest");
 if(gs<=0||gr<=0||chest<=0)return toast("請確認 Gauge 與胸圍數值");
 const ease=val("kEase"),finished=chest+ease,stsPerCm=gs/10,rowsPerCm=gr/10;
 const roundSt=n=>Math.max(2,Math.round(n/2)*2);
 const total=roundSt(finished*stsPerCm),half=Math.round(total/2),bodyRows=Math.round(val("kBodyLength")*rowsPerCm),ribRows=Math.round(val("kRib")*rowsPerCm),armRows=Math.round(val("kArmhole")*rowsPerCm);
 const sleeveUpper=roundSt((val("kUpperArm")+Math.max(2,ease*.35))*stsPerCm),wrist=roundSt((val("kWrist")+4)*stsPerCm),sleeveRows=Math.round(val("kSleeveLength")*rowsPerCm);
 const neck=$("kNeck").value,structure=$("kShoulderType").value,direction=$("kDirection").value,fit=$("kFit").value,garment=$("kGarment").value;
 const cast=structure==="raglan"?roundSt(Math.max(60,(chest*.42)*stsPerCm)):total;
 const neckLabel={crew:"圓領",v:"V 領",high:"高領",boat:"船型領"}[neck];
 const structLabel={raglan:"插肩 Raglan",drop:"落肩 Drop Shoulder",setin:"正肩 Set-in"}[structure];
 const dirLabel=direction==="bottom"?"由下往上":"由上往下";
 const fitLabel={fit:"Fit",regular:"Regular",loose:"Loose",oversized:"Oversized",custom:"自訂"}[fit];
 const repeat=Math.max(1,Math.floor((sleeveUpper-wrist)/2));
 const incInterval=Math.max(1,Math.floor(sleeveRows/repeat));
 const armBind=Math.max(2,roundSt(armRows*stsPerCm*.45)/2);
 let lines=[];
 lines.push(`【${garment}｜${structLabel}｜${neckLabel}｜${dirLabel}｜${fitLabel}】`);
 lines.push(`Gauge：${gs} 針 × ${gr} 行 / 10 cm；棒針 ${val("kNeedle")} mm`);
 lines.push(`身體尺寸：身高 ${val("kHeight")||"未填"} cm、體重 ${val("kWeight")||"未填"} kg、胸圍 ${chest} cm`);
 lines.push(`成衣胸圍目標：約 ${finished.toFixed(1)} cm（胸圍 Ease ${ease} cm）`);
 lines.push(`換算：每 cm 約 ${stsPerCm.toFixed(2)} 針、${rowsPerCm.toFixed(2)} 行`);
 lines.push("");
 lines.push("【尺寸計算摘要】");
 lines.push(`衣身總圍估算 ${total} 針；前片約 ${half} 針、後片約 ${total-half} 針。`);
 lines.push(`衣身長度 ${val("kBodyLength")} cm ≈ ${bodyRows} 行；下擺羅紋 ${val("kRib")} cm ≈ ${ribRows} 行。`);
 lines.push(`袖窿深度 ${val("kArmhole")} cm ≈ ${armRows} 行。`);
 lines.push(`上臂目標約 ${sleeveUpper} 針；手腕目標約 ${wrist} 針；袖長 ${sleeveRows} 行。`);
 lines.push("");
 if(direction==="bottom"){
   lines.push("【衣身｜由下往上計算草稿】");
   lines.push(`1. 下擺起針：總計 ${total} 針（前後片分開織時，前片 ${half} 針、後片 ${total-half} 針）。`);
   lines.push(`2. 下擺羅紋：織 ${ribRows} 行（約 ${val("kRib")} cm）。`);
   lines.push(`3. 衣身直織：繼續織至腋下位置；全長目標 ${bodyRows} 行，需扣除羅紋行數及肩領塑形預留行數。`);
   lines.push(`4. 腋下：前後片兩側各暫收約 ${Math.round(armBind)} 針作為初始估算；前後片分開織，袖窿深度約 ${armRows} 行。`);
   if(structure==="raglan")lines.push("5. Raglan 注意：若採由下往上插肩，需在前後片與袖子兩側依插肩線規則同步減針，直到肩頸所需針數；此草稿未假設固定減針頻率。");
   else if(structure==="drop")lines.push("5. 落肩：肩線以直肩或少量肩斜處理；肩部與領口需依實際肩寬、後領深度及前領深度修正。");
   else lines.push("5. 正肩：需另外設計袖山弧線與肩斜；本草稿未自動完成袖山曲線，請依袖窿實測尺寸繪製對應減針。");
   lines.push(`6. 領口：${neckLabel}；左右領口分別塑形。V 領需沿領邊規律減針；圓領／高領需保留前後領深差。`);
   lines.push(`7. 肩部：使用德式引返或階梯式收針塑造肩斜，肩斜行數需按肩寬與後領寬調整。`);
 }else{
   lines.push("【衣身與育克｜由上往下計算草稿】");
   lines.push(`1. 領口起始針數：初估 ${cast} 針；此值是起始估算，請依頸圍、領口鬆量與肩部配置修正。`);
   if(structure==="raglan"){
     const targetYoke=total+Math.round(sleeveUpper*2);
     const incRounds=Math.max(1,Math.ceil((targetYoke-cast)/8));
     lines.push(`2. Raglan 育克：四條插肩線，每個加針圈共增加 8 針；達到衣身與袖子分配目標前，約需 ${incRounds} 個加針圈（若隔圈加針，約 ${incRounds*2} 圈）。`);
     lines.push(`3. 分袖：衣身目標總針數約 ${total} 針，兩袖合計目標約 ${sleeveUpper*2} 針；腋下另加針需依腋下寬度調整。`);
   }else{
     lines.push("2. 育克：此結構不是標準四線 Raglan；請依肩寬、袖窿深度及領口形狀設計分配，以下衣身與袖子針數僅作目標值。");
   }
   lines.push(`3. 衣身：分袖後織至目標衣長 ${val("kBodyLength")} cm，再織下擺羅紋約 ${ribRows} 行。`);
   lines.push(`4. 袖子：每袖目標上臂 ${sleeveUpper} 針、手腕 ${wrist} 針；若採縮袖，約分 ${repeat} 次減針，平均每 ${incInterval} 行調整一次（需依袖型修正）。`);
   lines.push(`5. 領口：${neckLabel}，依前領深度及領邊形狀挑針／繼續織領口。`);
 }
 lines.push("");
 lines.push("【袖子計算草稿】");
 lines.push(`袖口目標 ${wrist} 針；上臂目標 ${sleeveUpper} 針。兩者差 ${sleeveUpper-wrist} 針。`);
 lines.push(`如由袖口往上織，需逐步增加；如由上往下織，需逐步減少。預估調整約 ${repeat} 次，間隔約 ${incInterval} 行，請按實際袖長與袖型分配。`);
 lines.push("");
 lines.push("【材料估算】");
 if(val("kSwatch")>0){
   const area=finished*val("kBodyLength")/2 + 2*(val("kUpperArm")+val("kWrist"))/2*val("kSleeveLength")/2;
   const grams=area/100*val("kSwatch")*1.15;
   lines.push(`依樣片重量 ${val("kSwatch")} g / 100 cm² 粗估，含 15% 預留約 ${Math.ceil(grams/5)*5} g。此為簡化平面面積估算，花樣、線材蓬鬆度、領口門襟及版型會造成差異。`);
 }else lines.push("尚未輸入樣片重量，暫不估算克數。建議量測洗後 10×10 cm 樣片重量，再估算用量。");
 lines.push("");
 lines.push("【重要試織檢查】");
 lines.push("請確認洗後 Gauge、衣身胸圍、袖窿深度、肩寬、袖長與領口服貼度。正肩袖山、V 領曲線、肩斜、門襟挑針數及花樣密度需依實際版型修正。");
 lastCalc={name:`${garment} ${structLabel} ${neckLabel}`,type:"棒針毛衣織圖",text:lines.join("\n"),meta:{gaugeSt:gs,gaugeRow:gr,needle:val("kNeedle"),chest,finished,ease}};
 $("knitSummary").innerHTML=`<div class="summary-grid"><div class="summary-item"><small>目標成衣胸圍</small><b>${finished.toFixed(1)} cm</b></div><div class="summary-item"><small>衣身總針數</small><b>${total} 針</b></div><div class="summary-item"><small>前／後片</small><b>${half} / ${total-half}</b></div><div class="summary-item"><small>袖口／上臂</small><b>${wrist} / ${sleeveUpper}</b></div></div><div class="warning">這是依輸入尺寸產生的計算草稿，不是已試織驗證的完整版型。正肩袖山、領口與肩斜需要人工核對。</div>`;
 $("knitPatternText").value=lines.join("\n");$("knitOutput").classList.remove("hidden");$("knitOutput").scrollIntoView({behavior:"smooth",block:"start"});
}
$("knitForm").onsubmit=knitGenerator;
$("kFit").onchange=e=>{const defaults={fit:2,regular:6,loose:12,oversized:20,custom:6};$("kEase").value=defaults[e.target.value];};
$("copyKnit").onclick=async()=>{try{await navigator.clipboard.writeText($("knitPatternText").value);toast("織圖已複製");}catch(e){$("knitPatternText").select();toast("請長按選取文字複製");}};
$("saveKnitProject").onclick=()=>{if(!lastCalc)return;let p={id:uid(),name:lastCalc.name,mode:"棒針",type:"毛衣織圖",needle:lastCalc.meta.needle,yarn:"",notes:$("knitPatternText").value,currentRows:0,currentPart:"衣身",timer:{elapsed:0,running:false},pattern:$("knitPatternText").value,gauge:{stitches:lastCalc.meta.gaugeSt,rows:lastCalc.meta.gaugeRow}};db.projects.push(p);db.activeProjectId=p.id;save();render();toast("織圖已儲存為作品");};

/* Crochet pattern editor */
function activeCProject(){return db.crochetProjects.find(p=>p.id===db.activeCrochetProjectId)||null;}
function activeCPart(){let p=activeCProject();return p?.parts.find(x=>x.id===db.activeCrochetPartId)||p?.parts[0]||null;}
function createCrochetProject(){
 let name=$("cProjectName").value.trim();if(!name)return toast("請先輸入鉤針作品名稱");
 let p={id:uid(),name,hook:$("cHook").value,yarn:$("cYarn").value.trim(),parts:[]};db.crochetProjects.push(p);db.activeCrochetProjectId=p.id;db.activeCrochetPartId=null;save();renderCrochet();toast("鉤針作品已建立");
}
function renderCrochet(){
 let p=activeCProject();$("crochetParts").innerHTML="";
 if(!p){$("crochetParts").innerHTML='<div class="empty-state">輸入作品名稱後，點選「新增部位」建立玩偶部位。</div>';$("crochetActivePart").textContent="尚未選擇";$("crochetPatternRows").innerHTML='<div class="empty-state">尚無織圖資料。</div>';return;}
 $("cProjectName").value=p.name;$("cHook").value=p.hook||"";$("cYarn").value=p.yarn||"";
 if(!p.parts.length)$("crochetParts").innerHTML='<div class="empty-state">尚未建立部位。</div>';
 p.parts.forEach(part=>{let el=document.createElement("div");el.className="part-card"+(part.id===db.activeCrochetPartId?" selected":"");el.innerHTML=`<div class="part-card-head"><div><h4>${esc(part.name)}</h4><p>${part.method==="round"?"圈織 Round":"來回織片 Row"} · ${part.rows.length} 圈／行</p></div><span class="soft-pill">${part.rows.length} 筆</span></div><div class="project-actions"><button class="small-button" data-cpart="select" data-id="${part.id}">開啟織圖</button><button class="small-button danger-text" data-cpart="delete" data-id="${part.id}">刪除部位</button></div>`; $("crochetParts").appendChild(el);});
 let part=activeCPart();if(part){db.activeCrochetPartId=part.id;$("crochetActivePart").textContent=part.name;$("crochetPatternRows").innerHTML=part.rows.length?part.rows.map(r=>`<div class="pattern-row"><div><strong>${part.method==="round"?"R":"Row"}${r.number} · ${esc(r.instruction)}</strong><p>計算針數：${r.calculated??"未能自動判讀"}${r.expected?` · 預期 ${r.expected}`:""}${r.expected&&r.calculated!==null&&r.expected!==r.calculated?' · <span style="color:#a94e42">針數不符</span>':""}</p></div><button class="small-button danger-text" data-delrow="${r.id}">刪除</button></div>`).join(""):'<div class="empty-state">此部位尚未加入圈／行紀錄。</div>';}else{$("crochetActivePart").textContent="尚未選擇";$("crochetPatternRows").innerHTML='<div class="empty-state">先新增部位，再加入每圈／行針法。</div>';}
}
$("addCrochetPart").onclick=()=>{
 let name=$("cPartName").value.trim();if(!name)return toast("請輸入部位名稱");
 let p=activeCProject();if(!p){let projectName=$("cProjectName").value.trim();if(!projectName)return toast("請先輸入鉤針作品名稱");p={id:uid(),name:projectName,hook:$("cHook").value,yarn:$("cYarn").value.trim(),parts:[]};db.crochetProjects.push(p);db.activeCrochetProjectId=p.id;}
 p.parts.push({id:uid(),name,method:$("cMethod").value,rows:[]});db.activeCrochetPartId=p.parts[p.parts.length-1].id;$("cPartName").value="";save();renderCrochet();
};
$("crochetParts").onclick=e=>{let b=e.target.closest("[data-cpart]");if(!b)return;let p=activeCProject();if(!p)return;if(b.dataset.cpart==="select")db.activeCrochetPartId=b.dataset.id;if(b.dataset.cpart==="delete"){if(!confirm("刪除此部位及其織圖？"))return;p.parts=p.parts.filter(x=>x.id!==b.dataset.id);if(db.activeCrochetPartId===b.dataset.id)db.activeCrochetPartId=p.parts[0]?.id||null;}save();renderCrochet();};
function parseStitches(input){
 // Supports expressions such as (sc*3, inc*1)*6; increase adds two finished stitches; decrease makes one.
 let s=input.toLowerCase().replace(/×/g,"*").replace(/短針/g,"sc").replace(/加針/g,"inc").replace(/減針/g,"dec").replace(/\s+/g,"");
 if(!s)return null;
 let total=0,recognized=0;
 const tokens=s.match(/\([^()]*\)\*\d+|[a-z]+(?:\*\d+)?/g)||[];
 for(let token of tokens){
   let mult=1,body=token;
   let gm=token.match(/^\((.*)\)\*(\d+)$/);if(gm){body=gm[1];mult=+gm[2];}
   let subtotal=0,inner=body.split(",");
   for(let part of inner){
     let m=part.match(/^([a-z]+)(?:\*(\d+))?$/);if(!m)continue;
     let kind=m[1],n=+(m[2]||1),per=({sc:1,hdc:1,dc:1,tr:1,slst:1,inc:2,dec:1,scinc:2,hdcinc:2,dcinc:2}[kind]);
     if(per===undefined)continue;
     subtotal+=per*n;recognized++;
   }
   total+=subtotal*mult;
 }
 if(!recognized)return null;
 return total;
}
let lastCrochetCalc=null;
function calculateC(){
 let p=activeCProject(),part=activeCPart();if(!p||!part)return toast("請先建立鉤針作品及部位");
 let instruction=$("cInstruction").value.trim(),n=parseStitches(instruction);lastCrochetCalc=n;
 $("crochetCalc").classList.remove("hidden");
 $("crochetCalc").innerHTML=n===null?"<b>無法自動判讀完整針數</b><br>可保留文字織圖，請自行填寫預期完成針數。":`<b>自動計算：${n} 針</b><br>請確認輸入格式及特殊針法是否都已納入計算。`;
 let expected=+$("cExpected").value;if(expected&&n!==null&&expected!==n)$("crochetCalc").innerHTML+=`<br><span style="color:#a94e42">注意：預期 ${expected} 針，計算結果 ${n} 針，請檢查。</span>`;
}
$("calculateCrochet").onclick=calculateC;
$("saveCrochetRound").onclick=()=>{
 let p=activeCProject(),part=activeCPart();if(!p||!part)return toast("請先建立部位");
 let instruction=$("cInstruction").value.trim();if(!instruction)return toast("請輸入針法");
 let calc=parseStitches(instruction),expected=+$("cExpected").value;
 part.rows.push({id:uid(),number:+$("cRoundNo").value||part.rows.length+1,instruction,calculated:calc,expected:expected||null});
 part.rows.sort((a,b)=>a.number-b.number);$("cInstruction").value="";$("cExpected").value="";$("cRoundNo").value=part.rows.length+1;$("crochetCalc").classList.add("hidden");save();renderCrochet();toast("圈／行織圖已儲存");
};
$("crochetPatternRows").onclick=e=>{let b=e.target.closest("[data-delrow]");if(!b)return;let part=activeCPart();if(part){part.rows=part.rows.filter(r=>r.id!==b.dataset.delrow);save();renderCrochet();}};
$("exportCrochetText").onclick=()=>{
 let p=activeCProject();if(!p)return toast("尚無鉤針作品");
 let out=[`作品：${p.name}`,`鉤針：${p.hook||"未填"} mm`,`毛線：${p.yarn||"未填"}`,""];
 p.parts.forEach(part=>{out.push(`【${part.name}｜${part.method==="round"?"圈織":"來回織片"}】`);part.rows.forEach(r=>out.push(`${part.method==="round"?"R":"Row"}${r.number}: ${r.instruction} ${r.calculated!==null?`（計算 ${r.calculated} 針）`:""}`));out.push("");});
 download("crochet-pattern.txt",out.join("\n"),"text/plain;charset=utf-8");};
$("cProjectName").onchange=()=>{let p=activeCProject();if(p){p.name=$("cProjectName").value;save();}};
$("cHook").onchange=()=>{let p=activeCProject();if(p){p.hook=$("cHook").value;save();}};
$("cYarn").onchange=()=>{let p=activeCProject();if(p){p.yarn=$("cYarn").value;save();}};

/* Backup / import */
function download(name,content,type){let blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$("exportBackup").onclick=()=>{download("knitting-studio-backup-"+new Date().toISOString().slice(0,10)+".json",JSON.stringify(db,null,2),"application/json");toast("備份檔已下載");};
$("exportHistoryCsv").onclick=()=>{let rows=[["日期","作品","部位","行數／圈數","秒數"],...db.sessions.map(s=>[new Date(s.createdAt).toLocaleString("zh-TW"),s.projectName,s.part,s.rows,s.seconds])];let csv=rows.map(r=>r.map(x=>'"'+String(x??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");download("knitting-history.csv","\ufeff"+csv,"text/csv;charset=utf-8");};
$("importBackup").onchange=async e=>{let f=e.target.files?.[0];if(!f)return;try{let x=JSON.parse(await f.text());if(!Array.isArray(x.projects)||!Array.isArray(x.sessions))throw Error();if(!confirm("匯入會取代目前 App 所有資料，確定繼續？"))return;db={...blank(),...x};save();render();$("settingsDialog").close();toast("備份匯入完成");}catch(err){alert("備份格式不正確，請選擇本 App 匯出的 JSON。");}e.target.value="";};
$("clearData").onclick=()=>{if(confirm("確定清除所有作品、織圖及紀錄？建議先備份。")){db=blank();save();render();$("settingsDialog").close();toast("資料已清除");}};
setInterval(()=>{if(active()?.timer?.running)renderActive();},500);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)renderActive();});
if("serviceWorker"in navigator&&location.protocol!=="file:")window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();
})();