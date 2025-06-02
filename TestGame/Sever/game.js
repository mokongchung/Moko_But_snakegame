const { GRID_SIZE } = require('./constants');

module.exports = {
    initGame,
    getUpdatedVelocity,
    gameLoop,
}

function initGame() {
    const state = createGameState()
    randomFood(state);
    return state;
}

function createGameState() {
    return {
        players: [{
            pos: {
                x: 3,
                y: 10,
            },
            vel: {
                x: 1,
                y: 0,
            },
            snake: [
                { x: 1, y: 5 },
                { x: 2, y: 5 },
                { x: 3, y: 5 },
            ],
        }],
        food: {},
        gridsize: GRID_SIZE,
    };
}

function randomFood(state) {
    food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
    }

    for (let cell of state.players[0].snake) {
        if (cell.x === food.x && cell.y === food.y) {
            return randomFood(state);
        }
    }



    state.food = food;
}


function getUpdatedVelocity(keyCode, currentVel) {
  switch (keyCode) {
    case 37: // left
      if (currentVel.x === 1) return null;
      return { x: -1, y: 0 };
    case 38: // up
      if (currentVel.y === 1) return null;
      return { x: 0, y: -1 };
    case 39: // right
      if (currentVel.x === -1) return null;
      return { x: 1, y: 0 };
    case 40: // down
      if (currentVel.y === -1) return null;
      return { x: 0, y: 1 };
  }
}


function gameLoop(state) {
    if (!state) {
        return;
    }
    const playerOne = state.players[0];

    playerOne.pos.x += playerOne.vel.x;
    playerOne.pos.y += playerOne.vel.y;

    if (playerOne.pos.x < 0) {
        playerOne.pos.x = GRID_SIZE;
    } else if (playerOne.pos.x > GRID_SIZE) {
        playerOne.pos.x = 0;
    }

    if (playerOne.pos.y < 0) {
        playerOne.pos.y = GRID_SIZE;
    } else if (playerOne.pos.y > GRID_SIZE) {
        playerOne.pos.y = 0;
    }

    if (state.food.x === playerOne.pos.x && state.food.y === playerOne.pos.y) {
        playerOne.snake.push({ ...playerOne.pos });
        playerOne.pos.x += playerOne.vel.x;
        playerOne.pos.y += playerOne.vel.y;
        randomFood(state);
    }

    if (playerOne.vel.x || playerOne.vel.y) {
        // for (let cell of playerOne.snake) {
        //   if (cell.x === playerOne.pos.x && cell.y === playerOne.pos.y) {
        //     return 2;
        //   }
        // }

        playerOne.snake.push({ ...playerOne.pos });
        playerOne.snake.shift();
    }


    return false;

}