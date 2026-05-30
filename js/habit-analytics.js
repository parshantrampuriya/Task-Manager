/* ================= IMPORTS ================= */

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
}
from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
onSnapshot
}
from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL ================= */

let habits = [];
let currentUser = null;

/* ================= AUTH ================= */

onAuthStateChanged(auth,(user)=>{

if(!user){

location.href="index.html";
return;

}

currentUser = user;

loadAnalytics();

});

/* ================= LOAD ================= */

function loadAnalytics(){

onSnapshot(
collection(db,"habits"),

(snapshot)=>{

habits=[];

snapshot.forEach(doc=>{

const h = doc.data();

if(h.uid===currentUser.uid){

habits.push({

id:doc.id,
...h

});

}

});

updateStatistics();

createWeeklyChart();

createMonthlyChart();

createCategoryChart();

createXPChart();

}

);

}

/* ================= STATS ================= */

function updateStatistics(){

let totalHabits = habits.length;

let totalCompletions = 0;

let bestStreak = 0;

habits.forEach(h=>{

totalCompletions +=
(h.completedDates?.length || 0);

if(
(h.longestStreak || 0)
>
bestStreak
){

bestStreak =
h.longestStreak;

}

});

let avgSuccess = 0;

if(totalHabits>0){

avgSuccess =
Math.round(
(totalCompletions /
(totalHabits*30))*100
);

}

document.getElementById(
"totalHabits"
).innerText =
totalHabits;

document.getElementById(
"totalCompletions"
).innerText =
totalCompletions;

document.getElementById(
"avgSuccess"
).innerText =
avgSuccess + "%";

document.getElementById(
"bestStreak"
).innerText =
bestStreak;

}

/* ================= WEEKLY ================= */

function createWeeklyChart(){

const weeklyData =
[0,0,0,0,0,0,0];

habits.forEach(h=>{

(h.completedDates || [])
.forEach(date=>{

const d =
new Date(date);

const day =
d.getDay();

weeklyData[day]++;

});

});

new Chart(

document.getElementById(
"weeklyChart"
),

{

type:"bar",

data:{

labels:[
"Sun",
"Mon",
"Tue",
"Wed",
"Thu",
"Fri",
"Sat"
],

datasets:[{

label:
"Completions",

data:
weeklyData

}]

}

}

);

}

/* ================= MONTHLY ================= */

function createMonthlyChart(){

const monthlyData =
new Array(12).fill(0);

habits.forEach(h=>{

(h.completedDates || [])
.forEach(date=>{

const month =
new Date(date)
.getMonth();

monthlyData[month]++;

});

});

new Chart(

document.getElementById(
"monthlyChart"
),

{

type:"line",

data:{

labels:[

"Jan","Feb",
"Mar","Apr",
"May","Jun",
"Jul","Aug",
"Sep","Oct",
"Nov","Dec"

],

datasets:[{

label:
"Monthly Activity",

data:
monthlyData,

tension:0.4

}]

}

}

);

}

/* ================= CATEGORY ================= */

function createCategoryChart(){

const categories = {};

habits.forEach(h=>{

const cat =
h.category || "Other";

categories[cat] =
(categories[cat] || 0)+1;

});

new Chart(

document.getElementById(
"categoryChart"
),

{

type:"pie",

data:{

labels:
Object.keys(categories),

datasets:[{

data:
Object.values(categories)

}]

}

}

);

}

/* ================= XP ================= */

function createXPChart(){

let xpData = [];

let runningXP = 0;

habits.forEach(h=>{

runningXP +=

(h.completedDates?.length || 0)
*
(h.xp || 10);

xpData.push(runningXP);

});

new Chart(

document.getElementById(
"xpChart"
),

{

type:"line",

data:{

labels:
xpData.map(
(_,i)=>`Habit ${i+1}`
),

datasets:[{

label:
"XP Growth",

data:
xpData

}]

}

}

);

}


/* ================= TOP HABITS ================= */

function renderTopHabits(){

const container =
document.getElementById(
"topHabits"
);

if(!container) return;

const sorted =
[...habits].sort((a,b)=>{

return (
(b.completedDates?.length || 0)
-
(a.completedDates?.length || 0)
);

});

let html="";

sorted
.slice(0,5)
.forEach((h,index)=>{

let badge = "🥉";

if(index===0){
badge="🥇";
}

if(index===1){
badge="🥈";
}

html += `

<div class="top-habit">

<div>

<div class="top-name">

${badge}
${h.icon || "🎯"}
${h.name}

</div>

</div>

<div class="top-score">

${h.completedDates?.length || 0}
Completions

</div>

</div>

`;

});

container.innerHTML =
html || "No habits";

}

