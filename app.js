const seed={
 tasks:[
  {id:1,title:"Netejar el bany",meta:"30 min · Esforç alt",who:"Laia",initials:"LA",done:false},
  {id:2,title:"Fer la compra",meta:"45 min · Llista preparada",who:"Jan",initials:"JT",done:false},
  {id:3,title:"Treure les escombraries",meta:"5 min · Abans de les 21:00",who:"Pau",initials:"PA",done:true},
  {id:4,title:"Posar una rentadora",meta:"15 min · Roba de color",who:"Jan",initials:"JT",done:false}
 ],
 events:[
  {time:"09:00",title:"Teletreball",person:"Jan",privacy:"Personal",type:"violet"},
  {time:"17:30",title:"Dentista",person:"Laia",privacy:"Compartit",type:"mint"},
  {time:"20:30",title:"Sopar de la llar",person:"Tothom",privacy:"Compartit",type:"mint"},
  {time:"22:00",title:"Ocupat",person:"Pau",privacy:"Privat",type:"gray"}
 ],
 expenses:[
  {id:1,title:"Compra setmanal",category:"🛒",amount:82.40,payer:"Jan",split:["Jan","Laia","Pau"]},
  {id:2,title:"Internet",category:"📶",amount:39.90,payer:"Laia",split:["Jan","Laia","Pau"]},
  {id:3,title:"Productes de neteja",category:"🧻",amount:21.35,payer:"Pau",split:["Jan","Laia","Pau"]}
 ],
 members:[
  {name:"Jan",initials:"JT",load:42,free:6,color:"#c5e5ff"},
  {name:"Laia",initials:"LA",load:33,free:3,color:"#d8cef8"},
  {name:"Pau",initials:"PA",load:25,free:5,color:"#ffd9bd"}
 ]
};
let state=JSON.parse(localStorage.getItem("holp-state")||"null")||structuredClone(seed);
let taskFilter="pending";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const money=n=>n.toLocaleString("ca-ES",{style:"currency",currency:"EUR"});
function save(){localStorage.setItem("holp-state",JSON.stringify(state))}
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove("show"),2200)}
function navigate(view){$$(".view").forEach(v=>v.classList.toggle("active",v.dataset.view===view));$$(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.nav===view));window.scrollTo({top:0,behavior:"smooth"})}
$$("[data-nav]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.nav)));

function taskHTML(t){return `<article class="task-card ${t.done?"done":""}"><button class="task-check ${t.done?"checked":""}" data-task="${t.id}" aria-label="${t.done?"Reobrir":"Completar"} ${t.title}">${t.done?"✓":""}</button><div><h3>${t.title}</h3><p>${t.meta} · ${t.who}</p></div><span class="assignee">${t.initials}</span></article>`}
function renderTasks(){
 $("#todayTasks").innerHTML=state.tasks.filter(t=>!t.done).slice(0,3).map(taskHTML).join("")||'<p>Tot fet per avui! 🎉</p>';
 const list=state.tasks.filter(t=>taskFilter==="all"||taskFilter==="done"===t.done);
 $("#taskList").innerHTML=list.map(taskHTML).join("")||"<p>No hi ha tasques en aquesta vista.</p>";
 $$(".task-check").forEach(b=>b.onclick=()=>{const t=state.tasks.find(x=>x.id===+b.dataset.task);t.done=!t.done;save();renderTasks();toast(t.done?"Tasques completada":"Tasques reoberta")});
 $("#workload").innerHTML=state.members.map(m=>`<div class="load-person"><span><b>${m.name}</b><em>${m.load}%</em></span><div class="load-track"><i style="width:${m.load}%"></i></div></div>`).join("");
}
$$("[data-task-filter]").forEach(b=>b.onclick=()=>{taskFilter=b.dataset.taskFilter;$$("[data-task-filter]").forEach(x=>x.classList.toggle("selected",x===b));renderTasks()});
function eventHTML(e){return `<div class="event-row ${e.type}"><time>${e.time}</time><i class="event-line"></i><div><b>${e.title}</b><small>${e.person} · ${e.privacy}</small></div></div>`}
function renderAgenda(){
 $("#todayEvents").innerHTML=state.events.slice(0,3).map(eventHTML).join("");
 $("#agendaList").innerHTML=state.events.map(e=>`<article class="agenda-event"><div class="time">${e.time}</div><div><h3>${e.title}</h3><p>${e.person}</p></div><span class="privacy">${e.privacy==="Privat"?"🔒":e.privacy==="Personal"?"👤":"🏠"}</span></article>`).join("");
 $("#weekStrip").innerHTML=["Dl|14","Dt|15","Dc|16","Dj|17","Dv|18","Ds|19","Dg|20"].map((d,i)=>{const [a,b]=d.split("|");return `<button class="day ${i===0?"selected":""}"><b>${a}</b><span>${b}</span></button>`}).join("");
 $("#availabilityBars").innerHTML=state.members.map(m=>`<div class="availability-row"><b>${m.name}</b><div class="availability-track"><i style="width:${m.free/8*100}%"></i></div><span>${m.free} h</span></div>`).join("");
}
function balances(){
 const bal=Object.fromEntries(state.members.map(m=>[m.name,0]));
 state.expenses.forEach(e=>{const share=e.amount/e.split.length;e.split.forEach(p=>bal[p]-=share);bal[e.payer]+=e.amount});
 return bal;
}
function renderExpenses(){
 $("#totalExpense").textContent=money(state.expenses.reduce((s,e)=>s+e.amount,0));
 $("#monthCount").textContent=`${state.expenses.length} moviments aquest mes`;
 $("#expenseList").innerHTML=state.expenses.map(e=>`<article class="expense-card"><span class="expense-icon">${e.category}</span><div><h3>${e.title}</h3><p>Ha pagat ${e.payer} · entre ${e.split.length}</p></div><strong>${money(e.amount)}</strong></article>`).join("");
 const bal=balances(),creditor=Object.entries(bal).sort((a,b)=>b[1]-a[1])[0],debtors=Object.entries(bal).filter(x=>x[1]<-.01);
 $("#settlements").innerHTML=debtors.map(d=>`<div class="settlement"><span>${d[0]} deu a ${creditor[0]}</span><b>${money(Math.min(-d[1],creditor[1]))}</b></div>`).join("")||'<div class="settlement"><span>Tot saldat</span><b>✓</b></div>';
}
function renderMembers(){
 $("#memberList").innerHTML=state.members.map((m,i)=>`<article class="member"><span class="avatar" style="background:${m.color}">${m.initials}</span><div><b>${m.name}${i===0?" (tu)":""}</b><small>${m.free} h disponibles avui</small></div><small>${m.load}% càrrega</small></article>`).join("");
}
function render(){renderTasks();renderAgenda();renderExpenses();renderMembers()}render();

const forms={
 task:{title:"Nova tasca",html:`<div class="field"><label>Què s’ha de fer?</label><input name="title" required placeholder="Ex. Netejar la cuina"></div><div class="field"><label>Responsable</label><select name="who"><option>Jan</option><option>Laia</option><option>Pau</option></select></div><div class="field"><label>Durada</label><select name="duration"><option>15 min</option><option>30 min</option><option>45 min</option><option>60 min</option></select></div>`},
 event:{title:"Nou esdeveniment",html:`<div class="field"><label>Títol</label><input name="title" required placeholder="Ex. Sopar amb amics"></div><div class="field"><label>Hora</label><input name="time" type="time" required></div><div class="field"><label>Visibilitat</label><select name="privacy"><option>Compartit</option><option>Personal</option><option>Privat</option></select></div>`},
 expense:{title:"Nova despesa",html:`<div class="field"><label>Concepte</label><input name="title" required placeholder="Ex. Compra setmanal"></div><div class="field"><label>Import</label><input name="amount" type="number" min=".01" step=".01" required placeholder="0,00"></div><div class="field"><label>Ha pagat</label><select name="payer"><option>Jan</option><option>Laia</option><option>Pau</option></select></div>`},
 member:{title:"Convidar a la llar",html:`<div class="field"><label>Nom</label><input name="name" required placeholder="Nom del nou membre"></div><div class="field"><label>Correu electrònic</label><input name="email" type="email" required placeholder="nom@exemple.cat"></div>`},
 quick:{title:"Què vols afegir?",html:`<div class="field"><label>Tipus</label><select name="kind"><option value="task">Una tasca</option><option value="event">Un esdeveniment</option><option value="expense">Una despesa</option></select></div>`}
};
function openModal(type){const f=forms[type];$("#modalTitle").textContent=f.title;$("#modalForm").innerHTML=f.html+'<button class="submit" type="submit">Desar</button>';$("#modalForm").dataset.type=type;$("#modalBackdrop").hidden=false;$("#modalForm input")?.focus()}
$$("[data-open]").forEach(b=>b.onclick=()=>openModal(b.dataset.open));
$("#closeModal").onclick=()=>$("#modalBackdrop").hidden=true;
$("#modalBackdrop").onclick=e=>{if(e.target===e.currentTarget)e.currentTarget.hidden=true};
$("#modalForm").onsubmit=e=>{
 e.preventDefault();const form=new FormData(e.currentTarget),type=e.currentTarget.dataset.type;
 if(type==="quick"){openModal(form.get("kind"));return}
 if(type==="task"){const who=form.get("who"),m=state.members.find(x=>x.name===who);state.tasks.unshift({id:Date.now(),title:form.get("title"),meta:`${form.get("duration")} · Esforç mitjà`,who,initials:m.initials,done:false});navigate("tasques")}
 if(type==="event"){const privacy=form.get("privacy");state.events.push({time:form.get("time"),title:privacy==="Privat"?"Ocupat":form.get("title"),person:"Jan",privacy,type:privacy==="Compartit"?"mint":privacy==="Personal"?"violet":"gray"});state.events.sort((a,b)=>a.time.localeCompare(b.time));navigate("agenda")}
 if(type==="expense"){state.expenses.unshift({id:Date.now(),title:form.get("title"),category:"🧾",amount:+form.get("amount"),payer:form.get("payer"),split:state.members.map(m=>m.name)});navigate("despeses")}
 if(type==="member"){const name=form.get("name");state.members.push({name,initials:name.slice(0,2).toUpperCase(),load:0,free:4,color:"#c9f0df"});toast("Invitació preparada")}
 save();render();$("#modalBackdrop").hidden=true;toast("Desat correctament");
};
$("#acceptSuggestion").onclick=()=>{const t=state.tasks.find(t=>t.title==="Fer la compra");t.who="Jan";t.initials="JT";save();renderTasks();$("#acceptSuggestion").textContent="Acceptada ✓";$("#acceptSuggestion").disabled=true;toast("Pla actualitzat")};
$("#settleButton").onclick=()=>toast("Enllaç de pagament copiat");
$("#copyCode").onclick=()=>{navigator.clipboard?.writeText("HOLP-8K4M");toast("Codi copiat")};
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#modalBackdrop").hidden=true});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));