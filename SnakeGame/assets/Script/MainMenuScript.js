let connectToSever = require("conectToSever");

cc.Class({
    extends: cc.Component,

    properties: {
        joinGameUI: cc.Node,
        edboxPlayerName: cc.EditBox,
        edboxRoomName: cc.EditBox,
        contentListRoom: cc.Node,
        roomPrefab: cc.Prefab,

        lblRoomSize: cc.Label,
        cautionUI: cc.Node,
        roomUI: cc.Node,
        lblNumPlayerInRoom: cc.Label,
        spritePlayerInRoom: {
            default: [],
            type: [cc.Sprite]
        },


        maxRoomSize : 4,

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.roomSize = maxRoomSize;
    },

    start() {
        this.socket = connectToSever.getInstance().getSocket();

        this.socket.on("listRoom", (data) => {
            console.log("listRoom message:", data.listRoom);
            this.showListRoom(data.listRoom);
        });

        this.node.on('joinThisRoom', this.joinThisRoom, this);


        this.socket.on("joinRoom", (data) => {
            console.log("joinRoom: ", data.newRoom);
            this.showInRoom(data.playerSize, data.roomSize)
        });
        this.socket.on("updatePlayerInRoom", (data) => {
            console.log("updatePlayerInRoom: ", data.listPlayers);
            this.updatePlayerInRoom(data.listPlayers, data.roomSize)
        });

        this.socket.on('gameState', this.handleGameState.bind(this));


        this.refeshListRoom();
    },

    btnPlayOnClick() {
        console.log("set name player");
        if(this.edboxPlayerName.string == ""){
            this.caution("Hãy nhập tên");
            return;
        }
        this.socket.emit("setName", { name: this.edboxPlayerName.string ?? "player" });
        this.joinGameUI.active = true;
    },
    btnJoinGameUIExitOnClick(){
        this.joinGameUI.active = false;
    },
    caution(string){
        this.cautionUI.active=true;
        let lblText = this.cautionUI.getChildByName("label_cautionUI")?.getComponent(cc.Label);
        lblText.string = string;
    },
    btnCautionUIOnClick(){
        this.cautionUI.active=false;
    },

    handleGameState(gameState) {
        try {
            if (!gameState) return;
            gameState = JSON.parse(gameState);
            console.log('GameState nhận được:', gameState);
            // this.paintGame(gameState);
        } catch (e) {
            console.error("Lỗi khi parse gameState:", e);
        }
    },

    setNamePlayer() {
        console.log("set name player");
        this.socket.emit("setName", { name: this.edboxPlayerName.string ?? "player" });
    },
    refeshListRoom() {
        this.socket.emit("getListRoom", { msg: "get List room" });
    },
    showListRoom(listRoom) {
        /*  
        listRoom [
            Name: roomName,
            sizePlayer: room.size
        ]
        */
        this.contentListRoom.removeAllChildren();
        listRoom.forEach(room => {
            const roomItem = cc.instantiate(this.roomPrefab);
            roomItem.getComponent("showRoom").init(room.Name, room.roomSize, room.sizePlayer); // wabc
            this.contentListRoom.addChild(roomItem);


        });


    },
    updatePlayerInRoom(listPlayer , roomSize) {
        this.spritePlayerInRoom.forEach(sprite => {
            sprite.node.active = false;
        });

        listPlayer.forEach((player, index) => {
            if (index < this.spritePlayerInRoom.length) {
                const sprite = this.spritePlayerInRoom[index];
                sprite.node.active = true;


                const label = sprite.node.getChildByName("label_name")?.getComponent(cc.Label);
                if (label) {
                    label.string = player.name;
                }
            }
        });

        this.lblNumPlayerInRoom.string = listPlayer.length + "/" + roomSize;

    },
    requestInfoInRoom() {
        this.socket.emit("updatePlayerInRoom", { meg: "updatePlayerInRoom" });
    },
    showInRoom(playerSize , roomSize) {

        this.joinGameUI.active = false;
        this.roomUI.active = true;
        this.lblNumPlayerInRoom.string = playerSize + "/"+roomSize ;

    },
    upSizeRoom (){
        this.roomSize = this.roomSize >= this.maxRoomSize ? this.maxRoomSize : (this.roomSize+1) ;
        this.lblRoomSize.string  = this.roomSize;
    },
    downSizeRoom(){
        this.roomSize = this.roomSize <= 1 ? 1 : (this.roomSize-1) ;
        this.lblRoomSize.string  = this.roomSize;
    },

    createRoom() {
        console.log("create room" + this.edboxRoomName.string);
        if (this.edboxRoomName.string == null)
            return;
        this.joinRoom(this.edboxRoomName.string);
    },
    joinRoom(roomName) {
        if (roomName) {
            this.socket.emit("joinRoom", { nameRoom: roomName , roomSize: this.roomSize});
        }
    },
    leaveRoom() {
        this.socket.emit("leaveRoom", { msg: "Leave room" });
        this.roomUI.active = false;
        this.joinGameUI.active = true;
    },
    joinThisRoom(event) {
        console.log("nhận joint this room");
        let roomName = event.detail.roomName;
        event.stopPropagation();
        this.joinRoom(roomName);

    },
    findRoom() {
        console.log("tìm room" + this.edboxRoomName.string);
        if (this.edboxRoomName.string == null)
            return;
        this.socket.emit("findRoom", { nameRoom: this.edboxRoomName.string });
    },

    startGame() {
        this.socket.emit("startGame", { nameRoom: this.edboxRoomName.string });
    }
    // update (dt) {},
});
