// FILE NAME: fishbone.js

const updateBtn = document.getElementById("updateBtn");
const problemInput = document.getElementById("problemInput");
const problemBox = document.getElementById("problemBox");

updateBtn.addEventListener("click", () => {

    if(problemInput.value.trim() === ""){
        alert("Please enter a problem.");
        return;
    }

    problemBox.innerText = problemInput.value;
});
