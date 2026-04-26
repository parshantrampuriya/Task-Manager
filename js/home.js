import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL ================= */

let currentUser = null;
let tasks = [];
let goals = [];
let quoteList = [];
let dashboardPrefs = JSON.parse(localStorage.getItem("dashboardPrefs")) || {
  focus:true,
  tasks:true,
  goals:true,
  growth:true,
  countdown:true,
  quote:true
};

/* ================= AUTH ================= */

onAuthStateChanged(auth, async(user)=>{

  if(!user){
    location.href="index.html";
    return;
  }

  currentUser = user;

  let snap = await getDoc(doc(db,"users",user.uid));

  if(snap.exists()){
    username.innerText = "👤 Welcome " + (snap.data().name || "User");
  }

  loadTasks();
  loadGoals();
  loadQuotes();
  startClock();

});

/* ================= DATE ================= */

function todayDate(){
  return new Date().toLocaleDateString("en-CA");
}

function niceDate(){
  return new Date().toDateString();
}

/* ================= LIVE CLOCK ================= */

function startClock(){

  setInterval(()=>{

    let now = new Date();
    let end = new Date();
    end.setHours(23,59,59,999);

    let diff = end-now;

    let h = Math.floor(diff/3600000);
    let m = Math.floor((diff%3600000)/60000);
    let s = Math.floor((diff%60000)/1000);

    todayCenter.innerHTML = `
      <h3>${niceDate()}</h3>
      <p>⏳ ${h}h ${m}m ${s}s remaining today</p>
    `;

  },1000);

}

/* ================= TASKS ================= */

function loadTasks(){

  onSnapshot(collection(db,"tasks"), snap=>{

    tasks=[];

    snap.forEach(d=>{
      let x=d.data();
      if(x.user===currentUser.uid){
        tasks.push({id:d.id,...x});
      }
    });

    renderDashboard();

  });

}

window.toggleTask = async(id,done)=>{
  await updateDoc(doc(db,"tasks",id),{
    completed:!done
  });
};

function todayTasks(){

  return tasks
  .filter(x=>x.date===todayDate())
  .sort((a,b)=>{

    if(a.completed!==b.completed){
      return a.completed ? 1 : -1;
    }

    return (a.time||"").localeCompare(b.time||"");
  });

}

/* ================= GOALS ================= */

function loadGoals(){

  onSnapshot(collection(db,"goals"), snap=>{

    goals=[];

    snap.forEach(d=>{
      let x=d.data();
      if(x.user===currentUser.uid){
        goals.push({id:d.id,...x});
      }
    });

    renderDashboard();

  });

}

/* ================= QUOTES ================= */

async function loadQuotes(){

  const snap = await getDocs(collection(db,"quotes"));

  quoteList=[];

  snap.forEach(d=>{
    quoteList.push(d.data().text);
  });

  renderDashboard();

}

function randomQuote(){

  if(!quoteList.length){
    return "Discipline today creates freedom tomorrow.";
  }

  return quoteList[Math.floor(Math.random()*quoteList.length)];

}

/* ================= COUNTS ================= */

async function getCount(name){

  const snap = await getDocs(collection(db,name));
  let c=0;

  snap.forEach(d=>{
    if(d.data().uid===currentUser.uid) c++;
  });

  return c;
}

/* ================= RENDER ================= */

