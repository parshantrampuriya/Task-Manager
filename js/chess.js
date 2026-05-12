const board = document.getElementById('board');
const turnText = document.getElementById('turnText');
const statusText = document.getElementById('statusText');

let currentPlayer = 'white';
let selectedCell = null;
let selectedPiece = null;
let moveHistory = [];

const pieces = {

'r':'♜',
'n':'♞',
'b':'♝',
'q':'♛',
'k':'♚',
'p':'♟',
'R':'♖',
'N':'♘',
'B':'♗',
'Q':'♕',
'K':'♔',
'P':'♙'

};

let gameBoard = [
['r','n','b','q','k','b','n','r'],
['p','p','p','p','p','p','p','p'],
['','','','','','','',''],
['','','','','','','',''],
['','','','','','','',''],
['','','','','','','',''],
['P','P','P','P','P','P','P','P'],
['R','N','B','Q','K','B','N','R']
];

function createBoard(){

board.innerHTML = '';

for(let row=0; row<8; row++){

 for(let col=0; col<8; col++){

  const cell = document.createElement('div');

  cell.classList.add('cell');

  if((row+col)%2===0){
  cell.classList.add('white');
  }else{
  cell.classList.add('black');
  }

  cell.dataset.row = row;
  cell.dataset.col = col;

  const piece = gameBoard[row][col];

  if(piece){
  cell.innerHTML = pieces[piece];
  }

  cell.addEventListener('click',()=>{
  handleClick(cell,row,col);
  });

  board.appendChild(cell);

 }

}

}

function handleClick(cell,row,col){

const piece = gameBoard[row][col];

clearHighlights();

if(selectedCell){

 movePiece(row,col);
 return;

}

if(!piece) return;

if(currentPlayer==='white' && piece===piece.toLowerCase()) return;
if(currentPlayer==='black' && piece===piece.toUpperCase()) return;

selectedCell = cell;
selectedPiece = {row,col,piece};

cell.classList.add('selected');

showPossibleMoves(piece,row,col);

}

function showPossibleMoves(piece,row,col){

const directions = [
[-1,0],
[1,0],
[0,-1],
[0,1],
[-1,-1],
[-1,1],
[1,-1],
[1,1]
];

const cells = document.querySelectorAll('.cell');

if(piece.toLowerCase()==='p'){

 let dir = piece==='P' ? -1 : 1;

 let newRow = row + dir;

 if(newRow>=0 && newRow<8){

  let index = newRow*8+col;

  cells[index].classList.add('move');

 }

 return;

}

for(let d of directions){

 let r = row + d[0];
 let c = col + d[1];

 if(r>=0 && r<8 && c>=0 && c<8){

  let index = r*8+c;

  if(gameBoard[r][c]){
  cells[index].classList.add('capture');
  }else{
  cells[index].classList.add('move');
  }

 }

}

}

function movePiece(newRow,newCol){

if(!selectedPiece){
return;
}

const oldRow = selectedPiece.row;
const oldCol = selectedPiece.col;

moveHistory.push(
JSON.parse(JSON.stringify(gameBoard))
);

gameBoard[newRow][newCol] = selectedPiece.piece;
gameBoard[oldRow][oldCol] = '';

selectedCell = null;
selectedPiece = null;

currentPlayer =
currentPlayer==='white'
? 'black'
: 'white';

turnText.innerText =
currentPlayer.charAt(0).toUpperCase()
+ currentPlayer.slice(1);

createBoard();
checkKings();

}

function clearHighlights(){

document
.querySelectorAll('.cell')
.forEach(c=>{

 c.classList.remove('selected');
 c.classList.remove('move');
 c.classList.remove('capture');

});

}

function checkKings(){

let whiteKing = false;
let blackKing = false;

for(let row of gameBoard){

 for(let piece of row){

  if(piece==='K') whiteKing = true;
  if(piece==='k') blackKing = true;

 }

}

if(!whiteKing){

 statusText.innerText = 'Black Wins';
 alert('♚ Black Wins');

}

if(!blackKing){

 statusText.innerText = 'White Wins';
 alert('♔ White Wins');

}

}

window.resetGame = ()=>{

currentPlayer = 'white';

turnText.innerText = 'White';
statusText.innerText = 'Playing';

moveHistory = [];

selectedCell = null;
selectedPiece = null;

gameBoard = [
['r','n','b','q','k','b','n','r'],
['p','p','p','p','p','p','p','p'],
['','','','','','','',''],
['','','','','','','',''],
['','','','','','','',''],
['','','','','','','',''],
['P','P','P','P','P','P','P','P'],
['R','N','B','Q','K','B','N','R']
];

createBoard();

};

window.undoMove = ()=>{

if(moveHistory.length===0) return;

gameBoard = moveHistory.pop();

currentPlayer =
currentPlayer==='white'
? 'black'
: 'white';

turnText.innerText =
currentPlayer.charAt(0).toUpperCase()
+ currentPlayer.slice(1);

createBoard();

};

window.goBack = ()=>{

window.location.href = 'games.html';

};

createBoard();
