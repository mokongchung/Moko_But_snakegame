let connectToSever = require("conectToSever");
let screenShotModule = require("screenShotModule");
cc.Class({
    extends: cc.Component,

    properties: {
        Timer: cc.ProgressBar,
        Bg: cc.Sprite,
        MapList: [cc.SpriteFrame],
        GameHolder: cc.Node,
        testPrefab: cc.Prefab,
        PauseUI: cc.Node,
        PingLabel: cc.Label,

        Player1: cc.Prefab,
        Player2: cc.Prefab,
        Player3: cc.Prefab,
        Player4: cc.Prefab,
        Tail: cc.Prefab,
        Banana: cc.Prefab,
        buff: cc.Prefab,

        ScoreHolder: [cc.Node],
        LabelScore: [cc.Label],
        PlayerSprite: [cc.Sprite],
        DeadSprite: cc.SpriteFrame,
    },

    onLoad() {
        this.GridSize = 0;
        this.cellWidth = 0;
        this.cellHeight = 0;
        this.mapSize = null;
        this.headPrefabs = [this.Player1, this.Player2, this.Player3, this.Player4];
        this._handleGameState = this.handleGameState.bind(this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        this._pingInterval = null;
    },

    start() {
        this.socket = connectToSever.getInstance().getSocket();
        this.screenShotModule = screenShotModule.getInstance();
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

        this.socket.on('gameState', this.handleGameState.bind(this));
        this.socket.on('gameOver', this.gameOver, this)
        this.socket.on('', this.screenShot, this)

     
    },


    pingCheck(socket) {
        const start = Date.now();
        socket.emit("pingCheck");
        socket.on("pongCheck", () => {
            const ping = Date.now() - start;
            this.PingLabel.string = "Ping: " + ping + "ms";
           // console.log("Ping: " + ping + "ms");
        });
    },



    onKeyDown(event) {
        console.log("Button Hited " + event.keyCode);
        this.socket.emit('keydown', event.keyCode);
    },

    handleGameState(gameState) {
        gameState = JSON.parse(gameState);
        console.log('GameState nhận được:', gameState);
        this.paintGame(gameState);
        this.TimerCtr(gameState.timer);
        this.ScoreUpdate(gameState)
        this.pingCheck(this.socket);
    },

    ScoreUpdate(state) {
        for (let i = 0; i < state.players.length; i++) {
            this.ScoreHolder[i].active = true;
            this.LabelScore[i].string = state.players[i].points;
            if (state.players[i].isDead) {
                let anim = this.PlayerSprite[i].getComponent(cc.Animation);
                if (anim) {
                    anim.stop();
                }
                this.PlayerSprite[i].spriteFrame = this.DeadSprite;
            }
        }


        let holdersWithScore = [];

        for (let i = 0; i < this.ScoreHolder.length; i++) {
            let holder = this.ScoreHolder[i];
            let label = this.LabelScore[i];

            let score = parseInt(label.string);
            if (isNaN(score)) score = 0;

            holdersWithScore.push({ holder, score });

        }

        // Bước 2: Sắp xếp theo điểm giảm dần
        holdersWithScore.sort((a, b) => b.score - a.score);

        // Bước 3: Cập nhật thứ tự trong cha của các ScoreHolder (giả sử chúng cùng cha)
        for (let i = 0; i < holdersWithScore.length; i++) {
            holdersWithScore[i].holder.setSiblingIndex(i);
        }
    },

    paintGame(state) {
        this.GameHolder.removeAllChildren();
        //Player
        for (let i = 0; i < state.players.length; i++) {
            if (!state.players[i].isDead)
                this.paintPlayer(state.players[i], i);
        }
        // //Food
        // const food = state.buff;
        // this.spawnObstacleAt(food.x, food.y, this.buff);

        const foods = state.foods;
        for (let i = 0; i < foods.length; i++) {
            this.spawnObstacleAt(foods[i].x, foods[i].y, this.Banana);
        }

        //Buff
        const buffs = state.buff;
        this.spawnObstacleAt(buffs.x, buffs.y, this.buff);


        // //obstacles
        //  const obstacles = state.obstacle;
        // for (let wall of obstacles) {
        //     this.spawnObstacleAt(wall.x, wall.y, this.testPrefab);
        // }


    },

    paintPlayer(player, index) {
        const snake = player.snake;
        const isHalfOpacity = player.isVisible === false;

        for (let i = 0; i < snake.length - 1; i++) {
            const segment = snake[i];
            let tail = this.spawnObstacleAt(segment.x, segment.y, this.Tail);
            if (isHalfOpacity) {
                tail.opacity = 128; 
            }
        }

        const headSegment = snake[snake.length - 1];
        const headPrefab = this.headPrefabs[index];

        let head = this.spawnObstacleAt(headSegment.x, headSegment.y, headPrefab);
        if (isHalfOpacity) {
            head.opacity = 128; 
        }
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
    },


    gameOver() {

        let socket = connectToSever.getInstance().getSocket();
        let canvas = cc.find("Canvas");
        let img = screenShotModule.getInstance().startCaptureScreen2(canvas);
        console.log("img base 64" + img)
        socket.emit("updateScreenShot", { image: img });

    },
    screenShot(name = "textName", point = 0) {

    },

    leaveRoomUIBtn() {
        this.PauseUI.active = true;
    },
    ClosePauseUI() {
        this.PauseUI.active = false;
    },
    LeaveBtn() {
        this.socket.emit("leaveGame");
        cc.director.loadScene("MainMenu");
    },
    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        if (this.socket) {
            this.socket.off('gameState', this._handleGameState);
        }
        if (this._pingInterval) {
            clearInterval(this._pingInterval);
            this._pingInterval = null;
        }
    }

});
