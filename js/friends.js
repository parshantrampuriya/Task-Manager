import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* SEND REQUEST */
window.sendRequest = async () => {

    let email = searchUser.value;

    let q = query(collection(db, "users"), where("email", "==", email));

    onSnapshot(q, snap => {

        snap.forEach(async (u) => {

            await addDoc(collection(db, "friendRequests"), {
                from: auth.currentUser.uid,
                to: u.id,
                status: "pending"
            });

            alert("Request Sent 🚀");
        });
    });
};

/* LOAD REQUESTS */
function loadRequests() {

    let q = query(
        collection(db, "friendRequests"),
        where("to", "==", auth.currentUser.uid),
        where("status", "==", "pending")
    );

    onSnapshot(q, snap => {

        let html = "";

        snap.forEach(r => {

            let d = r.data();

            html += `
            <div>
                ${d.from}
                <button onclick="accept('${r.id}','${d.from}')">✔</button>
                <button onclick="reject('${r.id}')">❌</button>
            </div>`;
        });

        requestList.innerHTML = html;
    });
}

/* ACCEPT */
window.accept = async (id, fromUser) => {

    await updateDoc(doc(db, "friendRequests", id), {
        status: "accepted"
    });

    await addDoc(collection(db, "friends"), {
        user1: fromUser,
        user2: auth.currentUser.uid
    });
};

/* REJECT */
window.reject = async (id) => {
    await updateDoc(doc(db, "friendRequests", id), {
        status: "rejected"
    });
};

/* LOAD FRIENDS */
function loadFriends() {

    let q = query(
        collection(db, "friends"),
        where("user1", "==", auth.currentUser.uid)
    );

    onSnapshot(q, snap => {

        let html = "";

        snap.forEach(f => {

            let d = f.data();

            html += `
            <div onclick="viewUser('${d.user2}')">
                👤 ${d.user2}
            </div>`;
        });

        friendList.innerHTML = html;
    });
}

/* VIEW USER */
window.viewUser = (id) => {
    window.location.href = "view.html?uid=" + id;
};

/* INIT */
loadRequests();
loadFriends();
