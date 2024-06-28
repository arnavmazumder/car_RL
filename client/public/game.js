//Document constants

const canvas = document.getElementById('gameCanvas');
const generateTrackButton = document.getElementById('generate');
const startAIButton = document.getElementById('start');
const trainStopButton = document.getElementById('trainStop')
const ctx = canvas.getContext('2d', {willReadFrequently: true});

// UI state variables
clientTraining = false;
serverTraining = false;
aiRunning = false;
playerRunning = true;

let car = {
    x: 100.0,
    y: 100.0,
    width: 25,
    height: 15,
    speed: 0.0,
    angle: 0.0,
    rotateSpeed: 0.0,
    accel: 0.0,
    spawn_x: 0.0,
    spawn_y: 0.0
};


// Track functions

function generateTrackPoints(numPoints, radius, centerX, centerY) {
    let points = [];
    for (let i = 0; i < numPoints; i++) {
        let angle = (i / numPoints) * 2 * Math.PI;
        let x = centerX + 2*radius * Math.cos(angle) + (Math.random() - 0.5) * 100;
        let y = centerY + 0.8*radius * Math.sin(angle) + (Math.random() - 0.5) * 100;
        points.push({ x, y });
    }
    car.x = points[4].x;
    car.y = points[4].y;
    car.angle=0.0;
    car.speed = 0.0;
    car.accel=0.0;
    car.spawn_x = car.x;
    car.spawn_y = car.y;


    return points;
}

// Generate random track
let trackPoints = generateTrackPoints(20, 300, canvas.width / 2, canvas.height / 2);

// Draw track
const finishImage = new Image()
finishImage.src = 'finish-line.png'
function drawTrack(points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 70;
    ctx.stroke();

    ctx.drawImage(finishImage, car.spawn_x-10, car.spawn_y-35, 20, 70)

}

function isCarOnTrack() {
    const carCorners = [
        { x: car.x + car.width / 2 * Math.cos(car.angle) - car.height / 2 * Math.sin(car.angle),
          y: car.y + car.width / 2 * Math.sin(car.angle) + car.height / 2 * Math.cos(car.angle) },
        { x: car.x - car.width / 2 * Math.cos(car.angle) - car.height / 2 * Math.sin(car.angle),
          y: car.y - car.width / 2 * Math.sin(car.angle) + car.height / 2 * Math.cos(car.angle) },
        { x: car.x + car.width / 2 * Math.cos(car.angle) + car.height / 2 * Math.sin(car.angle),
          y: car.y + car.width / 2 * Math.sin(car.angle) - car.height / 2 * Math.cos(car.angle) },
        { x: car.x - car.width / 2 * Math.cos(car.angle) + car.height / 2 * Math.sin(car.angle),
          y: car.y - car.width / 2 * Math.sin(car.angle) - car.height / 2 * Math.cos(car.angle) }
    ];


    ctx.beginPath();
    ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
    for (let i = 1; i < trackPoints.length; i++) {
        ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
    }
    ctx.closePath();


    //ctx.fillStyle = 'blue';
    for (let corner of carCorners) {
        //ctx.fillRect(corner.x - 2.5, corner.y - 2.5, 5, 5);
        if (!ctx.isPointInStroke(corner.x, corner.y)) {
            return false;
        }
    }
    return true;
}


// Car functions

const carImage = new Image()
carImage.src = 'car-image.png'
function drawCar() {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    // ctx.fillStyle = 'red';
    // ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    ctx.drawImage(carImage, -car.width / 2, -car.height / 2, car.width, car.height)
    ctx.restore();
}

function updateCar() {
    car.angle += car.rotateSpeed;

    if (car.accel!==0) {
        car.speed += car.accel;
    } else {
        if (car.speed < 0) {
            car.speed += 0.1;
            car.speed = (car.speed >= 0) ? 0 : car.speed;
        } else {
            car.speed -= 0.1;
            car.speed = (car.speed < 0) ? 0 : car.speed;
        }
    }

    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;
}

function initCar() {
    car.x = car.spawn_x;
    car.y = car.spawn_y;
    car.speed = 0.0;
    car.accel = 0.0;
    car.angle=0.0;
    car.rotateSpeed=0.0;
}

// Async/fetch functions

