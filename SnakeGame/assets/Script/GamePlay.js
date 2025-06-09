let connectToSever = require("conectToSever");
cc.Class({
    extends: cc.Component,

    properties: {
        Timer: cc.ProgressBar,
        Bg: cc.Sprite,
        MapList: [cc.SpriteFrame],
        GameHolder: cc.Node,
        testPrefab: cc.Prefab,

        Player1: cc.Prefab,
        Player2: cc.Prefab,
        Player3: cc.Prefab,
        Player4: cc.Prefab,
        Tail: cc.Prefab,
        Banana: cc.Prefab,


    },

    onLoad() {
        this.GridSize = 0;
        this.cellWidth = 0;
        this.cellHeight = 0;
        this.mapSize = null;
        this.headPrefabs = [this.Player1, this.Player2, this.Player3, this.Player4];
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

    },

    start() {
        this.socket = connectToSever.getInstance().getSocket();
        const savedMap = cc.sys.localStorage.getItem('MAP');

        for (let i = 0; i < this.MapList.length; i++) {
            const spriteName = this.MapList[i].name;
            console.log(`MAP NEED: "${savedMap}" | Current Map Name: "${spriteName}"`);

            if (savedMap == "Map1" || savedMap == "Map3")
                this.GridSize = 30;
            else
                this.GridSize = 31;

            if (savedMap === spriteName) {
                console.log("🎯 MATCH FOUND: Setting spriteFrame and breaking loop.");
                this.Bg.spriteFrame = this.MapList[i];
                break;
            }
        }

        // Lấy size mapHolder và tính cellWidth, cellHeight
        this.mapSize = this.GameHolder.getContentSize();
        this.cellWidth = this.mapSize.width / this.GridSize;
        this.cellHeight = this.mapSize.height / this.GridSize;

        this.spawnObstacleAt(0, 0, this.testPrefab);



        this.socket.on("countdown", (data) => {
            this.TimerCtr(data.timeLeft);
        });
        this.socket.on('gameState', this.handleGameState.bind(this));

    },

    onKeyDown(event) {
        console.log("Button Hited " + event.keyCode);
        this.socket.emit('keydown', event.keyCode);
    },

    handleGameState(gameState) {
        gameState = JSON.parse(gameState);
        console.log('GameState nhận được:', gameState);
        this.paintGame(gameState);
    },

    paintGame(state) {
        this.GameHolder.removeAllChildren();
        //Player
        for (let i = 0; i < state.players.length; i++) {
            if(!state.players[i].isDead)
            this.paintPlayer(state.players[i], i);
        }
        //Food
        const food = state.food;
        this.spawnObstacleAt(food.x, food.y, this.Banana);

        // //obstacles        
        //  const obstacles = state.obstacle;
        // for (let wall of obstacles) {
        //     this.spawnObstacleAt(wall.x, wall.y, this.testPrefab);
        // }


    },

    paintPlayer(player, index) {
        const snake = player.snake;

        for (let i = 0; i < snake.length - 1; i++) {
            const segment = snake[i];
            this.spawnObstacleAt(segment.x, segment.y, this.Tail);
        }


        const headSegment = snake[snake.length - 1];
        const headPrefab = this.headPrefabs[index];

        let head = this.spawnObstacleAt(headSegment.x, headSegment.y, headPrefab);
        let anim = head.getComponent(cc.Animation);
        anim.play(this.getAnimNameByVel(player.vel));
    },

    getAnimNameByVel(vel) {
        if (vel.x === 0 && vel.y === 1) return "EUp";
        else if (vel.x === 0 && vel.y === -1) return "EDown";
        else if (vel.x === -1 && vel.y === 0) return "Eleft";
        else return "ERight";
    },


    getLocalPositionFromGrid(x, y) {
        // Dùng biến đã được lưu trong this
        let offsetX = -this.mapSize.width / 2 + this.cellWidth / 2;
        let offsetY = -this.mapSize.height / 2 + this.cellHeight / 2;

        return cc.v3(
            offsetX + x * this.cellWidth,
            offsetY + y * this.cellHeight,
            0
        );
    },

    spawnObstacleAt(gridX, gridY, prefab) {



        let obstacle = cc.instantiate(prefab);

        // Gọi đúng this
        let pos = this.getLocalPositionFromGrid(gridX, gridY);
        obstacle.setPosition(pos);
        obstacle.parent = this.GameHolder;

        // Resize dựa trên kích thước cell
        obstacle.setContentSize(this.cellWidth, this.cellHeight);

        return obstacle;
    },

    TimerCtr(TimeLeft) {
        let MaxTime = 60;
        let progress = TimeLeft / MaxTime;
        this.Timer.progress = progress;
    }
});
