/* ================= GROWTH PAGE ================= */

document.addEventListener("DOMContentLoaded",()=>{

const cards =
document.querySelectorAll(".growth-card");

cards.forEach((card,i)=>{

card.style.opacity="0";
card.style.transform="translateY(30px)";

setTimeout(()=>{

card.style.transition=".45s ease";
card.style.opacity="1";
card.style.transform="translateY(0)";

},150*i);

});

});
