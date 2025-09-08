const canvas = document.getElementById("gameBoard");
const ctx = canvas.getContext("2d");

const unitSize = 25;
const tickSpeed = 24;

const bombSize = unitSize * 4;

const boardWidth = canvas.width;
const boardHeight = canvas.height;

let snake = [];
let velocity = [];

let food = {
  x: 0,
  y: 0,
};

let specialFood = {
  x: 0,
  y: 0,
};

let bomb = {
  x: 0,
  y: 0,
};

let gradientOffset = 0;

let score = 0;
let gameRunning = true;

const bombActiveInterval = 3_000;
const bombGenerateRadius = unitSize * 16;

const inputQueue = [];

const specialFoodPerSecondProbability = 10; // in %age
const specialFoodPerTickProbability =
  1 - Math.pow(1 - specialFoodPerSecondProbability / 100, 1 / tickSpeed);

const bombPerSecondProbability = 30; // in %age
const bombPerTickProbability =
  1 - Math.pow(1 - bombPerSecondProbability / 100, 1 / tickSpeed);

let specialFoodGenerated = false;

const maxBombs = 6;

const bombTimeoutIds = [];

const bombImg = new Image();
bombImg.src = "./bomb7.png";

const bombCanvas = document.createElement("canvas");
const bombCtx = bombCanvas.getContext("2d");

bombImg.onload = () => {
  bombCanvas.width = bombSize;
  bombCanvas.height = bombSize;
  bombCtx.drawImage(bombImg, 0, 0, bombSize, bombSize);
};

window.addEventListener("keydown", changeDirection);

beginGame();

function assignDefaultValues() {
  snake = [
    { x: 100, y: boardHeight / 2 },
    { x: 75, y: boardHeight / 2 },
    { x: 50, y: boardHeight / 2 },
  ];
  velocity = {
    x: unitSize,
    y: 0,
  };
}

function beginGame() {
  assignDefaultValues();
  generateFoodPosition(food);

  intervalId = setInterval(() => {
    if (!gameRunning) {
      score = 0;

      renderGameOverScreen();

      bombs.length = 0;
      bombCount = 0;
      clearInterval(intervalId);
      bombTimeoutIds.forEach((bombTimeoutId) => {
        clearInterval(bombTimeoutId);
      });
      bombTimeoutIds.length = 0;
    } else {
      updateBackground();
      renderFood();
      processSpecialFood();
      processBomb();
      renderSnake();
      moveSnake();
      renderScore();
    }
  }, 1000 / tickSpeed);
}