/* ================= RANKING ================= */

function renderRankingTable(){

const table =
document.getElementById(
"rankingTable"
);

if(!table) return;

const ranked =
[...habits].sort((a,b)=>{

return (
(b.streak || 0)
-
(a.streak || 0)
);

});

let html="";

ranked.forEach(h=>{

html += `

<tr>

<td>

${h.icon || "🎯"}
${h.name}

</td>

<td>

🔥 ${h.streak || 0}

</td>

<td>

${h.completedDates?.length || 0}

</td>

</tr>

`;

});

table.innerHTML = html;

}

/* ================= HEATMAP ================= */

function generateHeatmap(){

const grid =
document.querySelector(
".heat-grid"
);

if(!grid) return;

grid.innerHTML="";

let completedMap = {};

habits.forEach(h=>{

(h.completedDates || [])
.forEach(date=>{

completedMap[date] =
(completedMap[date] || 0)+1;

});

});

/* 84 DAYS */

for(let i=83;i>=0;i--){

let d = new Date();

d.setDate(
d.getDate()-i
);

let key =
d.toISOString()
.split("T")[0];

let count =
completedMap[key] || 0;

let level = 0;

if(count>=1) level=1;
if(count>=3) level=2;
if(count>=5) level=3;
if(count>=8) level=4;

grid.innerHTML += `

<div
class="heat-cell level${level}"
title="${key}">
</div>

`;

}

}

/* ================= CONSISTENCY ================= */

function getConsistencyScore(){

let completed = 0;

habits.forEach(h=>{

completed +=
(h.completedDates?.length || 0);

});

const possible =
habits.length * 30;

if(possible===0){
return 0;
}

return Math.round(
(completed/possible)*100
);

}

/* ================= CATEGORY ANALYSIS ================= */

function getBestCategory(){

const categories = {};

habits.forEach(h=>{

const cat =
h.category || "Other";

categories[cat] =
(categories[cat] || 0)
+
(h.completedDates?.length || 0);

});

let best = "None";

let max = 0;

Object.keys(categories)
.forEach(cat=>{

if(categories[cat] > max){

max =
categories[cat];

best =
cat;

}

});

return best;

}

/* ================= AI INSIGHTS ================= */

function generateAI(){

const box =
document.getElementById(
"aiSuggestions"
);

if(!box) return;

if(habits.length===0){

box.innerHTML =

`
Create habits to
start analytics.
`;

return;

}

const consistency =
getConsistencyScore();

const bestCategory =
getBestCategory();

let longest = 0;

let bestHabit = "None";

habits.forEach(h=>{

if(
(h.streak || 0)
>
longest
){

longest =
h.streak;

bestHabit =
h.name;

}

});

box.innerHTML =

`

🔥 Best Habit:
<b>${bestHabit}</b>

<br><br>

📚 Strongest Category:
<b>${bestCategory}</b>

<br><br>

📈 Consistency:
<b>${consistency}%</b>

<br><br>

💡 Recommendation:

${
consistency < 40
?
"Focus on building a daily routine."
:
consistency < 70
?
"Good progress. Improve consistency."
:
"Excellent discipline. Maintain momentum."
}

<br><br>

🏆 Current Best Streak:

<b>${longest} Days</b>

`;

}

/* ================= ACHIEVEMENT ANALYTICS ================= */

function achievementAnalytics(){

let completed = 0;

let longest = 0;

habits.forEach(h=>{

completed +=
(h.completedDates?.length || 0);

if(
(h.longestStreak || 0)
>
longest
){

longest =
h.longestStreak;

}

});

console.log(
"Achievements:",
{
completed,
longest
}
);

}

/* ================= FINAL ================= */

function runAdvancedAnalytics(){

renderTopHabits();

renderRankingTable();

generateHeatmap();

generateAI();

achievementAnalytics();

}

/* ================= CALL ================= */

/* ADD THIS INSIDE loadAnalytics() AFTER CHARTS */

runAdvancedAnalytics();