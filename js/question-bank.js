/* ================= QUESTION BANK PAGE ================= */
/* OLD FEATURES KEPT + FRIEND BUTTONS ADDED */

import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
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

/* ================= CLOSE SIDEBAR OUTSIDE ================= */
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
onAuthStateChanged(auth, async (user)=>{

    if(!user){
        location.href="index.html";
        return;
    }

    currentUser = user;

    await loadFriendBanks();

    animateCards();
});

/* ================= PAGE ANIMATION ================= */
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

        },200 + (index*140));
    });
}

/* ================= LOAD FRIEND BUTTONS ================= */
async function loadFriendBanks(){

    const wrap = getEl("friendCards");

    if(!wrap) return;

    wrap.innerHTML = "";

    try{

        /* TRY COLLECTION friends */
        const snap = await getDocs(
            query(
                collection(db,"friends"),
                where("uid","==",currentUser.uid)
            )
        );

        if(snap.empty){
            wrap.innerHTML = `
                <div class="big-card no-friend-card">
                    <div class="icon">👥</div>
                    <h2>No Friends</h2>
                    <p>Add friends to access their Question Bank</p>
                </div>
            `;
            animateCards();
            return;
        }

        let html = "";

        for(const item of snap.docs){

            const data = item.data();

            const friendId =
                data.friendId ||
                data.fid ||
                data.friendUid;

            if(!friendId) continue;

            let friendName = "Friend";

            try{

                const userSnap =
                await getDoc(
                    doc(db,"users",friendId)
                );

                if(userSnap.exists()){

                    const u = userSnap.data();

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

        wrap.innerHTML = html;

        animateCards();

    }catch(error){

        wrap.innerHTML = `
            <div class="big-card no-friend-card">
                <div class="icon">⚠</div>
                <h2>Error</h2>
                <p>Unable to load friends</p>
            </div>
        `;
    }
}

/* ================= OPEN FRIEND BANK ================= */
window.openFriendBank = (uid)=>{

    location.href =
    "view-question.html?uid=" +
    encodeURIComponent(uid);
};
