// Màu sắc
const BG_COLOUR = new cc.Color(35, 31, 32);       // #231f20
const SNAKE_COLOUR = new cc.Color(194, 194, 194); // #c2c2c2
const FOOD_COLOUR = new cc.Color(230, 105, 22);   // #e66916
const OTHER_SNAKE_COLOUR = new cc.Color(255, 0, 0); // đỏ

cc.Class({
    extends: cc.Component,

    properties: {
        holder: cc.Node,       // node chứa grid ô vuông (child node sắp xếp grid)
        gridsize: 20,
    },

    onLoad () {
        this.gameActive = false;
        this.playerNumber = null;

        // Giả sử nhận event socket tương tự như bên bạn hoặc setup khác
        // Ở đây bạn sẽ cần socket.on(...) tương tự
    },

    initGame () {
        this.gameActive = true;
        // Reset tất cả ô về màu nền
        for (let i = 0; i < this.holder.children.length; i++) {
            this.holder.children[i].color = BG_COLOUR;
        }
    },

    // Hàm đổi màu một cell trong grid tại vị trí (x, y)
    setCellColor (x, y, color) {
        // Tính index = y * gridsize + x (giả sử layout theo hàng)
        let index = y * this.gridsize + x;
        let cellNode = this.holder.children[index];
        if (cellNode) {
            cellNode.color = color;
        }
    },

    paintGame (state) {
        if (!this.gameActive) return;

        // Đặt lại nền
        for (let i = 0; i < this.holder.children.length; i++) {
            this.holder.children[i].color = BG_COLOUR;
        }

        // Vẽ thức ăn
        let food = state.food;
        this.setCellColor(food.x, food.y, FOOD_COLOUR);

        // Vẽ player 1
        this.paintPlayer(state.players[0], SNAKE_COLOUR);
        // Vẽ player 2
        this.paintPlayer(state.players[1], OTHER_SNAKE_COLOUR);
    },

    paintPlayer (playerState, color) {
        let snake = playerState.snake;
        for (let cell of snake) {
            this.setCellColor(cell.x, cell.y, color);
        }
    },

    // Các hàm handleEvent tương tự handleInit, handleGameState, handleGameOver...
    handleInit (number) {
        this.playerNumber = number;
    },

    handleGameState (gameState) {
        if (!this.gameActive) return;
        this.paintGame(gameState);
    },

    handleGameOver (data) {
        if (!this.gameActive) return;
        this.gameActive = false;

        if (data.winner === this.playerNumber) {
            cc.log('You Win!');
            // hoặc show popup message
        } else {
            cc.log('You Lose :(');
        }
    },

    reset () {
        this.playerNumber = null;
        this.gameActive = false;
        // Reset màu tất cả ô
        for (let i = 0; i < this.holder.children.length; i++) {
            this.holder.children[i].color = BG_COLOUR;
        }
    }
});
