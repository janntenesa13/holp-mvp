const seed={
 tasks:[
  {id:1,title:"Netejar el bany",meta:"30 min · Esforç alt",duration:"30 min",effort:"Alt",who:"Laia",initials:"LA",done:false,recurrence:"Setmanal",due:"21 set."},
  {id:2,title:"Fer la compra",meta:"45 min · Llista preparada",duration:"45 min",effort:"Mitjà",who:"Jan",initials:"JT",done:false,recurrence:"Setmanal",due:"Avui"},
  {id:3,title:"Treure les escombraries",meta:"5 min · Abans de les 21:00",duration:"5 min",effort:"Baix",who:"Pau",initials:"PA",done:true,recurrence:"Cap",due:""},
  {id:4,title:"Posar una rentadora",meta:"15 min · Roba de color",duration:"15 min",effort:"Mitjà",who:"Jan",initials:"JT",done:false,recurrence:"Cada 2 setmanes",due:"28 set."}
 ],
 events:[
  {id:11,start:"09:00",end:"17:00",title:"Teletreball",person:"Jan",privacy:"Personal",type:"violet"},
  {id:12,start:"17:30",end:"18:30",title:"Dentista",person:"Laia",privacy:"Compartit",type:"mint"},
  {id:13,start:"20:30",end:"22:00",title:"Sopar de la llar",person:"Tothom",privacy:"Compartit",type:"mint"},
  {id:14,start:"22:00",end:"23:00",title:"Ocupat",person:"Pau",privacy:"Privat",type:"gray"}
 ],
 expenses:[
  {id:1,title:"Compra setmanal",category:"Menjar",icon:"🛒",amount:82.40,payer:"Jan",split:["Jan","Laia","Pau"],status:"pending"},
  {id:2,title:"Internet",category:"Pagaments mensuals",icon:"📶",amount:39.90,payer:"Laia",split:["Jan","Laia","Pau"],status:"paid"},
  {id:3,title:"Productes de neteja",category:"Casa",icon:"🧻",amount:21.35,payer:"Pau",split:["Jan","Laia","Pau"],status:"pending"}
 ],
 members:[
  {name:"Jan",initials:"JT",load:42,wake:"07:00",sleep:"23:30",freeFrom:"18:00",freeTo:"22:30",color:"#c5e5ff"},
  {name:"Laia",initials:"LA",load:33,wake:"08:00",sleep:"00:00",freeFrom:"18:30",freeTo:"21:30",color:"#d8cef8"},
  {name:"Pau",initials:"PA",load:25,wake:"07:30",sleep:"23:00",freeFrom:"16:00",freeTo:"21:00",color:"#ffd9bd"}
 ]
};
let state=JSON.parse(localStorage.getItem("holp-state")||"null")||structuredClone(seed);
state.tasks=(state.tasks||[]).map(t=>({...t,duration:t.duration||t.meta?.split(" · ")[0]||"30 min",effort:t.effort||"Mitjà",recurrence:t.recurrence||"Cap",due:t.due||""}));
state.events=(state.events||[]).map(e=>({...e,id:e.id||Date.now()+Math.random(),start:e.start||e.time||"09:00",end:e.end||addHour(e.time||"09:00")}));
state.expenses=(state.expenses||[]).map(e=>({...e,category:e.category||"Altres",icon:e.icon||e.category||"🧾",status:e.status||"pending"}));
state.members=(state.members||[]).map((m,i)=>({...m,wake:m.wake||["07:00","08:00","07:30"][i]||"07:30",sleep:m.sleep||"23:30",freeFrom:m.freeFrom||"18:00",freeTo:m.freeTo||"22:00"}));
state.routines=state.routines||[{id:21,member:"Jan",day:"Dilluns",title:"Treball",start:"08:00",end:"17:00"},{id:22,member:"Laia",day:"Dimecres",title:"Classe",start:"19:00",end:"20:30"}];
let taskFilter="pending",editingExpenseId=null;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const money=n=>n.toLocaleString("ca-ES",{style:"currency",currency:"EUR"});
function addHour(t){const [h,m]=t.split(":").map(Number);return String((h+1)%24).padStart(2,"0")+":"+String(m).padStart(2,"0")}
function durationHours(from,to){let [a,b]=[from,to].map(t=>{const [h,m]=t.split(":").map(Number);return h+m/60});if(b<a)b+=24;return Math.max(0,b-a)}
function save(){localStorage.setItem("holp-state",JSON.stringify(state))}
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove("show"),2200)}
function navigate(view){$$(".view").forEach(v=>v.classList.toggle("active",v.dataset.view===view));$$(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.nav===view));window.scrollTo({top:0,behavior:"smooth"})}
$$("[data-nav]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.nav)));

function taskHTML(t){const repeat=t.recurrence&&t.recurrence!=="Cap"?` · ↻ ${t.recurrence}`:"";return `<article class="task-card ${t.done?"done":""}"><button class="task-check ${t.done?"checked":""}" data-task="${t.id}" aria-label="${t.done?"Reobrir":"Completar"} ${t.title}">${t.done?"✓":""}</button><div><h3>${t.title}</h3><p>${t.duration} · Esforç ${t.effort} · ${t.who}${repeat}${t.due?" · "+t.due:""}</p></div><span class="assignee">${t.initials}</span></article>`}
function nextDue(recurrence){return recurrence==="Setmanal"?"D’aquí 1 setmana":recurrence==="Cada 2 setmanes"?"D’aquí 2 setmanes":recurrence==="Mensual"?"El mes vinent":""}
function rotateTask(t){if(!t.recurrence||t.recurrence==="Cap")return;const i=state.members.findIndex(m=>m.name===t.who),next=state.members[(i+1)%state.members.length];state.tasks.push({...t,id:Date.now()+Math.random(),done:false,who:next.name,initials:next.initials,due:nextDue(t.recurrence)})}
function renderTasks(){
 $("#todayTasks").innerHTML=state.tasks.filter(t=>!t.done).slice(0,3).map(taskHTML).join("")||'<p>Tot fet per avui! 🎉</p>';
 const list=state.tasks.filter(t=>taskFilter==="all"||(taskFilter==="done"?t.done:!t.done));
 $("#taskList").innerHTML=list.map(taskHTML).join("")||"<p>No hi ha tasques en aquesta vista.</p>";
 $$(".task-check").forEach(b=>b.onclick=()=>{const t=state.tasks.find(x=>x.id==b.dataset.task);const wasDone=t.done;t.done=!t.done;if(!wasDone&&t.done)rotateTask(t);save();renderTasks();toast(t.done?(t.recurrence!=="Cap"?"Completada i pròxim torn creat":"Tasca completada"):"Tasca reoberta")});
 $("#workload").innerHTML=state.members.map(m=>`<div class="load-person"><span><b>${m.name}</b><em>${m.load}%</em></span><div class="load-track"><i style="width:${m.load}%"></i></div></div>`).join("");
}
$$("[data-task-filter]").forEach(b=>b.onclick=()=>{taskFilter=b.dataset.taskFilter;$$("[data-task-filter]").forEach(x=>x.classList.toggle("selected",x===b));renderTasks()});
function eventHTML(e){return `<div class="event-row ${e.type}"><time>${e.start}<small>${e.end}</small></time><i class="event-line"></i><div><b>${e.title}</b><small>${e.person} · ${e.privacy}</small></div></div>`}
function renderAgenda(){
 $("#todayEvents").innerHTML=state.events.slice(0,3).map(eventHTML).join("");
 $("#agendaList").innerHTML=state.events.map(e=>`<article class="agenda-event"><div class="time">${e.start}<small>fins ${e.end}</small></div><div><h3>${e.title}</h3><p>${e.person}</p></div><span class="privacy">${e.privacy==="Privat"?"🔒":e.privacy==="Personal"?"👤":"🏠"}</span></article>`).join("");
 $("#weekStrip").innerHTML=["Dl|14","Dt|15","Dc|16","Dj|17","Dv|18","Ds|19","Dg|20"].map((d,i)=>{const [a,b]=d.split("|");return `<button class="day ${i===0?"selected":""}"><b>${a}</b><span>${b}</span></button>`}).join("");
 $("#availabilityBars").innerHTML=state.members.map(m=>{const h=durationHours(m.freeFrom,m.freeTo);return `<div class="schedule-row"><div><b>${m.name}</b><small>Despert ${m.wake}–${m.sleep}</small></div><span>${m.freeFrom}–${m.freeTo}</span><em>${h.toLocaleString("ca-ES")} h lliures</em></div>`}).join("");
 $("#routineList").innerHTML=state.routines.map(r=>`<article class="agenda-event"><div class="time">${r.start}<small>fins ${r.end}</small></div><div><h3>${r.day} · ${r.title}</h3><p>${r.member} · Cada setmana</p></div><button class="routine-delete" data-routine-delete="${r.id}" aria-label="Eliminar rutina">×</button></article>`).join("")||'<p class="empty-note">Encara no hi ha rutines setmanals.</p>';
 $$("[data-routine-delete]").forEach(b=>b.onclick=()=>{state.routines=state.routines.filter(r=>r.id!==+b.dataset.routineDelete);save();renderAgenda();toast("Rutina eliminada")});
}
const categoryIcons={"Menjar":"🛒","Pagaments mensuals":"🏠","Casa":"🧻","Oci":"🎟️","Altres":"🧾"};
function balances(){const bal=Object.fromEntries(state.members.map(m=>[m.name,0]));state.expenses.filter(e=>e.status==="pending").forEach(e=>{const share=e.amount/e.split.length;e.split.forEach(p=>bal[p]=(bal[p]||0)-share);bal[e.payer]=(bal[e.payer]||0)+e.amount});return bal}
function expenseHTML(e,paid=false){return `<article class="expense-card"><span class="expense-icon">${e.icon||categoryIcons[e.category]||"🧾"}</span><div><h3>${e.title}</h3><p>Ha pagat ${e.payer} · ${e.category}</p><div class="expense-actions">${paid?'<span class="paid-label">Pagada ✓</span>':`<button data-expense-edit="${e.id}">Editar</button><button data-expense-pay="${e.id}">Pagada</button><button class="danger-link" data-expense-delete="${e.id}">Eliminar</button>`}</div></div><strong>${money(e.amount)}</strong></article>`}
function renderExpenses(){
 const all=state.expenses,total=all.reduce((s,e)=>s+e.amount,0),pending=all.filter(e=>e.status==="pending"),paid=all.filter(e=>e.status==="paid");
 $("#totalExpense").textContent=money(total);$("#monthCount").textContent=`${all.length} moviments aquest mes · ${paid.length} pagats`;
 const cats=all.reduce((a,e)=>{a[e.category]=(a[e.category]||0)+e.amount;return a},{});
 $("#categoryTotals").innerHTML=Object.entries(cats).map(([name,value])=>`<article><span>${categoryIcons[name]||"🧾"} ${name}</span><b>${money(value)}</b></article>`).join("");
 $("#expenseList").innerHTML=pending.map(e=>expenseHTML(e)).join("")||'<p class="empty-note">No hi ha pagaments pendents.</p>';
 $("#paidExpenseList").innerHTML=paid.map(e=>expenseHTML(e,true)).join("")||'<p class="empty-note">Encara no hi ha despeses pagades.</p>';
 const bal=balances(),creditor=Object.entries(bal).sort((a,b)=>b[1]-a[1])[0],debtors=Object.entries(bal).filter(x=>x[1]<-.01);
 $("#settlements").innerHTML=debtors.map(d=>`<div class="settlement"><span>${d[0]} deu a ${creditor[0]}</span><b>${money(Math.min(-d[1],creditor[1]))}</b></div>`).join("")||'<div class="settlement"><span>Tot saldat</span><b>✓</b></div>';
 $$("[data-expense-edit]").forEach(b=>b.onclick=()=>openExpenseEdit(+b.dataset.expenseEdit));
 $$("[data-expense-pay]").forEach(b=>b.onclick=()=>{const e=state.expenses.find(x=>x.id===+b.dataset.expensePay);e.status="paid";save();renderExpenses();toast("Despesa passada a pagades")});
 $$("[data-expense-delete]").forEach(b=>b.onclick=()=>{if(confirm("Vols eliminar aquesta despesa?")){state.expenses=state.expenses.filter(x=>x.id!==+b.dataset.expenseDelete);save();renderExpenses();toast("Despesa eliminada")}});
}
function renderMembers(){
 $("#memberList").innerHTML=state.members.map((m,i)=>`<article class="member"><span class="avatar" style="background:${m.color}">${m.initials}</span><div><b>${m.name}${i===0?" (tu)":""}</b><small>Disponible ${m.freeFrom}–${m.freeTo}</small></div>${i===0?`<small>${m.load}% càrrega</small>`:`<button class="member-delete" data-member-delete="${m.name}">Eliminar</button>`}</article>`).join("");
 $$("[data-member-delete]").forEach(b=>b.onclick=()=>{const name=b.dataset.memberDelete;if(!confirm(`Eliminar ${name} de la llar? Les seves tasques passaran a Jan.`))return;state.members=state.members.filter(m=>m.name!==name);state.tasks=state.tasks.map(t=>t.who===name?{...t,who:"Jan",initials:"JT"}:t);state.routines=state.routines.filter(r=>r.member!==name);save();render();toast("Membre eliminat")});
}
function render(){renderTasks();renderAgenda();renderExpenses();renderMembers()}render();

const recurrenceOptions='<option>Cap</option><option>Setmanal</option><option>Cada 2 setmanes</option><option>Mensual</option>';
const categoryOptions=Object.keys(categoryIcons).map(x=>`<option>${x}</option>`).join("");
const forms={
 task:{title:"Nova tasca recurrent",html:`<div class="field"><label>Què s’ha de fer?</label><input name="title" required placeholder="Ex. Netejar els vidres"></div><div class="field"><label>Responsable del primer torn</label><select name="who"><option>Jan</option><option>Laia</option><option>Pau</option></select></div><div class="field"><label>Durada</label><select name="duration"><option>15 min</option><option>30 min</option><option>45 min</option><option>60 min</option></select></div><div class="field"><label>Esforç</label><select name="effort"><option>Baix</option><option selected>Mitjà</option><option>Alt</option></select></div><div class="field"><label>Cada quan es repeteix?</label><select name="recurrence">${recurrenceOptions}</select></div>`},
 event:{title:"Nou esdeveniment",html:`<div class="field"><label>Títol</label><input name="title" required placeholder="Ex. Sopar amb amics"></div><div class="two-fields"><div class="field"><label>Comença</label><input name="start" type="time" required></div><div class="field"><label>Acaba</label><input name="end" type="time" required></div></div><div class="field"><label>Visibilitat</label><select name="privacy"><option>Compartit</option><option>Personal</option><option>Privat</option></select></div>`},
 expense:{title:"Nova despesa",html:`<div class="field"><label>Concepte</label><input name="title" required placeholder="Ex. Compra setmanal"></div><div class="field"><label>Categoria</label><select name="category">${categoryOptions}</select></div><div class="field"><label>Import</label><input name="amount" type="number" min=".01" step=".01" required placeholder="0,00"></div><div class="field"><label>Ha pagat</label><select name="payer"><option>Jan</option><option>Laia</option><option>Pau</option></select></div>`},
 routine:{title:"Nova rutina setmanal",html:`<div class="field"><label>Membre</label><select name="member">${state.members.map(m=>`<option>${m.name}</option>`).join("")}</select></div><div class="field"><label>Activitat</label><input name="title" required placeholder="Ex. Treball o classe"></div><div class="field"><label>Dia de la setmana</label><select name="day"><option>Dilluns</option><option>Dimarts</option><option>Dimecres</option><option>Dijous</option><option>Divendres</option><option>Dissabte</option><option>Diumenge</option></select></div><div class="two-fields"><div class="field"><label>Comença</label><input name="start" type="time" required></div><div class="field"><label>Acaba</label><input name="end" type="time" required></div></div>`},
 member:{title:"Convidar a la llar",html:`<div class="field"><label>Nom</label><input name="name" required placeholder="Nom del nou membre"></div><div class="field"><label>Correu electrònic</label><input name="email" type="email" required placeholder="nom@exemple.cat"></div>`},
 availability:{title:"El meu horari d’avui",html:`<div class="two-fields"><div class="field"><label>Em llevo</label><input name="wake" type="time" required></div><div class="field"><label>Vaig a dormir</label><input name="sleep" type="time" required></div></div><div class="two-fields"><div class="field"><label>Disponible des de</label><input name="freeFrom" type="time" required></div><div class="field"><label>Disponible fins a</label><input name="freeTo" type="time" required></div></div>`},
 quick:{title:"Què vols afegir?",html:`<div class="field"><label>Tipus</label><select name="kind"><option value="task">Una tasca</option><option value="event">Un esdeveniment</option><option value="expense">Una despesa</option></select></div>`}
};
function openModal(type){editingExpenseId=null;const f=forms[type];$("#modalTitle").textContent=f.title;$("#modalForm").innerHTML=f.html+'<button class="submit" type="submit">Desar</button>';$("#modalForm").dataset.type=type;$("#modalBackdrop").hidden=false;if(type==="availability"){const m=state.members[0];["wake","sleep","freeFrom","freeTo"].forEach(k=>$("#modalForm").elements[k].value=m[k])}$("#modalForm input")?.focus()}
function openExpenseEdit(id){const e=state.expenses.find(x=>x.id===id);openModal("expense");editingExpenseId=id;$("#modalTitle").textContent="Editar despesa";["title","category","amount","payer"].forEach(k=>$("#modalForm").elements[k].value=e[k])}
$$("[data-open]").forEach(b=>b.onclick=()=>openModal(b.dataset.open));
$("#closeModal").onclick=()=>$("#modalBackdrop").hidden=true;
$("#modalBackdrop").onclick=e=>{if(e.target===e.currentTarget)e.currentTarget.hidden=true};
$("#modalForm").onsubmit=e=>{
 e.preventDefault();const form=new FormData(e.currentTarget),type=e.currentTarget.dataset.type;
 if(type==="quick"){openModal(form.get("kind"));return}
 if(type==="task"){const who=form.get("who"),m=state.members.find(x=>x.name===who);state.tasks.unshift({id:Date.now(),title:form.get("title"),duration:form.get("duration"),effort:form.get("effort"),meta:"",who,initials:m.initials,done:false,recurrence:form.get("recurrence"),due:"Avui"});navigate("tasques")}
 if(type==="event"){const privacy=form.get("privacy"),start=form.get("start"),end=form.get("end");if(durationHours(start,end)<=0){toast("L’hora final ha de ser posterior");return}state.events.push({id:Date.now(),start,end,title:privacy==="Privat"?"Ocupat":form.get("title"),person:"Jan",privacy,type:privacy==="Compartit"?"mint":privacy==="Personal"?"violet":"gray"});state.events.sort((a,b)=>a.start.localeCompare(b.start));navigate("agenda")}
 if(type==="expense"){const category=form.get("category"),data={title:form.get("title"),category,icon:categoryIcons[category],amount:+form.get("amount"),payer:form.get("payer")};if(editingExpenseId){Object.assign(state.expenses.find(x=>x.id===editingExpenseId),data)}else state.expenses.unshift({id:Date.now(),...data,split:state.members.map(m=>m.name),status:"pending"});navigate("despeses")}
 if(type==="availability"){const m=state.members[0];["wake","sleep","freeFrom","freeTo"].forEach(k=>m[k]=form.get(k));navigate("agenda")}
 if(type==="routine"){const start=form.get("start"),end=form.get("end");if(durationHours(start,end)<=0){toast("L’hora final ha de ser posterior");return}state.routines.push({id:Date.now(),member:form.get("member"),day:form.get("day"),title:form.get("title"),start,end});navigate("agenda")}
 if(type==="member"){const name=form.get("name");state.members.push({name,initials:name.slice(0,2).toUpperCase(),load:0,wake:"07:30",sleep:"23:30",freeFrom:"18:00",freeTo:"22:00",color:"#c9f0df"});toast("Invitació preparada")}
 save();render();$("#modalBackdrop").hidden=true;toast("Desat correctament");
};
$("#acceptSuggestion").onclick=()=>{const t=state.tasks.find(t=>t.title==="Fer la compra");if(t){t.who="Jan";t.initials="JT";save();renderTasks()}$("#acceptSuggestion").textContent="Acceptada ✓";$("#acceptSuggestion").disabled=true;toast("Pla actualitzat")};
$("#settleButton").onclick=()=>{const pending=state.expenses.filter(e=>e.status==="pending");if(!pending.length){toast("No hi ha deutes pendents");return}if(confirm("Marcar totes les despeses pendents com a pagades?")){pending.forEach(e=>e.status="paid");save();renderExpenses();toast("Deutes saldats i arxivats")}};
$("#copyCode").onclick=()=>{navigator.clipboard?.writeText("HOLP-8K4M");toast("Codi copiat")};
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#modalBackdrop").hidden=true});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));

/* HOLP v7: calendari dinàmic, compra compartida i catàleg de tasques */
const HOLP_DAYS=["Diumenge","Dilluns","Dimarts","Dimecres","Dijous","Divendres","Dissabte"];
const HOLP_MONTHS=["gener","febrer","març","abril","maig","juny","juliol","agost","setembre","octubre","novembre","desembre"];
const HOLP_TASKS={"Cuina":["Rentar els plats","Netejar els fogons","Netejar la nevera","Fregar el terra"],"Menjador":["Treure la pols","Aspirar","Fregar el terra","Netejar les finestres"],"Lavabo":["Netejar el vàter","Netejar la dutxa","Netejar el mirall","Canviar les tovalloles"],"Habitacions":["Canviar els llençols","Treure la pols","Aspirar","Ordenar"],"Bugaderia":["Posar una rentadora","Estendre la roba","Plegar la roba","Planxar"],"Exterior":["Treure les escombraries","Netejar el balcó","Regar les plantes"],"Altres":[]};
const holpIso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const holpToday=()=>holpIso(new Date());
const holpFormat=value=>{const d=new Date(value+"T12:00:00");return `${HOLP_DAYS[d.getDay()].toLowerCase()}, ${d.getDate()} de ${HOLP_MONTHS[d.getMonth()]}`};
let holpSelectedDate=holpToday();
state.events=state.events.map((e,i)=>({...e,date:e.date||holpToday()}));
state.tasks=state.tasks.map(t=>({...t,section:t.section||"Altres",due:t.due&&/^\d{4}-/.test(t.due)?t.due:holpToday()}));
state.shopping=state.shopping||[{id:31,name:"Llet",quantity:"2 brics",category:"Menjar",done:false,addedBy:"Laia"},{id:32,name:"Paper higiènic",quantity:"1 paquet",category:"Casa",done:false,addedBy:"Pau"}];
state.shopper=state.shopper||null;

function holpUpdateDate(){
 const now=new Date();
 $("#todayLabel").textContent=holpFormat(holpToday()).toUpperCase();
 $("#agendaMonth").textContent=`${HOLP_MONTHS[new Date(holpSelectedDate+"T12:00:00").getMonth()].toUpperCase()} ${new Date(holpSelectedDate+"T12:00:00").getFullYear()}`;
}
function holpWeek(){
 const current=new Date(holpSelectedDate+"T12:00:00"),monday=new Date(current);monday.setDate(current.getDate()-((current.getDay()+6)%7));
 $("#weekStrip").innerHTML=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);const value=holpIso(d);return `<button class="day ${value===holpSelectedDate?"selected":""}" data-holp-day="${value}"><b>${["Dl","Dt","Dc","Dj","Dv","Ds","Dg"][i]}</b><span>${d.getDate()}</span></button>`}).join("");
 $$("[data-holp-day]").forEach(b=>b.onclick=()=>{holpSelectedDate=b.dataset.holpDay;renderAgenda()});
}
function holpOverlap(aStart,aEnd,bStart,bEnd){const n=t=>{const [h,m]=t.split(":").map(Number);return h+m/60};return Math.max(0,Math.min(n(aEnd),n(bEnd))-Math.max(n(aStart),n(bStart)))}
renderAgenda=function(){
 holpUpdateDate();holpWeek();
 const events=state.events.filter(e=>e.date===holpSelectedDate);
 $("#agendaList").innerHTML=events.map(e=>`<article class="agenda-event"><div class="time">${e.start}<small>fins ${e.end}</small></div><div><h3>${e.title}</h3><p>${e.person}</p></div><span class="privacy">${e.privacy==="Privat"?"🔒":e.privacy==="Personal"?"👤":"🏠"}</span></article>`).join("")||`<p class="empty-note">Cap esdeveniment el ${holpFormat(holpSelectedDate)}.</p>`;
 $("#todayEvents").innerHTML=state.events.filter(e=>e.date===holpToday()).slice(0,3).map(eventHTML).join("")||'<p class="empty-note">Agenda lliure avui.</p>';
 $("#routineList").innerHTML=state.routines.map(r=>`<article class="agenda-event"><div class="time">${r.start}<small>fins ${r.end}</small></div><div><h3>${r.day} · ${r.title}</h3><p>${r.member} · Cada setmana</p></div><button class="routine-delete" data-routine-delete="${r.id}">×</button></article>`).join("")||'<p class="empty-note">Encara no hi ha rutines.</p>';
 $$("[data-routine-delete]").forEach(b=>b.onclick=()=>{state.routines=state.routines.filter(r=>String(r.id)!==b.dataset.routineDelete);save();renderAgenda()});
 const day=HOLP_DAYS[new Date(holpSelectedDate+"T12:00:00").getDay()];
 $("#availabilityBars").innerHTML=state.members.map(m=>{const blocks=state.routines.filter(r=>r.member===m.name&&r.day===day),base=durationHours(m.freeFrom,m.freeTo),busy=blocks.reduce((n,r)=>n+holpOverlap(m.freeFrom,m.freeTo,r.start,r.end),0),free=Math.max(0,base-busy);return `<div class="schedule-row"><div><b>${m.name}</b><small>Base ${m.freeFrom}–${m.freeTo}${blocks.length?" · "+blocks.map(x=>x.title+" "+x.start+"–"+x.end).join(", "):""}</small></div><span>${free.toLocaleString("ca-ES")} h lliures</span><em>${busy?busy.toLocaleString("ca-ES")+" h restades per rutines":"Sense rutines aquest dia"}</em></div>`}).join("");
};

