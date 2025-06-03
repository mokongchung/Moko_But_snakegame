// server.js

console.log(" start sever ");
const { Server } = require('socket.io');
const http = require('http');
/*

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});
*/

const io = require("socket.io")(3000, {
    cors: {
        origin: "*"
    }
});

const MAX_PLAYERS = 4;

io.on("connection", socket => {
    console.log("Client connected:", socket.id);


    socket.on("getListRoom", data => {
        console.log("listRoom:", io.sockets.adapter.rooms);
       
        let listRoomName = [];
        for (let [roomName, room] of io.sockets.adapter.rooms) { // duyet qua danh sach tat ca cac phong
            const roomSize = room.size;
            // Kiểm tra nếu room không phải là socket ID riêng lẻ (tức là không phải room riêng của socket)
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
    socket.on("jointRoom", data => {
        console.log("jointRoom:", data.nameRoom);
        let newRoom = "" + data.nameRoom;
        leaveRoom(socket);
        socket.join(newRoom);
        console.log(io.sockets.adapter.rooms);
        socket.emit("jointRoom", { room: newRoom });

        
        // Broadcast cho các thành viên khác trong room
        socket.to(newRoom).emit("playerJoined", {
            id: socket.id
        });
        
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


});


function findRoomByName(roomName){
    
    const room = io.sockets.adapter.rooms.get(roomName);
    if (room) {
        console.log(`Room ${roomName} có ${room.size} socket.`);
        console.log(Array.from(room)); // Danh sách socket ID
        return room;
    }

}
function setName(socket, name){
    socket.data.name = name;
}
function leaveRoom(socket){
    for (const room of socket.rooms) {
        if (room !== socket.id) {
            console.log(`Leaving room: ${room}`);
            socket.leave(room);

            
            socket.to(room).emit("playerLeft", {
                id: socket.id,
                room
            });
        }
    }
}

