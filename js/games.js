/* ================= OPEN GAME ================= */
window.openGame = (page)=>{

window.location.href = page;

};

/* ================= PAGE ROUTES ================= */
window.goGames = ()=>{
window.location.href = 'games.html';
};

/* ================= OPTIONAL PREVIEW ALERT ================= */
const futureGames = [
'sudoku.html',
'chess.html',
'tictactoe.html',
'memory.html',
'pattern.html',
'reflex.html',
'mathbattle.html',
'iqarena.html',
'maze.html',
'2048.html',
'minesweeper.html',
'wordbattle.html'
];

console.log('🎮 Brain Arena Loaded');
console.log('Games:', futureGames);