function renderShopping(){
 const pending=state.shopping.filter(x=>!x.done);
 $("#shoppingPreview").innerHTML=pending.slice(0,3).map(x=>`<span>○ ${x.name}<small>${x.quantity}</small></span>`).join("")||'<span>La llista està completa ✓</span>';
 $("#shopperName").textContent=state.shopper||"Encara ningú";
 $("#shoppingStats").innerHTML=`<b>${pending.length} productes pendents</b><span>${state.shopping.length-pending.length} comprats</span>`;
 $("#shoppingList").innerHTML=state.shopping.map(x=>`<article class="shopping-item ${x.done?"done":""}"><button data-shop-toggle="${x.id}">${x.done?"✓":""}</button><div><h3>${x.name}</h3><p>${x.quantity} · ${x.category} · ${x.addedBy}</p></div><button class="shopping-delete" data-shop-delete="${x.id}">×</button></article>`).join("")||'<p class="empty-note">Afegeix el primer producte.</p>';
 $$("[data-shop-toggle]").forEach(b=>b.onclick=()=>{const x=state.shopping.find(i=>String(i.id)===b.dataset.shopToggle);x.done=!x.done;save();renderShopping()});
 $$("[data-shop-delete]").forEach(b=>b.onclick=()=>{state.shopping=state.shopping.filter(i=>String(i.id)!==b.dataset.shopDelete);save();renderShopping()});
}
$("#takeShopping").onclick=()=>{state.shopper=state.shopper==="Jan"?null:"Jan";save();renderShopping();toast(state.shopper?"T’encarregues de la compra":"Compra alliberada")};

