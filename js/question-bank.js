/* ================= QUESTION BANK PAGE ================= */
/* OLD FEATURES KEPT + NOW USES REAL FRIENDS COLLECTION */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    onSnapshot,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= HELPERS ================= */
const getEl = (id)=>document.getElementById(id);

let currentUser = null;

/* ================= SIDEBAR TOGGLE ================= */
window.toggleSidebar = ()=>{

    const sidebar = getEl("sidebar");

    if(sidebar){
        sidebar.classList.toggle("active");
    }
};

/* ================= CLOSE SIDEBAR ================= */
document.addEventListener("click",(e)=>{

    const sidebar = getEl("sidebar");
    const btn = document.querySelector(".menu-btn");

    if(!sidebar || !btn) return;

    if(
        sidebar.classList.contains("active") &&
        !sidebar.contains(e.target) &&
        !btn.contains(e.target)
    ){
        sidebar.classList.remove("active");
    }
});

/* ================= AUTH ================= */
onAuthStateChanged(auth,(user)=>{

    if(!user){
        location.href="index.html";
        return;
    }

    currentUser = user;

    loadFriendBanks();
    animateCards();
});

/* ================= CARD ANIMATION ================= */
function animateCards(){

    const cards =
    document.querySelectorAll(".big-card");

    cards.forEach((card,index)=>{

        card.style.opacity="0";
        card.style.transform=
        "translateY(30px)";

        setTimeout(()=>{

            card.style.transition=
            "0.5s ease";

            card.style.opacity="1";
            card.style.transform=
            "translateY(0)";

        },180 + (index*130));
    });
}

/* ================= LOAD FRIEND BUTTONS ================= */
function loadFriendBanks(){

    const wrap = getEl("friendCards");

    if(!wrap) return;

    onSnapshot(
        collection(db,"friends"),

        async (snap)=>{

            let html = "";

            for(const item of snap.docs){

                const data = item.data();
                const users = data.users || [];

                /* only my friends */
                if(
                    !users.includes(currentUser.uid)
                ) continue;

                const friendId =
                users.find(
                    uid => uid !== currentUser.uid
                );

                if(!friendId) continue;

                let friendName = "Friend";

                try{

                    const userSnap =
                    await getDoc(
                        doc(db,"users",friendId)
                    );

                    if(userSnap.exists()){

                        const u =
                        userSnap.data();

                        friendName =
                            u.name ||
                            u.username ||
                            u.email ||
                            "Friend";
                    }

                }catch(err){}

                html += `
                <div class="big-card"
                onclick="openFriendBank('${friendId}')">

                    <div class="icon">👤</div>

                    <h2>${friendName}</h2>

                    <p>
                    Open ${friendName}'s Question Bank
                    </p>

                </div>
                `;
            }

            if(!html){

                html = `
                <div class="big-card no-friend-card">

                    <div class="icon">👥</div>

                    <h2>No Friends Yet</h2>

                    <p>
                    Add friends first to access their Question Bank
                    </p>

                </div>
                `;
            }

            wrap.innerHTML = html;

            animateCards();
        }
    );
}

/* ================= OPEN FRIEND BANK ================= */
window.openFriendBank = (uid)=>{

    location.href =
    "view-question.html?uid=" +
    encodeURIComponent(uid);
};
