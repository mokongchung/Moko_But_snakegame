const firebase = require('firebase');
const http = require('http');
const server = http.createServer(); // tạo HTTP server
const { Server } = require("socket.io");
const { getUpdatedVelocity, initGame, gameLoop } = require('./game');
const { mapInfo, FRAME_RATE } = require('./constants');
const io = new Server(server, {
    cors: {
        origin: "*", // hoặc IP build của Cocos
        credentials: false
    }
});


//firebaes ================================================

const firebaseConfig = {
    apiKey: "AIzaSyCoMOOf0EO4g-4pAob35LX5teuS-7Xtj8I",
    authDomain: "snakecocos.firebaseapp.com",
    databaseURL: "https://snakecocos-default-rtdb.firebaseio.com/",
    projectId: "snakecocos",
    storageBucket: "snakecocos.firebasestorage.app",
    messagingSenderId: "711157853594",
    appId: "1:711157853594:web:bbaaef2d2d9817b8a21e23"
};
firebase.initializeApp(firebaseConfig);


const db = firebase.database();
db.ref(".info/connected").on("value", (snap) => {
    if (snap.val() === true) {
        console.log("✅ Firebase đã kết nối!");
    } else {
        console.log("⚠️ Firebase chưa kết nối hoặc mất kết nối.");
    }
});

//firebase ====================================================
server.listen(3000, () => {
    console.log("Server running on port at 3000");
});


const rooms = {};

let MAX_PLAYERS = 4;

io.on("connection", socket => {
    console.log("Client connected:", socket.id);


    socket.on("getListRoom", data => {
        console.log("listRoom:", io.sockets.adapter.rooms);

        let listRoomName = [];
        for (let [roomName, room] of io.sockets.adapter.rooms) {
            const roomSize = room.size;

            if (!io.sockets.sockets.has(roomName)) {
                console.log("see rooomName " + roomName);
                listRoomName.push({
                    Name: roomName,
                    sizePlayer: room.size,
                    roomSize: rooms[roomName].roomSize,
                });

            }
        }
        console.log("listRoom retuen " + listRoomName.length);
        socket.emit("listRoom", { listRoom: listRoomName });
    });

    // Tạo room mới với tên room"
    // socket.on("joinRoom", data => {
    //     console.log("joinRoom:", data.nameRoom);
    //     let newRoom = "" + data.nameRoom;
    //     const room = io.sockets.adapter.rooms.get(newRoom);
    //     if (!room || (room && (room.size <= MAX_PLAYERS))) {
    //         leaveRoom(socket);

    //         socket.join(newRoom);
    //         console.log(io.sockets.adapter.rooms);
    //         socket.emit("joinRoom", { room: newRoom, playerSize: room ? room.size : 1 });


    //         // Broadcast cho các thành viên khác trong room
    //         updatePlayerInRoom(socket);
    //     }

    // });
    socket.on('keydown', (keyCode) => {
        const joinedRoom = socket.data.joinedRoom;
        const playerIndex = socket.data.playerIndex;

        if (!joinedRoom || typeof playerIndex !== 'number') {
            console.warn('⚠️ Socket chưa được gán room hoặc index');
            return;
        }

        handleKeydown(keyCode, rooms[joinedRoom].state, playerIndex);
    });

    socket.on("joinRoom", data => {
        console.log("joinRoom:", data.nameRoom);
        let newRoom = "" + data.nameRoom;
        const room = io.sockets.adapter.rooms.get(newRoom);

        if (!room || (room && (room.size <= rooms[newRoom].roomSize))) {
            leaveRoom(socket);

            socket.join(newRoom);

            // GÁN joinedRoom và playerIndex sau khi đã join
            socket.data.joinedRoom = newRoom;
            socket.data.playerIndex = io.sockets.adapter.rooms.get(newRoom).size - 1;


            // Tạo entry trong rooms nếu chưa có
            if (!rooms[newRoom]) {
                rooms[newRoom] = {
                    players: [],
                    state: null, // chưa init game
                    intervalId: null,
                    roomSize: data.roomSize,
                };
                console.log("list rooms data" + rooms[newRoom].roomSize);
            }

            socket.emit("joinRoom", { room: newRoom, playerSize: room ? room.size : 1, roomSize: rooms[newRoom].roomSize ?? 4 });

            // Broadcast cho các thành viên khác trong room
            updatePlayerInRoom(socket);
        }
    });


    socket.on("message", data => {
        console.log("Received:", data);
        socket.emit("message", { msg: "Reply from server" });
    });


    socket.on("setName", data => {
        console.log("setName event:", data);
        setName(socket, data.name)
    });
    socket.on("leaveRoom", data => {
        leaveRoom(socket)

    });
    socket.on("findRoom", data => {
        findRoom(socket, data.nameRoom)

    });

    socket.on("updatePlayerInRoom", data => {

        updatePlayerInRoom(socket);

    });

    socket.on("chatMessage", (data) => {
        const { message } = data;

        let room = getRoom(socket);
        socket.to(room).emit("chatMessage", { //wabc
            from: socket?.data?.name || socket.id,
            message: message
        });
    });

    socket.on("startGame", (data) => {

        //  io.to(roomName).emit('startGame', { data: selectedMap });

        startRoomGame(socket, data)

        console.log(`Start game`);

    });


});

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


