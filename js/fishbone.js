// FILE NAME: fishbone.js

function updateProblem(){

    const input = document.getElementById("problemInput").value;
    const problemBox = document.getElementById("problemBox");

    if(input.trim() === ""){
        alert("Please enter a problem");
        return;
    }

    problemBox.innerText = input;
}
