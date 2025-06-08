let connectToSever = require("conectToSever");
cc.Class({
    extends: cc.Component,

    properties: {
        Timer: cc.ProgressBar,
        Bg: cc.Sprite,
        MapList: [cc.SpriteFrame],
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {
        const savedMap = cc.sys.localStorage.getItem('MAP');

        for (let i = 0; i < this.MapList.length; i++) {
            const spriteName = this.MapList[i].name;
            console.log(`MAP NEED: "${savedMap}" | Current Map Name: "${spriteName}"`);

            if (savedMap === spriteName) {
                console.log("🎯 MATCH FOUND: Setting spriteFrame and breaking loop.");
                this.Bg.spriteFrame = this.MapList[i];
                break;
            }
        }


        this.socket = connectToSever.getInstance().getSocket();

        this.socket.on("countdown", (data) => {
            this.TimerCtr(data.timeLeft);
        });

    },

    TimerCtr(TimeLeft) {
        let MaxTime = 60;
        let progress = TimeLeft / MaxTime;
        this.Timer.progress = progress;
    }
    // update (dt) {},
});
