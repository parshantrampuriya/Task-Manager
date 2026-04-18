/* ================= TEST DASHBOARD ================= */

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
collection,
getDocs,
query,
where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);

let currentUser = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async(user)=>{

    if(!user){
        location.href = "index.html";
        return;
    }

    currentUser = user;

    animateCards();

    await loadUpcoming();
    await loadRecent();
});

/* ================= MENU ================= */
window.toggleSidebar = ()=>{

    const sidebar = getEl("sidebar");

    if(sidebar){
        sidebar.classList.toggle("active");
    }
};

/* ================= REFRESH ================= */
window.refreshPage = async ()=>{

    showToast("Refreshing...");

    await loadUpcoming();
    await loadRecent();

    showToast("Updated ✅");
};

/* ================= CARD ANIMATION ================= */
function animateCards(){

    const cards =
    document.querySelectorAll(".big-card");

    cards.forEach((card,index)=>{

        card.style.opacity = "0";
        card.style.transform =
        "translateY(25px)";

        setTimeout(()=>{

            card.style.transition =
            "0.45s ease";

            card.style.opacity = "1";
            card.style.transform =
            "translateY(0)";

        },150 + (index*110));
    });
}

/* ================= UPCOMING TESTS ================= */
async function loadUpcoming(){

    const box = getEl("upcomingList");
    const count = getEl("upcomingCount");

    if(!box || !count) return;

    try{

        const snap = await getDocs(
            query(
                collection(db,"tests"),
                where("assignedUsers","array-contains",currentUser.uid)
            )
        );

        let html = "";
        let total = 0;

        snap.forEach(doc=>{

            const d = doc.data();

            if(total >= 5) return;

            html += `
            <div class="list-row">

                <div>
                    <strong>
                    ${d.testName || "Untitled Test"}
                    </strong>

                    <small>
                    ${d.duration || 0} min
                    </small>
                </div>

                <button class="mini-btn"
                onclick="location.href='give-test.html?id=${doc.id}'">
                Start
                </button>

            </div>
            `;

            total++;
        });

        count.innerText = total;

        box.innerHTML =
        html || `
        <div class="empty-row">
        No upcoming tests
        </div>`;

    }catch(error){

        count.innerText = "0";

        box.innerHTML = `
        <div class="empty-row">
        No upcoming tests
        </div>`;
    }
}

/* ================= RECENT ACTIVITY ================= */
async function loadRecent(){

    const box = getEl("recentList");

    if(!box) return;

    try{

        const snap = await getDocs(
            query(
                collection(db,"attempts"),
                where("userId","==",currentUser.uid)
            )
        );

        let html = "";
        let total = 0;

        snap.forEach(doc=>{

            const d = doc.data();

            if(total >= 5) return;

            html += `
            <div class="list-row">

                <div>
                    <strong>
                    ${d.testName || "Test"}
                    </strong>

                    <small>
                    Score:
                    ${d.score ?? 0}
                    </small>
                </div>

                <button class="mini-btn"
                onclick="location.href='results.html?id=${doc.id}'">
                View
                </button>

            </div>
            `;

            total++;
        });

        box.innerHTML =
        html || `
        <div class="empty-row">
        No recent activity
        </div>`;

    }catch(error){

        box.innerHTML = `
        <div class="empty-row">
        No recent activity
        </div>`;
    }
}

/* ================= TOAST ================= */
function showToast(msg){

    const toast = getEl("toast");

    if(!toast) return;

    toast.innerText = msg;
    toast.className = "show";

    setTimeout(()=>{
        toast.className = "";
    },2000);
}
