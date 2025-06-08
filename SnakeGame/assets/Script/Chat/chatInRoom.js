// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        lblChatPrefab: cc.Prefab,
        listChatShow: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {
        this.node.on('addChat', this.joinThisRoom, this);
    },
    addChat(event) {
        event.detail.name;
        event.detail.myChat;
        event.detail.chatText;

        let newChatNode = cc.instantiate(this.lblChatPrefab);
        let label = newChatNode.getComponent(cc.Label);
        if (label) {
            label.string = "["+ event.detail.name+"]: "+ event.detail.chatText;
            if (event.detail.myChat) {
                label.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
            }

        } else {
            cc.warn("Không tìm thấy cc.Label trong prefab lblChatPrefab");
        }
         this.listChatShow.addChild(newChatNode);
    }

    // update (dt) {},
});
