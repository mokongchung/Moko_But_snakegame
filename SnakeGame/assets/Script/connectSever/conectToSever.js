const io = require('socket.io-client');

let connectToSever = cc.Class({
    extends: cc.Component,
    statics: {
        _instance: null,

        getInstance() {
            if (!this._instance) {
                console.warn("⚠️ connectToServer chưa được tạo");
            }
            return this._instance;
        }
    },
    properties: {

    },



    onLoad() {
        console.log("on load conncec server")
        if (connectToSever._instance) {
            // Nếu đã có instance rồi, tự hủy node này để tránh duplicate
            this.node.destroy();
            return;
        }
        connectToSever._instance = this;

        // Giữ node này tồn tại xuyên scene
        cc.game.addPersistRootNode(this.node)

        //connect to sever
        this.socket = this.connect();
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
    },

    start() {

    },
    getSocket(){
        return this.socket;
    },
    connect() {
        
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


    // update (dt) {},
});

module.exports = connectToSever;