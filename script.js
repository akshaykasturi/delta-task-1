// Constants
const BOARD_SIZE = 8;
const INITIAL_TIME = 60; // Initial time in seconds
const piecesTypes = ["T", "C", "R", "S", "K"]; // Titan, Cannon, Ricochets, Semi Ricochets, Tank

// Elements
const gameBoard = document.getElementById('game-board');
const pauseButton = document.getElementById('pause-button');
const resumeButton = document.getElementById('resume-button');
const resetButton = document.getElementById('reset-button');
const timeLeftDisplay = document.getElementById('time-left');
const currentTurnDisplay = document.getElementById('current-turn');

// Variables
let timer;
let timeLeft = INITIAL_TIME;
let isPaused = false;
let selectedPiece = null;
let pieces = []; // Store pieces with their type and position
let currentPlayer = 1; // Player 1 or Player 2

// Initialize the board
function initializeBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', () => handleCellClick(i));
        gameBoard.appendChild(cell);
    }
    pieces = [
        { type: 'T', position: 56, player: 1 }, // Titan for Player 1
        { type: 'C', position: 57, player: 1 }, // Cannon for Player 1
        { type: 'R', position: 58, player: 1 }, // Ricochet for Player 1
        { type: 'S', position: 59, player: 1 }, // Semi Ricochet for Player 1
        { type: 'K', position: 60, player: 1 }, // Tank for Player 1
        { type: 'T', position: 7, player: 2 }, // Titan for Player 2
        { type: 'C', position: 6, player: 2 }, // Cannon for Player 2
        { type: 'R', position: 5, player: 2 }, // Ricochet for Player 2
        { type: 'S', position: 4, player: 2 }, // Semi Ricochet for Player 2
        { type: 'K', position: 3, player: 2 }  // Tank for Player 2
    ];
    renderBoard();
}

// Render the board
function renderBoard() {
    gameBoard.querySelectorAll('div').forEach(cell => {
        cell.textContent = '';
        cell.className = '';
    });
    pieces.forEach(piece => {
        const cell = gameBoard.querySelector(`div[data-index='${piece.position}']`);
        cell.classList.add(piece.type);
        cell.classList.add(`player${piece.player}`);
        cell.textContent = getPieceName(piece.type);
    });
}

// Get the name of the piece
function getPieceName(type) {
    switch (type) {
        case 'T':
            return 'Titan';
        case 'C':
            return 'Cannon';
        case 'R':
            return 'Ricochet';
        case 'S':
            return 'Semi Ricochet';
        case 'K':
            return 'Tank';
        default:
            return '';
    }
}

// Handle cell click
function handleCellClick(index) {
    if (selectedPiece) {
        movePiece(selectedPiece, index);
        selectedPiece = null;
    } else {
        selectedPiece = pieces.find(piece => piece.position === index && piece.player === currentPlayer);
    }
}

// Move piece
async function movePiece(piece, newIndex) {
    if (isValidMove(piece, newIndex)) {
        piece.position = newIndex;
        checkForWin();
        currentPlayer = currentPlayer === 1 ? 2 : 1; // Switch turn
        currentTurnDisplay.textContent = currentPlayer === 1 ? 'BLUE' : 'RED';
        
        // Shoot cannon if the current piece is a cannon
        if (piece.type === 'C') {
            await shootCannon(piece);
        }
        
        // Shoot semi-ricochet if the current piece is a semi-ricochet
        if (piece.type === 'S') {
            shootSemiRicochet(piece.position);
        }
        
        // Update the timer after each move
        timeLeft = INITIAL_TIME;
        timeLeftDisplay.textContent = timeLeft;
        
        renderBoard();
    }
}

// Check if move is valid
function isValidMove(piece, newIndex) {
    const oldIndex = piece.position;
    const oldRow = Math.floor(oldIndex / BOARD_SIZE);
    const oldCol = oldIndex % BOARD_SIZE;
    const newRow = Math.floor(newIndex / BOARD_SIZE);
    const newCol = newIndex % BOARD_SIZE;
    const isAdjacent = Math.abs(oldRow - newRow) <= 1 && Math.abs(oldCol - newCol) <= 1;
    
    // Specific rules for the cannon (horizontal only)
    if (piece.type === 'C') {
        return oldRow === newRow && isValidTarget(newIndex);
    }
    
    // General rules for other pieces
    return isAdjacent && isValidTarget(newIndex);
}

