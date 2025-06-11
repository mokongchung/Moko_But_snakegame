let connectToSever = require("conectToSever");
let screenShotModule = require("screenShotModule");

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

        mapGr: [cc.Toggle],
        startBtn: cc.Node,

        maxRoomSize: 4,

        itemLeaderBoarPrefab: cc.Prefab,
        listItemLeaderBoar: cc.Node,
        popupNode: cc.Node,
        popupImage: cc.Sprite,

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {

        this.roomSize = this.maxRoomSize;
        this.SelectedMap = "Map1";
    },

    start() {
        this.socket = connectToSever.getInstance().getSocket();
        this.screenShotModule = screenShotModule.getInstance();

        this.node.on('joinThisRoom', this.joinThisRoom, this);

        this.socket.on("joinRoom", (data) => {
            console.log("joinRoom: ", data.newRoom);
            this.showInRoom(data.playerSize, data.roomSize)
        });
        this.socket.on("updatePlayerInRoom", (data) => {
            console.log("updatePlayerInRoom: ", data.listPlayers);
            this.updatePlayerInRoom(data.listPlayers, data.roomSize)
        });

        // this.socket.on('gameState', this.handleGameState.bind(this));
        this.socket.on('startGameCall', this.gameStart.bind(this));
        this.socket.on('pickedMap', (data) => {
            this.PickedMap(data);
        }
        );

        this.socket.on("listRoom", (data) => {
            console.log("listRoom message:", data.listRoom);
            if (data.clientName) {

                this.joinGameUI.active = true;
            }
            this.showListRoom(data.listRoom);

        });
        this.socket.on("leaderBoard", (data) => {
            console.log("leaderBoard message:", data);
            this.showLeaderBoard(data.leaderBoard);
        });
        this.getLeaderBoard();
        this.refeshListRoom();
    },
    gameStart(SelectedMap) {
        console.log("GAME STARTEL CALLED FROM SERVER" + SelectedMap.data);
        cc.sys.localStorage.setItem('MAP', SelectedMap.data);
        cc.director.loadScene("GamePlay");//dong 59
    },
    btnPlayOnClick() {
        console.log("set name player");
        if (this.edboxPlayerName.string == "") {
            this.caution("Hãy nhập tên");
            return;
        }
        this.socket.emit("setName", { name: this.edboxPlayerName.string ?? "player" });
        this.joinGameUI.active = true;
    },
    btnJoinGameUIExitOnClick() {
        this.joinGameUI.active = false;
    },
    caution(string) {
        this.cautionUI.active = true;
        let lblText = this.cautionUI.getChildByName("label_cautionUI")?.getComponent(cc.Label);
        lblText.string = string;
    },
    btnCautionUIOnClick() {
        this.cautionUI.active = false;
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
            roomItem.getComponent("showRoom").init(room.Name, room.roomSize, room.sizePlayer);
            this.contentListRoom.addChild(roomItem);


        });


    },
    updatePlayerInRoom(listPlayer, roomSize) {
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
    showInRoom(playerSize, roomSize) {

        this.joinGameUI.active = false;
        this.roomUI.active = true;
        this.lblNumPlayerInRoom.string = playerSize + "/" + roomSize;

    },
    upSizeRoom() {
        this.roomSize = this.roomSize >= this.maxRoomSize ? this.maxRoomSize : (this.roomSize + 1);
        this.lblRoomSize.string = this.roomSize;
    },
    downSizeRoom() {
        this.roomSize = this.roomSize <= 1 ? 1 : (this.roomSize - 1);
        this.lblRoomSize.string = this.roomSize;
    },

    createRoom() {
        console.log("create room" + this.edboxRoomName.string);
        if (this.edboxRoomName.string == null)
            return;
        this.joinRoom(this.edboxRoomName.string);
        for (let i = 0; i < this.mapGr.length; i++) {
            this.mapGr[i].interactable = true;
        }
        this.startBtn.active = true;
    },
    joinRoom(roomName) {
        if (roomName) {
            this.socket.emit("joinRoom", { nameRoom: roomName, roomSize: this.roomSize });
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
        for (let i = 0; i < this.mapGr.length; i++) {
            this.mapGr[i].interactable = false;
        }
        this.startBtn.active = false;

    },
    findRoom() {
        console.log("tìm room" + this.edboxRoomName.string);
        if (this.edboxRoomName.string == null)
            return;
        this.socket.emit("findRoom", { nameRoom: this.edboxRoomName.string });
    },


    MapSelectToggle(toggle, Name) {
        if (toggle.isChecked) {
            this.SelectedMap = Name;
            console.log("Map Selected: " + this.SelectedMap);

            this.socket.emit("mapPick", this.SelectedMap);
        }

    },
    PickedMap(data) {
        console.log("PickedMap: " + data);
        this.SelectedMap = data;
        for (let i = 0; i < this.mapGr.length; i++) {
            if (this.mapGr[i].node.name == data) {
                this.mapGr[i].isChecked = true;
            } else {
                this.mapGr[i].isChecked = false;
            }
        }
    },

    startGame() {
        this.socket.emit("startGame", this.SelectedMap);
    },
    // update (dt) {},

    getLeaderBoard() {
        console.log("get Leader Board");
        this.socket.emit("getLeaderBoard", { msg: "getLeaderBoard" });
    },
    async showLeaderBoard(arrayLeaderBoard) {
        if (!arrayLeaderBoard) {
            console.log("arrayLeaderBoard " + null);
            return;
        }
        for (let i = 0; i < arrayLeaderBoard.length; i++) {
            console.log("showLeaderBoard: " + arrayLeaderBoard[i].name + " " + arrayLeaderBoard[i].score + "\n\r" + arrayLeaderBoard[i].image)
            let texture = await this.screenShotModule.convertBase64ToTexture(arrayLeaderBoard[i].image);
            const spriteFrame = new cc.SpriteFrame(texture);
            //this.testSprite.spriteFrame = spriteFrame;
            this.createItemLeaderBoard({ name: arrayLeaderBoard[i].name, points: arrayLeaderBoard[i].score, spriteFrame: spriteFrame })
        }


    },
    createItemLeaderBoard(data) {

        let item = cc.instantiate(this.itemLeaderBoarPrefab);


        let labelName = item.getChildByName("label_name").getComponent(cc.Label);
        if (labelName) labelName.string = data.name;


        let labelPoints = item.getChildByName("label_points").getComponent(cc.Label);
        if (labelPoints) labelPoints.string = data.points.toString();


        let spriteNode = item.getChildByName("sprite_image");
        if (spriteNode) {
            let sprite = spriteNode.getComponent(cc.Sprite);
            if (sprite && data.spriteFrame) {
                sprite.spriteFrame = data.spriteFrame;
            }
        }
        let buttonNode = item.getChildByName("button");
        if (buttonNode) {
            buttonNode.on('click', () => {

                if (this.popupNode.active && this.popupImage.spriteFrame === data.spriteFrame) {
                    this.popupNode.active = false;
                } else {

                    this.popupImage.spriteFrame = data.spriteFrame;
                    this.popupNode.active = true;


                    let worldPos = buttonNode.convertToWorldSpaceAR(cc.v2(0, 0));
                    let localPos = this.popupNode.parent.convertToNodeSpaceAR(worldPos);
                    this.popupNode.setPosition(localPos.add(cc.v2(0, 100)));
                }
            }, this);
        }
        this.listItemLeaderBoar.addChild(item);
    },


    onDestroy() {
        this.node.off('joinThisRoom', this.joinThisRoom, this);
        this.socket.off("joinRoom");
        this.socket.off("updatePlayerInRoom");
        this.socket.off('startGameCall');
        this.socket.off('pickedMap');
        this.socket.off("listRoom");
        this.socket.off("gameState");
        this.socket.off("setName");
        this.socket.off("getListRoom");
        this.socket.off("mapPick");
        this.socket.off("leaveRoom");
        this.socket.off("findRoom");
        this.socket.off("startGame");
    },
});
