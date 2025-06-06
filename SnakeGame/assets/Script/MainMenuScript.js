let connectToSever = require("conectToSever");

cc.Class({
    extends: cc.Component,

    properties: {
        joinGameUI : cc.Node,
            edboxPlayerName : cc.EditBox,
            edboxRoomName   : cc.EditBox,
            contentListRoom : cc.Node,
            roomPrefab : cc.Prefab,

        cautionUI : cc.Node,
        createRoomUI : cc.Node,
        roomUI: cc.Node,
            lblNumPlayerInRoom : cc.Label,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {

    },

    start () {
        this.socket = connectToSever.getInstance().getSocket();

        this.socket.on("listRoom", (data) => {
            console.log("listRoom message:", data.listRoom);
            this.showListRoom(data.listRoom);
        });

        this.node.on('joinThisRoom', this.joinThisRoom, this);

        this.socket.on("joinRoom", (data) => {
            console.log("Joinroom message:", data.room);
            this.requestInfoInRoom(); //show room hien tai dang o
        });

        this.refeshListRoom();
    },

    btnPlayOnClick(){
        this.joinGameUI.active = true;
    },
    setNamePlayer(){
        console.log("set name player");
        this.socket.emit("setName", { name: this.edboxPlayerName.string ?? "player" });
    },
    refeshListRoom(){
        this.socket.emit("getListRoom", { msg: "get List room" });
    },
    showListRoom(listRoom){
        /*  
        listRoom [
            Name: roomName,
            sizePlayer: room.size
        ]
        */
        this.contentListRoom.removeAllChildren();
        listRoom.forEach(room => {
            const roomItem = cc.instantiate(this.roomPrefab);
            roomItem.getComponent("showRoom").init(  room.Name, 4 , room.sizePlayer); // wabc
            this.contentListRoom.addChild(roomItem);


        });


    },
    requestInfoInRoom(room){
        this.socket.emit("findRoom", { nameRoom: this.edboxRoomName.string });
    },
    showInRoom(room){
        this.roomUI.active = true;
        this.lblNumPlayerInRoom.string = room.sizePlayer+"/4"; 
    },

    createRoom(){
        console.log("create room" +this.edboxRoomName.string );
        if ( this.edboxRoomName.string == null)
            return;
        this.joinRoom(this.edboxRoomName.string );
    },
    joinRoom(roomName){
        if(roomName){
            this.socket.emit("joinRoom", { nameRoom: roomName });
        }
    },
    leaveRoom() {
        this.socket.emit("leaveRoom", { msg: "Leave room" });
        this.roomUI.active = false;
    },
    joinThisRoom(event){
        console.log("nhận joint this room");
        let roomName = event.detail.roomName;
        event.stopPropagation();
        this.joinRoom(roomName);
        
    },
    findRoom(){
        console.log("tìm room" +this.edboxRoomName.string );
        if ( this.edboxRoomName.string == null)
            return;
        this.socket.emit("findRoom", { nameRoom: this.edboxRoomName.string });
    },

    startGame(){

    }
    // update (dt) {},
});
