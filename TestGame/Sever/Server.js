const { FRAME_RATE } = require('./constants');

const http = require('http');
const socketio = require('socket.io');
const { getUpdatedVelocity, initGame, gameLoop } = require('./game');


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

io.on('connection', (socket) => {
  console.log('🟢 Client đã kết nối');

  socket.on('keydown', handleKeydown);

  socket.on('chat', (msg) => {
    console.log("💬 Client gửi:", msg);

    // Gửi phản hồi lại client
    socket.emit('reply', 'Server đã nhận: ' + msg);

      gameState = initGame();
      startGameInterval(socket);
      //emitGameState(socket, gameState);
    
    //  const Win = gameLoop(gameState);
  });
  // if (!gameState.players) {
  //   console.warn('⚠️ Tự động khởi tạo game vì chưa có state');
  //   gameState = initGame();
  // }


  socket.on('disconnect', () => {
    console.log('🔴 Client đã ngắt kết nối');
  });
});



function startGameInterval(socket) {
  const intervalId = setInterval(() => {
    const winner = gameLoop(gameState);
    
    if (!winner) {
      emitGameState(socket, gameState)
    } else {

      clearInterval(intervalId);
    }
  }, 1000 / FRAME_RATE);
}

function handleKeydown(keyCode) {

  if (!gameState.players) {
    console.warn('⚠️ Tự động khởi tạo game vì chưa có state');
    gameState = initGame();
  }

  try {
    keyCode = parseInt(keyCode);
  } catch (e) {
    console.error(e);
    return;
  }

  const vel = getUpdatedVelocity(keyCode, gameState.players[0].vel);

  if (vel) {
    gameState.players[0].vel = vel;
  }


}

// Chạy server ở cổng 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});

function emitGameState(socket, gameState) {
  // Send this event to everyone in the room.
  socket
    .emit('gameState', JSON.stringify(gameState));
}