renderMembers=function(){
 $("#memberList").innerHTML=state.members.map((m,i)=>`<article class="member"><span class="avatar" style="background:${m.color}">${m.initials}</span><div><b>${m.name}${i===0?" (tu)":""}</b><small>Disponible ${m.freeFrom}–${m.freeTo}</small></div>${i===0?`<small>${m.load}% càrrega</small>`:`<button class="member-delete" data-safe-member-delete="${m.name}">Eliminar</button>`}</article>`).join("");
 $$("[data-safe-member-delete]").forEach(b=>b.onclick=()=>{const name=b.dataset.safeMemberDelete;if(!confirm(`Eliminar ${name}? S’eliminaran les tasques pendents i rutines assignades; l’historial es conservarà.`))return;state.members=state.members.filter(m=>m.name!==name);state.tasks=state.tasks.filter(t=>t.who!==name||t.done);state.routines=state.routines.filter(r=>r.member!==name);if(state.shopper===name)state.shopper=null;save();render();toast("Membre exclòs de les assignacions")});
};

const holpBaseOpenModal=openModal;
openModal=function(type){
 if(type!=="task"&&type!=="shopping"&&type!=="event"){holpBaseOpenModal(type);return}
 editingExpenseId=null;
 if(type==="shopping"){
  $("#modalTitle").textContent="Afegir a la compra";
  $("#modalForm").innerHTML=`<div class="field"><label>Producte</label><input name="name" required></div><div class="field"><label>Quantitat</label><input name="quantity" required placeholder="Ex. 2 paquets"></div><div class="field"><label>Categoria</label><select name="category"><option>Menjar</option><option>Casa</option><option>Higiene</option><option>Altres</option></select></div><button class="submit">Desar</button>`;
 }else if(type==="event"){
  $("#modalTitle").textContent="Nou esdeveniment";
  $("#modalForm").innerHTML=`<div class="field"><label>Títol</label><input name="title" required></div><div class="field"><label>Data</label><input name="date" type="date" value="${holpSelectedDate}" required></div><div class="two-fields"><div class="field"><label>Comença</label><input name="start" type="time" required></div><div class="field"><label>Acaba</label><input name="end" type="time" required></div></div><div class="field"><label>Visibilitat</label><select name="privacy"><option>Compartit</option><option>Personal</option><option>Privat</option></select></div><button class="submit">Desar</button>`;
 }else{
  $("#modalTitle").textContent="Nova tasca";
  $("#modalForm").innerHTML=`<div class="field"><label>Estança</label><select name="section" id="holpSection">${Object.keys(HOLP_TASKS).map(x=>`<option>${x}</option>`).join("")}</select></div><div class="field"><label>Tasca</label><select name="catalog" id="holpCatalog"></select></div><div class="field" id="holpCustom" hidden><label>Una altra tasca</label><input name="custom"></div><div class="field"><label>Responsable</label><select name="who">${state.members.map(m=>`<option>${m.name}</option>`).join("")}</select></div><div class="field"><label>Data</label><input name="due" type="date" value="${holpToday()}" required></div><div class="field"><label>Repetició</label><select name="recurrence">${recurrenceOptions}</select></div><button class="submit">Desar</button>`;
  const section=$("#holpSection"),catalog=$("#holpCatalog"),custom=$("#holpCustom"),sync=()=>{const items=HOLP_TASKS[section.value];catalog.innerHTML=items.length?items.map(x=>`<option>${x}</option>`).join(""):'<option value="">Personalitzada</option>';custom.hidden=section.value!=="Altres"};section.onchange=sync;sync();
 }
 $("#modalForm").dataset.type=type;$("#modalBackdrop").hidden=false;
};

