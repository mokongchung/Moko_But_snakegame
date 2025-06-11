const firebase = require('firebase');
require('firebase/firestore');

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
    apiKey: "AIzaSyBRUMiOdj7aX4UNfQOcSI4PW-f8kMRzTwM",
    authDomain: "snakegamecocos.firebaseapp.com",
    projectId: "snakegamecocos",
    storageBucket: "snakegamecocos.firebasestorage.app",
    messagingSenderId: "915215386383",
    appId: "1:915215386383:web:ba499ab8f7ebe46b82607a"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

db.collection('leaderboard_database').get()
    .then(snapshot => {
        console.log('✅ Kết nối Firestore thành công.');
    })
    .catch(error => {
        console.error('❌ Lỗi kết nối Firestore:', error);
    });

//=============================firebase =======================
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
        socket.emit("listRoom", { listRoom: listRoomName, clientName: socket.data.name });
    });

    socket.on('keydown', (keyCode) => {
        const joinedRoom = socket.data.joinedRoom;
        const playerIndex = socket.data.playerIndex;

        if (!joinedRoom || typeof playerIndex !== 'number') {
            console.warn('⚠️ Socket chưa được gán room hoặc index');
            return;
        }

        handleKeydown(keyCode, rooms[joinedRoom].state, playerIndex);
    });

    socket.on("pingCheck", () => {
        socket.emit("pongCheck");
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

    socket.on("getLeaderBoard", data => {
        console.log("getLeaderBoard event:", data);
        loadLeaderboard(10, socket);
    });

    socket.on("leaveGame", () => {
        leaveGame(socket);
    }
    );
    socket.on("findRoom", data => {
        findRoom(socket, data.nameRoom)

    });
    socket.on("updateScreenShot", data => {
        console.log('updateScreenShot')

        updateScreenShot(socket, data.image);

    });


    socket.on("updatePlayerInRoom", data => {

        updatePlayerInRoom(socket);

    });

    socket.on("chatMessage", (data) => {

        let room = getRoom(socket);
        console.log("chatMessage : " + room + " " + data.message);
        socket.to(room).emit("chatMessage", {
            name: socket?.data?.name || socket.id,
            message: data.message
        });
    });

    socket.on("startGame", (data) => {

        //  io.to(roomName).emit('startGame', { data: selectedMap });

        startRoomGame(socket, data)

        console.log(`Start game`);

    });

    socket.on("mapPick", (data) => {
        const room = getRoom(socket);
        if (room) {
            io.to(room).emit("pickedMap", data);
        }
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

//============= fire base ================

function updateScreenShot(socket, image) {
    const playerIndex = socket.data.playerIndex;
    const roomId = getRoom(socket);
    if (rooms[roomId] && rooms[roomId].intervalId) {
        console.log("up leaderboar " + socket.data.name);
        console.log("up leaderboar " + rooms[roomId].state.players[playerIndex].points);
        console.log("up leaderboar " + image);

        submitScore(socket.data.name, rooms[roomId].state.players[playerIndex].points, image)

    }
}

function submitScore(playerName, score, image = "") {
    db.collection("leaderboard").add({
        name: playerName,
        score: score,
        image: image,
    })
        .then(() => {
            console.log("Score submitted!");
        })
        .catch((error) => {
            console.error("Error submitting score: ", error);
        });
}
function loadLeaderboard(limit = 10, socket) {
    db.collection("leaderboard")
        .orderBy("score", "desc")
        .limit(limit)
        .get()
        .then((querySnapshot) => {
            const results = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                results.push({
                    name: data.name,
                    score: data.score,
                    image: data.image,
                });
            });

            // TODO: Hiển thị trong UI
            console.log("Leaderboard:", results);
            socket.emit("leaderBoard", { leaderBoard: results });
            return results;
        });
    return null;
}

// === === ==== ==== firebase ==== ==== === === ===

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


function leaveRoom(socket) {
    for (const room of socket.rooms) {
        if (room !== socket.id) {
            console.log(`Leaving room: ${room}`);
            socket.leave(room);

            // Nếu sau khi rời phòng mà không còn ai, xóa luôn room trong biến rooms
            const remaining = io.sockets.adapter.rooms.get(room);
            if (!remaining || remaining.size === 0) {
                if (rooms[room]?.intervalId) {
                    clearInterval(rooms[room].intervalId);
                }
                delete rooms[room];
            } else {
                // Nếu còn người, cập nhật danh sách player
                const listPlayers = getNameAllPlayerInRoom(room);
                if (!rooms[room].state) {
                    io.to(room).emit("updatePlayerInRoom", {
                        listPlayers: listPlayers,
                        roomSize: rooms[room].roomSize,
                    });
                }
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
        let listNamePlayer = getNameAllPlayerInRoom(roomName);

        rooms[roomName].state = initGame(numPlayers, selectedMap, listNamePlayer); // Chỉ gọi initGame 1 lần với số người chơi

        io.to(roomName).emit('startGameCall', { data: selectedMap });

        startGameInterval(roomName);
        //startCountdown(roomName);
    } else {
        console.warn("⚠️ startRoomGame: No valid room found for socket", socket.id);
    }
}

////==== ==GamePlay== ====


function startGameInterval(roomId) {
    const intervalId = setInterval(() => {
        const gameState = rooms[roomId].state;
        const winner = gameLoop(gameState);

        if (!winner) {
            emitGameState(roomId, gameState);
        } else {
            clearInterval(intervalId);
            console.log("GAME OVER");
            io.to(roomId).emit('gameOver', JSON.stringify(gameState));
        }
    }, 1000 / FRAME_RATE);
    if (rooms[roomId]) {
        rooms[roomId].intervalId = intervalId;

    }

}

function leaveGame(socket) {
    const playerIndex = socket.data.playerIndex;
    const roomId = getRoom(socket);
    if (rooms[roomId] && rooms[roomId].intervalId) {
        rooms[roomId].state.players[playerIndex].isDead = true;
        rooms[roomId].state.players[playerIndex].points = 0;
        leaveRoom(socket)
    }
}

function emitGameState(roomId, gameState) {
    io.to(roomId).emit('gameState', JSON.stringify(gameState));
}

