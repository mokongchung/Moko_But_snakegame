const { MapManager, FRAME_RATE } = require('./constants');
//mapInfo.selectNewMap('Map1');
module.exports = {
    initGame,
    getUpdatedVelocity,
    gameLoop,
}

function initGame(numPlayers, selectedMap) {
    const mapInfo = new MapManager();
    mapInfo.selectNewMap(selectedMap);
    const state = createGameState(numPlayers, mapInfo)
    randomFood(state);
    return state;
}
function createGameState(numPlayers, mapInfo) {
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
            isVisible: true,
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
        timer: 60,
        players,
        buff: {},
        foods: [],
        obstacle: generateObstaclesFromMap(mapInfo.getSelectedMap()),
        gridsize: mapInfo.getGridSize(),
    };
}
function generateObstaclesFromMap(map) {
    const obstacle = [];
    const height = map.length;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === '1') {
                obstacle.push({
                    x,
                    y: height - 1 - y // đảo ngược y
                });
            }
        }
    }
    return obstacle;
}

function SpawnBuff(state) {
    // if (Math.random() < 1) {
    //     return;
    // }
    let allVisible = true;
    for (let i = 0; i < state.players.length; i++) {
        let player = state.players[i];
        if (player.isVisible !== true) {
            allVisible = false;
            break;
        }
    }

    if ((Object.keys(state.buff).length === 0) && allVisible) {
        const available = [];
        for (let x = 0; x < state.gridsize; x++) {
            for (let y = 0; y < state.gridsize; y++) {
                if (isCellFree(state, x, y)) {
                    available.push({ x, y });
                }
            }
        }

        if (available.length === 0) {
            console.warn("No space to spawn buff!");
            return;
        }

        const index = Math.floor(Math.random() * available.length);
        state.buff = available[index];
    }
};


function randomFood(state) {
    // Ensure foods array exists
    if (!state.foods) state.foods = [];
    if (state.foods.length < 4) {
        // Find all available cells
        const available = [];
        for (let x = 0; x < state.gridsize; x++) {
            for (let y = 0; y < state.gridsize; y++) {
                if (isCellFree(state, x, y)) {
                    available.push({ x, y });
                }
            }
        }

        if (available.length === 0) {
            console.warn("No space to spawn food!");
            return;
        }


        while (state.foods.length < 4 && available.length > 0) {
            const index = Math.floor(Math.random() * available.length);
            state.foods.push(available.splice(index, 1)[0]);
        }

    }
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
            if (currentVel.y === -1) return null;
            return { x: 0, y: 1 };
        case 39: // right
            if (currentVel.x === -1) return null;
            return { x: 1, y: 0 };
        case 40: // down
            if (currentVel.y === 1) return null;
            return { x: 0, y: -1 };
    }
}


function gameLoop(state, isVsBot) {
    if (!state) return;

    state.timer -= 1 / FRAME_RATE;
    if (state.timer <= 0) return true;

    movePlayers(state);
    if (isVsBot) {
        autoPlayAI(state);
    }
    eatFood(state);
    checkCollisions(state);
    SpawnBuff(state);

    return isGameOver(state);
}

// Move all players
function movePlayers(state) {
    for (let player of state.players) {
        if (player.isDead) continue;

        player.pos.x += player.vel.x;
        player.pos.y += player.vel.y;
        player.hasMoved = false;

        // Portal logic
        if (player.pos.x < 0) player.pos.x = state.gridsize;
        else if (player.pos.x > state.gridsize) player.pos.x = 0;

        if (player.pos.y < 0) player.pos.y = state.gridsize;
        else if (player.pos.y > state.gridsize) player.pos.y = 0;
    }
}