function setName(socket, name) {
    socket.data.name = name;
}
function findRoom(socket, name) {

    console.log("listRoom:", io.sockets.adapter.rooms);

    let listRoomName = [];
    for (let [roomName, room] of io.sockets.adapter.rooms) {
        const roomSize = room.size;

        if (!io.sockets.sockets.has(roomName) && roomName.includes(name)) {
            console.log("see rooomName " + roomName);
            listRoomName.push(
                {
                    Name: roomName,
                    sizePlayer: room.size,
                    roomSize: rooms[room].roomSize,
                });

        }
    }
    console.log("listRoom retuen " + listRoomName.length);
    socket.emit("listRoom", { listRoom: listRoomName });


}
// function leaveRoom(socket) {
//     for (const room of socket.rooms) {
//         if (room !== socket.id) {
//             console.log(`Leaving room: ${room}`);
//             socket.leave(room);


//             if (io.sockets.adapter.rooms.has(room)) {
//                 let listPlayers = [];

//                 listPlayers = getNameAllPlayerInRoom(room);
//                 io.to(room).emit("updatePlayerInRoom", {
//                     listPlayers: listPlayers
//                 });
//             }

//         }
//     }
// }

function leaveRoom(socket) {
    for (const room of socket.rooms) {
        if (room !== socket.id) {
            console.log(`Leaving room: ${room}`);
            socket.leave(room);

            // Nếu sau khi rời phòng mà không còn ai, xóa luôn room trong biến rooms
            const remaining = io.sockets.adapter.rooms.get(room);
            if (!remaining || remaining.size === 0) {
                delete rooms[room];
            } else {
                // Nếu còn người, cập nhật danh sách player
                const listPlayers = getNameAllPlayerInRoom(room);
                io.to(room).emit("updatePlayerInRoom", {
                    listPlayers: listPlayers,
                    roomSize: rooms[room].roomSize,
                });
            }
        }
    }
}

function getRoom(socket) {
    for (const room of socket.rooms) {
        if (room !== socket.id) {
            return room;
        }
    }
    return null;
}
function getNameAllPlayerInRoom(roomName) {
    const room = io.sockets.adapter.rooms.get(roomName);
    const listPlayers = Array.from(room).map(id => {
        const player = io.sockets.sockets.get(id);
        console.log(`getNameAllPlayerInRoom room: ${id}`);
        return {
            id,
            name: player?.data?.name || "unknown"
        };
    });

    return listPlayers;

}

function updatePlayerInRoom(socket) {
    console.log("updatePlayerInRoom:");
    let room = getRoom(socket);
    let listPlayers = [];
    if (room) {

        listPlayers = getNameAllPlayerInRoom(room);
        io.to(room).emit("updatePlayerInRoom", {
            listPlayers: listPlayers,
            roomSize: rooms[room].roomSize,
        });
    }



}

function startRoomGame(socket, selectedMap) {
    let roomName = getRoom(socket);
    if (roomName) {
        const numPlayers = io.sockets.adapter.rooms.get(roomName).size;

        // Tạo state và khởi tạo nếu chưa có
        if (!rooms[roomName]) {
            rooms[roomName] = {};
        }
        console.log("Sever nhận dc thong tin Map là " + selectedMap)
        rooms[roomName].state = initGame(numPlayers, selectedMap); // Chỉ gọi initGame 1 lần với số người chơi

        io.to(roomName).emit('startGameCall', { data: selectedMap });

        startGameInterval(roomName);
        startCountdown(roomName);
    } else {
        console.warn("⚠️ startRoomGame: No valid room found for socket", socket.id);
    }
}

////======GamePlay=======


function startGameInterval(roomId) {
    const intervalId = setInterval(() => {
        const gameState = rooms[roomId].state;
        const winner = gameLoop(gameState);

        if (!winner) {
            console.log("Game Goingon");
            emitGameState(roomId, gameState);
        } else {
            clearInterval(intervalId);
            //  console.log("BUG GAME OVER");
            io.to(roomId).emit('gameOver', winner);
        }
    }, 1000 / FRAME_RATE);
}

function startCountdown(roomId) {
    let timeLeft = 60; // giây

    const countdownInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            io.to(roomId).emit('countdownFinished');
            console.log(`⏰ Countdown finished in room: ${roomId}`);
        } else {
            io.to(roomId).emit('countdown', { timeLeft }); // Gửi đến client
            console.log(`⏳ Room ${roomId} - Time left: ${timeLeft}s`);
            timeLeft--;
        }
    }, 1000);
}

function emitGameState(roomId, gameState) {
    io.to(roomId).emit('gameState', JSON.stringify(gameState));
}

