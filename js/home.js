function renderHome(tasks) {

    let today = new Date().toISOString().split("T")[0];

    let todayTasks = tasks.filter(t => t.date === today);

    /* 🔥 SORT → incomplete first, completed last */
    todayTasks.sort((a, b) => a.completed - b.completed);

    let completed = todayTasks.filter(t => t.completed).length;
    let total = todayTasks.length;

    let percent = total ? Math.round((completed / total) * 100) : 0;

    let html = `
        <h2>📅 Today's Tasks</h2>

        <div class="progress-bar">
            <div class="progress-fill" style="width:${percent}%"></div>
        </div>
        <p>${completed} / ${total} completed</p>

        <ol class="task-list">
    `;

    todayTasks.forEach((t, index) => {

        html += `
        <li class="task-item ${t.completed ? 'done' : ''}">
            
            <span>
                ${index + 1}. ${t.text}
            </span>

            <div class="task-actions">
                <button onclick="toggle('${t.id}',${t.completed})">✔</button>
                <button onclick="editTask('${t.id}','${t.text}')">✏️</button>
                <button onclick="del('${t.id}')">❌</button>
            </div>

        </li>`;
    });

    html += `</ol>`;

    document.getElementById("homeContent").innerHTML = html;
}
