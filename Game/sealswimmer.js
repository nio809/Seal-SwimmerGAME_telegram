let scoreSent = false;  // Flag to check if the score has been sent

//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//bird
let birdWidth = 90; //width/height ratio = 408/228 = 17/12
let birdHeight = 50;
let birdX = boardWidth/8;
let birdY = boardHeight/2;
let birdImg;

let bird = {
    x : birdX,
    y : birdY,
    width : birdWidth,
    height : birdHeight
}

//pipes
let pipeArray = [];
let pipeWidth = 64; //width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -2; //pipes moving left speed
let velocityY = 0; //bird jump speed
let gravity = 0.4;

let gameOver = false;
let score = 0;

let pipeIntervalId;  // Global variable to hold the interval ID
let initialPipeInterval = 1500;  // Initial interval for placing pipes
let pipeInterval = initialPipeInterval;  // Current interval, starts with initial value
let powerups = {powerup1: 0, powerup2: 0, powerup3: 0};



window.onload = function() {
    // Initial game setup functions
    fetchPowerups(); // Load powerups once at the beginning

    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    pipeIntervalId = setInterval(placePipes, pipeInterval); // Set initial interval

    // Load images and start game loop
    birdImg = new Image();
    birdImg.src = "images/sealswimmer.png";
    birdImg.onload = function() {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    }

    topPipeImg = new Image();
    topPipeImg.src = "images/toppipe.png";
    bottomPipeImg = new Image();
    bottomPipeImg.src = "images/bottompipe.png";

    displayUserId(); // Display the user ID on the HTML element
    requestAnimationFrame(update); // Start the game loop

    document.addEventListener("keydown", function(event) {
        if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyX") {
            moveBird();
        }
    });
    document.addEventListener("click", moveBird); // Listen for mouse clicks to move the bird
}

let powerupsLoaded = false;  // Flag to check if the powerups have been loaded

function fetchPowerups() {
    const userId = getUserIdFromUrl();
    fetch(`____your api endpoint___/get_powerups/${encodeURIComponent(userId)}`)
    .then(response => response.json())
    .then(data => {
        powerups = data; // Assuming the data format matches the expected
        console.log("Powerups loaded:", powerups);
    })
    .catch(error => console.error('Error fetching powerups:', error));
}


function showMenu() {
    // Call fetchPowerups when showing the menu for the first time
    document.getElementById('menu').style.display = 'flex';  // Show menu vertically
    document.getElementById('board').style.display = 'none';  // Hide canvas
}


function startGame() {
    document.getElementById('menu').style.display = 'none'; // Hide menu
    document.getElementById('board').style.display = 'block'; // Show game canvas

    // Reset game state
    bird.y = birdY;
    pipeArray = [];
    score = 0;
    gameOver = false;
    scoreSent = false;  // Reset the scoreSent flag
    
    // Continue with game initialization
}
function getUserIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('userId');
}

function displayUserId() {
    const userId = getUserIdFromUrl() || "No ID"; // Fetch user ID or use "No ID"
    document.getElementById('userIdDisplay').textContent = `User ID: ${userId}`; // Update text content
}

function sendScore(userId, score) {
    fetch('____your api endpoint___/save-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userId, score: score })
    })
    .then(response => response.json())
    .then(data => console.log('Score saved:', data))
    .catch(error => console.error('Failed to save score:', error));
}
function sendScoreAndShowMenu() {
    const userId = getUserIdFromUrl(); // Ensure you have this function to get the user ID

    
    if (!userId || userId === 'No ID') {
        console.log("Invalid user ID, not sending score.");
        showMenu(); // Show the menu directly without sending the score
        return;
    }

    // Check for zero score after verifying user ID
    if (score === 0) {
        console.log("Score is zero, not sending score.");
        showMenu(); // Show the menu directly without sending the score
        return;
    }

    // Construct the URL with the user ID and score
    const url = `____your api endpoint___/add_score?userid=${encodeURIComponent(userId)}&score=${score}`;

    // Use fetch to send the score to the server
    fetch(url)
    .then(response => response.json())
    .then(data => {
        
        console.log('Success:', data);
        showMenu(); // first show menu after score is sent
    })
    .catch((error) => {
        console.error('Error:', error);
        showMenu(); // Optionally still show the menu on error
    });
}


function disableGameInteraction() {
    // Disable game-related event listeners
    document.removeEventListener("keydown", handleKeyInput);
    document.removeEventListener("click", moveBird);
}

function enableGameInteraction() {
    // Enable game-related event listeners
    document.addEventListener("keydown", handleKeyInput);
    document.addEventListener("click", moveBird);
}

function handleKeyInput(event) {
    if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyX") {
        moveBird();
    }
}

