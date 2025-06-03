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
        players: [
            {
                isDead: false,
                pos: { x: 0, y: 2 },
                vel: { x: 0, y: 1 },
                snake: [
                    { x: 0, y: 0 },
                    { x: 0, y: 1 },
                    { x: 0, y: 2 },
                ],
            },
            {
                isDead: false,
                pos: { x: GRID_SIZE, y: GRID_SIZE - 2 },
                vel: { x: 0, y: -1 },
                snake: [
                    { x: GRID_SIZE, y: GRID_SIZE },
                    { x: GRID_SIZE, y: GRID_SIZE - 1 },
                    { x: GRID_SIZE, y: GRID_SIZE - 2 },
                ],
            },
            {
                isDead: false,
                pos: { x: GRID_SIZE - 2, y: 0 },
                vel: { x: -1, y: 0 },
                snake: [
                    { x: GRID_SIZE, y: 0 },
                    { x: GRID_SIZE - 1, y: 0 },
                    { x: GRID_SIZE - 2, y: 0 },
                ],
            },
            {
                isDead: false,
                pos: { x: 2, y: GRID_SIZE },
                vel: { x: 1, y: 0 },
                snake: [
                    { x: 0, y: GRID_SIZE },
                    { x: 1, y: GRID_SIZE },
                    { x: 2, y: GRID_SIZE },
                ],
            },
        ],
        food: {},
        obstacle: [],
        gridsize: GRID_SIZE,
    };
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
    spawnFood(state, available[index].x, available[index].y)

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

function spawnFood(state, x, y) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
       return;
    }

    for (let player of state.players) {
        for (let cell of player.snake) {
            if (cell.x === x && cell.y === y) {
                return;
            }
        }
    }

    if (state.obstacle) {
        for (let rock of state.obstacle) {
            if (rock.x === x && rock.y === y) {
                return;
            }
        }
    }

    state.food = { x, y };
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
        if (state.food.x === player.pos.x && state.food.y === player.pos.y) {
            player.snake.push({ ...player.pos }); // Tăng độ dài rắn
            player.pos.x += player.vel.x;
            player.pos.y += player.vel.y;
            randomFood(state);
        }

        // Di chuyển rắn
        if (player.vel.x || player.vel.y) {
            // Va chạm với chính mình
            for (let cell of player.snake) {
                if (cell.x === player.pos.x && cell.y === player.pos.y) {
                    player.isDead = true;
                    player.snake = [];
                    player.vel = { x: 0, y: 0 };
                    continue;
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
                killPlayer(playerA);
                killPlayer(playerB);
            }
        }

        // Va chạm đầu chạm thân rắn khác hoặc vật cản
        for (let other of state.players) {
            if (other === playerA || other.isDead) continue;

            for (let cell of other.snake) {
                if (cell.x === playerA.pos.x && cell.y === playerA.pos.y) {
                    killPlayer(playerA);
                    break;
                }
            }

            if (state.obstacle) {
                for (let rock of state.obstacle) {
                    if (rock.x === playerA.pos.x && rock.y === playerA.pos.y) {
                        killPlayer(playerA);
                        break;
                    }
                }
            }
        }
    }


    return false;
}

function killPlayer(player) {
    player.isDead = true;
    player.snake = [];
    player.vel = { x: 0, y: 0 };
}

