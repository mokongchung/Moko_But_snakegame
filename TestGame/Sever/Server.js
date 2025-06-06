const { FRAME_RATE } = require('./constants');

const http = require('http');
const socketio = require('socket.io');
const { getUpdatedVelocity, initGame, gameLoop } = require('./game');
const rooms = {}; // key: roomId, value: { players: [socket1, socket2], state: gameState }


const server = http.createServer((req, res) => {
  res.end('✅ Socket.IO server đang chạy');
});

let gameState = {};

const io = socketio(server, {
  cors: {
    origin: "*",  // Cho phép mọi nguồn (có thể giới hạn lại nếu cần)
    methods: ["GET", "POST"]
  }
});

// io.on('connection', (socket) => {
//   console.log('🟢 Client đã kết nối');

//   socket.on('keydown', handleKeydown);

//   socket.on('chat', (msg) => {
//     console.log("💬 Client gửi:", msg);

//     // Gửi phản hồi lại client
//     socket.emit('reply', 'Server đã nhận: ' + msg);

//       gameState = initGame();
//       startGameInterval(socket);
//       //emitGameState(socket, gameState);
    
//     //  const Win = gameLoop(gameState);
//   });
//   // if (!gameState.players) {
//   //   console.warn('⚠️ Tự động khởi tạo game vì chưa có state');
//   //   gameState = initGame();
//   // }


//   socket.on('disconnect', () => {
//     console.log('🔴 Client đã ngắt kết nối');
//   });
// });
io.on('connection', (socket) => {
  console.log('🟢 Client đã kết nối');

  let joinedRoom = null;

  for (const roomId in rooms) {
    if (rooms[roomId].players.length < 2) {
      joinedRoom = roomId;
      break;
    }
  }

  if (!joinedRoom) {
    joinedRoom = socket.id;
    rooms[joinedRoom] = {
      players: [],
      state: null, // chưa init game
      intervalId: null,
    };
  }

  socket.join(joinedRoom);
  rooms[joinedRoom].players.push(socket);

  const playerIndex = rooms[joinedRoom].players.length - 1;
  socket.emit('playerNumber', playerIndex);

  // Khi đủ 2 người, khởi tạo game state và bắt đầu game loop
  if (rooms[joinedRoom].players.length === 2) {
    rooms[joinedRoom].state = initGame(2);
    startGameInterval(joinedRoom);
  }

  socket.on('keydown', (keyCode) => {
    handleKeydown(keyCode, rooms[joinedRoom].state, playerIndex);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client đã ngắt kết nối');

    // Dừng game loop nếu đang chạy
    if (rooms[joinedRoom].intervalId) {
      clearInterval(rooms[joinedRoom].intervalId);
    }

    // Xoá phòng
    delete rooms[joinedRoom];

    // Báo cho client còn lại trong phòng
    io.to(joinedRoom).emit('playerDisconnected');
  });
});



// function startGameInterval(socket) {
//   const intervalId = setInterval(() => {
//     const winner = gameLoop(gameState);
    
//     if (!winner) {
//       emitGameState(socket, gameState)
//     } else {

//       clearInterval(intervalId);
//     }
//   }, 1000 / FRAME_RATE);
// }

// function handleKeydown(keyCode) {

//   if (!gameState.players) {
//     console.warn('⚠️ Tự động khởi tạo game vì chưa có state');
//     gameState = initGame();
//   }

//   try {
//     keyCode = parseInt(keyCode);
//   } catch (e) {
//     console.error(e);
//     return;
//   }

//   const vel = getUpdatedVelocity(keyCode, gameState.players[0].vel);

//   if (vel) {
//     gameState.players[0].vel = vel;
//   }


// }

function startGameInterval(roomId) {
  const intervalId = setInterval(() => {
    const gameState = rooms[roomId].state;
    const winner = gameLoop(gameState);

    if (!winner) {
      emitGameState(roomId, gameState);
    } else {
      clearInterval(intervalId);
      io.to(roomId).emit('gameOver', winner);
    }
  }, 1000 / FRAME_RATE);
}


function handleKeydown(keyCode, gameState, playerIndex) {
  if (!gameState || !Array.isArray(gameState.players)) {
    console.warn('⚠️ GameState không hợp lệ hoặc chưa có players');
    return;
  }

  if (playerIndex < 0 || playerIndex >= gameState.players.length) {
    console.warn(`⚠️ playerIndex ${playerIndex} không hợp lệ`);
    return;
  }

  const player = gameState.players[playerIndex];
  if (player.hasMoved) return; // đã nhập hướng trong frame này

  try {
    keyCode = parseInt(keyCode);
    if (isNaN(keyCode)) throw new Error('keyCode không phải số');
  } catch (e) {
    console.error('❌ Lỗi keyCode:', e.message);
    return;
  }

  const newVel = getUpdatedVelocity(keyCode, player.vel);

  if (newVel) {
    player.vel = newVel;
    player.hasMoved = true;
  } else {
    console.warn(`⛔ Không thể cập nhật hướng di chuyển cho player ${playerIndex}`);
  }
}



// Chạy server ở cổng 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});

// function emitGameState(socket, gameState) {
//   // Send this event to everyone in the room.
//   socket
//     .emit('gameState', JSON.stringify(gameState));
// }

function emitGameState(roomId, gameState) {
  io.to(roomId).emit('gameState', JSON.stringify(gameState));
}