function updatePowerupText() {
    var powerupText = document.getElementById('powerupText');
    // Check if the element exists before trying to set its HTML
    if (powerupText) {
        // Using HTML to format text with line breaks and other formatting
        powerupText.innerHTML = `Choose a Power-Up.<br>2x score: ${powerups.powerup1} | 20+ score: ${powerups.powerup2}`;
    } else {
        console.error('Failed to find the powerupText element.');
    }
}


function showPowerupPopup() {
    console.log('Showing powerup popup');
    updatePowerupText(); // Update the text before showing the popup
    var popup = document.getElementById('powerupPopup');
    if (popup) {
        popup.style.display = 'block';
    } else {
        console.error('Failed to find the powerupPopup element.');
    }
    disableGameInteraction(); // Assuming you have this function to disable game interactions
}

function confirmPowerup(powerupType) {
    console.log('Powerup selected:', powerupType); // Debug log
    document.getElementById('powerupPopup').style.display = 'none';
    enableGameInteraction(); // Re-enable game interaction after decision

    if (powerupType === 'powerbuff1') {
        if (powerups.powerup1 > 0) {
            powerups.powerup1 -= 1; // Reduce the powerup count
            score *= 2; // Apply the powerup effect
            sendScoreAndShowMenu(); // Continue game processing
            sendPowerupReduction([1, 0, 0, 0, 0, 0]); // Notify server of the powerup usage
        }
    } else if (powerupType === 'powerbuff2') {
        if (powerups.powerup2 > 0) {
            powerups.powerup2 -= 1; // Reduce the count of powerbuff2
            score += 20; // Apply the powerup effect
            sendScoreAndShowMenu(); // Send score and show the menu
            sendPowerupReduction([0, 1, 0, 0, 0, 0]); // Notify server of the powerup usage
        }
    } else {
        sendScoreAndShowMenu(); // Just close the menu without using a powerup
    }
}


function sendPowerupReduction(reductions) {
    const userId = getUserIdFromUrl();
    const url = `____your api endpoint___/reduce_powerups/${encodeURIComponent(userId)}`;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({powerups: reductions})
    })
    .then(response => response.json())
    .then(data => {
        console.log('Powerup reduction response:', data);
    })
    .catch(error => console.error('Failed to reduce powerups:', error));
}




function update() {
    requestAnimationFrame(update); // Continues the animation loop

    if (gameOver) {
        if (!scoreSent) {
            // Check if either powerup1 or powerup2 is greater than 0
            if (powerups.powerup1 > 0 || powerups.powerup2 > 0) {
                showPowerupPopup();
            } else {
                sendScoreAndShowMenu();
            }
            scoreSent = true; 
        }
        return;
    }

    context.clearRect(0, 0, board.width, board.height);  // Clear the canvas

    // Update bird's position with gravity
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0); // Prevent bird from moving above the top of the canvas

    // Draw the bird
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    // Check if the bird has fallen off the screen
    if (bird.y > board.height) {
        gameOver = true;
    }

    // Move and draw pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;  // Move pipe to the left
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        // Increase score when the bird passes a pipe
        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5;  // Since there are two pipes (top and bottom), each pass increases the score by 0.5 twice
            pipe.passed = true;

            // Adjust pipe placement interval every 25 points, but not below 500 ms
            if (score % 25 === 0 && pipeInterval > 500) {
                clearInterval(pipeIntervalId);  // Stop the current interval
                pipeInterval -= 500;  // Decrease the interval
                pipeIntervalId = setInterval(placePipes, pipeInterval);  // Start a new interval with the new time
            }
        }

        // Check for collision
        if (detectCollision(bird, pipe)) {
            gameOver = true;
        }
    }

    // Remove pipes that have moved off screen to the left
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    // Display score
    context.fillStyle = "#8B008B"; // Dark magenta
    context.font = "45px 'Arcade Classic', cursive"; // Retro arcade-style font
    context.fillText(score, 5, 45);  // Draw score at the top left

    if (gameOver) {
        context.fillText("GAME OVER", 5, 90);  // If the game is over, display game over message
    }
}

function placePipes() {
    if (gameOver) {
        return;
    }

    // Increase the horizontal spacing by adjusting the starting x position of the pipes.
    // This will make each new set of pipes appear further to the right.
    let additionalXSpacing = 100; // Adjust this value to increase the horizontal distance
    let pipeXPosition = pipeX + additionalXSpacing;

    // Increase the vertical gap between the top and bottom pipes
    let openingSpace = board.height / 3; // Larger value increases the space

    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);

    let topPipe = {
        img: topPipeImg,
        x: pipeXPosition, // Modified to use the new horizontally spaced position
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(topPipe);

    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeXPosition, // Consistent with topPipe for alignment
        y: randomPipeY + pipeHeight + openingSpace, // Use increased openingSpace
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(bottomPipe);
}


