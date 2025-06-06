const { GRID_SIZE,selectedMap } = require('./constants');

module.exports = {
    initGame,
    getUpdatedVelocity,
    gameLoop,
}

function initGame(numPlayers) {
    const state = createGameState(numPlayers)
    randomFood(state);
    return state;
}
function createGameState(numPlayers) {
  const initialPositions = [
    { x: 14, y: 2 },
    { x: 15, y: 2 },
    { x: 16, y: 2 },
    { x: 17, y: 2 },
  ];

  const players = [];

  for (let i = 0; i < numPlayers; i++) {
    const pos = initialPositions[i] || { x: 10 + i, y: 2 }; // Nếu quá số vị trí mặc định thì tự tạo vị trí
    players.push({
      isDead: false,
      hasMoved: false,
      pos: { ...pos },
      vel: { x: 0, y: 1 },
      points: 0,
      snake: [
        { x: pos.x, y: pos.y - 2 },
        { x: pos.x, y: pos.y - 1 },
        { x: pos.x, y: pos.y },
      ],
    });
  }

  return {
    players,
    food: {},
    obstacle: generateObstaclesFromMap(selectedMap),
    gridsize: GRID_SIZE,
  };
}
function generateObstaclesFromMap(map) {
  const obstacle = [];
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === '1') {
        obstacle.push({ x, y });
      }
    }
  }
  return obstacle;
}


function randomFood(state) {

    const available = [];

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            if (isCellFree(state, x, y)) {
                available.push({ x, y });
            }
        }
    }

    if (available.length === 0) {
        console.warn("No space to spawn food!");
        return;
    }

    const index = Math.floor(Math.random() * available.length);
    state.food = available[index];

}

function isCellFree(state, x, y) {
    for (let player of state.players) {
        for (let cell of player.snake) {
            if (cell.x === x && cell.y === y) {
                return false;
            }
        }
    }

    if (state.obstacle) {
        for (let rock of state.obstacle) {
            if (rock.x === x && rock.y === y) {
                return false;
            }
        }
    }

    return true;
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
    if (!state) return;

    for (let i = 0; i < state.players.length; i++) {
        const player = state.players[i];
        if (player.isDead)
            continue;

        // run
        player.pos.x += player.vel.x;
        player.pos.y += player.vel.y;
        player.hasMoved = false;


        // portal bruh
        if (player.pos.x < 0) {
            player.pos.x = GRID_SIZE;
        } else if (player.pos.x > GRID_SIZE) {
            player.pos.x = 0;
        }

        if (player.pos.y < 0) {
            player.pos.y = GRID_SIZE;
        } else if (player.pos.y > GRID_SIZE) {
            player.pos.y = 0;
        }

        // ăn food
        // Ăn food đơn
        if (state.food && state.food.x === player.pos.x && state.food.y === player.pos.y) {
            player.snake.push({ ...player.pos });
            player.pos.x += player.vel.x;
            player.pos.y += player.vel.y;
            player.points += 10; // thêm điểm
            randomFood(state);  // cập nhật food đơn
        }

        // Ăn các foods trong mảng
        if (state.foods && state.foods.length > 0) {
            for (let i = 0; i < state.foods.length; i++) {
                const food = state.foods[i];
                if (food.x === player.pos.x && food.y === player.pos.y) {
                    player.snake.push({ ...player.pos });
                    player.pos.x += player.vel.x;
                    player.pos.y += player.vel.y;
                    // Xóa thức ăn vừa ăn khỏi mảng foods
                    state.foods.splice(i, 1);
                    break;
                }
            }
        }


        // Di chuyển rắn
        if (player.vel.x || player.vel.y) {
            // Va chạm với chính mình
            for (let cell of player.snake) {
                if (cell.x === player.pos.x && cell.y === player.pos.y) {

                    killPlayer(player, state);
                     break;

                }
            }

            if (!player.isDead) {
                player.snake.push({ ...player.pos });
                player.snake.shift();
            }
        }
    }
    //check va chạm
    for (let i = 0; i < state.players.length; i++) {
        const playerA = state.players[i];
        if (playerA.isDead) continue;

        // Va chạm đầu chạm đầu
        for (let j = i + 1; j < state.players.length; j++) {
            const playerB = state.players[j];
            if (playerB.isDead) continue;

            if (
                playerA.pos.x === playerB.pos.x &&
                playerA.pos.y === playerB.pos.y
            ) {
                killPlayer(playerA, state);
                killPlayer(playerB, state);
            }
        }

        // Va chạm đầu chạm thân rắn khác hoặc vật cản
        for (let other of state.players) {
            if (other === playerA || other.isDead) continue;

            for (let cell of other.snake) {
                if (cell.x === playerA.pos.x && cell.y === playerA.pos.y) {
                    killPlayer(playerA, state);
                    break;
                }
            }

            if (state.obstacle) {
                for (let rock of state.obstacle) {
                    if (rock.x === playerA.pos.x && rock.y === playerA.pos.y) {
                        killPlayer(playerA, state);
                        break;
                    }
                }
            }
        }
    }


//     const alivePlayers = state.players.filter(p => !p.isDead);

//   if (alivePlayers.length <= 1) 
//     {
//     if (alivePlayers.length === 1) 
//         {
//       return {
//         winner: {
//           id: alivePlayers[0].id,
//           name: alivePlayers[0].name || "Player",
//         },
//         reason: "Last player standing",
//       };
//     } else {
//       return {
//         winner: null,
//         reason: "Draw",
//       };
//     }
//   }

  return false;

}

function killPlayer(player, state) {
    player.isDead = true;
    // for (let cell of player.snake) {
    //     spawnFoods(state, cell.x, cell.y);
    // }
    player.snake = [];
    player.vel = { x: 0, y: 0 };
}