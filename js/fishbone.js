// File: fishbone.js

const updateBtn = document.getElementById("updateBtn");
const clearBtn = document.getElementById("clearBtn");
const mainProblem = document.getElementById("mainProblem");
const effectText = document.getElementById("effectText");

updateBtn.addEventListener("click", () => {

    if(mainProblem.value.trim() === ""){
        alert("Please enter the main problem.");
        return;
    }

    effectText.innerText = mainProblem.value;
});

clearBtn.addEventListener("click", () => {

    mainProblem.value = "";
    effectText.innerText = "Problem";

    const textareas = document.querySelectorAll("textarea");

    textareas.forEach(area => {
        area.value = "";
    });
});
