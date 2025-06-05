// server.js




const http = require('http');
const server = http.createServer(); // tạo HTTP server
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*", // hoặc IP build của Cocos
    credentials: false
  }
});


server.listen(3000, () => {
    console.log("Server running on port at 3000");
});



const MAX_PLAYERS = 4;

io.on("connection", socket => {
    console.log("Client connected:", socket.id);


    socket.on("getListRoom", data => {
        console.log("listRoom:", io.sockets.adapter.rooms);

        let listRoomName = [];
        for (let [roomName, room] of io.sockets.adapter.rooms) {
            const roomSize = room.size;

            if (!io.sockets.sockets.has(roomName)) {
                console.log("see rooomName " + roomName);
                listRoomName.push(
                    {
                        Name: roomName,
                        sizePlayer: room.size
                    });

            }
        }
        console.log("listRoom retuen " + listRoomName.length);
        socket.emit("listRoom", { listRoom: listRoomName });
    });

    // Tạo room mới với tên room"
    socket.on("joinRoom", data => {
        console.log("joinRoom:", data.nameRoom);
        let newRoom = "" + data.nameRoom;
        const room = io.sockets.adapter.rooms.get(newRoom);
        if (!room || (room && (room.size <= MAX_PLAYERS))) {
            leaveRoom(socket);

            socket.join(newRoom);
            console.log(io.sockets.adapter.rooms);
            socket.emit("joinRoom", { room: newRoom });


            // Broadcast cho các thành viên khác trong room
            socket.to(newRoom).emit("playerJoined", {
                id: socket.id
            });
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
        findRoom(socket , data.nameRoom)

    });

    socket.on("updatePlayerInRoom", data => {
        updatePlayerInRoom(socket);
        console.log("updatePlayerInRoom:", data);
        let room = getRoom(socket);
        let listPlayers = [];
        if (room) {

            listPlayers = getNameAllPlayerInRoom(room);

        }

        updatePlayerInRoom(socket);
        //socket.emit("updatePlayerInRoom", { listPlayers: listPlayers });
    });

    socket.on("chatMessage", (data) => {
        const { message } = data;
    
        let room = getRoom(socket);
        socket.to(room).emit("chatMessage", { //wabc
            from: socket?.data?.name || socket.id,
            message: message
        });
    
        console.log(`💬 Chat từ ${name}: ${message} (room: ${room})`);
    });


});



function setName(socket, name) {
    socket.data.name = name;
}
function findRoom(socket, name){
        
        console.log("listRoom:", io.sockets.adapter.rooms);

        let listRoomName = [];
        for (let [roomName, room] of io.sockets.adapter.rooms) {
            const roomSize = room.size;

            if (!io.sockets.sockets.has(roomName) && roomName.includes(name)) {
                console.log("see rooomName " + roomName);
                listRoomName.push(
                    {
                        Name: roomName,
                        sizePlayer: room.size
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


            updatePlayerInRoom();
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

    }

    socket.to(room).emit("updatePlayerInRoom", {
        listPlayers: listPlayers
    });

}

