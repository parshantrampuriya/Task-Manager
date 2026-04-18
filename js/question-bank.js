/* ================= QUESTION BANK PAGE ================= */

/* Sidebar Toggle */
window.toggleSidebar = () => {
    const sidebar = document.getElementById("sidebar");
    if(sidebar){
        sidebar.classList.toggle("active");
    }
};

/* Close Sidebar Clicking Outside */
document.addEventListener("click",(e)=>{

    const sidebar = document.getElementById("sidebar");
    const btn = document.querySelector(".menu-btn");

    if(!sidebar || !btn) return;

    if(
        sidebar.classList.contains("active") &&
        !sidebar.contains(e.target) &&
        !btn.contains(e.target)
    ){
        sidebar.classList.remove("active");
    }
});

/* Page Loaded Animation */
document.addEventListener("DOMContentLoaded",()=>{

    const cards = document.querySelectorAll(".big-card");

    cards.forEach((card,index)=>{
        card.style.opacity="0";
        card.style.transform="translateY(30px)";

        setTimeout(()=>{
            card.style.transition="0.5s ease";
            card.style.opacity="1";
            card.style.transform="translateY(0)";
        },200 + (index*150));
    });

});
