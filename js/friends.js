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
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser;

/* ================= SAFE DOM ================= */

const getEl = (id) => document.getElementById(id);

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

    let email = getEl("searchUser")?.value.trim();

    if (!email) return showToast("Enter email ❗");

    let snap = await getDocs(
        query(collection(db,"users"), where("email","==",email))
    );

    if (snap.empty) return showToast("User not found ❌");

    let target = snap.docs[0];

    if (target.id === currentUser.uid)
        return showToast("You cannot add yourself ❗");

    let existing = await getDocs(
        query(collection(db,"friendRequests"),
            where("from","==",currentUser.uid),
            where("to","==",target.id)
        )
    );

    if (!existing.empty) return showToast("Already sent ⚠️");

    await addDoc(collection(db,"friendRequests"), {
        from: currentUser.uid,
        to: target.id,
        status:"pending"
    });

    showToast("Request sent ✅");
    getEl("searchUser").value = "";
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

        getEl("requestList").innerHTML = html || "No requests";
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

        getEl("sentList").innerHTML = html || "No sent";
    });
}

/* ================= ACCEPT ================= */

window.accept = async (id, fromUser) => {

    await updateDoc(doc(db,"friendRequests",id), {
        status:"accepted"
    });

    await addDoc(collection(db,"friends"), {
        users: [currentUser.uid, fromUser]
    });

    showActionPopup("Friend Added 🎉","success");
};

/* ================= REJECT ================= */

window.reject = async (id) => {

    await updateDoc(doc(db,"friendRequests",id), {
        status:"rejected"
    });

    showActionPopup("Request Rejected ❌","reject");
};

/* ================= FRIENDS ================= */

function loadFriends() {

    onSnapshot(collection(db,"friends"), async snap => {

        let html = "";

        for (let f of snap.docs) {

            let d = f.data();

            let users = d.users || [d.user1, d.user2];

            if (!users || !users.includes(currentUser.uid)) continue;

            let friendId = users.find(u => u !== currentUser.uid);

            let userSnap = await getDocs(
                query(collection(db,"users"),
                where("__name__","==",friendId))
            );

            let name = userSnap.docs[0]?.data()?.name || "User";

            html += `
            <div class="friend">

                <span class="friend-name" onclick="openFriend('${friendId}')">
                    👤 ${name}
                </span>

                <div class="friend-actions">
                    <button onclick="openChat('${friendId}')">💬 Chat</button>
                    <button onclick="openFriend('${friendId}')">📊 View</button>
                    <button class="remove" onclick="removeFriend('${f.id}')">❌</button>
                </div>

            </div>`;
        }

        getEl("friendList").innerHTML = html || "No friends yet";
    });
}

/* ================= REMOVE FRIEND ================= */

window.removeFriend = (docId) => {

    showConfirmModal(
        "Remove Friend",
        "Are you sure you want to remove this friend?",
        async () => {
            await deleteDoc(doc(db,"friends",docId));
            showToast("Friend removed ❌");
        }
    );
};

/* ================= NAV ================= */

window.openFriend = (id) => {
    location.href = "view.html?uid=" + id;
};

window.openChat = (id) => {
    location.href = "chat.html?uid=" + id;
};

/* ================= MODAL ================= */

let confirmCallback = null;

window.showConfirmModal = (title, text, callback) => {
    getEl("confirmTitle").innerText = title;
    getEl("confirmText").innerText = text;
    getEl("confirmModal").classList.add("active");
    confirmCallback = callback;
};

window.closeConfirm = () => {
    getEl("confirmModal").classList.remove("active");
};

window.confirmYes = () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
};

/* ================= TOAST ================= */

window.showToast = (msg) => {
    let t = getEl("toast");
    t.innerText = msg;
    t.classList.add("show");

    setTimeout(() => t.classList.remove("show"), 2000);
};

/* ================= ACTION POPUP ================= */

window.showActionPopup = (msg,type) => {

    let p = getEl("actionPopup");

    p.innerText = msg;
    p.className = "action-popup show " + type;

    setTimeout(()=>{
        p.classList.remove("show");
    },2000);
};
