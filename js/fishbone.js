/* REPLACE YOUR COMPLETE fishbone.js WITH THIS */

const textareas = document.querySelectorAll("textarea");

textareas.forEach((textarea)=>{

    function autoResize(){

        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";

        updateFishSize();
    }

    textarea.addEventListener("input",autoResize);

    autoResize();
});

function updateFishSize(){

    const fishBody = document.querySelector(".fish-body");

    let maxHeight = 760;

    textareas.forEach((textarea)=>{

        maxHeight += textarea.scrollHeight * 0.05;
    });

    fishBody.style.minHeight = maxHeight + "px";
}

console.log("Dynamic Fishbone Ready");
