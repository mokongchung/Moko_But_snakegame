let connectToSever = require("conectToSever");
cc.Class({
    extends: cc.Component,

    properties: {
        Timer: cc.ProgressBar,
        Bg: cc.Sprite,
        MapList: [cc.SpriteFrame],
        GameHolder: cc.Node,
        testPrefab: cc.Prefab,
    },

    onLoad() {
        this.GridSize = 0;
        this.cellWidth = 0;
        this.cellHeight = 0;
        this.mapSize = null;
    },

    start() {
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

        this.socket = connectToSever.getInstance().getSocket();

        this.socket.on("countdown", (data) => {
            this.TimerCtr(data.timeLeft);
        });
    },

    getLocalPositionFromGrid(x, y, mapHolder) {
        // Dùng biến đã được lưu trong this
        let offsetX = -this.mapSize.width / 2 + this.cellWidth / 2;
        let offsetY = -this.mapSize.height / 2 + this.cellHeight / 2;

        return cc.v3(
            offsetX + x * this.cellWidth,
            offsetY + y * this.cellHeight,
            0
        );
    },

    spawnObstacleAt(gridX, gridY , prefab) {

        this.GameHolder.removeAllChildren(); 

        let obstacle = cc.instantiate(prefab);

        // Gọi đúng this
        let pos = this.getLocalPositionFromGrid(gridX, gridY, this.GameHolder);
        obstacle.setPosition(pos);
        obstacle.parent = this.GameHolder;

        // Resize dựa trên kích thước cell
        obstacle.setContentSize(this.cellWidth, this.cellHeight);
    },

    TimerCtr(TimeLeft) {
        let MaxTime = 60;
        let progress = TimeLeft / MaxTime;
        this.Timer.progress = progress;
    }
});
