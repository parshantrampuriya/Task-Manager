const board = document.getElementById('board');
const timerEl = document.getElementById('timer');
const mistakesEl = document.getElementById('mistakes');
const difficultyText = document.getElementById('difficultyText');
const difficultySelect = document.getElementById('difficultySelect');

let selectedCell = null;
let selectedNumber = null;

let timer = 0;
let timerInterval;

let mistakes = 0;

let currentPuzzle = [];
let currentSolution = [];

const puzzles = {

 easy:{

 puzzle:[
 [5,3,0,0,7,0,0,0,0],
 [6,0,0,1,9,5,0,0,0],
 [0,9,8,0,0,0,0,6,0],
 [8,0,0,0,6,0,0,0,3],
 [4,0,0,8,0,3,0,0,1],
 [7,0,0,0,2,0,0,0,6],
 [0,6,0,0,0,0,2,8,0],
 [0,0,0,4,1,9,0,0,5],
 [0,0,0,0,8,0,0,7,9]
 ],

 solution:[
 [5,3,4,6,7,8,9,1,2],
 [6,7,2,1,9,5,3,4,8],
 [1,9,8,3,4,2,5,6,7],
 [8,5,9,7,6,1,4,2,3],
 [4,2,6,8,5,3,7,9,1],
 [7,1,3,9,2,4,8,5,6],
 [9,6,1,5,3,7,2,8,4],
 [2,8,7,4,1,9,6,3,5],
 [3,4,5,2,8,6,1,7,9]
 ]

 },

 medium:{
 puzzle:[
 [0,0,0,2,6,0,7,0,1],
 [6,8,0,0,7,0,0,9,0],
 [1,9,0,0,0,4,5,0,0],
 [8,2,0,1,0,0,0,4,0],
 [0,0,4,6,0,2,9,0,0],
 [0,5,0,0,0,3,0,2,8],
 [0,0,9,3,0,0,0,7,4],
 [0,4,0,0,5,0,0,3,6],
 [7,0,3,0,1,8,0,0,0]
 ],
 solution:[
 [4,3,5,2,6,9,7,8,1],
 [6,8,2,5,7,1,4,9,3],
 [1,9,7,8,3,4,5,6,2],
 [8,2,6,1,9,5,3,4,7],
 [3,7,4,6,8,2,9,1,5],
 [9,5,1,7,4,3,6,2,8],
 [5,1,9,3,2,6,8,7,4],
 [2,4,8,9,5,7,1,3,6],
 [7,6,3,4,1,8,2,5,9]
 ]
 },

 hard:{
 puzzle:[
 [0,0,0,0,0,0,0,1,2],
 [0,0,0,0,3,5,0,0,0],
 [0,0,1,0,0,0,0,0,0],
 [0,0,0,5,0,0,4,0,7],
 [0,0,2,0,0,0,9,0,0],
 [6,0,7,0,0,9,0,0,0],
 [0,0,0,0,0,0,8,0,0],
 [0,0,0,7,6,0,0,0,0],
 [8,6,0,0,0,0,0,0,0]
 ],
 solution:[
 [3,5,6,9,7,8,1,4,2],
 [2,4,8,1,3,5,7,9,6],
 [7,9,1,6,2,4,3,5,8],
 [9,8,3,5,1,6,4,2,7],
 [5,1,2,4,8,7,9,6,3],
 [6,7,4,2,9,3,5,8,1],
 [1,2,9,3,5,0,8,7,4],
 [4,3,5,7,6,1,2,0,9],
 [8,6,7,0,4,2,0,1,5]
 ]
 }

};

function createBoard(){

board.innerHTML = '';

for(let row=0; row<9; row++){

 for(let col=0; col<9; col++){

  const cell = document.createElement('div');

  cell.classList.add('cell');

  if(row===2 || row===5){
  cell.classList.add('row-end');
  }

  const value = currentPuzzle[row][col];

  if(value !== 0){

   cell.innerText = value;
   cell.classList.add('fixed');

  }

  cell.dataset.row = row;
  cell.dataset.col = col;

  cell.addEventListener('click',()=>{

   if(cell.classList.contains('fixed')) return;

   document
   .querySelectorAll('.cell')
   .forEach(c=>{
   c.classList.remove('selected');
   });

   selectedCell = cell;

   cell.classList.add('selected');

  });

  board.appendChild(cell);

 }

}

}

window.selectNumber = (num)=>{

selectedNumber = num;

if(!selectedCell) return;

const row = parseInt(selectedCell.dataset.row);
const col = parseInt(selectedCell.dataset.col);

if(num === 0){

 selectedCell.innerText = '';
 currentPuzzle[row][col] = 0;
 return;

}

if(currentSolution[row][col] === num){

 selectedCell.innerText = num;
 currentPuzzle[row][col] = num;
 selectedCell.classList.remove('error');

 checkWin();

}else{

 mistakes++;

 mistakesEl.innerText = `${mistakes} / 3`;

 selectedCell.classList.add('error');

 setTimeout(()=>{
 selectedCell.classList.remove('error');
 },500);

 if(mistakes >= 3){

  alert('💀 Game Over');
  solveGame();

 }

}

};

window.startGame = ()=>{

const level = difficultySelect.value;

const data = puzzles[level];

currentPuzzle = JSON.parse(JSON.stringify(data.puzzle));
currentSolution = JSON.parse(JSON.stringify(data.solution));

mistakes = 0;
mistakesEl.innerText = '0 / 3';

difficultyText.innerText =
level.charAt(0).toUpperCase() + level.slice(1);

createBoard();
startTimer();

};

function startTimer(){

clearInterval(timerInterval);

timer = 0;

updateTimer();

timerInterval = setInterval(()=>{

 timer++;
 updateTimer();

},1000);

}

function updateTimer(){

const mins = String(Math.floor(timer/60)).padStart(2,'0');
const secs = String(timer%60).padStart(2,'0');

timerEl.innerText = `${mins}:${secs}`;

}

window.checkBoard = ()=>{

let correct = true;

for(let row=0; row<9; row++){

 for(let col=0; col<9; col++){

  if(currentPuzzle[row][col] !== currentSolution[row][col]){

   correct = false;

  }

 }

}

if(correct){

 alert('🏆 Perfect Sudoku Completed!');

}else{

 alert('❌ Some answers are wrong');

}

};

function checkWin(){

for(let row=0; row<9; row++){

 for(let col=0; col<9; col++){

  if(currentPuzzle[row][col] !== currentSolution[row][col]){

   return;

  }

 }

}

clearInterval(timerInterval);

setTimeout(()=>{

alert('🎉 You Solved The Sudoku!');

},300);

}

window.solveGame = ()=>{

currentPuzzle = JSON.parse(JSON.stringify(currentSolution));

createBoard();

clearInterval(timerInterval);

};

window.goBack = ()=>{

window.location.href = 'games.html';

};

startGame();