const holpSubmit=$("#modalForm").onsubmit;
$("#modalForm").onsubmit=e=>{
 const type=e.currentTarget.dataset.type;
 if(!["task","shopping","event"].includes(type)){holpSubmit(e);return}
 e.preventDefault();const f=new FormData(e.currentTarget);
 if(type==="shopping")state.shopping.unshift({id:Date.now(),name:f.get("name"),quantity:f.get("quantity"),category:f.get("category"),done:false,addedBy:"Jan"});
 if(type==="event"){const start=f.get("start"),end=f.get("end"),privacy=f.get("privacy");if(durationHours(start,end)<=0){toast("Horari incorrecte");return}state.events.push({id:Date.now(),date:f.get("date"),start,end,title:privacy==="Privat"?"Ocupat":f.get("title"),person:"Jan",privacy,type:privacy==="Compartit"?"mint":privacy==="Personal"?"violet":"gray"});holpSelectedDate=f.get("date")}
 if(type==="task"){const section=f.get("section"),title=section==="Altres"?f.get("custom")?.trim():f.get("catalog");if(!title){toast("Escriu la tasca");return}const who=f.get("who"),m=state.members.find(x=>x.name===who);state.tasks.unshift({id:Date.now(),title,section,duration:"30 min",effort:"Mitjà",who,initials:m.initials,done:false,recurrence:f.get("recurrence"),due:f.get("due")})}
 save();render();$("#modalBackdrop").hidden=true;navigate(type==="shopping"?"compra":type==="event"?"agenda":"tasques");toast("Desat correctament")
};
const holpRender=render;
render=function(){holpRender();holpUpdateDate();renderShopping()};
render();


