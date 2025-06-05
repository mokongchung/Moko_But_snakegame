// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        roomName : "room name",
        maxSize : 4,
        size : 0,

        lblNameRoom : cc.Label,
        lblSize : cc.Label,
    },


    // onLoad () {},

    start () {

    },


    init(roomName , maxSize,size){
        this.roomName = roomName;
        this.maxSize = maxSize;
        this.size = size;

        this.lblNameRoom.string = this.roomName;
        this.lblSize.string = "Max: "+ this.size +"/"+this.maxSize; 
    },
    btnJoinOnClick(){
        let event = new cc.Event.EventCustom('joinThisRoom', true); // bubbling = true
        event.detail = { roomName: roomName  };
        this.node.dispatchEvent(event); 
    }

});