// Handle eating food (single and multiple)
function eatFood(state) {
    for (let player of state.players) {
        if (player.isDead) continue;

        // Single food
        if (state.buff && state.buff.x === player.pos.x && state.buff.y === player.pos.y) {
            player.snake.push({ ...player.pos });
            player.pos.x += player.vel.x;
            player.pos.y += player.vel.y;
            player.points += 50;
            player.isVisible = false;
            countDownBuff(player);
            state.buff = {};
        }

        // Multiple foods
        if (state.foods && state.foods.length > 0) {
            for (let i = 0; i < state.foods.length; i++) {
                const food = state.foods[i];
                if (food.x === player.pos.x && food.y === player.pos.y) {
                    player.snake.push({ ...player.pos });
                    player.pos.x += player.vel.x;
                    player.pos.y += player.vel.y;
                    player.points += 10;
                    state.foods.splice(i, 1);
                    randomFood(state);

                    break;
                }
            }
        }

        // Move snake (self-collision check)
        if (player.vel.x || player.vel.y) {
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
}

function countDownBuff(player) {
    let Timer = 10;
    const interval = setInterval(() => {

        if (Timer <= 0) {
            player.isVisible = true;
            clearInterval(interval);
            console.log("🛑 Countdown ended.");
        }

        Timer--;
    }, 1000);
};
// Check collisions: player vs player, player vs obstacle
function checkCollisions(state) {
    for (let i = 0; i < state.players.length; i++) {
        const playerA = state.players[i];
        if (playerA.isDead) continue;
        if (playerA.isVisible === false) {
            continue;
        }
        // Player vs Player
        for (let j = 0; j < state.players.length; j++) {
            const playerB = state.players[j];
            if (playerB.isDead) continue;

            // Head-to-head
            if (i !== j && playerA.pos.x === playerB.pos.x && playerA.pos.y === playerB.pos.y) {
                killPlayer(playerA, state);
                killPlayer(playerB, state);
                continue;
            }

            // Head-to-body
            if (i !== j) {
                for (let cell of playerB.snake) {
                    if (cell.x === playerA.pos.x && cell.y === playerA.pos.y) {
                        killPlayer(playerA, state);
                        break;
                    }
                }
            }
        }

        if (playerA.isDead) continue;

        // Player vs Obstacle
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

function isGameOver(state) {
    let livingPlayers = 0;
    for (const player of state.players) {
        if (!player.isDead) livingPlayers++;
    }

    if (state.players.length > 1 && livingPlayers <= 1) {
        return true;
    }

    return false;
}


function autoPlayAI(state) {
    for (let i = 1; i < state.players.length; i++) {
        const player = state.players[i];
        if (player.isDead) continue;


        const nextX = player.pos.x + player.vel.x;
        const nextY = player.pos.y + player.vel.y;

        let blocked = false;

        if (state.obstacle) {
            for (let rock of state.obstacle) {
                if (rock.x === nextX && rock.y === nextY) {
                    blocked = true;
                    break;
                }
            }
        }

        if (!blocked) {
            for (let j = 0; j < state.players.length; j++) {
                if (j === i) continue;
                for (let cell of state.players[j].snake) {
                    if (cell.x === nextX && cell.y === nextY) {
                        blocked = true;
                        break;
                    }
                }
                if (blocked) break;
            }
        }

        if (!blocked && Math.random() < 0.1) {
            blocked = true;
        }

        if (blocked) {

            const dirs = [
                { x: 1, y: 0 },  // phải
                { x: 0, y: -1 }, // xuống
                { x: -1, y: 0 }, // trái
                { x: 0, y: 1 }   // lên
            ];
            let dirIdx = dirs.findIndex(d => d.x === player.vel.x && d.y === player.vel.y);

            dirIdx = (dirIdx + 1) % dirs.length;
            player.vel = { ...dirs[dirIdx] };
        }
    }
}

function killPlayer(player, state) {
    player.isDead = true;
    for (let cell of player.snake) {
        spawnFoods(state, cell);
    }
    player.snake = [];
    player.vel = { x: 0, y: 0 };
}

function spawnFoods(state, cell) {
    // Only check for obstacles, not snakes
    if (state.obstacle) {
        for (let rock of state.obstacle) {
            if (rock.x === cell.x && rock.y === cell.y) {
                return;
            }
        }
    }
    if (!state.foods) state.foods = [];
    state.foods.push({ ...cell });
}