/* HOLP v8: Bosch House, calendaris mensual/anual i catàlegs complets */
const HOLP_FULL_TASKS={
"Neteja general":["Escombrar o aspirar els terres","Fregar els terres","Treure la pols de mobles, prestatges i decoració","Netejar portes, poms i interruptors","Netejar vidres, finestres i persianes","Netejar miralls","Treure teranyines","Netejar sòcols","Aspirar sofàs, butaques i coixins","Netejar sota els mobles","Ordenar les habitacions","Buidar les papereres","Treure les escombraries","Separar i treure el reciclatge"],
"Cuina":["Rentar els plats o posar el rentaplats","Buidar el rentaplats","Netejar la pica i l’aixeta","Netejar els fogons/placa","Netejar el marbre i les superfícies","Netejar la taula i les cadires","Netejar el microones","Netejar el forn","Netejar la campana extractora i els filtres","Netejar la nevera i el congelador","Revisar aliments caducats","Netejar armaris i calaixos","Ordenar el rebost","Fer la llista de la compra","Fer la compra","Guardar la compra","Planificar els àpats","Cuinar","Preparar esmorzars, dinars i sopars","Recollir i netejar després de cuinar"],
"Banys":["Netejar el vàter","Netejar lavabo i aixetes","Netejar dutxa o banyera","Netejar mampares","Netejar miralls","Desinfectar superfícies","Fregar el terra","Canviar les tovalloles","Rentar catifes de bany","Reposar paper higiènic","Reposar sabó, xampú, etc.","Netejar desguassos","Eliminar la calç"],
"Habitacions":["Fer els llits","Canviar els llençols","Rentar la roba de llit","Ordenar tauletes i superfícies","Ordenar armaris i calaixos","Guardar la roba","Aspirar sota el llit","Girar o rotar el matalàs periòdicament"],
"Roba":["Recollir la roba bruta","Separar-la per tipus/color","Posar rentadores","Estendre la roba o posar l’assecadora","Recollir la roba seca","Doblegar-la","Planxar","Guardar-la","Rentar peces delicades","Rentar jaquetes, nòrdics, cortines, etc.","Revisar roba que cal arreglar o substituir"],
"Sala, menjador i zones comunes":["Recollir objectes","Ordenar sofàs i coixins","Netejar taules","Treure la pols dels mobles","Netejar televisió i aparells electrònics","Aspirar sofàs i catifes","Ordenar llibres, revistes, joguines, etc.","Netejar llums i làmpades"],
"Exterior":["Escombrar terrassa, pati o balcó","Netejar mobles d’exterior","Regar les plantes","Podar i cuidar plantes","Tallar la gespa","Treure males herbes","Recollir fulles","Netejar barbacoa","Netejar desguassos i canalons","Mantenir piscina, si n’hi ha","Ordenar garatge o traster"],
"Altres":[]
};
const HOLP_PRODUCTS={
"Fruita i verdura":["Patates","Cebes","Alls","Tomàquets","Enciam","Pastanagues","Pebrots","Carbassó","Albergínia","Cogombre","Bròquil","Coliflor","Espinacs","Mongeta tendra","Xampinyons","Porros","Carxofes","Alvocat","Llimones","Taronges / mandarines","Pomes","Peres","Plàtans","Kiwi","Raïm","Maduixes","Préssecs / nectarines","Meló / síndria","Fruita de temporada"],
"Carn":["Pollastre","Pit de pollastre","Cuixes de pollastre","Gall dindi","Vedella","Porc","Llom","Costelles","Carn picada","Hamburgueses","Botifarres","Salsitxes","Bacon","Pernil"],
"Peix i marisc":["Salmó","Lluç","Bacallà","Tonyina","Sardines","Calamars","Sípia","Gambes","Musclos","Peix congelat"],
"Ous i lactis":["Ous","Llet","Beguda vegetal","Iogurts","Formatge","Formatge ratllat","Formatge per untar","Mantega","Nata per cuinar","Postres làctics"],
"Pa, cereals i esmorzar":["Pa","Pa de motlle","Torrades","Cereals","Civada","Galetes","Croissants / brioixeria","Melmelada","Mel","Crema de cacau","Cafè","Cafè soluble","Cacau en pols","Te / infusions"],
"Pasta, arròs i llegums":["Arròs","Pasta","Espaguetis","Macarrons","Fideus","Cuscús","Quinoa","Llenties","Cigrons","Mongetes","Llegums cuits en pot"],
"Rebost i conserves":["Tonyina en llauna","Sardines / anxoves","Tomàquet triturat","Tomàquet fregit","Blat de moro","Olives","Pebrots en conserva","Brou","Sopes","Farina","Llevat","Pa ratllat","Sucre","Sal","Fruits secs"],
"Oli, salses i condiments":["Oli d’oliva","Oli per cuinar","Vinagre","Maionesa","Ketchup","Mostassa","Salsa de soja","Salsa barbacoa","Pesto","Pebre","Orenga","Julivert","Pebre vermell","Curri","All en pols","Altres espècies"],
"Congelats":["Verdures congelades","Pèsols","Espinacs","Patates fregides","Peix congelat","Marisc","Pizza","Croquetes","Canelons / lasanya","Gelats","Fruita congelada"],
"Embotits i coses per picar":["Pernil dolç","Pernil salat","Gall dindi","Fuet","Xoriço","Llonganissa","Formatges","Hummus","Patates xips","Olives","Fruits secs","Galetes salades"],
"Begudes":["Aigua","Aigua amb gas","Sucs","Refrescos","Llet","Begudes vegetals","Cafè","Te / infusions"],
"Dolços i postres":["Xocolata","Galetes","Cereals","Gelats","Flam","Natilles","Iogurts","Pastissos / brioixeria","Caramels"],
"Supermercat i llar":["Paper higiènic","Paper de cuina","Tovallons","Paper d’alumini","Film transparent","Bosses d’escombraries","Detergent de roba","Suavitzant","Rentavaixelles","Pastilles de rentaplats","Producte per fregar","Lleixiu / desinfectant","Netejavidres","Esponges","Sabó de mans","Gel de dutxa","Xampú","Pasta de dents"]
};
Object.keys(HOLP_TASKS).forEach(k=>delete HOLP_TASKS[k]);Object.assign(HOLP_TASKS,HOLP_FULL_TASKS);
state.migrations=state.migrations||{};
if(!state.migrations.boschV8){
 state.members=state.members.filter(m=>!["Laia","Pau"].includes(m.name));
 state.tasks=state.tasks.filter(t=>!["Laia","Pau"].includes(t.who));
 state.events=state.events.filter(e=>!["Laia","Pau"].includes(e.person));
 state.routines=state.routines.filter(r=>!["Laia","Pau"].includes(r.member));
 state.expenses=state.expenses.filter(e=>!["Laia","Pau"].includes(e.payer)).map(e=>({...e,split:e.split.filter(p=>!["Laia","Pau"].includes(p))}));
 state.shopping=state.shopping.filter(x=>!["Laia","Pau"].includes(x.addedBy));
 state.shopper=null;state.migrations.boschV8=true;save();
}
let holpCalendarMode="month",holpCalendarDate=new Date();
function holpDateKey(d){return holpIso(d)}
function holpMonthGrid(){
 const year=holpCalendarDate.getFullYear(),month=holpCalendarDate.getMonth(),first=new Date(year,month,1),start=(first.getDay()+6)%7,days=new Date(year,month+1,0).getDate();
 $("#calendarTitle").textContent=`${HOLP_MONTHS[month]} ${year}`;
 $("#monthCalendar").innerHTML=`<div class="cal-weekdays">${["Dl","Dt","Dc","Dj","Dv","Ds","Dg"].map(x=>`<b>${x}</b>`).join("")}</div><div class="cal-days">${Array(start).fill('<span></span>').join("")}${Array.from({length:days},(_,i)=>{const key=holpIso(new Date(year,month,i+1)),count=state.events.filter(e=>e.date===key).length;return `<button class="${key===holpSelectedDate?"selected":""} ${key===holpToday()?"today":""}" data-month-day="${key}"><b>${i+1}</b>${count?`<i>${count}</i>`:""}</button>`}).join("")}</div>`;
 $$("[data-month-day]").forEach(b=>b.onclick=()=>{holpSelectedDate=b.dataset.monthDay;renderAgenda()});
}
function holpYearGrid(){
 const year=holpCalendarDate.getFullYear();$("#calendarTitle").textContent=String(year);
 $("#yearCalendar").innerHTML=HOLP_MONTHS.map((name,month)=>{const count=state.events.filter(e=>{const d=new Date(e.date+"T12:00:00");return d.getFullYear()===year&&d.getMonth()===month}).length;return `<button data-year-month="${month}"><b>${name}</b><span>${count} esdeveniment${count===1?"":"s"}</span></button>`}).join("");
 $$("[data-year-month]").forEach(b=>b.onclick=()=>{holpCalendarDate=new Date(year,+b.dataset.yearMonth,1);holpSelectedDate=holpIso(holpCalendarDate);holpCalendarMode="month";$$("[data-calendar-mode]").forEach(x=>x.classList.toggle("selected",x.dataset.calendarMode==="month"));renderAgenda()});
}
const v7RenderAgenda=renderAgenda;
renderAgenda=function(){
 v7RenderAgenda();
 $("#weekStrip").hidden=true;
 $("#monthCalendar").hidden=holpCalendarMode!=="month";$("#yearCalendar").hidden=holpCalendarMode!=="year";
 if(holpCalendarMode==="month")holpMonthGrid();else holpYearGrid();
};
$$("[data-calendar-mode]").forEach(b=>b.onclick=()=>{holpCalendarMode=b.dataset.calendarMode;$$("[data-calendar-mode]").forEach(x=>x.classList.toggle("selected",x===b));renderAgenda()});
$("#calendarPrev").onclick=()=>{holpCalendarDate.setMonth(holpCalendarDate.getMonth()+(holpCalendarMode==="month"?-1:-12));renderAgenda()};
$("#calendarNext").onclick=()=>{holpCalendarDate.setMonth(holpCalendarDate.getMonth()+(holpCalendarMode==="month"?1:12));renderAgenda()};

