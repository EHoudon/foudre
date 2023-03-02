class Maze {
    constructor(width, height) {
        console.log("Initializing maze of width", width, "and height", height);
        this.walls = null;
        this.width = width;
        this.height = height;
    }

    generate(ph, pv) {
        console.log("Generating maze with ph:", ph, "and pv:", pv);
        this.walls = [];
        for (let i = 0; i < this.height * this.width; i++) {
            this.walls.push([]);
            for (let j = 0; j < this.height * this.width; j++) {
                this.walls[i].push(false);
            }
        }
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                let cur = { "row": row, "col": col };
                let nextH = { "row": row, "col": col + 1 };
                if (this.posExists(nextH) && Math.random() < ph) {
                    this.walls[this.fromPos(cur)][this.fromPos(nextH)] = true;
                    this.walls[this.fromPos(nextH)][this.fromPos(cur)] = true;
                }
                let nextV = { "row": row + 1, "col": col };
                if (this.posExists(nextV) && Math.random() < pv) {
                    this.walls[this.fromPos(cur)][this.fromPos(nextV)] = true;
                    this.walls[this.fromPos(nextV)][this.fromPos(cur)] = true;
                }
            }
        }
    }

    toPos(i) {
        return {
            row: Math.floor(i / this.width),
            col: i - (Math.floor(i / this.width) * this.width)
        }
    }

    fromPos(pos) {
        return pos.row * this.width + pos.col;
    }

    posExists(pos) {
        return pos.row >= 0 && pos.col >= 0 && pos.row < this.height && pos.col < this.width;
    }

    getNeighborsPos(pos) {
        let arr = [];
        let candidates = [
            { row: pos.row, col: pos.col - 1 },
            { row: pos.row, col: pos.col + 1 },
            { row: pos.row - 1, col: pos.col },
            { row: pos.row + 1, col: pos.col },
        ];
        candidates.forEach(candidate => {
            if (this.posExists(candidate)) {
                arr.push(candidate);
            }
        });
        return arr;
    }

    getNeighbors(i) {
        let arr = this.getNeighborsPos(this.toPos(i));
        let res = [];
        arr.forEach(pos => {
            let j = this.fromPos(pos);
            if (!this.walls[i][j]) {
                res.push(j);
            }
        });
        return res;
    }

    bfs(start) {
        console.log("Starting BFS from", start);
        let res = [];
        for (let i = 0; i < this.width * this.height; i++) {
            res.push(null);
        }
        let seen = new Set();
        let father = {};
        let frontier = [start];
        let solvable = false;
        while (frontier.length > 0) {
            let i = frontier.shift();
            if (seen.has(i)) continue;
            seen.add(i);
            if (i in father) {
                res[i] = res[father[i]] + 1;
            } else {
                res[i] = 0;
            }
            let pos = this.toPos(i);
            if (pos.row == this.height - 1) {
                solvable = true;
                break;
            }
            this.getNeighbors(i).forEach(j => {
                if (!(seen.has(j))) {
                    father[j] = i;
                    frontier.push(j);
                }
            });
        }
        return {
            res: res,
            father: father,
            solvable: solvable
        };
    }

    solvable() {
        let start = this.fromPos({
            row: 0,
            col: Math.floor(this.width / 2)
        });
        return this.bfs(start).solvable;
    }

}


class MazePainter {