function updateBackground() {
  let gradient = ctx.createLinearGradient(0, 0, boardWidth, boardHeight);
  gradient.addColorStop(0, `hsl(${gradientOffset % 360}, 70%, 50%)`);
  gradient.addColorStop(1, `hsl(${(gradientOffset + 120) % 360}, 70%, 50%)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, boardWidth, boardHeight);
  gradientOffset += 0.5;
}

function renderGameOverScreen() {
  ctx.font = "60px bolder Dosis";
  ctx.fillStyle = "black";

  const gameOverText = "Game Over!";

  ctx.fillText(
    gameOverText,
    boardWidth / 2 - gameOverText.length * 15,
    boardHeight / 2,
  );
}

function renderScore() {
  ctx.font = "30px bold Arial";
  ctx.fillStyle = "black";

  const scoreText = `Score: ${score}`;
  const tickSpeedText = `Tick Speed: ${tickSpeed}`;

  ctx.fillText(scoreText, boardWidth - scoreText.length * 15, 30);
  ctx.fillText(tickSpeedText, boardWidth - tickSpeedText.length * 15, 60);
}

function randomPosition(min, max) {
  return Math.round((Math.random() * (max - min) + min) / unitSize) * unitSize;
}

function generateFoodPosition(food) {
  food.x = randomPosition(0, boardWidth - unitSize);
  food.y = randomPosition(0, boardHeight - unitSize);

  snake.forEach((segment) => {
    if (food.x === segment.x && food.y === segment.y)
      generateFoodPosition(food);
  });
}

function renderFood() {
  ctx.fillStyle = "red";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(food.x, food.y + unitSize);
  ctx.lineTo(food.x + unitSize / 2, food.y);
  ctx.lineTo(food.x + unitSize, food.y + unitSize);
  ctx.lineTo(food.x, food.y + unitSize);
  ctx.fill();
  ctx.stroke();
}

function renderSpecialFood() {
  ctx.fillStyle = "blue";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.fillRect(specialFood.x, specialFood.y, unitSize, unitSize);
  ctx.stroke();
  ctx.strokeRect(specialFood.x, specialFood.y, unitSize, unitSize);
}

function processSpecialFood() {
  if (specialFoodGenerated) {
    renderSpecialFood();
    return;
  }
  if (Math.random() < specialFoodPerTickProbability) {
    specialFoodGenerated = true;
    generateFoodPosition(specialFood);
    renderSpecialFood();
  }
}

function isFoodEaten(food) {
  return snake[0].x === food.x && snake[0].y === food.y;
}

function generateBombPosition() {
  const possiblePositions = [];

  for (let x = 0; x < boardWidth - bombSize; x += unitSize)
    for (let y = 0; y < boardHeight - bombSize; y += unitSize) {
      const tooClose = snake.some(
        (segment) =>
          Math.abs(x - segment.x) <= bombGenerateRadius &&
          Math.abs(y - segment.y) <= bombGenerateRadius,
      );

      if (!tooClose) possiblePositions.push({ x, y });
    }

  if (possiblePositions.length === 0) {
    return;
  }

  const bomb = {};

  const randomPositionId = Math.floor(Math.random() * possiblePositions.length);
  bomb.x = possiblePositions[randomPositionId].x;
  bomb.y = possiblePositions[randomPositionId].y;

  bombs.push(bomb);
}

function renderBomb(bomb) {
  bombCtx.drawImage(bombImg, 0, 0, bombSize, bombSize);
  ctx.drawImage(bombImg, bomb.x, bomb.y, bombSize, bombSize);
}

const bombs = [];
let bombCount = 0;

function processBomb() {
  if (bombCount > 0) {
    bombs.forEach((bomb) => {
      renderBomb(bomb);
    });
  }
  if (Math.random() < bombPerTickProbability && bombCount < maxBombs) {
    bombCount++;
    generateBombPosition();
    renderBomb(bombs[bombs.length - 1]);

    bombTimeoutIds.push(
      setTimeout(() => {
        bombs.shift();
        bombCount--;
      }, bombActiveInterval),
    );
  }
}

function isCollidedWithBomb(bomb) {
  const head = snake[0];

  // Compute overlapping rectangle
  const startX = Math.max(head.x, bomb.x);
  const startY = Math.max(head.y, bomb.y);
  const endX = Math.min(head.x + unitSize, bomb.x + bombSize);
  const endY = Math.min(head.y + unitSize, bomb.y + bombSize);

  if (startX >= endX || startY >= endY) return false; // No overlap

  const width = endX - startX;
  const height = endY - startY;

  // Get bomb pixels in the overlapping area
  const bombData = bombCtx.getImageData(
    startX - bomb.x,
    startY - bomb.y,
    width,
    height,
  ).data;

  // Check each pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4 + 3; // alpha channel
      if (bombData[idx] > 0) {
        return true; // collision
      }
    }
  }

  return false;
}

function isCollided(head) {
  return snake.some((segment) => segment.x === head.x && segment.y === head.y);
}

function renderSnake() {
  ctx.fillStyle = "green";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  for (let i = 0; i < snake.length; i++) {
    const segment = snake[i];

    ctx.fillStyle = "green";

    // Outer circle
    ctx.beginPath();
    ctx.arc(
      segment.x + unitSize / 2,
      segment.y + unitSize / 2,
      unitSize / 2,
      0,
      2 * Math.PI,
    );
    ctx.fill();
    ctx.stroke();

    // Inner eyes for head only
    if (i === 0) {
      ctx.beginPath();

      let x1, y1, x2, y2;

      if (velocity.x > 0) {
        // right
        x1 = segment.x + (3 * unitSize) / 4;
        y1 = segment.y + unitSize / 3;
        x2 = x1;
        y2 = segment.y + (2 * unitSize) / 3;
      } else if (velocity.x < 0) {
        // left
        x1 = segment.x + unitSize / 4;
        y1 = segment.y + unitSize / 3;
        x2 = x1;
        y2 = segment.y + (2 * unitSize) / 3;
      } else if (velocity.y > 0) {
        // down
        x1 = segment.x + unitSize / 3;
        y1 = segment.y + (3 * unitSize) / 4;
        x2 = segment.x + (2 * unitSize) / 3;
        y2 = y1;
      } else if (velocity.y < 0) {
        // up
        x1 = segment.x + unitSize / 3;
        y1 = segment.y + unitSize / 4;
        x2 = segment.x + (2 * unitSize) / 3;
        y2 = y1;
      }

      ctx.arc(x1, y1, unitSize / 8, 0, 2 * Math.PI);
      ctx.arc(x2, y2, unitSize / 8, 0, 2 * Math.PI);

      ctx.fillStyle = "white";
      ctx.fill();
    }
  }
}

function moveSnake() {
  if (inputQueue.length > 0) {
    velocity.x = inputQueue[0].x;
    velocity.y = inputQueue[0].y;

    inputQueue.shift();
  }

  const head = {
    x: snake[0].x + velocity.x,
    y: snake[0].y + velocity.y,
  };

  if (isCollided(head)) gameRunning = false;
  snake.unshift(head);

  bombs.forEach((bomb) => {
    if (isCollidedWithBomb(bomb)) gameRunning = false;
  });

  if (isFoodEaten(food)) {
    score++;
    generateFoodPosition(food);
  } else if (isFoodEaten(specialFood)) {
    score += 5;
    specialFoodGenerated = false;
  } else {
    snake.pop();
  }

  // Teleport the snake when it reaches the borders
  if (snake[0].x < 0) snake[0].x = boardWidth - unitSize;
  else if (snake[0].x >= boardWidth) snake[0].x = 0;

  if (snake[0].y < 0) snake[0].y = boardHeight - unitSize;
  else if (snake[0].y >= boardHeight) snake[0].y = 0;
}

function pushToInputQueue(x, y) {
  inputQueue.push({
    x,
    y,
  });
}

function changeDirection(event) {
  const keyPressed = event.keyCode;

  const LEFT = 37;
  const UP = 38;
  const RIGHT = 39;
  const DOWN = 40;

  const W = 87;
  const A = 65;
  const S = 83;
  const D = 68;

  const ENTER = 13;

  const lastDir =
    inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : velocity;

  if ((keyPressed === W || keyPressed === UP) && lastDir.y === 0) {
    pushToInputQueue(0, -unitSize);
  } else if ((keyPressed === S || keyPressed === DOWN) && lastDir.y === 0) {
    pushToInputQueue(0, unitSize);
  } else if ((keyPressed === A || keyPressed === LEFT) && lastDir.x === 0) {
    pushToInputQueue(-unitSize, 0);
  } else if ((keyPressed === D || keyPressed === RIGHT) && lastDir.x === 0) {
    pushToInputQueue(unitSize, 0);
  }

  if (keyPressed === ENTER && !gameRunning) {
    gameRunning = true;

    beginGame();
  }
}

