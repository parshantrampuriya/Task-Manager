import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GET PARAM ================= */

const params = new URLSearchParams(window.location.search);
const friendId = params.get("uid");

let currentUser = null;

/* ================= SAFE DOM ================= */

const getEl = (id) => document.getElementById(id);

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.href = "index.html";
        return;
    }

    if (!friendId) {
        alert("No user selected ❗");
        location.href = "friends.html";
        return;
    }

    currentUser = user;

    loadFriend();
    loadMessages();
    setOnlineStatus();
});

/* ================= ONLINE STATUS ================= */

async function setOnlineStatus() {

    try {
        await updateDoc(doc(db, "users", currentUser.uid), {
            online: true
        });

        window.addEventListener("beforeunload", async () => {
            await updateDoc(doc(db, "users", currentUser.uid), {
                online: false
            });
        });

    } catch (e) {
        console.error("Online status error:", e);
    }
}

/* ================= LOAD FRIEND ================= */

async function loadFriend() {

    try {

        const snap = await getDoc(doc(db, "users", friendId));

        if (!snap.exists()) return;

        const data = snap.data();

        getEl("chatName").innerText = data.name || "User";

        // realtime status
        onSnapshot(doc(db, "users", friendId), (snap) => {

            const d = snap.data();

            if (!d) return;

            let statusEl = getEl("status");

            if (d.online) {
                statusEl.innerText = "Online";
                statusEl.className = "online";
            } else {
                statusEl.innerText = "Offline";
                statusEl.className = "offline";
            }
        });

    } catch (e) {
        console.error("Friend load error:", e);
    }
}

/* ================= CHAT ID ================= */

function getChatId() {
    return [currentUser.uid, friendId].sort().join("_");
}

/* ================= SEND MESSAGE ================= */

window.sendMsg = async () => {

    const input = getEl("msgInput");
    const text = input.value.trim();

    if (!text) return;

    try {

        await addDoc(collection(db, "messages"), {
            chatId: getChatId(),
            sender: currentUser.uid,
            text: text,
            time: Date.now()
        });

        input.value = "";

    } catch (e) {
        console.error("Send error:", e);
    }
};

/* ================= LOAD MESSAGES ================= */

function loadMessages() {

    onSnapshot(
        query(
            collection(db, "messages"),
            where("chatId", "==", getChatId())
        ),
        (snap) => {

            let msgs = [];

            snap.forEach(doc => {
                msgs.push(doc.data());
            });

            msgs.sort((a, b) => a.time - b.time);

            let html = "";

            msgs.forEach(m => {

                let cls = m.sender === currentUser.uid ? "me" : "other";

                html += `
                <div class="msg ${cls}">
                    ${m.text}
                </div>`;
            });

            const box = getEl("chatBox");
            box.innerHTML = html;

            // auto scroll
            box.scrollTop = box.scrollHeight;
        }
    );
}