async function renderDashboard(){

  dashboard.innerHTML="";

  if(dashboardPrefs.focus){

    let t = todayTasks();
    let done = t.filter(x=>x.completed).length;
    let per = t.length ? Math.round(done*100/t.length) : 0;

    addCard(`
      <div class="card-head"><h3>📅 Today Focus</h3></div>
      <div class="widget-body">
        <div class="big-number">${per}%</div>
        <div class="progress"><div class="progress-fill" style="width:${per}%"></div></div>
        <div class="small-muted">${done}/${t.length} tasks completed</div>
      </div>
    `,"compact");
  }

  if(dashboardPrefs.countdown){

    addCard(`
      <div class="card-head"><h3>⏳ Countdown</h3></div>
      <div class="widget-body">
        <div class="small-muted">Live day timer shown above</div>
      </div>
    `,"compact");
  }

  if(dashboardPrefs.quote){

    addCard(`
      <div class="card-head">
        <h3>💬 Quote</h3>
        <button class="icon-btn" onclick="renderDashboard()">↻</button>
      </div>
      <div class="widget-body">
        <div class="quote-box">${randomQuote()}</div>
      </div>
    `,"compact");
  }

  if(dashboardPrefs.tasks){

    let html="";

    todayTasks().forEach(x=>{

      html+=`
      <div class="task-row ${x.completed?'task-done':''}">
        <div class="task-left">
          <div class="task-title">${x.text}</div>
          <div class="task-time">${x.time || "00:00"}</div>
        </div>

        <button class="tick-btn"
        onclick="toggleTask('${x.id}',${x.completed})">
        ✔
        </button>
      </div>
      `;
    });

    addCard(`
      <div class="card-head"><h3>📝 Today Tasks</h3></div>
      <div class="widget-body">${html || "No task today"}</div>
    `,"full-card");
  }

  if(dashboardPrefs.goals){

    let html="";

    goals.forEach(g=>{

      let p = Math.round((g.done/g.total)*100 || 0);

      html+=`
      <div class="goal-row">
        <div class="goal-title">${g.name}</div>
        <div class="goal-bar">
          <div class="goal-fill" style="width:${p}%"></div>
        </div>
      </div>
      `;
    });

    addCard(`
      <div class="card-head"><h3>🎯 Goals</h3></div>
      <div class="widget-body">${html || "No goals"}</div>
    `,"compact");
  }

  if(dashboardPrefs.growth){

    let mistakes = await getCount("mistakes");
    let insights = await getCount("insights");
    let quest = await getCount("quest");
    let smart = await getCount("smartmoves");

    addCard(`
      <div class="card-head"><h3>🌱 Growth Summary</h3></div>
      <div class="widget-body">
        <div class="summary-row"><span>Mistakes</span><b>${mistakes}</b></div>
        <div class="summary-row"><span>Insights</span><b>${insights}</b></div>
        <div class="summary-row"><span>Quest</span><b>${quest}</b></div>
        <div class="summary-row"><span>Smart Moves</span><b>${smart}</b></div>
      </div>
    `,"compact");
  }

}

/* ================= ADD CARD ================= */

function addCard(inner,cls=""){
  dashboard.innerHTML += `
    <div class="widget-card ${cls}">
      ${inner}
    </div>
  `;
}

/* ================= CUSTOMIZE ================= */

window.openCustomize = ()=>{

  customPopup.classList.add("show");

  chkFocus.checked = dashboardPrefs.focus;
  chkTasks.checked = dashboardPrefs.tasks;
  chkGoals.checked = dashboardPrefs.goals;
  chkGrowth.checked = dashboardPrefs.growth;
  chkCountdown.checked = dashboardPrefs.countdown;
  chkQuote.checked = dashboardPrefs.quote;

};

window.closeCustomize = ()=>{
  customPopup.classList.remove("show");
};

window.saveCustomize = ()=>{

  dashboardPrefs = {
    focus:chkFocus.checked,
    tasks:chkTasks.checked,
    goals:chkGoals.checked,
    growth:chkGrowth.checked,
    countdown:chkCountdown.checked,
    quote:chkQuote.checked
  };

  localStorage.setItem("dashboardPrefs",
  JSON.stringify(dashboardPrefs));

  closeCustomize();
  renderDashboard();

};

/* ================= QUICK ADD ================= */

window.openAdd = ()=>{
  addPopup.classList.add("show");
};

window.closeAdd = ()=>{
  addPopup.classList.remove("show");
};

window.selectType = (type)=>{

  addFields.innerHTML="";

  if(type==="task"){
    addFields.innerHTML=`
      <input id="aText" placeholder="Task name">
      <input type="date" id="aDate">
      <input type="time" id="aTime">
      <button class="main-btn" onclick="saveTask()">Save Task</button>
    `;
  }

  if(type==="goal"){
    addFields.innerHTML=`
      <input id="aText" placeholder="Goal name">
      <input id="aTotal" type="number" placeholder="Target">
      <button class="main-btn" onclick="saveGoal()">Save Goal</button>
    `;
  }

};

window.saveTask = async()=>{

  await addDoc(collection(db,"tasks"),{
    text:aText.value,
    date:aDate.value || todayDate(),
    time:aTime.value || "00:00",
    completed:false,
    user:currentUser.uid
  });

  closeAdd();
};

window.saveGoal = async()=>{

  await addDoc(collection(db,"goals"),{
    name:aText.value,
    total:Number(aTotal.value||1),
    done:0,
    user:currentUser.uid
  });

  closeAdd();
};

/* ================= LOGOUT ================= */

logoutBtn.addEventListener("click",async()=>{
  await signOut(auth);
  location.href="index.html";
});
