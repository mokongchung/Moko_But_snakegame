cc.Class({
    extends: cc.Component,

    properties: {
        HolderNode: cc.Node,
    },

    onLoad() {
        this.gridNodes = this.HolderNode.children;
        //  console.log("Number Child" + this.HolderNode.children.length)
        this.gridSize = 10;
        // cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        if (!cc.sys.isNative) {
            this.socket = window.io('http://localhost:3000', {
                withCredentials: false
            });
            this.socket.on('connect', () => {
                console.log("✅ Socket.IO (Web) đã kết nối");
                // Đăng ký sự kiện gameState ở đây, bind đúng context
                this.socket.on('gameState', this.handleGameState.bind(this));
            });
            this.socket.on('reply', (msg) => {
                console.log("📩 Tin nhắn từ server:", msg);
            });
        } else {
            this.socket = SocketIO.connect('http://localhost:3000', {});
            this.socket.on('reply', (msg) => {
                console.log("📩 Native socket nhận:", msg);
            });
            this.socket.on('gameState', this.handleGameState.bind(this));
        }

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    },

    onKeyDown(event) {
        this.socket.emit('keydown', event.keyCode);
        if (event.keyCode === cc.macro.KEY.enter && this.socket) {
            console.log("⬆️ Gửi tin nhắn: " + event.keyCode);
            this.socket.emit('chat', "'xin chào server'" + event.keyCode);
        }
    },

    paintGame(state) {
        // Reset màu trắng
        for (let node of this.gridNodes) {
            node.color = cc.Color.WHITE;
        }

        // Vẽ thức ăn
        const food = state.food;
        let foodNode = this.getNodeAt(food.y, food.x);
        if (foodNode) foodNode.color = cc.Color.ORANGE;

        const foods = state.foods;
        if (foods && foods.length > 0)
            for (let foodPart of foods) {
                let foodsNode = this.getNodeAt(foodPart.y, foodPart.x);
                if (foodsNode) foodsNode.color = cc.Color.MAGENTA;
            }





        // Vẽ rắn của từng player
        const colors = [cc.Color.RED, cc.Color.BLUE, cc.Color.GREEN, cc.Color.YELLOW];

        for (let i = 0; i < state.players.length; i++) {
            const player = state.players[i];
            const color = colors[i % colors.length]; // đề phòng có hơn 4 người chơi
            this.paintPlayer(player, color);
        }

    },


    handleGameState(gameState) {
        gameState = JSON.parse(gameState);
        console.log('GameState nhận được:', gameState);
        this.paintGame(gameState);
    },

    paintPlayer(playerState, color) {
        for (let cell of playerState.snake) {
            let node = this.getNodeAt(cell.y, cell.x);
            if (node) {
                node.color = color;
            }
        }
    },


    getNodeAt(row, col) {
        return this.gridNodes[row * this.gridSize + col];
    },

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        if (this.socket && this.socket.disconnect) {
            this.socket.disconnect();
        }
    }
});
