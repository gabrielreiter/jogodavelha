const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

let rooms = {}; // mantém estado de cada sala

io.on('connection', socket => {
  // registra a sala atual deste socket
  socket.currentRoom = null;

  socket.on('joinRoom', newRoomId => {
    // se já estava em outra sala, sai dela
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
      console.log(`[leave] ${socket.id} saiu de ${socket.currentRoom}`);
    }

    // entra na nova
    socket.join(newRoomId);
    socket.currentRoom = newRoomId;
    console.log(`[join] ${socket.id} entrou em ${newRoomId}`);

    // inicializa estado se necessário
    if (!rooms[newRoomId]) {
      rooms[newRoomId] = {
        boardState: Array(9).fill(null),
        currentPlayer: 'X',
        gameOver: false,
        winner: null
      };
    }

    // envia o estado só naquela sala
    socket.emit('stateUpdate', rooms[newRoomId]);
  });

  socket.on('makeMove', ({ index }) => {
    const roomId = socket.currentRoom;
    const room = rooms[roomId];
    if (!room || room.gameOver) return;

    if (room.boardState[index] === null) {
      room.boardState[index] = room.currentPlayer;

      // checa vitória
      const win = checkWin(room.boardState);
      if (win) {
        room.gameOver = true;
        room.winner = room.currentPlayer;
      } else if (!room.boardState.includes(null)) {
        room.gameOver = true;
        room.winner = null; // empate
      } else {
        room.currentPlayer = room.currentPlayer === 'X' ? 'O' : 'X';
      }

      // broadcast apenas nessa sala
      io.to(roomId).emit('stateUpdate', room);
    }
  });

  socket.on('resetGame', () => {
    const roomId = socket.currentRoom;
    if (!rooms[roomId]) return;

    rooms[roomId] = {
      boardState: Array(9).fill(null),
      currentPlayer: 'X',
      gameOver: false,
      winner: null
    };

    io.to(roomId).emit('stateUpdate', rooms[roomId]);
  });
});

function checkWin(board) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return combos.some(c => {
    return board[c[0]] &&
           board[c[0]] === board[c[1]] &&
           board[c[1]] === board[c[2]];
  });
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