    constructor(canvas, maze) {
        this.maze = maze;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.scale = Math.min(canvas.width / maze.width, canvas.height / maze.height);
        this.seen = null;
        this.father = null;
        this.frontier = null;
        this.breadth = null;
        this.start = null;
        this.shouldDrawLightning = false;
        this.lightning = null;
        this.lightningTimeStart = null;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawWalls() {
        if (document.getElementById("draw-walls").checked) {
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = "white";
            for (let i = 0; i < this.maze.height * this.maze.width; i++) {
                for (let j = 0; j < i; j++) {
                    if (this.maze.walls[i][j]) {
                        this.ctx.beginPath();
                        let pos = this.maze.toPos(i);
                        if (Math.abs(i - j) == 1) {
                            // Vertical wall, between horizontal neighbors
                            this.ctx.moveTo(pos.col * this.scale, pos.row * this.scale);
                            this.ctx.lineTo(pos.col * this.scale, (pos.row + 1) * this.scale);
                        } else {
                            // Horizontal wall, between vertical neighbors
                            this.ctx.moveTo(pos.col * this.scale, pos.row * this.scale);
                            this.ctx.lineTo((pos.col + 1) * this.scale, pos.row * this.scale);
                        }
                        this.ctx.stroke();
                    }
                }
            }
        }
    }

    initAnimation() {
        this.start = this.maze.fromPos({
            row: 0,
            col: Math.floor(this.maze.width / 2)
        });
        this.seen = new Set();
        this.father = {};
        this.frontier = [this.start];
        this.breadth = [];
        for (let i = 0; i < this.maze.width * this.maze.height; i++) {
            this.breadth.push([null]);
        }
    }

    draw() {
        if (this.shouldDrawLightning) {
            this.drawLightning();
        } else {
            this.drawStep();
        }
    }

    drawStep() {
        if (this.frontier != null && this.frontier.length > 0) {
            this.clear();
            this.writeBreadth();
            let i = null;
            let previousFrontier = this.frontier.slice();
            let newFrontier = [];
            while (this.frontier.length > 0) {
                while (this.frontier.length > 0) {
                    i = this.frontier.shift();
                    if (!(this.seen.has(i))) {
                        break;
                    }
                }
                if (i != null) {
                    this.seen.add(i);
                    if (i in this.father) {
                        this.breadth[i] = this.breadth[this.father[i]] + 1;
                    } else {
                        this.breadth[i] = 0;
                    }
                    this.maze.getNeighbors(i).forEach(j => {
                        if (!(this.seen.has(j))) {
                            this.father[j] = i;
                            newFrontier.push(j);
                        }
                    });
                }
            }
            if (newFrontier.length > 0 || previousFrontier.length > 0) {
                let cells = [];
                let maxRow = null;
                previousFrontier.concat(newFrontier).forEach(j => {
                    let pos = this.maze.toPos(j);
                    if (maxRow == null || maxRow < pos.row) {
                        maxRow = pos.row;
                    }
                    if (pos.row == this.maze.height - 1 && !this.shouldDrawLightning) {
                        this.shouldDrawLightning = true;
                        this.lightning = [j];
                        this.lightningTimeStart = 0;
                        playThunderSound();
                    }
                    cells.push(pos);
                });
                cells.forEach(pos => {
                    let alpha = 1 - FRONTIER_OPACITY_FACTOR * (maxRow - pos.row);
                    if (alpha > 0) {
                        this.ctx.fillStyle = "#fbf6c2" + Math.floor(255 * alpha).toString(16);
                        this.ctx.fillRect(pos.col * this.scale, pos.row * this.scale, this.scale, this.scale);
                    }
                });
            }
            this.frontier = newFrontier;
            this.drawWalls();
        }
    }

    writeBreadth() {
        if (document.getElementById("draw-breadth").checked) {
            // this.ctx.font = "Consolas";
            this.ctx.fillStyle = "#AAA";
            this.ctx.textBaseLine = "middle";
            this.ctx.textAlign = "center";
            for (let i = 0; i < this.maze.width * this.maze.height; i++) {
                if (this.breadth[i] != null) {
                    let pos = this.maze.toPos(i);
                    this.ctx.fillText(this.breadth[i], (pos.col + 0.5) * this.scale, (pos.row + 0.5) * this.scale);
                }
            }
        }
    }

    drawLightning() {
        this.clear();
        for (let k = 0; k < 3; k++) {
            let last = this.lightning[this.lightning.length - 1]
            if (last != this.start) {
                this.lightning.push(this.father[last]);
            }
        }
        let color = "#fbf6c2" + Math.floor(Math.random() * 255 + 0).toString(16);
        this.lightning.forEach(i => {
            let pos = this.maze.toPos(i);
            this.ctx.fillStyle = color;
            this.ctx.fillRect(pos.col * this.scale, pos.row * this.scale, this.scale, this.scale);
        });
        this.writeBreadth();
        this.drawWalls();
        if (this.lightningTimeStart > this.maze.height + this.maze.width) {
            clearInterval(ANIMATION_INTERVAL);
            this.clear();
            this.drawWalls();
            setTimeout(() => {
                main();
            }, Math.floor(Math.random() * 1000) * (document.getElementById("delay-lightning").checked ? 1 : 0));
        } else {
            this.lightningTimeStart++;
        }
    }

}


function playThunderSound() {
    let thunder = thunders[Math.floor(Math.random() * thunders.length)];
    thunder.volume = 0.2;
    thunder.play();
}


var FRONTIER_OPACITY_FACTOR = .2;
var ANIMATION_INTERVAL = null;
var PAINTER = null;
const rain = new Audio("rain.mp3");
rain.volume = 0.1;
rain.loop = true;
const thunders = [
    new Audio("thunder-1.mp3"),
    new Audio("thunder-2.mp3"),
    new Audio("thunder-3.mp3")
]

var ANIMATION_SPEED = 10;

function main() {
    let maze = null;
    let generations = 0;
    while (true) {
        generations++;
        maze = new Maze(31, 45); // 31, 45
        maze.generate(.6, .4); // .6, .4
        if (maze.solvable()) {
            break;
        }
    }
    console.log("Generation took", generations, "tries");
    PAINTER = new MazePainter(document.getElementById("canvas"), maze);
    PAINTER.clear();
    PAINTER.drawWalls();
    ANIMATION_INTERVAL = null;
    setTimeout(() => {
        PAINTER.initAnimation();
        ANIMATION_INTERVAL = setInterval(() => {
            PAINTER.draw();
        }, ANIMATION_SPEED);
    }, Math.floor(Math.random() * 5000) * (document.getElementById("delay-lightning").checked ? 1 : 0));
}


function setCanvasSize() {
    let canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}


window.addEventListener("resize", () => {
    setCanvasSize();
});


window.addEventListener("load", () => {
    setCanvasSize();
    rain.play();
    main();
    document.getElementById("btn-play").addEventListener("click", (event) => {
        if (event.target.textContent == "Pause") { // Do a pause
            if (ANIMATION_INTERVAL != null) {
                clearInterval(ANIMATION_INTERVAL);
                // document.getElementById("btn-speed").classList.add("disabled");
                event.target.textContent = "Reprendre";
                ANIMATION_INTERVAL = null;
            }
        } else { // Restart
            if (ANIMATION_INTERVAL == null) {
                ANIMATION_INTERVAL = setInterval(() => {
                    PAINTER.draw();
                }, ANIMATION_SPEED);
                // document.getElementById("btn-speed").classList.remove("disabled");
                event.target.textContent = "Pause";
            }
        }
    });
    document.getElementById("input-speed").addEventListener("input", () => {
        let value = document.getElementById("input-speed").value;
        ANIMATION_SPEED = [1000, 100, 20, 15, 10, 7, 5, 2, 1][value - 1];
        if (ANIMATION_INTERVAL != null) {
            clearInterval(ANIMATION_INTERVAL);
            ANIMATION_INTERVAL = setInterval(() => {
                PAINTER.draw();
            }, ANIMATION_SPEED);
        }
    });
    document.getElementById("input-frontier").addEventListener("input", () => {
        let value = document.getElementById("input-frontier").value;
        FRONTIER_OPACITY_FACTOR = [1, .75, .5, .33, .2, .1, .05, .01, 0][value - 1];

    });
    /*
    document.getElementById("btn-speed").addEventListener("click", (event) => {
        let makeFullRestart = ANIMATION_INTERVAL != null;
        if (makeFullRestart) {
            clearInterval(ANIMATION_INTERVAL);
        }
        if (event.target.textContent == "Ralentir") {
            ANIMATION_SPEED = 100;
            event.target.textContent = "Accélérer";
        } else {
            ANIMATION_SPEED = 10;
            event.target.textContent = "Ralentir";
        }
        if (makeFullRestart) {
            ANIMATION_INTERVAL = setInterval(() => {
                PAINTER.draw();
            }, ANIMATION_SPEED);
        }
    });
    */
});