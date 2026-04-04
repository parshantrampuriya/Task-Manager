import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
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

    loadReceived();
    loadSent();
    loadFriends();
});

/* ================= SEND REQUEST ================= */

window.sendRequest = async () => {

    let email = searchUser.value.trim();

    if (!email) return alert("Enter email");

    let snap = await getDocs(
        query(collection(db,"users"), where("email","==",email))
    );

    if (snap.empty) return alert("User not found ❌");

    let target = snap.docs[0];

    if (target.id === currentUser.uid)
        return alert("You cannot add yourself");

    // 🔥 prevent duplicate request
    let existing = await getDocs(
        query(collection(db,"friendRequests"),
            where("from","==",currentUser.uid),
            where("to","==",target.id)
        )
    );

    if (!existing.empty) return alert("Already sent request");

    await addDoc(collection(db,"friendRequests"), {
        from: currentUser.uid,
        to: target.id,
        status:"pending"
    });

    alert("Request sent ✅");
    searchUser.value = "";
};

/* ================= RECEIVED ================= */

function loadReceived() {

    onSnapshot(
        query(collection(db,"friendRequests"),
        where("to","==",currentUser.uid),
        where("status","==","pending")),
    async snap => {

        let html = "";

        for (let r of snap.docs) {

            let d = r.data();

            let userSnap = await getDocs(
                query(collection(db,"users"),
                where("__name__","==",d.from))
            );

            let name = userSnap.docs[0]?.data()?.name || "User";

            html += `
            <div>
                👤 ${name}
                <div>
                    <button class="accept" onclick="accept('${r.id}','${d.from}')">✔</button>
                    <button class="reject" onclick="reject('${r.id}')">❌</button>
                </div>
            </div>`;
        }

        requestList.innerHTML = html || "No requests";
    });
}

/* ================= SENT ================= */

function loadSent() {

    onSnapshot(
        query(collection(db,"friendRequests"),
        where("from","==",currentUser.uid),
        where("status","==","pending")),
    async snap => {

        let html = "";

        for (let r of snap.docs) {

            let d = r.data();

            let userSnap = await getDocs(
                query(collection(db,"users"),
                where("__name__","==",d.to))
            );

            let name = userSnap.docs[0]?.data()?.name || "User";

            html += `<div>⏳ ${name}</div>`;
        }

        sentList.innerHTML = html || "No sent requests";
    });
}

/* ================= ACCEPT ================= */

window.accept = async (id, fromUser) => {

    await updateDoc(doc(db,"friendRequests",id), {
        status:"accepted"
    });

    // 🔥 store BOTH users
    await addDoc(collection(db,"friends"), {
        users: [currentUser.uid, fromUser]
    });
};

/* ================= REJECT ================= */

window.reject = async (id) => {

    await updateDoc(doc(db,"friendRequests",id), {
        status:"rejected"
    });
};

/* ================= FRIENDS ================= */

function loadFriends() {

    onSnapshot(collection(db,"friends"), async snap => {

        let html = "";

        for (let f of snap.docs) {

            let d = f.data();

            let users = [];

            // 🔥 HANDLE BOTH OLD + NEW DATA
            if (d.users) {
                users = d.users;
            } else if (d.user1 && d.user2) {
                users = [d.user1, d.user2];
            } else {
                continue;
            }

            if (!users.includes(currentUser.uid)) continue;

            let friendId = users.find(u => u !== currentUser.uid);

            let userSnap = await getDocs(
                query(collection(db,"users"),
                where("__name__","==",friendId))
            );

            let name = userSnap.docs[0]?.data()?.name || "User";

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