function moveBird() {
    // Jump
    velocityY = -6;

    // Reset game if over
    if (gameOver) {
        bird.y = birdY;
        pipeArray = [];
        score = 0;
        gameOver = false;
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}

function showScores() {
    const userId = getUserIdFromUrl(); // Reuse your existing function to get the user ID
    if ( userId === 'NooiID') {
        alert("Invalid user ID");
        return;
    }
    // Correctly format the URL by including userId in the path
    const url = `____your api endpoint___/scores/${encodeURIComponent(userId)}`;

    fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        displayScores(data); // Function to handle the display of scores
    })
    .catch((error) => {
        console.error('Error fetching scores:', error);
        alert("Failed to fetch scores. Please check the console for more information.");
    });
}


function closePopupscore() {
    document.getElementById('scorePopup').style.display = 'none';
}
function closestorePopup() {
    document.getElementById('storePopup').style.display = 'none';
}


function displayScores(scores) {
    const scoresList = document.getElementById('scoresList');
    scoresList.innerHTML = ''; // Clear previous scores

    let totalScore = 0;
    let highestScore = 0;

    scores.forEach(scoreItem => {
        totalScore += scoreItem.score;
        if (scoreItem.score > highestScore) {
            highestScore = scoreItem.score;
        }
    });

    // Display total and highest scores
    const totalScoreElement = document.createElement('p');
    totalScoreElement.innerHTML = `<b>Total Score:</b> ${totalScore}`;
    scoresList.appendChild(totalScoreElement);

    const highestScoreElement = document.createElement('p');
    highestScoreElement.innerHTML = `<b>Highest Score:</b> ${highestScore}`;
    scoresList.appendChild(highestScoreElement);

    const divider = document.createElement('div');
    divider.id = 'divider';
    scoresList.appendChild(divider);

    const scoresHeader = document.createElement('p');
    scoresHeader.textContent = "Scores:";
    scoresList.appendChild(scoresHeader);

    // Append each score
    scores.forEach(scoreItem => {
        const scoreElement = document.createElement('p');
        scoreElement.textContent = scoreItem.score;
        scoresList.appendChild(scoreElement);
    });

    document.getElementById('scorePopup').style.display = 'block'; // Show the popup
}



function leaderAction() {
    fetch('____your api endpoint___/top_users')
        .then(response => response.json())
        .then(data => displayLeaderboard(data))
        .catch(error => console.error('Error fetching leaderboard:', error));
}

function displayLeaderboard(data) {
    const leaderboardPopup = document.getElementById('scorePopup');
    const scoresList = document.getElementById('scoresList');
    
    // Clear previous scores
    scoresList.innerHTML = '';

    // Create header row
    const header = document.createElement('div');
    header.innerHTML = `<span class='score-entry'>ID</span><span class='score-entry'>Score</span>`;
    scoresList.appendChild(header);

    // Add new scores
    data.forEach(user => {
        const scoreEntry = document.createElement('div');
        scoreEntry.innerHTML = `<span class='score-entry'>${user.userid}</span><span class='score-entry'>${user.total_score}</span>`;
        scoresList.appendChild(scoreEntry);
    });

    // Show the popup
    leaderboardPopup.style.display = 'block';
}

function storeAction() {
    var popup = document.getElementById('storePopup');
    popup.style.display = 'block';  // Show the popup
}


document.getElementById('closeButton').addEventListener('click', function() {
    var popup = document.getElementById('storePopup');
    popup.style.display = 'none';  // Hide the popup
});


function copyWalletAddress() {
    const walletAddress = document.getElementById('walletAddress').textContent;
    navigator.clipboard.writeText(walletAddress).then(() => {
        console.log('Wallet address copied to clipboard!');
    }, (err) => {
        console.error('Failed to copy wallet address: ', err);
    });
}
function closeWalletPopup() {
    document.getElementById('walletPopup').style.display = 'none';
}

async function checkTransactionSignature(txnSignature) {
    try {
        const response = await fetch(`____your api endpoint___/check_transaction/${txnSignature}`);
        const text = await response.text(); // Use .text() instead of .json()
        return text;  // Expecting "Y" or "N"
    } catch (error) {
        console.error('Failed to check transaction:', error);
        return null;  // Null signifies an error occurred
    }
}


