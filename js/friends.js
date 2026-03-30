import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser;

/* ================= AUTH ================= */

onAuthStateChanged(auth, (user) => {
    if (!user) location.href = "index.html";
    currentUser = user;

    loadRequests();
    loadFriends();
});

/* ================= SEND REQUEST ================= */

window.sendRequest = async () => {

    let email = searchUser.value;

    let q = query(collection(db, "users"), where("email", "==", email));
    let snap = await getDocs(q);

    if (snap.empty) return alert("User not found ❌");

    let targetUser = snap.docs[0];

    await addDoc(collection(db, "friendRequests"), {
        from: currentUser.uid,
        to: targetUser.id,
        status: "pending"
    });

    alert("Request Sent 🚀");
};

/* ================= LOAD REQUESTS ================= */

function loadRequests() {

    let q = query(collection(db, "friendRequests"),
        where("to", "==", currentUser.uid),
        where("status", "==", "pending")
    );

    onSnapshot(q, async snap => {

        let html = "";

        for (let r of snap.docs) {

            let d = r.data();

            let userDoc = await getDocs(
                query(collection(db,"users"), where("__name__","==",d.from))
            );

            let name = userDoc.docs[0]?.data().name || "User";

            html += `
            <div>
                👤 ${name}
                <div>
                    <button class="req-btn accept" onclick="accept('${r.id}','${d.from}')">✔</button>
                    <button class="req-btn reject" onclick="reject('${r.id}')">❌</button>
                </div>
            </div>`;
        }

        requestList.innerHTML = html || "No requests";
    });
}

/* ================= ACCEPT ================= */

window.accept = async (id, fromUser) => {

    await updateDoc(doc(db,"friendRequests",id), {
        status:"accepted"
    });

    await addDoc(collection(db,"friends"), {
        users: [fromUser, currentUser.uid]
    });
};

/* ================= REJECT ================= */

window.reject = async (id) => {
    await updateDoc(doc(db,"friendRequests",id), {
        status:"rejected"
    });
};

/* ================= LOAD FRIENDS ================= */

function loadFriends() {

    onSnapshot(collection(db,"friends"), async snap => {

        let html = "";

        for (let f of snap.docs) {

            let d = f.data();

            if (!d.users.includes(currentUser.uid)) continue;

            let friendId = d.users.find(u => u !== currentUser.uid);

            let userDoc = await getDocs(
                query(collection(db,"users"), where("__name__","==",friendId))
            );

            let name = userDoc.docs[0]?.data().name || "User";

            html += `
            <div class="friend" onclick="openFriend('${friendId}')">
                👤 ${name}
            </div>`;
        }

        friendList.innerHTML = html || "No friends yet";
    });
}

/* ================= OPEN FRIEND ================= */

window.openFriend = (id) => {
    location.href = "view.html?uid=" + id;
};

/* ================= LOGOUT ================= */

logoutBtn.onclick = async () => {
    await signOut(auth);
    location.href = "index.html";
};