// sends the game state to the server agent and return the next action
async function sendState(reward) {
    try {
        const args = {carPosX: car.x, carPosY: car.y, carSpeed: car.speed, carAngle: car.angle, track: trackPoints, reward: reward};
        const resp = await fetch('/api/sendState', {
                                method: 'POST',
                                body: JSON.stringify(args),
                                headers: new Headers({'Content-Type': 'application/json'})
                            })

        if (!resp.ok) console.error("Status " + resp.status + ": " + resp.statusText)

        data = await resp.json();
        if (data === null || typeof data !== "object") throw Error("Invalid response.");
        
        //actions are in the form of KeyDirection
        if (data.action !== 'UpUp' && data.action !== 'UpDown' && data.action !== 'UpRight' && data.action !== 'UpLeft' && data.action !== 'DownUp' && data.action !== 'DownDown' && data.action !== 'DownRight' && data.action !== 'DownLeft' && data.action !== 'None') { 
            throw Error("Invalid response: " + data.action) 
        }

        return data.action;

    } catch(error) {
        console.error(`Fetch error for /api/sendState:`, error);
    }
}


// Training Simulation Functions

function executeAction(action) {
    if (action === 'DownUp') car.accel = 0.25;
    if (action === 'DownDown') car.accel = -0.25;
    if (action === 'DownLeft') car.rotateSpeed = -0.06;
    if (action === 'DownRight') car.rotateSpeed = 0.06;
    if (action === 'UpUp' || action === 'UpDown') car.accel=0;
    if (action === 'UpLeft' || action === 'UpRight') car.rotateSpeed = 0;
} 

function observeReward() {
    const r = 1.1; //TODO
    return r;

}

// Main game loop
let counter = 1n;
let newAction;
let currReward;
async function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTrack(trackPoints);
    drawCar();
    
    if (counter%100n == 0n) {
        //console.log("100 ticks")
        if (serverTraining) {
            currReward = observeReward()
            newAction = await sendState(currReward);
            executeAction(newAction);

        } else if (aiRunning) {

        }

        counter = 1n
    }
    counter += 1n

    updateCar();
    if (!isCarOnTrack()) initCar();
    requestAnimationFrame(gameLoop);
}




// Event listeners

document.addEventListener('keydown', (event) => {
    if (playerRunning) {
        if (event.key === 'ArrowUp') car.accel = 0.25;
        if (event.key === 'ArrowDown') car.accel = -0.25;
        if (event.key === 'ArrowLeft') car.rotateSpeed = -0.06; 
        if (event.key === 'ArrowRight') car.rotateSpeed = 0.06;
    }
});

document.addEventListener('keyup', (event) => {
    if (playerRunning) {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') car.accel=0;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') car.rotateSpeed = 0;
    }
});

generateTrackButton.addEventListener('click', () => {
    if (playerRunning) {
        trackPoints = generateTrackPoints(20, 300, canvas.width / 2, canvas.height / 2);
    }
});

startAIButton.addEventListener('click', () => {
    if (!clientTraining) {
        aiRunning = !aiRunning;
        playerRunning = !aiRunning;
        startAIButton.textContent = (aiRunning) ? 'Stop AI (DQN)' : 'Start AI (DQN)';
        initCar();
    }
});

trainStopButton.addEventListener('click', () => {
    if (!aiRunning) {
        // UI Update
        clientTraining = !clientTraining;
        playerRunning = !clientTraining;
        trainStopButton.textContent = (clientTraining) ? 'Stop' : 'Train';
        initCar();

        

        if (clientTraining) {

            fetch('/api/startTraining', {
                method: 'POST',
                body: JSON.stringify({
                    carPosX: car.x,
                    carPosY: car.y,
                    carSpeed: car.speed,
                    carAngle: car.angle,
                    track: trackPoints
                }),
                headers: new Headers({'Content-Type': 'application/json'})
            })
            .then((resp) => {
                if (resp.ok) {
                    resp.json().then((data) => {
                        if (data === null || typeof data !== "object") console.error("Invalid response.");
                        else if (data.action !== 'UpUp' && data.action !== 'UpDown' && data.action !== 'UpRight' && data.action !== 'UpLeft' && data.action !== 'DownUp' && data.action !== 'DownDown' && data.action !== 'DownRight' && data.action !== 'DownLeft' && data.action !== 'None') { 
                            console.error("Invalid response.") 
                        } else {

                            executeAction(data.action);
                            serverTraining=true;
                        }

                    })
                } else {
                    console.error('Status code' + resp.status + ': ' + resp.statusText)
                }
            })
            .catch(() => console.error("Could not start training"))


        } else {
            fetch('/api/stopTraining', {
                method: 'POST',
                headers: new Headers({'Content-Type': 'application/json'})
            })
            .then((resp) => {
                if (resp.ok) {
                    resp.json().then((data) => {
                        if (data === null || typeof data !== "object") console.error("Invalid response.");
                        else {
                            serverTraining=false;
                        }
                    })
                } else {
                    console.error('Status code' + resp.status + ': ' + resp.statusText)
                }
            })
            .catch(() => console.error("Could not stop training"))
        }
    }
})


// Main
gameLoop();
