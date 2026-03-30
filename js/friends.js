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

/* ================= SEND ================= */

window.sendRequest = async () => {

    let email = searchUser.value;

    let snap = await getDocs(
        query(collection(db,"users"), where("email","==",email))
    );

    if (snap.empty) return alert("User not found ❌");

    let target = snap.docs[0];

    await addDoc(collection(db,"friendRequests"), {
        from: currentUser.uid,
        to: target.id,
        status:"pending"
    });

    alert("Sent ✅");
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

            let u = await getDocs(
                query(collection(db,"users"), where("__name__","==",d.from))
            );

            let name = u.docs[0]?.data().name;

            html += `
            <div>
                👤 ${name}
                <div>
                    <button onclick="accept('${r.id}','${d.from}')">✔</button>
                    <button onclick="reject('${r.id}')">❌</button>
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

            let u = await getDocs(
                query(collection(db,"users"), where("__name__","==",d.to))
            );

            let name = u.docs[0]?.data().name;

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

    await addDoc(collection(db,"friends"), {
        users:[fromUser,currentUser.uid]
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

            if (!d.users.includes(currentUser.uid)) continue;

            let friendId = d.users.find(u => u !== currentUser.uid);

            let u = await getDocs(
                query(collection(db,"users"), where("__name__","==",friendId))
            );

            let name = u.docs[0]?.data().name;

            html += `
            <div onclick="openFriend('${friendId}')">
                👤 ${name}
            </div>`;
        }

        friendList.innerHTML = html || "No friends yet";
    });
}

/* ================= VIEW ================= */

window.openFriend = (id) => {
    location.href = "view.html?uid=" + id;
};
