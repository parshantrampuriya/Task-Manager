import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, setDoc, getDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2qZmQSv7tJXmVQiGRJD6xO8MKQvGGQ6o",
  authDomain: "task-manager-c32bc.firebaseapp.com",
  projectId: "task-manager-c32bc",
  storageBucket: "task-manager-c32bc.firebasestorage.app",
  messagingSenderId: "686414095912",
  appId: "1:686414095912:web:158882cd292ccbaaccb71d",
  measurementId: "G-TLD8JJGETS"
};

const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);
const db = getFirestore(appFirebase);

let currentUser=null;
let allTasks=[];
window.allTasks=[];

let currentFilter="pending";

window.goSignup=()=>{loginPage.style.display="none";signupPage.style.display="flex";}
window.goLogin=()=>{signupPage.style.display="none";loginPage.style.display="flex";}
window.goDashboard=()=>{window.location.href="dashboard.html";}

onAuthStateChanged(auth, async(user)=>{
    if(user){
        currentUser=user;
        loginPage.style.display="none";
        signupPage.style.display="none";
        app.style.display="block";

        let userDoc=await getDoc(doc(db,"users",user.uid));
        userEmail.innerText="👤 "+(userDoc.data()?.name||user.email);

        loadTasks();
    }else{
        loginPage.style.display="flex";
        app.style.display="none";
    }
});

window.signup=async()=>{
    let user=await createUserWithEmailAndPassword(auth,email.value,password.value);
    await setDoc(doc(db,"users",user.user.uid),{
        name:name.value,
        gender:gender.value,
        dob:dob.value,
        email:email.value
    });
    signupMessage.innerText="Account Created";
}

window.login=async()=>{
    await signInWithEmailAndPassword(auth,loginEmail.value,loginPassword.value);
}

window.logout=()=>signOut(auth);

function loadTasks(){
    onSnapshot(collection(db,"tasks"),snap=>{
        allTasks=[];
        snap.forEach(d=>{
            let t=d.data();
            if(t.user===currentUser.uid){
                allTasks.push({id:d.id,...t});
            }
        });
        window.allTasks=allTasks;
        render(allTasks);
    });
}

window.add=async()=>{
    await addDoc(collection(db,"tasks"),{
        text:taskInput.value,
        date:dateInput.value,
        completed:false,
        user:currentUser.uid,
        priority:priority.value
    });
    taskInput.value="";
}

window.switchFilter=(f)=>{currentFilter=f;render(allTasks);}
window.toggle=(id,c)=>updateDoc(doc(db,"tasks",id),{completed:!c});
window.del=(id)=>deleteDoc(doc(db,"tasks",id));

window.editTask=(id,text)=>{
    let newText=prompt("Edit Task",text);
    if(newText){
        updateDoc(doc(db,"tasks",id),{text:newText});
    }
}

window.render=(tasks)=>{
    let today=new Date().toISOString().split("T")[0];

    tasks=tasks.filter(t=>{
        if(currentFilter==="pending") return !t.completed;
        if(currentFilter==="completed") return t.completed;
        if(currentFilter==="due") return !t.completed && t.date<today;
        return true;
    });

    let html="";
    tasks.forEach(t=>{
        html+=`
        <div class="card ${t.priority}">
            <div class="task ${t.completed?'completed':''}">
                ${t.text}
                <div>
                    <button onclick="toggle('${t.id}',${t.completed})">✔</button>
                    <button onclick="editTask('${t.id}','${t.text}')">✏️</button>
                    <button onclick="del('${t.id}')">❌</button>
                </div>
            </div>
            <small>${t.date}</small>
        </div>`;
    });

    grid.innerHTML=html;
}
