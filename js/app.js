<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Task Manager</title>

<link rel="stylesheet" href="css/style.css">
</head>

<body>

<div class="app-container">

    <!-- NAVBAR -->
    <div class="navbar">
        <h2>🚀 Task Manager</h2>
        <button onclick="logout()">Logout</button>
    </div>

    <!-- SEARCH -->
    <div class="task-input">
        <input id="searchInput" placeholder="Search task..." oninput="renderTasks()">
    </div>

    <!-- TABS -->
    <div class="tabs-buttons">
        <button onclick="setTab('due')">🔥 Due</button>
        <button class="active" onclick="setTab('pending')">📌 Pending</button>
        <button onclick="setTab('completed')">✅ Completed</button>
    </div>

    <!-- ADD TASK -->
    <div class="task-input">
        <input id="taskInput" placeholder="Enter task">
        <input type="date" id="dateInput">
        <button onclick="add()">Add</button>
    </div>

    <!-- TASKS -->
    <div id="tabs"></div>

</div>

<script type="module" src="js/app.js"></script>

</body>
</html>
