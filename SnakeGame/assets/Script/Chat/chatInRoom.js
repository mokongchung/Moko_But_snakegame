let connectToSever = require("conectToSever");
cc.Class({
    extends: cc.Component,

    properties: {
        lblChatPrefab: cc.Prefab,
        listChatShow: cc.Node,
        edboxTextInput: cc.EditBox,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this._chatMode = false;
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    },

    start() {

        this.socket = connectToSever.getInstance().getSocket();
        this.socket.on("chatMessage", (data) => {
            console.log("chatMessage: ", data.listRoom);
            this.addChat(false, "[" + data.name + "]: " + data.chatText);
        });
    },

    addChat(myText = false, textChat = "") {
        let newChatNode = cc.instantiate(this.lblChatPrefab);
        let label = newChatNode.getComponent(cc.Label);
        if (label) {
            label.string = textChat;
            if (myText) {
                label.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
            }

        } else {
            cc.warn("Không tìm thấy cc.Label trong prefab lblChatPrefab");
        }
        this.listChatShow.addChild(newChatNode);
    },


    onKeyDown(event) {
        if (event.keyCode === cc.macro.KEY.enter) {
            if (!this._chatMode) {
                this._chatMode = true;
                this.chatEditBox.node.active = true;
                this.chatEditBox.setFocus();
            } else {
                this.sendChat();
            }
        }
    },
    sendChat() {
        if(!this._chatMode && !this.chatEditBox.node.active) return;
        const message = this.chatEditBox.string.trim();
        if (message.length > 0) {
            this.addChat(true, message);
            this.socket.emit("chatMessage", { message: message });
        }


        this.chatEditBox.string = "";
        this.chatEditBox.node.active = false;
        this._chatMode = false;
    },

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    },
});
