const io = require('socket.io-client');

cc.Class({
    extends: cc.Component,

    properties: {
        nameInput: cc.EditBox,
        roomNameInput: cc.EditBox,
        lblListRoom: cc.Label,

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.socket = this.connectToSever();
        // Sự kiện kết nối thành công
        this.socket.on("connect", () => {
            console.log("Connected to server: ", this.socket.id);
        });
        // 🔌 Mất kết nối
        this.socket.on("disconnect", (reason) => {
            console.warn("❌ Disconnected from server:", reason);

            if (reason === "io server disconnect") {
                // Server gọi socket.disconnect() — cần reconnect thủ công
                this.socket.connect();
            }
        });

        // 🔌 Không kết nối được
        this.socket.on("connect_error", (err) => {
            console.error("⚠️ Connection error:", err.message);
        });

        // Khi đang thử kết nối lại
        this.socket.on("reconnect_attempt", (attemptNumber) => {
            console.log("🔁 Reconnect attempt:", attemptNumber);
        });

        // Nhận tin nhắn từ server
        this.socket.on("message", (data) => {
            console.log("Received message:", data);
        });

        this.socket.on("listRoom", (data) => {
            console.log("listRoom message:", data.listRoom);
            this.showListRoom(data.listRoom);
        });

        this.socket.on("joinRoom", (data) => {
            console.log("Joinroom message:", data.room);
            this.showRoom(data.room);
        });


    },

    start() {

    },
    setNamePlayer() {
        this.socket.emit("setName", { name: this.nameInput.string });
    },

    connectToSever() {
        this._socket = io("http://localhost:3000",
            {
                transports: ['websocket'],
                reconnection: true,
                forceNew: false,

                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                randomizationFactor: 0,
                rememberUpgrade: true,
                timestampRequests: true
            });
        return this._socket;
       // return window.io("http://localhost:3000");
    },
    getListRoom() {
        this.socket.emit("getListRoom", { msg: "get List room" });
    },
    joinRoom() {

        this.socket.emit("joinRoom", { nameRoom: this.roomNameInput.string });
    },
    leaveRoom() {
        this.socket.emit("leaveRoom", { msg: "Leave room" });
    },

    showListRoom(listRoom) {
        if (listRoom.length == 0) {
            this.lblListRoom.string = "Không có room nào cả";
            return;
        }
        let result = "";

        for (let room of listRoom) {
            result += `Room: ${room.Name} - Players: ${room.sizePlayer}\n`;
        }

        this.lblListRoom.string = result;
    },
    showRoom(room) {

    }

    // update (dt) {},
});