async function doneWalletPopup() {
    const userId = getUserIdFromUrl();
    const txnSignature = document.getElementById('txnInput').value;
    const requiredAmount = parseFloat(document.getElementById('walletPopup').dataset.minAmount);

    const transactionStatus = await checkTransactionSignature(txnSignature);
    if (transactionStatus === 'Y') {
        showMessagePopup("This transaction signature has been used previously.");
        return;
    } else if (transactionStatus === 'N') {
        try {
            const transactionDetails = await fetchTransactionDetails(txnSignature);
            if (transactionDetails && transactionDetails.secondAccountKey === '6nqcKkM12MrrnRPCrrG2TGSwj2whuwkJqS9YLyD2NWFL' && transactionDetails.balanceDifference >= requiredAmount) {
                if (currentAction === 'action1') {
                    storeUserData(userId, "wallet456", [5, 0, 0, 0, 0, 0]);
                    powerups.powerup1 = parseInt(powerups.powerup1) + 5;  // Correctly increment powerup1
                } else if (currentAction === 'action2') {
                    storeUserData(userId, "wallet456", [0, 5, 0, 0, 0, 0]);
                    powerups.powerup2 = parseInt(powerups.powerup2) + 5;  // Correctly increment powerup2
                }
                storeTransaction(txnSignature, requiredAmount);
                showMessagePopup("You will receive your power buffs shortly!");
            } else {
                showMessagePopup("Please check the criteria. If needed, submit again.");
            }
        } catch (error) {
            console.error('Error fetching transaction details:', error);
            showMessagePopup("Error checking transaction status. Please try again.");
        }
    } else {
        showMessagePopup("Error checking transaction status. Please try again.");
    }
}



async function storeUserData(userId, wallet, powerups) {
    try {
        const response = await fetch('____your api endpoint___/add_user', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userid: userId, wallet: wallet, powerups: powerups })
        });
        const data = await response.json();
        console.log('User added:', data);
    } catch (error) {
        console.error('Failed to add user:', error);
        showMessagePopup("Failed to add user data. Please try again.");
    }
}


async function storeTransaction(txnSignature, amount) {
    try {
        const response = await fetch('____your api endpoint___/add_transaction', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({txn: txnSignature, amount: amount})
        });
        const data = await response.json();
        console.log('Transaction stored:', data);
    } catch (error) {
        console.error('Failed to store transaction:', error);
    }
}

async function fetchTransactionDetails(txnSignature) {
    const url = 'https://solana-mainnet.g.alchemy.com/v2/iBDPy20UhGgGdP9bSOTIqh-5RYb5en4X';
    const requestBody = {
        method: "getTransaction",
        jsonrpc: "2.0",
        params: [
            txnSignature,
            {
                "commitment": "confirmed"
            }
        ],
        id: "pepe"
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(requestBody)
        });
        const data = await response.json();

        if (data.result && data.result.transaction && data.result.transaction.message) {
            const accountKeys = data.result.transaction.message.accountKeys;
            const secondAccountKey = accountKeys.length > 1 ? accountKeys[1] : null;
            const { preBalances, postBalances } = data.result.meta || {};
            const balanceDifference = (preBalances && postBalances) ? (preBalances[0] - postBalances[0]) : null;

            if (secondAccountKey && balanceDifference !== null) {
                return { secondAccountKey, balanceDifference };
            } else {
                throw new Error('Incomplete transaction data');
            }
        } else {
            throw new Error('Invalid transaction data');
        }
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        throw error;  // Rethrow to handle it in the calling function
    }
}



function showMessagePopup(message) {
    const messagePopup = document.getElementById('messagePopup');
    const messageText = document.getElementById('messageText');
    if (messageText) {
        messageText.textContent = message; // Set the message text
        messagePopup.style.display = 'block'; // Show the popup
    } else {
        console.error('Message element not found');
    }
}


function closeMessagePopup() {
    const messagePopup = document.getElementById('messagePopup');
    messagePopup.style.display = 'none'; // Hide the popup
    document.getElementById('walletPopup').style.display = 'none';

}


let currentAction = null;

function action1() {
    console.log("Action 1 executed");
    document.getElementById('walletMessage').textContent = "Please send 0.0006 sol to this wallet and provide the Txn Sig:";
    document.getElementById('walletPopup').style.display = 'block';
    document.getElementById('walletPopup').dataset.minAmount = "600000";
    currentAction = 'action1';  // Setting current action
}

function action2() {
    console.log("Action 2 executed");
    document.getElementById('walletMessage').textContent = "Please send 0.0012 sol to this wallet and provide the Txn Sig:";

    document.getElementById('walletPopup').style.display = 'block';
    document.getElementById('walletPopup').dataset.minAmount = "1200000";
    currentAction = 'action2';  // Setting current action
}
function showPopup(popupId) {
    var popup = document.getElementById(popupId);
    popup.classList.add('showUpcoming');  // Add the class to make it visible
}

function closePopup(popupId) {
    var popup = document.getElementById(popupId);
    popup.classList.remove('showUpcoming');  // Remove the class to hide it
}
