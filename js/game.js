// Game configuration
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const GRID_WIDTH = CANVAS_SIZE / GRID_SIZE;
const GRID_HEIGHT = CANVAS_SIZE / GRID_SIZE;
const FPS = 10;

// Colors
const BACKGROUND_COLOR = "#000000";
const SNAKE_COLOR = "#00FF00";
const APPLE_COLOR = "#FF0000";
const TEXT_COLOR = "#FFFFFF";
const BORDER_COLOR = "#3333FF";

// Directions
const UP = { x: 0, y: -1 };
const DOWN = { x: 0, y: 1 };
const LEFT = { x: -1, y: 0 };
const RIGHT = { x: 1, y: 0 };

// DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('startBtn');

// Adjust canvas size for smaller screens
function adjustCanvasSize() {
    const gameContainer = document.querySelector('.game-container');
    if (window.innerHeight < 650) {
        canvas.width = 350;
        canvas.height = 350;
    } else {
        canvas.width = 400;
        canvas.height = 400;
    }
    
    // Redraw if game is in progress
    if (!gameOver) {
        draw();
    }
}

// Call once on load
adjustCanvasSize();

// Add resize event listener
window.addEventListener('resize', adjustCanvasSize);

// Game state
let snake = [];
let direction = RIGHT;
let newDirection = RIGHT;
let apple = { x: 0, y: 0 };
let score = 0;
let gameOver = true;
let gameLoop = null;

// Audio context for sound effects
let audioContext = null;

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playEatSound() {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playGameOverSound() {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1);
}

// Game initialization
function initGame() {
    snake = [{ x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) }];
    direction = RIGHT;
    newDirection = RIGHT;
    score = 0;
    gameOver = false;
    scoreElement.textContent = score;
    generateApple();
    
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    
    gameLoop = setInterval(update, 1000 / FPS);
    startButton.textContent = "RESTART";
}

// Generate apple at random position
function generateApple() {
    const x = Math.floor(Math.random() * GRID_WIDTH);
    const y = Math.floor(Math.random() * GRID_HEIGHT);
    
    // Check if apple is not on the snake
    for (let segment of snake) {
        if (segment.x === x && segment.y === y) {
            return generateApple();
        }
    }
    
    apple = { x, y };
}

// Game update logic
function update() {
    if (gameOver) return;
    
    // Update direction
    direction = newDirection;
    
    // Calculate new head position
    const head = { ...snake[0] };
    head.x = (head.x + direction.x + GRID_WIDTH) % GRID_WIDTH;
    head.y = (head.y + direction.y + GRID_HEIGHT) % GRID_HEIGHT;
    
    // Check collision with body
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            endGame();
            return;
        }
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check collision with apple
    if (head.x === apple.x && head.y === apple.y) {
        score += 10;
        scoreElement.textContent = score;
        generateApple();
        playEatSound();
    } else {
        // Remove tail if no apple eaten
        snake.pop();
    }
    
    // Draw everything
    draw();
}

// Draw game elements
function draw() {
    // Get current canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const cellSize = canvasWidth / GRID_WIDTH;
    
    // Clear canvas
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw border
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw snake
    ctx.fillStyle = SNAKE_COLOR;
    for (let segment of snake) {
        ctx.fillRect(
            segment.x * cellSize, 
            segment.y * cellSize, 
            cellSize - 1, 
            cellSize - 1
        );
    }
    
    // Draw apple
    const centerX = apple.x * cellSize + cellSize / 2;
    const centerY = apple.y * cellSize + cellSize / 2;
    const radius = cellSize / 2 - 2;
    
    // Apple body
    ctx.fillStyle = APPLE_COLOR;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Apple stem
    ctx.fillStyle = "#654321";
    ctx.fillRect(
        centerX - 1, 
        centerY - radius - 3, 
        2, 
        4
    );
    
    // Apple leaf
    ctx.fillStyle = "#00AA00";
    ctx.beginPath();
    ctx.moveTo(centerX + 2, centerY - radius - 2);
    ctx.lineTo(centerX + 6, centerY - radius - 4);
    ctx.lineTo(centerX + 5, centerY - radius);
    ctx.closePath();
    ctx.fill();
    
    // Game over text
    if (gameOver) {
        ctx.font = 'bold 30px "Courier New", monospace';
        ctx.fillStyle = TEXT_COLOR;
        const gameOverText = "GAME OVER";
        const textWidth = ctx.measureText(gameOverText).width;
        ctx.fillText(
            gameOverText, 
            (canvasWidth - textWidth) / 2, 
            canvasHeight / 2
        );
        
        ctx.font = '16px "Courier New", monospace';
        const restartText = "PRESS START TO PLAY AGAIN";
        const restartWidth = ctx.measureText(restartText).width;
        ctx.fillText(
            restartText, 
            (canvasWidth - restartWidth) / 2, 
            canvasHeight / 2 + 30
        );
    }
}

// End game
function endGame() {
    gameOver = true;
    playGameOverSound();
    draw();
}

// Keyboard controls
document.addEventListener('keydown', (event) => {
    // Prevent default behavior for arrow keys
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
    }
    
    // Change direction based on key
    switch (event.key) {
        case "ArrowUp":
            if (direction !== DOWN) {
                newDirection = UP;
            }
            break;
        case "ArrowDown":
            if (direction !== UP) {
                newDirection = DOWN;
            }
            break;
        case "ArrowLeft":
            if (direction !== RIGHT) {
                newDirection = LEFT;
            }
            break;
        case "ArrowRight":
            if (direction !== LEFT) {
                newDirection = RIGHT;
            }
            break;
    }
});

// Start/restart button
startButton.addEventListener('click', () => {
    if (!audioContext) {
        initAudio();
    }
    initGame();
});

// Draw initial state
draw();
