// dependencias e inicializaçao do scoket
const socket = io();
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const roomInput = document.getElementById('roomInput');
const btnJoin = document.getElementById('btnJoin');
const btnReset = document.getElementById('btnReset');
const roomNameEl = document.getElementById('roomName');

let currentRoom = null;      // ← declara aqui
let boardState = Array(9).fill(null);
let currentPlayer = 'X';
let gameOver = false;

// ─── Entrar na sala ───
btnJoin.addEventListener('click', () => {
  const id = roomInput.value.trim();
  if (!id) return alert('Informe um nome de sala');

  // se já estava em outra sala, sai dela
  if (currentRoom) {
    socket.emit('leaveRoom', currentRoom);
  }

  currentRoom = id;
  socket.emit('joinRoom', currentRoom);

  // mostra na tela a sala e limpa o input
  roomNameEl.innerText = `Sala: ${currentRoom}`;
  roomInput.value = '';
  roomInput.disabled = true;
  btnJoin.disabled = true;
});

// ─── Reiniciar o jogo ───
btnReset.addEventListener('click', () => {
  if (currentRoom) {
    socket.emit('resetGame', currentRoom);
    roomInput.disabled = true;
    btnJoin.disabled = true;
  }
});

// ─── Atualização vinda do servidor ───
socket.on('stateUpdate', state => {
  boardState = state.boardState;
  currentPlayer = state.currentPlayer;
  gameOver = state.gameOver;

  const { win, combo, winner } = checkWin(boardState);
  render(combo);

  if (win) {
    statusEl.innerText = `🎉 Jogador ${winner} venceu!`;
    roomInput.disabled = false;
    btnJoin.disabled = false;
  } else if (gameOver) {
    statusEl.innerText = '🤝 Empate!';
    roomInput.disabled = false;
    btnJoin.disabled = false;
  } else {
    statusEl.innerText = `Vez de: ${currentPlayer}`;
  }
});

// ─── Funções auxiliares ───
function render(combo = []) {
  debugger;
  boardEl.innerHTML = '';
  boardState.forEach((val, idx) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    if (combo.includes(idx)) cell.classList.add('winner');
    cell.innerText = val || '';
    cell.addEventListener('click', () => makeMove(idx));
    boardEl.appendChild(cell);
  });
}

//envia a jogada ao servidor
function makeMove(idx) {
    if (gameOver || boardState[idx] !== null) return;
    socket.emit('makeMove', { roomId: currentRoom, index: idx });
}

//verifica a vitória
function checkWin(board) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let c of combos) {
    const [a,b,c2] = c;
    if (board[a] && board[a] === board[b] && board[b] === board[c2]) {
      return { win: true, combo: c, winner: board[a] };
    }
  }
  return { win: false, combo: [], winner: null };
}

// inicializa mensagem
statusEl.innerText = 'Entre em uma sala para começar';
