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

/* AUTH */
onAuthStateChanged(auth, (user) => {
    if (!user) location.href = "index.html";
    currentUser = user;

    loadReceived();
    loadSent();
    loadFriends();
});

/* SEND */
window.sendRequest = async () => {

    let email = searchUser.value;

    let snap = await getDocs(
        query(collection(db,"users"), where("email","==",email))
    );

    if (snap.empty) return alert("User not found");

    let target = snap.docs[0];

    await addDoc(collection(db,"friendRequests"), {
        from: currentUser.uid,
        to: target.id,
        status:"pending"
    });

    alert("Request sent");
};

/* RECEIVED */
function loadReceived() {

    onSnapshot(
        query(collection(db,"friendRequests"),
        where("to","==",currentUser.uid),
        where("status","==","pending")),
    snap => {

        let html = "";

        snap.forEach(r => {
            let d = r.data();

            html += `
            <div>
                ${d.from}
                <div>
                    <button class="accept" onclick="accept('${r.id}','${d.from}')">✔</button>
                    <button class="reject" onclick="reject('${r.id}')">❌</button>
                </div>
            </div>`;
        });

        requestList.innerHTML = html || "No requests";
    });
}

/* SENT */
function loadSent() {

    onSnapshot(
        query(collection(db,"friendRequests"),
        where("from","==",currentUser.uid),
        where("status","==","pending")),
    snap => {

        let html = "";

        snap.forEach(r => {
            html += `<div>⏳ Pending request</div>`;
        });

        sentList.innerHTML = html || "No sent requests";
    });
}

/* ACCEPT (FIXED) */
window.accept = async (id, fromUser) => {

    await updateDoc(doc(db,"friendRequests",id), {
        status:"accepted"
    });

    await addDoc(collection(db,"friends"), {
        user1: currentUser.uid,
        user2: fromUser
    });
};

/* REJECT */
window.reject = async (id) => {
    await updateDoc(doc(db,"friendRequests",id), {
        status:"rejected"
    });
};

/* FRIENDS (FIXED) */
function loadFriends() {

    onSnapshot(collection(db,"friends"), snap => {

        let html = "";

        snap.forEach(f => {

            let d = f.data();

            if (d.user1 === currentUser.uid || d.user2 === currentUser.uid) {

                let friendId = d.user1 === currentUser.uid ? d.user2 : d.user1;

                html += `<div>👤 ${friendId}</div>`;
            }
        });

        friendList.innerHTML = html || "No friends yet";
    });
}