function ensureShoppingTask(){
 const pending=state.shopping.some(x=>!x.done),exists=state.tasks.some(t=>!t.done&&t.title==="Fer la compra");
 if(pending&&!exists){const m=state.members.find(x=>x.name===(state.shopper||"Jan"))||state.members[0];state.tasks.unshift({id:Date.now()+Math.random(),title:"Fer la compra",section:"Cuina",duration:"45 min",effort:"Mitjà",who:m.name,initials:m.initials,done:false,recurrence:"Cap",due:holpToday(),shoppingTask:true})}
 if(!pending)state.tasks=state.tasks.filter(t=>!t.shoppingTask||t.done);
}
function renderProductCatalog(){
 const select=$("#productCategory");if(!select.dataset.ready){select.innerHTML=Object.keys(HOLP_PRODUCTS).map(x=>`<option>${x}</option>`).join("");select.onchange=renderProductCatalog;select.dataset.ready="1"}
 const category=select.value||Object.keys(HOLP_PRODUCTS)[0];
 $("#productCatalog").innerHTML=HOLP_PRODUCTS[category].map(name=>{const active=state.shopping.some(x=>x.name===name&&!x.done);return `<button class="${active?"selected":""}" data-product="${name}"><span>${active?"✓":"＋"}</span>${name}</button>`}).join("");
 $$("[data-product]").forEach(b=>b.onclick=()=>{const name=b.dataset.product,existing=state.shopping.find(x=>x.name===name&&!x.done);if(existing)state.shopping=state.shopping.filter(x=>x!==existing);else state.shopping.unshift({id:Date.now()+Math.random(),name,quantity:"1",category,done:false,addedBy:"Jan"});ensureShoppingTask();save();render()});
}
const v7RenderShopping=renderShopping;
renderShopping=function(){v7RenderShopping();renderProductCatalog()};
$("#clearBought").onclick=()=>{state.shopping=state.shopping.filter(x=>!x.done);save();renderShopping()};
const oldTake=$("#takeShopping").onclick;
$("#takeShopping").onclick=()=>{oldTake();const task=state.tasks.find(t=>!t.done&&t.title==="Fer la compra");if(task&&state.shopper){const m=state.members.find(x=>x.name===state.shopper);task.who=m.name;task.initials=m.initials;save();renderTasks()}};
const v7Render=render;render=function(){ensureShoppingTask();v7Render();document.querySelector(".home-switch b").textContent="Bosch House";document.querySelector(".home-switch small").textContent=`${state.members.length} membre${state.members.length===1?"":"s"}`};render();
