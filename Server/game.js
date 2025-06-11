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
        food: {},
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



function randomFood(state) {

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


function gameLoop(state) {
    if (!state) return;

    state.timer -= 1 / FRAME_RATE;
    if (state.timer <= 0) return true;

    movePlayers(state);
    eatFood(state);
    checkCollisions(state);

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
        if (state.food && state.food.x === player.pos.x && state.food.y === player.pos.y) {
            player.snake.push({ ...player.pos });
            player.pos.x += player.vel.x;
            player.pos.y += player.vel.y;
            player.points += 10;
            randomFood(state);
        }

        // Multiple foods
        if (state.foods && state.foods.length > 0) {
            for (let i = 0; i < state.foods.length; i++) {
                const food = state.foods[i];
                if (food.x === player.pos.x && food.y === player.pos.y) {
                    player.snake.push({ ...player.pos });
                    player.pos.x += player.vel.x;
                    player.pos.y += player.vel.y;
                    state.foods.splice(i, 1);
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

// Check collisions: player vs player, player vs obstacle
function checkCollisions(state) {
    for (let i = 0; i < state.players.length; i++) {
        const playerA = state.players[i];
        if (playerA.isDead) continue;

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

// Check if the game is over
function isGameOver(state) {
    let livingPlayers = 0;
    for (const player of state.players) {
        if (!player.isDead) livingPlayers++;
    }

    if (state.players.length === 1 && livingPlayers === 0) return true;
    if (state.players.length > 1 && livingPlayers === 1) return true;

    return false;
}


function autoPlayAI(state) {
    for (let i = 1; i < state.players.length; i++) {
        const player = state.players[i];
        if (player.isDead) continue;



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
    if (!isCellFree(state, cell.x, cell.y)) return;

    if (!state.foods) state.foods = [];
    state.foods.push({ ...cell });
}