// Check if the target cell is valid (not occupied by own piece)
function isValidTarget(newIndex) {
    return !pieces.some(piece => piece.position === newIndex && piece.player === currentPlayer);
}

// Shoot cannon
async function shootCannon(cannon) {
    let bulletPosition = cannon.position;
    const cannonRow = Math.floor(bulletPosition / BOARD_SIZE);
    const cannonCol = bulletPosition % BOARD_SIZE;
    
    // Shoot the bullet vertically
    while (true) {
        bulletPosition += cannonRow < BOARD_SIZE / 2 ? 1 : -1;
        const bulletRow = Math.floor(bulletPosition / BOARD_SIZE);
        const bulletCol = bulletPosition % BOARD_SIZE;
        
        // Check if the bullet has reached the edge of the board
        if (bulletCol === 0 || bulletCol === BOARD_SIZE - 1) {
            break;
        }
        
        // Check if the bullet hits an opponent's tank
        const targetPiece = pieces.find(piece => piece.position === bulletPosition && piece.player !== currentPlayer && piece.type === 'K');
        if (targetPiece) {
            alert(`Player ${currentPlayer === 1 ? 2 : 1}'s tank has been hit by the cannon`);
            clearInterval(timer);
            targetPiece.type = 'D'; // Set the target piece type to 'D' for destroyed
            break;
        }
        
        // Check if the bullet hits another piece (friendly or enemy)
        const obstacleIndex = pieces.findIndex(piece => piece.position === bulletPosition);
        if (obstacleIndex !== -1) {
            break;
        }
        
        // Render the bullet's position
        renderBullet(bulletPosition);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay for visual effect
        renderBoard();
    }
}

// Shoot semi-ricochet
function shootSemiRicochet(bulletPosition) {
    const bulletRow = Math.floor(bulletPosition / BOARD_SIZE);
    const bulletCol = bulletPosition % BOARD_SIZE;
    
    // Check if the bullet hits the diagonal part
    if (Math.abs(bulletRow - bulletCol) === 1) {
        // Deflect the bullet
        bulletPosition += bulletRow < bulletCol ? 1 : -1;
    }
    
    // Check if the bullet hits an opponent's tank
    const targetPiece = pieces.find(piece => piece.position === bulletPosition && piece.player !== currentPlayer && piece.type === 'K');
    if (targetPiece) {
        alert(`Player ${currentPlayer === 1 ? 2 : 1}'s tank has been hit by the semi-ricochet`);
        clearInterval(timer);
        targetPiece.type = 'D'; // Set the target piece type to 'D' for destroyed
    }
}

// Render the bullet's position
function renderBullet(bulletPosition) {
    gameBoard.querySelectorAll('div').forEach(cell => {
        cell.classList.remove('bullet');
    });
    const bulletCell = gameBoard.querySelector(`div[data-index='${bulletPosition}']`);
    bulletCell.classList.add('bullet');
}

// Timer functionality
function startTimer() {
    timer = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            timeLeftDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timer);
                alert(`Time is up Player ${currentPlayer === 1 ? 2 : 1} wins`);
            }
        }
    }, 1000);
}

// Pause game
pauseButton.addEventListener('click', () => {
    isPaused = true;
});

// Resume game
resumeButton.addEventListener('click', () => {
    isPaused = false;
});

// Reset game
resetButton.addEventListener('click', () => {
    clearInterval(timer);
    timeLeft = INITIAL_TIME;
    timeLeftDisplay.textContent = timeLeft;
    initializeBoard();
    startTimer();
});

// Check for win condition
function checkForWin() {
    const titan1 = pieces.find(piece => piece.type === 'T' && piece.player === 1);
    const titan2 = pieces.find(piece => piece.type === 'T' && piece.player === 2);
    if (!titan1) {
        alert('Player 2 wins!');
        clearInterval(timer);
    } else if (!titan2) {
        alert('Player 1 wins!');
        clearInterval(timer);
    }
}

// Initialize the game
initializeBoard();
startTimer();